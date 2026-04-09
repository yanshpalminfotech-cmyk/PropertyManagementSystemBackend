import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { STATUS } from '../common/enums/status.constant';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserCodeService } from './user-code.service';
import {
  USER_INSERT_QUERY,
  USER_FIND_BY_ID_QUERY,
  USER_UNLOCK_QUERY,
  USER_SOFT_DELETE_QUERY,
  USER_FIND_ALL_ACTIVE_QUERY,
  USER_CHECK_EXISTING_QUERY
} from './user.queries';

export interface IUser {
  id: string;
  userCode: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: string;
  failedLoginAttempts: number;
  isLocked: boolean;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly userCodeService: UserCodeService,
  ) { }

  /**
   * Helper to map raw DB results to User entity shape
   */
  private mapUser(raw: Record<string, unknown>, isSensitiveRequest = false): IUser | null {
    if (!raw) return null;

    const user: IUser = {
      id: raw.id as string,
      userCode: raw.user_code as string,
      name: raw.name as string,
      email: raw.email as string,
      phone: raw.phone as string,
      passwordHash: raw.password_hash as string,
      role: raw.role as string,
      failedLoginAttempts: raw.failed_login_attempts as number,
      isLocked: Boolean(raw.is_locked),
      status: raw.status as number,
      createdAt: raw.created_at as Date,
      updatedAt: raw.updated_at as Date,
    };

    if (!isSensitiveRequest) {
      delete user.passwordHash;
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<IUser | null> {
    const { email, phone, password, role, name } = createUserDto;

    return this.db.transaction(async (conn) => {
      // Use execute for transactional queries
      const existing = await this.db.execute(conn, USER_CHECK_EXISTING_QUERY, [email, phone]) as unknown[];

      if (existing.length > 0) {
        throw new BadRequestException('User with this email or phone already exists');
      }

      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);
      const id = uuidv4();

      const userCode = await this.userCodeService.generateNextCode(conn);

      await this.db.execute(conn, USER_INSERT_QUERY, [
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

      const [newUser] = await this.db.execute(conn, USER_FIND_BY_ID_QUERY, [id]) as Record<string, unknown>[];
      return this.mapUser(newUser);
    });
  }

  async findAll(): Promise<IUser[]> {
    const rows = await this.db.query(
      USER_FIND_ALL_ACTIVE_QUERY,
      [STATUS.ACTIVE]
    ) as Record<string, unknown>[];
    return rows.map((row) => this.mapUser(row)).filter((u): u is IUser => u !== null);
  }

  async findOne(id: string): Promise<IUser | null> {
    const [row] = await this.db.query(
      USER_FIND_BY_ID_QUERY,
      [id]
    ) as Record<string, unknown>[];

    if (!row) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapUser(row);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser | null> {
    const [existing] = await this.db.query(USER_FIND_BY_ID_QUERY, [id]) as Record<string, unknown>[];
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    const colMap: Record<string, string> = {
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
      await this.db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const [updated] = await this.db.query(USER_FIND_BY_ID_QUERY, [id]) as Record<string, unknown>[];
    return this.mapUser(updated);
  }

  async remove(id: string): Promise<void> {
    const [existing] = await this.db.query(USER_FIND_BY_ID_QUERY, [id]) as unknown[];
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.db.query(
      USER_SOFT_DELETE_QUERY,
      [STATUS.DELETED, id]
    );
  }

  async unlock(id: string): Promise<void> {
    const [existing] = await this.db.query(USER_FIND_BY_ID_QUERY, [id]) as unknown[];
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.db.query(
      USER_UNLOCK_QUERY,
      [id]
    );
  }
}
