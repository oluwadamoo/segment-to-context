import {
    Column,
    Entity,
    PrimaryColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("user_personas")
export class UserPersonaOrmEntity {
    @PrimaryColumn({ name: "tenant_id", type: "varchar" })
    tenantId!: string;

    @PrimaryColumn({ name: "user_id", type: "varchar" })
    userId!: string;

    @Column({ type: "jsonb" })
    persona!: Record<string, unknown>;

    @UpdateDateColumn({ name: "last_updated", type: "timestamp" })
    lastUpdated!: Date;
}