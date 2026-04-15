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
  USER_FIND_ALL_QUERY,
  USER_FIND_BY_ROLE_QUERY,
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
      const existing = await this.db.execute<IUserCheckResult[]>(conn, USER_CHECK_EXISTING_QUERY, [email, phone]);

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

      const newUserRows = await this.db.execute<IRawUser[]>(conn, USER_FIND_BY_ID_QUERY, [id]);
      return this.mapUser(newUserRows[0]);
    });
  }

  async findAll(role?: string): Promise<IUser[]> {
    let rows: IRawUser[];

    if (role) {
      rows = await this.db.query<IRawUser[]>(
        USER_FIND_BY_ROLE_QUERY,
        [role, STATUS.DELETED]
      );
    } else {
      rows = await this.db.query<IRawUser[]>(
        USER_FIND_ALL_QUERY,
        [STATUS.DELETED]
      );
    }

    return rows.map((row) => this.mapUser(row)).filter((u): u is IUser => u !== null);
  }

  async findOne(id: string): Promise<IUser | null> {
    const rows = await this.db.query<IRawUser[]>(
      USER_FIND_BY_ID_QUERY,
      [id]
    );
    const row = rows[0];

    if (!row) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapUser(row);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser | null> {
    const existingRows = await this.db.query<IRawUser[]>(USER_FIND_BY_ID_QUERY, [id]);
    const existing = existingRows[0];
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updates: string[] = [];
    const params: SqlParam[] = [];

    const colMap: Record<string, string> = {
      userCode: 'user_code',
      passwordHash: 'password_hash',
      failedLoginAttempts: 'failed_login_attempts',
      isLocked: 'is_locked',
    };

    // Use a temporary record to safely build the update payload
    const dataToUpdate: Record<string, any> = { ...updateUserDto };

    // If password is provided, hash it first
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      dataToUpdate.password_hash = await bcrypt.hash(updateUserDto.password, salt);
      delete dataToUpdate.password;
    }

    (Object.keys(dataToUpdate)).forEach((key) => {
      const val = dataToUpdate[key];
      if (val !== undefined) {
        const col = colMap[key] || key;
        updates.push(`${col} = ?`);
        params.push(val as SqlParam);
      }
    });

    if (updates.length > 0) {
      params.push(id);
      await this.db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
        params
      );
    }

    const updatedRows = await this.db.query<IRawUser[]>(USER_FIND_BY_ID_QUERY, [id]);
    return this.mapUser(updatedRows[0]);
  }

  async remove(id: string): Promise<void> {
    const rows = await this.db.query<Pick<IRawUser, 'id'>[]>(USER_FIND_BY_ID_QUERY, [id]);
    const existing = rows[0];
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
