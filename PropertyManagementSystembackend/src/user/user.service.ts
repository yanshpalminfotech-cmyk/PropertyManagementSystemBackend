import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { STATUS } from '../common/enums/status.constant';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { UserCodeService } from './user-code.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly userCodeService: UserCodeService,
  ) { }

  /**
   * Helper to map raw DB results to User entity shape
   */
  private mapUser(raw: any, isSensitiveRequest = false): any {
    if (!raw) return null;

    const user: any = {
      id: raw.id,
      userCode: raw.user_code,
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      passwordHash: raw.password_hash,
      role: raw.role,
      failedLoginAttempts: raw.failed_login_attempts,
      isLocked: Boolean(raw.is_locked),
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };

    // Conditionally check and handle privacy
    if (!isSensitiveRequest) {
      delete user.passwordHash;
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<any> {
    const { email, phone, password, role, name } = createUserDto;

    return this.dataSource.transaction(async (manager) => {
      // Direct SQL check for existing user within transaction
      const existing = await manager.query(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [email, phone]
      );

      if (existing.length > 0) {
        throw new BadRequestException('User with this email or phone already exists');
      }

      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);
      const id = uuidv4();
      
      // Generate sequential user code with pessimistic locking
      const userCode = await this.userCodeService.generateNextCode(manager);

      const sql = `
        INSERT INTO users (
          id, user_code, name, email, phone, password_hash, 
          role, failed_login_attempts, is_locked, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await manager.query(sql, [
        id,
        userCode,
        name,
        email,
        phone,
        passwordHash,
        role,
        0, // failed_login_attempts
        0, // is_locked
        STATUS.ACTIVE
      ]);

      const [newUser] = await manager.query('SELECT * FROM users WHERE id = ?', [id]);
      return this.mapUser(newUser);
    });
  }

  async findAll(): Promise<any[]> {
    const rows = await this.userRepository.query(
      'SELECT * FROM users WHERE status = ?',
      [STATUS.ACTIVE]
    );
    return rows.map((row: any) => this.mapUser(row));
  }

  async findOne(id: string): Promise<any> {
    const [row] = await this.userRepository.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!row) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapUser(row);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const [existing] = await this.userRepository.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updates: string[] = [];
    const params: any[] = [];

    // Map DTO keys to snake_case
    const colMap: any = {
      userCode: 'user_code',
      passwordHash: 'password_hash',
      failedLoginAttempts: 'failed_login_attempts',
      isLocked: 'is_locked'
    };

    Object.keys(updateUserDto).forEach(key => {
      const val = (updateUserDto as any)[key];
      if (val !== undefined) {
        const col = colMap[key] || key;
        updates.push(`${col} = ?`);
        params.push(key === 'isLocked' ? (val ? 1 : 0) : val);
      }
    });

    if (updates.length > 0) {
      params.push(id);
      await this.userRepository.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const [updated] = await this.userRepository.query('SELECT * FROM users WHERE id = ?', [id]);
    return this.mapUser(updated);
  }

  async remove(id: string): Promise<void> {
    const [existing] = await this.userRepository.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [STATUS.DELETED, id]
    );
  }

  async unlock(id: string): Promise<void> {
    const [existing] = await this.userRepository.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.query(
      'UPDATE users SET is_locked = 0, failed_login_attempts = 0 WHERE id = ?',
      [id]
    );
  }
}
