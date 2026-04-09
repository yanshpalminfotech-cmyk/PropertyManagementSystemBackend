import { Token } from '../../auth/entities/token.entity';
import { Property } from '../../properties/entities/property.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';

// import { RefreshToken } from '../../auth/entities/refresh-token.entity';
// import { Property } from '../../properties/entities/property.entity';
// import { VisitRequest } from '../../visit-requests/entities/visit-request.entity';


// ✅ ENUMS (must for TypeScript strict mode)

export enum UserRole {
    ADMIN = 'ADMIN',
    BROKER = 'BROKER',
    CUSTOMER = 'CUSTOMER',
}

import { STATUS } from '../../common/enums/status.constant';


@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_code', type: 'varchar', length: 50 })
    userCode!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Index()
    @Column({ type: 'varchar', length: 255 })
    email!: string;

    @Index()
    @Column({ type: 'varchar', length: 20 })
    phone!: string;

    @Exclude()
    @Column({ name: 'password_hash', type: 'text' })
    passwordHash!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
    })
    role!: UserRole;

    @Column({
        name: 'failed_login_attempts',
        type: 'int',
        default: 0,
    })
    failedLoginAttempts!: number;

    @Column({
        name: 'is_locked',
        type: 'boolean',
        default: false,
    })
    isLocked!: boolean;

    @Index()
    @Column({
        type: 'tinyint',
        default: STATUS.ACTIVE,
    })
    status!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;


    // 🔗 RELATIONS

    // 1. User → Refresh Tokens
    // @OneToMany(() => Token, (token) => token.user)
    // tokens!: Token[];

    // // 2. Broker → Properties
    // @OneToMany(() => Property, (property) => property.broker)
    // properties!: Property[];

    // // 3. Customer → Visit Requests
    // @OneToMany(() => VisitRequest, (visit) => visit.customer)
    // visitRequests: VisitRequest[];
}