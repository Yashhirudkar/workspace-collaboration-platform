import { sequelize } from '../config/database';
import { logger } from '../utils/logger';
import migration = require('../../migrations/20260714153811-create-productivity-features.js');

export async function runDatabaseMigrations() {
  try {
    // 1. Check if migrations_meta table exists first to avoid concurrent CREATE TABLE race conditions
    const [tableExists] = await sequelize.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'migrations_meta'
    `);

    if (tableExists.length === 0) {
      try {
        await sequelize.query(`
          CREATE TABLE "migrations_meta" (
            "name" VARCHAR(255) PRIMARY KEY,
            "executedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } catch (err: any) {
        // If it was created concurrently by another worker, ignore the constraint violation
        if (!err.message.includes('already exists') && !err.message.includes('duplicate key')) {
          throw err;
        }
      }
    }

    // 2. Check if this migration already ran
    const migrationName = '20260714153811-create-productivity-features';
    const ran = await sequelize.query(`
      SELECT 1 FROM "migrations_meta" WHERE "name" = :name;
    `, {
      replacements: { name: migrationName },
      type: 'SELECT'
    }) as any[];

    if (ran.length === 0) {
      logger.info(`Executing DB migration via Sequelize Migration API: ${migrationName}...`);
      
      const queryInterface = sequelize.getQueryInterface();
      const Sequelize = sequelize.constructor;
      
      // Execute the Up migration using the Sequelize Migration API
      await migration.up(queryInterface, Sequelize);

      // Record migration execution
      await sequelize.query(`
        INSERT INTO "migrations_meta" ("name") VALUES (:name);
      `, {
        replacements: { name: migrationName }
      });
      
      logger.info(`DB Migration successfully executed: ${migrationName}`);
    }
  } catch (error) {
    logger.error('Failed to run database migrations:', error);
    throw error;
  }
}
