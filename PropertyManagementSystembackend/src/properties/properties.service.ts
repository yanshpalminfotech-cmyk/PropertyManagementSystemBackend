import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SqlParam } from '../common/types';
import { DatabaseService } from '../common/database/database.service';
import { STATUS } from '../common/enums/status.constant';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UpdatePropertyAvailabilityDto } from './dto/update-property-availability.dto';
import { PropertyQueryDto, AdminPropertyQueryStatus } from './dto/property-query.dto';
import { PropertyCodeService } from './property-code.service';
import type { UserInfo } from '../common/types';
import { UserRole } from '../user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import {
  PROPERTY_INSERT_QUERY,
  PROPERTY_FIND_BY_ID_QUERY,
  PROPERTY_FIND_MINIMAL_QUERY,
  PROPERTY_SOFT_DELETE_QUERY,
  PROPERTY_UPDATE_AVAILABILITY_QUERY,
  PROPERTY_FIND_ALL_BASE_QUERY,
} from './properties.queries';

export enum PropertyType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
}

export enum PropertyCategory {
  BHK1 = '1BHK',
  BHK2 = '2BHK',
  BHK3 = '3BHK',
  VILLA = 'VILLA',
  PLOT = 'PLOT',
  SHOP = 'SHOP',
  OFFICE = 'OFFICE',
}

export enum TransactionType {
  SALE = 'SALE',
  RENT = 'RENT',
}

export enum PropertyLocation {
  ADAJAN = 'ADAJAN',
  VESU = 'VESU',
  CITYLIGHT = 'CITYLIGHT',
  PIPLOD = 'PIPLOD',
  PAL = 'PAL',
  MAGDALLA = 'MAGDALLA',
}

export enum FurnishingStatus {
  FURNISHED = 'FURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  UNFURNISHED = 'UNFURNISHED',
}

export enum PropertyAvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  UNDER_NEGOTIATION = 'UNDER_NEGOTIATION',
}

export interface IRawProperty {
  id: string;
  property_code: string;
  broker_id: string;
  property_type: PropertyType;
  category: PropertyCategory;
  transaction_type: TransactionType;
  location: PropertyLocation;
  address: string;
  owner_name?: string;
  owner_mobile_number?: string;
  carpet_area: number | string;
  built_up_area: number | string;
  price: number | string;
  maintenance_cost?: number | string;
  furnishing: FurnishingStatus;
  parking: number | boolean;
  floor_number?: number;
  total_floors?: number;
  property_age?: number;
  facing?: string;
  description?: string;
  amenities?: string;
  available_for_visit: number | boolean;
  propertiesstatus: PropertyAvailabilityStatus;
  broker_commission?: number | string;
  status: number;
  created_at: Date;
  updated_at: Date;
  status_change_date?: Date | null;
  b_id?: string;
  b_name?: string;
  b_email?: string;
  b_phone?: string;
}

export interface IRawPropertyMinimal {
  id: string;
  status: number;
  broker_id: string;
  carpet_area: number | string;
  built_up_area: number | string;
  floor_number?: number;
  total_floors?: number;
}

