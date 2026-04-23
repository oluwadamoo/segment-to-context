import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1776811553790 implements MigrationInterface {
  name = "Init1776811553790";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" character varying NOT NULL,
        "tenant_id" character varying NOT NULL,
        "user_id" character varying NOT NULL,
        "event_type" character varying NOT NULL,
        "payload" jsonb NOT NULL,
        "processed" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_personas" (
        "tenant_id" character varying NOT NULL,
        "user_id" character varying NOT NULL,
        "persona" jsonb NOT NULL,
        "last_updated" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_personas" PRIMARY KEY ("tenant_id", "user_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_unprocessed_by_user"
      ON "events" ("tenant_id", "user_id", "created_at")
      WHERE "processed" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_events_unprocessed_by_user"`);
    await queryRunner.query(`DROP TABLE "user_personas"`);
    await queryRunner.query(`DROP TABLE "events"`);
  }
}