import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

const MIGRATIONS = [
  {
    name: '01_create_productivity_tables',
    sql: `
      ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE NULL;
      ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletedBy" UUID NULL;
      ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletedReason" VARCHAR(255) NULL;

      CREATE TABLE IF NOT EXISTS "tags" (
        "id" UUID PRIMARY KEY,
        "name" VARCHAR(255) UNIQUE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "favorite_documents" (
        "id" UUID PRIMARY KEY,
        "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "documentId" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE("userId", "documentId")
      );

      CREATE TABLE IF NOT EXISTS "pinned_documents" (
        "id" UUID PRIMARY KEY,
        "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "documentId" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE("userId", "documentId")
      );

      CREATE TABLE IF NOT EXISTS "document_tags" (
        "id" UUID PRIMARY KEY,
        "documentId" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
        "tagId" UUID NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE("documentId", "tagId")
      );

      CREATE TABLE IF NOT EXISTS "user_document_activity" (
        "id" UUID PRIMARY KEY,
        "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "documentId" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
        "lastOpenedAt" TIMESTAMP WITH TIME ZONE NULL,
        "lastEditedAt" TIMESTAMP WITH TIME ZONE NULL,
        "lastViewedAt" TIMESTAMP WITH TIME ZONE NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE("userId", "documentId")
      );
    `
  }
];

export async function runDatabaseMigrations() {
  try {
    // Create meta table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "migrations_meta" (
        "name" VARCHAR(255) PRIMARY KEY,
        "executedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Execute migrations sequentially
    for (const migration of MIGRATIONS) {
      const [ran] = await sequelize.query(`
        SELECT 1 FROM "migrations_meta" WHERE "name" = :name;
      `, {
        replacements: { name: migration.name },
        type: 'SELECT'
      });

      if (ran.length === 0) {
        logger.info(`Executing DB migration: ${migration.name}...`);
        await sequelize.query(migration.sql);
        await sequelize.query(`
          INSERT INTO "migrations_meta" ("name") VALUES (:name);
        `, {
          replacements: { name: migration.name }
        });
        logger.info(`DB Migration successfully executed: ${migration.name}`);
      }
    }
  } catch (error) {
    logger.error('Failed to run migration scripts:', error);
    throw error;
  }
}
