import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventHistoryIndex1776811553792 implements MigrationInterface {
    name = "AddEventHistoryIndex1776811553792";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_events_tenant_created_at_id"
            ON "events" ("tenant_id", "created_at" DESC, "id" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_events_tenant_created_at_id"
        `);
    }
}
