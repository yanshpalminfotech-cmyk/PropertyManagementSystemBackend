import { User } from 'src/user/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';



// ✅ ENUM for token type
export enum TokenType {
    REFRESH = 'REFRESHTOKEN',
    ACCESS = 'ACCESSTOKEN',
}

@Entity('tokens')
export class Token {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Index('idx_token_hash', ['hashedToken'])
    @Column({ name: 'hashed_token', type: 'varchar', length: 255 })
    hashedToken!: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt!: Date;

    @Column({
        name: 'is_revoked',
        type: 'boolean',
        default: false,
    })
    isRevoked!: boolean;

    @Column({
        name: 'token_type',
        type: 'enum',
        enum: TokenType,
    })
    tokenType!: TokenType;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    // // 🔗 Relation with User (Commented out to decouple from TypeORM metadata logic)
    // @ManyToOne(() => User, (user) => user.tokens, {
    //     onDelete: 'CASCADE',
    // })
    // @JoinColumn({ name: 'user_id' })
    // user!: User;

}