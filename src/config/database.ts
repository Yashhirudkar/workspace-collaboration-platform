import { Sequelize } from 'sequelize';
import pg from 'pg';
import { ENV } from './env';
import { logger } from '../utils/logger';

export const sequelize = new Sequelize(ENV.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
  }
});

export async function setupAssociations() {
  const { default: User } = await import('@/models/User');
  const { default: Document } = await import('@/models/Document');
  const { default: DocumentCollaborator } = await import('@/models/DocumentCollaborator');
  const { default: Operation } = await import('@/models/Operation');
  const { default: DocumentVersion } = await import('@/models/DocumentVersion');

  // Avoid re-registering associations if they are already setup (important for Next.js dev hot-reloads)
  if (Document.associations && Document.associations.creator) {
    return;
  }

  // A Document belongs to a Creator (User)
  Document.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
  User.hasMany(Document, { foreignKey: 'createdBy', onDelete: 'CASCADE' });

  // A Document belongs to a Last Editor (User)
  Document.belongsTo(User, { as: 'lastEditor', foreignKey: 'lastEditedBy' });

  // Document Collaborators (Many-to-Many)
  User.belongsToMany(Document, { through: DocumentCollaborator, foreignKey: 'userId', onDelete: 'CASCADE' });
  Document.belongsToMany(User, { through: DocumentCollaborator, foreignKey: 'documentId', onDelete: 'CASCADE' });

  DocumentCollaborator.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  DocumentCollaborator.belongsTo(Document, { foreignKey: 'documentId', onDelete: 'CASCADE' });

  // Operation associations
  Operation.belongsTo(Document, { foreignKey: 'documentId', onDelete: 'CASCADE' });
  Document.hasMany(Operation, { foreignKey: 'documentId', onDelete: 'CASCADE' });
  Operation.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  User.hasMany(Operation, { foreignKey: 'userId', onDelete: 'CASCADE' });

  // DocumentVersion associations
  DocumentVersion.belongsTo(Document, { foreignKey: 'documentId', onDelete: 'CASCADE' });
  Document.hasMany(DocumentVersion, { foreignKey: 'documentId', onDelete: 'CASCADE' });
  DocumentVersion.belongsTo(User, { as: 'author', foreignKey: 'createdBy', onDelete: 'CASCADE' });
  User.hasMany(DocumentVersion, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
}

let isInitialized = false;

async function createDatabaseIfNotExists() {
  const url = new URL(ENV.DATABASE_URL);
  const dbName = url.pathname.slice(1);
  
  if (!dbName) return;
  
  url.pathname = '/postgres'; // connect to default db
  
  const tempSequelize = new Sequelize(url.toString(), {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
  });

  try {
    const [results] = await tempSequelize.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    if (results.length === 0) {
      logger.info(`Database ${dbName} does not exist. Creating...`);
      await tempSequelize.query(`CREATE DATABASE "${dbName}"`);
      logger.info(`Database ${dbName} created successfully.`);
    }
  } catch (error) {
    logger.error('Failed to create database automatically:', error);
  } finally {
    await tempSequelize.close();
  }
}

export async function initDatabase() {
  if (isInitialized) return;
  
  await createDatabaseIfNotExists();
  
  await setupAssociations();
  // Using sync() to auto-create tables for the assignment. In production, use migrations.
  await sequelize.sync();
  
  isInitialized = true;
}
