import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenants1776811553791 implements MigrationInterface {
  name = "AddTenants1776811553791";

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
        CREATE TABLE "tenants" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(),
            "email" character varying NOT NULL,
            "password_hash" character varying NOT NULL,
            "api_key_hash" character varying NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_tenants_id" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_tenants_email" UNIQUE ("email"),
            CONSTRAINT "UQ_tenants_api_key_hash" UNIQUE ("api_key_hash")
        )
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}