export interface IProperty {
  id: string;
  propertyCode: string;
  brokerId: string;
  propertyType: PropertyType;
  category: PropertyCategory;
  transactionType: TransactionType;
  location: PropertyLocation;
  address: string;
  ownerName?: string;
  ownerMobileNumber?: string;
  carpetArea: number;
  builtUpArea: number;
  price: number;
  maintenanceCost?: number;
  brokerCommission?: number;
  furnishing: FurnishingStatus;
  parking: boolean;
  floorNumber?: number;
  totalFloors?: number;
  propertyAge?: number;
  facing?: string;
  description?: string;
  amenities?: string;
  availableForVisit: boolean;
  propertiesstatus: PropertyAvailabilityStatus;
  postedDate?: Date;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  statusChangeDate?: Date;
  broker?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly propertyCodeService: PropertyCodeService,
  ) { }

  /**
   * Validates business logic for property dimensions and levels.
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
   * Helper to map raw DB results to IProperty shape
   */
  private mapProperty(raw: IRawProperty | null, currentUser?: UserInfo): IProperty | null {
    if (!raw) return null;

    const property: IProperty = {
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
      maintenanceCost: raw.maintenance_cost ? Number(raw.maintenance_cost) : undefined,
      furnishing: raw.furnishing,
      parking: Boolean(raw.parking),
      floorNumber: raw.floor_number,
      totalFloors: raw.total_floors,
      propertyAge: raw.property_age,
      facing: raw.facing,
      description: raw.description,
      amenities: raw.amenities ?? undefined,
      availableForVisit: Boolean(raw.available_for_visit),
      propertiesstatus: raw.propertiesstatus,
      brokerCommission: raw.broker_commission ? Number(raw.broker_commission) : undefined,
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      statusChangeDate: raw.status_change_date ? new Date(raw.status_change_date) : undefined,
    };

    if (raw.b_id) {
      property.broker = {
        id: raw.b_id as string,
        name: raw.b_name as string,
        email: raw.b_email as string,
        phone: raw.b_phone as string,
      };
    }

    const isOwner = currentUser?.role === UserRole.BROKER && property.brokerId === currentUser.id;
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      delete property.ownerName;
      delete property.ownerMobileNumber;
      delete property.brokerCommission;
    }

    return property;
  }

  async create(createPropertyDto: CreatePropertyDto, user: UserInfo): Promise<IProperty | null> {
    this.validatePropertyLogic(
      createPropertyDto.carpetArea,
      createPropertyDto.builtUpArea,
      createPropertyDto.floorNumber,
      createPropertyDto.totalFloors
    );

    return this.db.transaction(async (conn) => {
      const propertyCode = await this.propertyCodeService.generateNextCode(conn);
      const id = uuidv4();

      await this.db.execute(conn, PROPERTY_INSERT_QUERY, [
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

      const [newProperty] = await this.db.execute(conn, PROPERTY_FIND_BY_ID_QUERY, [id, id, STATUS.ACTIVE]) as IRawProperty[];
      return this.mapProperty(newProperty, user);
    });
  }

  async findAll(query: PropertyQueryDto, currentUser?: UserInfo): Promise<{ items: IProperty[], total: number, page: number, lastPage: number }> {
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

    let sql = PROPERTY_FIND_ALL_BASE_QUERY;
    const params: SqlParam[] = [];

    if (currentUser?.role === UserRole.ADMIN) {
      // Admin can see all properties and filter by record status
      if (status && status !== AdminPropertyQueryStatus.ALL) {
        const statusMap: Record<string, number> = {
          [AdminPropertyQueryStatus.ACTIVE]: STATUS.ACTIVE,
          [AdminPropertyQueryStatus.INACTIVE]: STATUS.INACTIVE,
          [AdminPropertyQueryStatus.DELETED]: STATUS.DELETED,
        };
        sql += ` AND p.status = ?`;
        params.push(statusMap[status]);
      }
    } else if (currentUser?.role === UserRole.BROKER) {
      // Broker sees only their own properties in all availability states
      sql += ` AND p.status = ? AND p.broker_id = ?`;
      params.push(STATUS.ACTIVE, currentUser.id);
    } else {
      // Customer / guest: only ACTIVE + AVAILABLE + open for visits
      sql += ` AND p.status = ?`;
      params.push(STATUS.ACTIVE);

      const visitFlag = availableForVisit !== undefined ? (availableForVisit ? 1 : 0) : 1;
      const statusFlag = propertiesstatus || PropertyAvailabilityStatus.AVAILABLE;

      sql += ` AND p.available_for_visit = ? AND p.propertiesstatus = ?`;
      params.push(visitFlag, statusFlag);
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

    (Object.keys(filters) as Array<keyof typeof filters>).forEach(key => {
      const val = filters[key];
      if (val) {
        const colMap: Record<string, string> = { 
          type: 'property_type',
          propertyType: 'property_type', 
          transactionType: 'transaction_type' 
        };
        const colName = colMap[key as string] || (key as string);
        sql += ` AND p.${colName} = ?`;
        params.push(val as SqlParam);
      }
    });

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const [countResult] = await this.db.query(countSql, params) as { total: number }[];
    const total = Number(countResult.total);

    sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await this.db.query(sql, params) as IRawProperty[];
    const items = rows.map((row) => this.mapProperty(row, currentUser)).filter((p): p is IProperty => p !== null);

    return {
      items,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, currentUser?: UserInfo): Promise<IProperty | null> {
    const [row] = await this.db.query(PROPERTY_FIND_BY_ID_QUERY, [id, id, STATUS.ACTIVE]) as IRawProperty[];

    if (!row) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Broker can only view their own property's detail
    if (currentUser?.role === UserRole.BROKER && row.broker_id !== currentUser.id) {
      throw new ForbiddenException('You can only view your own properties');
    }

    return this.mapProperty(row, currentUser);
  }

  async findMyProperties(query: PropertyQueryDto, user: UserInfo): Promise<{ items: IProperty[], total: number, page: number, lastPage: number }> {
    // findAll already auto-scopes to broker's own properties when role is BROKER
    return this.findAll({ ...query }, user);
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, user: UserInfo): Promise<IProperty | null> {
    const [existing] = await this.db.query(PROPERTY_FIND_MINIMAL_QUERY, [id, id]) as IRawPropertyMinimal[];

    if (!existing || existing.status !== STATUS.ACTIVE) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

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

    const updates: string[] = [];
    const params: SqlParam[] = [];
    const colMap: Record<string, string> = {
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

    (Object.keys(updatePropertyDto) as Array<keyof UpdatePropertyDto>).forEach(key => {
      const val = updatePropertyDto[key];
      if (val !== undefined) {
        const col = colMap[key as string] || (key as string);
        updates.push(`${col} = ?`);
        params.push(key === 'availableForVisit' || key === 'parking' ? (val ? 1 : 0) : (val as SqlParam));
      }
    });

    if (updates.length > 0) {
      params.push(existing.id);
      await this.db.query(
        `UPDATE properties SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const [updated] = await this.db.query(PROPERTY_FIND_BY_ID_QUERY, [existing.id, existing.id, STATUS.ACTIVE]) as IRawProperty[];
    return this.mapProperty(updated, user);
  }

  async remove(id: string, user: UserInfo): Promise<{ success: boolean; message: string }> {
    const [existing] = await this.db.query(PROPERTY_FIND_MINIMAL_QUERY, [id, id]) as IRawPropertyMinimal[];

    if (!existing) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    if (user.role === UserRole.BROKER && existing.broker_id !== user.id) {
      throw new ForbiddenException('You can only delete your own properties');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.BROKER) {
      throw new ForbiddenException('You do not have permission to delete properties');
    }

    await this.db.query(PROPERTY_SOFT_DELETE_QUERY, [STATUS.DELETED, existing.id]);

    return { success: true, message: 'Property deleted successfully' };
  }

  async updateAvailabilityStatus(id: string, dto: UpdatePropertyAvailabilityDto, user: UserInfo): Promise<IProperty | null> {
    const [existing] = await this.db.query(PROPERTY_FIND_MINIMAL_QUERY, [id, id]) as IRawPropertyMinimal[];

    if (!existing || existing.status !== STATUS.ACTIVE) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    if (user.role === UserRole.BROKER && existing.broker_id !== user.id) {
      throw new ForbiddenException('You can only update the status of your own properties');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.BROKER) {
      throw new ForbiddenException('You do not have permission to update property status');
    }

    const statusChangeDate = (dto.propertiesstatus === PropertyAvailabilityStatus.SOLD || 
                             dto.propertiesstatus === PropertyAvailabilityStatus.RENTED) 
                             ? new Date() : null;

    await this.db.query(PROPERTY_UPDATE_AVAILABILITY_QUERY, [dto.propertiesstatus, statusChangeDate, existing.id]);

    const [updated] = await this.db.query(PROPERTY_FIND_BY_ID_QUERY, [existing.id, existing.id, STATUS.ACTIVE]) as IRawProperty[];
    return this.mapProperty(updated, user);
  }
}
