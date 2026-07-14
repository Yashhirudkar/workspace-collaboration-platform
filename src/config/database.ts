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
  const { default: FavoriteDocument } = await import('@/models/FavoriteDocument');
  const { default: PinnedDocument } = await import('@/models/PinnedDocument');
  const { default: UserDocumentActivity } = await import('@/models/UserDocumentActivity');
  const { default: Tag } = await import('@/models/Tag');
  const { default: DocumentTag } = await import('@/models/DocumentTag');

  // Avoid re-registering associations if they are already setup (important for Next.js dev hot-reloads)
  if (Document.associations && Document.associations.favoritedBy) {
    return;
  }

  // A Document belongs to a Creator (User)
  Document.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
  User.hasMany(Document, { as: 'createdDocuments', foreignKey: 'createdBy', onDelete: 'CASCADE' });

  // A Document belongs to a Last Editor (User)
  Document.belongsTo(User, { as: 'lastEditor', foreignKey: 'lastEditedBy' });

  // Document Collaborators (Many-to-Many)
  User.belongsToMany(Document, { through: DocumentCollaborator, as: 'collaboratedDocuments', foreignKey: 'userId', onDelete: 'CASCADE' });
  Document.belongsToMany(User, { through: DocumentCollaborator, as: 'collaborators', foreignKey: 'documentId', onDelete: 'CASCADE' });

  DocumentCollaborator.belongsTo(User, { as: 'user', foreignKey: 'userId', onDelete: 'CASCADE' });
  DocumentCollaborator.belongsTo(Document, { as: 'document', foreignKey: 'documentId', onDelete: 'CASCADE' });

  // Operation associations
  Operation.belongsTo(Document, { as: 'document', foreignKey: 'documentId', onDelete: 'CASCADE' });
  Document.hasMany(Operation, { as: 'operations', foreignKey: 'documentId', onDelete: 'CASCADE' });
  Operation.belongsTo(User, { as: 'user', foreignKey: 'userId', onDelete: 'CASCADE' });
  User.hasMany(Operation, { as: 'operations', foreignKey: 'userId', onDelete: 'CASCADE' });

  // DocumentVersion associations
  DocumentVersion.belongsTo(Document, { as: 'document', foreignKey: 'documentId', onDelete: 'CASCADE' });
  Document.hasMany(DocumentVersion, { as: 'versions', foreignKey: 'documentId', onDelete: 'CASCADE' });
  DocumentVersion.belongsTo(User, { as: 'author', foreignKey: 'createdBy', onDelete: 'CASCADE' });
  User.hasMany(DocumentVersion, { as: 'versions', foreignKey: 'createdBy', onDelete: 'CASCADE' });

  // Favorite Documents
  User.belongsToMany(Document, { through: FavoriteDocument, as: 'favoriteDocuments', foreignKey: 'userId', onDelete: 'CASCADE' });
  Document.belongsToMany(User, { through: FavoriteDocument, as: 'favoritedBy', foreignKey: 'documentId', onDelete: 'CASCADE' });

  // Pinned Documents
  User.belongsToMany(Document, { through: PinnedDocument, as: 'pinnedDocuments', foreignKey: 'userId', onDelete: 'CASCADE' });
  Document.belongsToMany(User, { through: PinnedDocument, as: 'pinnedBy', foreignKey: 'documentId', onDelete: 'CASCADE' });

  // User Document Activity
  UserDocumentActivity.belongsTo(User, { as: 'user', foreignKey: 'userId', onDelete: 'CASCADE' });
  UserDocumentActivity.belongsTo(Document, { as: 'document', foreignKey: 'documentId', onDelete: 'CASCADE' });
  Document.hasMany(UserDocumentActivity, { as: 'activities', foreignKey: 'documentId', onDelete: 'CASCADE' });
  User.hasMany(UserDocumentActivity, { as: 'activities', foreignKey: 'userId', onDelete: 'CASCADE' });

  // Tags
  Document.belongsToMany(Tag, { through: DocumentTag, as: 'tags', foreignKey: 'documentId', onDelete: 'CASCADE' });
  Tag.belongsToMany(Document, { through: DocumentTag, as: 'taggedDocuments', foreignKey: 'tagId', onDelete: 'CASCADE' });
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

  // Dynamic migration: Ensure soft-delete columns exist in existing 'documents' table
  try {
    await sequelize.query('ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;');
    await sequelize.query('ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletedBy" UUID;');
    await sequelize.query('ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletedReason" VARCHAR(255);');
  } catch (err) {
    logger.error('Failed to migrate documents table columns:', err);
  }
  
  isInitialized = true;
}
