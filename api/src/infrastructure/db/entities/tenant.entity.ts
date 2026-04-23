import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("tenants")
export class TenantEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index("UQ_tenants_email", { unique: true })
    @Column({ type: "varchar", unique: true })
    email!: string;

    @Column({ name: "password_hash", type: "varchar" })
    passwordHash!: string;

    @Index("UQ_tenants_api_key_hash", { unique: true })
    @Column({ name: "api_key_hash", type: "varchar", unique: true })
    apiKeyHash!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updatedAt!: Date;
}
