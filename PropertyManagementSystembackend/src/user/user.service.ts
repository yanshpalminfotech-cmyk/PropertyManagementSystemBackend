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

export interface IRawUser {
  id: string;
  user_code: string;
  name: string;
  email: string;
  phone: string;
  password_hash?: string;
  role: string;
  failed_login_attempts: number;
  is_locked: number | boolean;
  status: number;
  created_at: Date;
  updated_at: Date;
}

export interface IUserCheckResult {
  id: string;
}

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

import { SqlParam } from '../common/types';

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
  private mapUser(raw: IRawUser | null, isSensitiveRequest = false): IUser | null {
    if (!raw) return null;

    const user: IUser = {
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

    if (!isSensitiveRequest) {
      delete user.passwordHash;
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<IUser | null> {
    const { email, phone, password, role, name } = createUserDto;

    return this.db.transaction(async (conn) => {
      const existing = await this.db.execute(conn, USER_CHECK_EXISTING_QUERY, [email, phone]) as IUserCheckResult[];

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
        0,
        0,
        STATUS.ACTIVE
      ]);

      const [newUser] = await this.db.execute(conn, USER_FIND_BY_ID_QUERY, [id]) as IRawUser[];
      return this.mapUser(newUser);
    });
  }

  async findAll(): Promise<IUser[]> {
    const rows = await this.db.query(
      USER_FIND_ALL_ACTIVE_QUERY,
      [STATUS.ACTIVE]
    ) as IRawUser[];
    return rows.map((row) => this.mapUser(row)).filter((u): u is IUser => u !== null);
  }

  async findOne(id: string): Promise<IUser | null> {
    const [row] = await this.db.query(
      USER_FIND_BY_ID_QUERY,
      [id]
    ) as IRawUser[];

    if (!row) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapUser(row);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser | null> {
    const [existing] = await this.db.query(USER_FIND_BY_ID_QUERY, [id]) as IRawUser[];
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updates: string[] = [];
    const params: SqlParam[] = [];

    const colMap: Record<string, string> = {
      userCode: 'user_code',
      passwordHash: 'password_hash',
      failedLoginAttempts: 'failed_login_attempts',
      isLocked: 'is_locked'
    };

    (Object.keys(updateUserDto) as Array<keyof UpdateUserDto>).forEach(key => {
      const val = updateUserDto[key];
      if (val !== undefined) {
        const col = colMap[key as string] || (key as string);
        updates.push(`${col} = ?`);
        params.push(val);
      }
    });

    if (updates.length > 0) {
      params.push(id);
      await this.db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const [updated] = await this.db.query(USER_FIND_BY_ID_QUERY, [id]) as IRawUser[];
    return this.mapUser(updated);
  }

  async remove(id: string): Promise<void> {
    const [existing] = await this.db.query(USER_FIND_BY_ID_QUERY, [id]) as Pick<IRawUser, 'id'>[];
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.db.query(
      USER_SOFT_DELETE_QUERY,
      [STATUS.DELETED, id]
    );
  }

  async unlock(id: string): Promise<void> {
    const [existing] = await this.db.query(USER_FIND_BY_ID_QUERY, [id]) as Pick<IRawUser, 'id'>[];
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.db.query(
      USER_UNLOCK_QUERY,
      [id]
    );
  }
}
