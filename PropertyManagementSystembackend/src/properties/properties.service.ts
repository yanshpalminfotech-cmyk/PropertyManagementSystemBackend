import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Property, PropertyAvailabilityStatus } from './entities/property.entity';
import { STATUS } from '../common/enums/status.constant';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UpdatePropertyAvailabilityDto } from './dto/update-property-availability.dto';
import { PropertyQueryDto, AdminPropertyQueryStatus } from './dto/property-query.dto';
import { PropertyCodeService } from './property-code.service';
import type { UserInfo } from '../common/types';
import { UserRole } from '../user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly propertyCodeService: PropertyCodeService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Validates business logic for property dimensions and levels.
   * - Carpet area must be less than built-up area.
   * - Floor number must be less than or equal to total floors.
   */
  private validatePropertyLogic(
    carpetArea: number,
    builtUpArea: number,
    floorNumber?: number,
    totalFloors?: number
  ) {
    if (carpetArea >= builtUpArea) {
      throw new BadRequestException('Carpet area must be less than built-up area');
    }

    if (floorNumber !== undefined && floorNumber !== null &&
      totalFloors !== undefined && totalFloors !== null) {
      if (floorNumber > totalFloors) {
        throw new BadRequestException('Floor number cannot exceed total floors');
      }
    }
  }

  /**
   * Helper to map raw DB results to camelCase and handle conditional privacy
   */
  private mapProperty(raw: any, currentUser?: UserInfo): any {
    if (!raw) return null;

    // Map snake_case to camelCase (Manually to stay "raw" and performant)
    const property: any = {
      id: raw.id,
      propertyCode: raw.property_code,
      brokerId: raw.broker_id,
      propertyType: raw.property_type,
      category: raw.category,
      transactionType: raw.transaction_type,
      location: raw.location,
      address: raw.address,
      ownerName: raw.owner_name,
      ownerMobileNumber: raw.owner_mobile_number,
      carpetArea: Number(raw.carpet_area),
      builtUpArea: Number(raw.built_up_area),
      price: Number(raw.price),
      maintenanceCost: raw.maintenance_cost ? Number(raw.maintenance_cost) : null,
      furnishing: raw.furnishing,
      parking: Boolean(raw.parking),
      floorNumber: raw.floor_number,
      totalFloors: raw.total_floors,
      propertyAge: raw.property_age,
      facing: raw.facing,
      description: raw.description,
      amenities: raw.amenities ?? null,
      availableForVisit: Boolean(raw.available_for_visit),
      propertiesstatus: raw.propertiesstatus,
      brokerCommission: raw.broker_commission ? Number(raw.broker_commission) : null,
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };

    // Include broker if joined
    if (raw.b_id) {
      property.broker = {
        id: raw.b_id,
        name: raw.b_name,
        email: raw.b_email,
        phone: raw.b_phone,
      };
    }

    // Conditionally handle privacy based on user role
    const isOwner = currentUser?.role === UserRole.BROKER && property.brokerId === currentUser.id;
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      delete property.ownerName;
      delete property.ownerMobileNumber;
      delete property.brokerCommission;
    }

    return property;
  }

  async create(createPropertyDto: CreatePropertyDto, user: UserInfo) {
    // Validate business logic
    this.validatePropertyLogic(
      createPropertyDto.carpetArea,
      createPropertyDto.builtUpArea,
      createPropertyDto.floorNumber,
      createPropertyDto.totalFloors
    );

    return this.dataSource.transaction(async (manager) => {
      const propertyCode = await this.propertyCodeService.generateNextCode(manager);
      const id = uuidv4();

      const sql = `
        INSERT INTO properties (
          id, property_code, broker_id, property_type, category,
          transaction_type, location, address, owner_name,
          owner_mobile_number, carpet_area, built_up_area, price,
          maintenance_cost, furnishing, parking, floor_number,
          total_floors, property_age, facing, description, amenities,
          available_for_visit, propertiesstatus, broker_commission, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await manager.query(sql, [
        id,
        propertyCode,
        user.id,
        createPropertyDto.propertyType,
        createPropertyDto.category,
        createPropertyDto.transactionType,
        createPropertyDto.location,
        createPropertyDto.address,
        createPropertyDto.ownerName,
        createPropertyDto.ownerMobileNumber,
        createPropertyDto.carpetArea,
        createPropertyDto.builtUpArea,
        createPropertyDto.price,
        createPropertyDto.maintenanceCost || null,
        createPropertyDto.furnishing,
        createPropertyDto.parking ? 1 : 0,
        createPropertyDto.floorNumber || null,
        createPropertyDto.totalFloors || null,
        createPropertyDto.propertyAge || null,
        createPropertyDto.facing || null,
        createPropertyDto.description || null,
        createPropertyDto.amenities || null,
        createPropertyDto.availableForVisit !== undefined ? (createPropertyDto.availableForVisit ? 1 : 0) : 1,
        createPropertyDto.propertiesstatus || PropertyAvailabilityStatus.AVAILABLE,
        createPropertyDto.brokerCommission || null,
        STATUS.ACTIVE
      ]);

      const [newProperty] = await manager.query('SELECT * FROM properties WHERE id = ?', [id]);
      return this.mapProperty(newProperty, user);
    });
  }

  async findAll(query: PropertyQueryDto, currentUser?: UserInfo, brokerId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      status,
      availableForVisit,
      propertiesstatus,
      ...filters
    } = query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*, 
             u.id as b_id, u.name as b_name, u.email as b_email, u.phone as b_phone
      FROM properties p
      LEFT JOIN users u ON p.broker_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Role-based status filter
    if (currentUser?.role === UserRole.ADMIN) {
      if (status && status !== AdminPropertyQueryStatus.ALL) {
        const statusMap: Record<string, number> = {
          [AdminPropertyQueryStatus.ACTIVE]: STATUS.ACTIVE,
          [AdminPropertyQueryStatus.INACTIVE]: STATUS.INACTIVE,
          [AdminPropertyQueryStatus.DELETED]: STATUS.DELETED,
        };
        sql += ` AND p.status = ?`;
        params.push(statusMap[status]);
      }
    } else {
      sql += ` AND p.status = ?`;
      params.push(STATUS.ACTIVE);

      const visitFlag = availableForVisit !== undefined ? (availableForVisit ? 1 : 0) : 1;
      const statusFlag = propertiesstatus || PropertyAvailabilityStatus.AVAILABLE;

      sql += ` AND p.available_for_visit = ? AND p.propertiesstatus = ?`;
      params.push(visitFlag, statusFlag);
    }

    if (brokerId) {
      sql += ` AND p.broker_id = ?`;
      params.push(brokerId);
    }

    if (search) {
      sql += ` AND (p.address LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      sql += ` AND p.price >= ?`;
      params.push(minPrice);
    }

    if (maxPrice) {
      sql += ` AND p.price <= ?`;
      params.push(maxPrice);
    }

    // dynamic enum filters
    Object.keys(filters).forEach(key => {
      const val = (filters as any)[key];
      if (val) {
        // Map camelCase DTO keys to snake_case column names if they differ
        const colMap: any = { propertyType: 'property_type', transactionType: 'transaction_type' };
        const colName = colMap[key] || key;
        sql += ` AND p.${colName} = ?`;
        params.push(val);
      }
    });

    // Handle count query
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const [countResult] = await this.propertyRepository.query(countSql, params);
    const total = Number(countResult.total);

    // Apply pagination
    sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await this.propertyRepository.query(sql, params);
    const items = rows.map((row: any) => this.mapProperty(row, currentUser));

    return {
      items,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, currentUser?: UserInfo) {
    const sql = `
      SELECT p.*, 
             u.id as b_id, u.name as b_name, u.email as b_email, u.phone as b_phone
      FROM properties p
      LEFT JOIN users u ON p.broker_id = u.id
      WHERE (p.id = ? OR p.property_code = ?) AND p.status = ?
    `;
    const [row] = await this.propertyRepository.query(sql, [id, id, STATUS.ACTIVE]);

    if (!row) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return this.mapProperty(row, currentUser);
  }

  async findMyProperties(query: PropertyQueryDto, user: UserInfo) {
    return this.findAll({ ...query }, user, user.id);
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, user: UserInfo) {
    const [existing] = await this.propertyRepository.query(
      'SELECT id, broker_id, status, carpet_area, built_up_area, floor_number, total_floors FROM properties WHERE (id = ? OR property_code = ?)',
      [id, id]
    );

    if (!existing || existing.status !== STATUS.ACTIVE) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Validate business logic with merged values
    const carpetArea = updatePropertyDto.carpetArea !== undefined ? updatePropertyDto.carpetArea : Number(existing.carpet_area);
    const builtUpArea = updatePropertyDto.builtUpArea !== undefined ? updatePropertyDto.builtUpArea : Number(existing.built_up_area);
    const floorNumber = updatePropertyDto.floorNumber !== undefined ? updatePropertyDto.floorNumber : (existing.floor_number !== null ? Number(existing.floor_number) : undefined);
    const totalFloors = updatePropertyDto.totalFloors !== undefined ? updatePropertyDto.totalFloors : (existing.total_floors !== null ? Number(existing.total_floors) : undefined);

    this.validatePropertyLogic(carpetArea, builtUpArea, floorNumber, totalFloors);

    if (user.role === UserRole.BROKER && existing.broker_id !== user.id) {
      throw new ForbiddenException('You can only update your own properties');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.BROKER) {
      throw new ForbiddenException('You do not have permission to update properties');
    }

    // Dynamically build update SQL
    const updates: string[] = [];
    const params: any[] = [];

    // Map DTO keys to snake_case
    const colMap: any = {
      propertyType: 'property_type',
      transactionType: 'transaction_type',
      ownerName: 'owner_name',
      ownerMobileNumber: 'owner_mobile_number',
      carpetArea: 'carpet_area',
      builtUpArea: 'built_up_area',
      maintenanceCost: 'maintenance_cost',
      floorNumber: 'floor_number',
      totalFloors: 'total_floors',
      propertyAge: 'property_age',
      availableForVisit: 'available_for_visit',
      brokerCommission: 'broker_commission',
      amenities: 'amenities',
    };

    Object.keys(updatePropertyDto).forEach(key => {
      const val = (updatePropertyDto as any)[key];
      if (val !== undefined) {
        const col = colMap[key] || key;
        updates.push(`${col} = ?`);
        params.push(key === 'availableForVisit' || key === 'parking' ? (val ? 1 : 0) : val);
      }
    });

    if (updates.length > 0) {
      params.push(existing.id);
      await this.propertyRepository.query(
        `UPDATE properties SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const [updated] = await this.propertyRepository.query('SELECT * FROM properties WHERE id = ?', [existing.id]);
    return this.mapProperty(updated, user);
  }

  async remove(id: string, user: UserInfo) {
    const [existing] = await this.propertyRepository.query(
      'SELECT id, broker_id FROM properties WHERE (id = ? OR property_code = ?)',
      [id, id]
    );

    if (!existing) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    if (user.role === UserRole.BROKER && existing.broker_id !== user.id) {
      throw new ForbiddenException('You can only delete your own properties');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.BROKER) {
      throw new ForbiddenException('You do not have permission to delete properties');
    }

    await this.propertyRepository.query(
      'UPDATE properties SET status = ? WHERE id = ?',
      [STATUS.DELETED, existing.id]
    );

    return { success: true, message: 'Property deleted successfully' };
  }

  async updateAvailabilityStatus(id: string, dto: UpdatePropertyAvailabilityDto, user: UserInfo) {
    const [existing] = await this.propertyRepository.query(
      'SELECT id, broker_id, status FROM properties WHERE (id = ? OR property_code = ?)',
      [id, id]
    );

    if (!existing || existing.status !== STATUS.ACTIVE) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    if (user.role === UserRole.BROKER && existing.broker_id !== user.id) {
      throw new ForbiddenException('You can only update the status of your own properties');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.BROKER) {
      throw new ForbiddenException('You do not have permission to update property status');
    }

    await this.propertyRepository.query(
      'UPDATE properties SET propertiesstatus = ? WHERE id = ?',
      [dto.propertiesstatus, existing.id]
    );

    const [updated] = await this.propertyRepository.query('SELECT * FROM properties WHERE id = ?', [existing.id]);
    return this.mapProperty(updated, user);
  }
}
