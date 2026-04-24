import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryColumn,
} from "typeorm";

@Entity("events")
@Index("IDX_events_tenant_user_created_at", ["tenantId", "userId", "createdAt"])
@Index("IDX_events_tenant_created_at_id", ["tenantId", "createdAt", "id"])
@Index("IDX_events_unprocessed_by_user", ["tenantId", "userId", "createdAt"], {
    where: `"processed" = false`,
})
export class EventEntity {
    @PrimaryColumn({ type: "varchar" })
    id!: string;

    @Column({ name: "tenant_id", type: "varchar" })
    tenantId!: string;

    @Column({ name: "user_id", type: "varchar" })
    userId!: string;

    @Column({ name: "event_type", type: "varchar" })
    eventType!: string;

    @Column({ type: "jsonb" })
    payload!: Record<string, unknown>;

    @Column({ type: "boolean", default: false })
    processed!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    createdAt!: Date;
}
