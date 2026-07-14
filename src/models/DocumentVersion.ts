import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class DocumentVersion extends Model {
  public id!: string;
  public documentId!: string;
  public versionNumber!: number;
  public snapshot!: Record<string, unknown>;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DocumentVersion.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  snapshot: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'document_versions',
  indexes: [
    { fields: ['documentId'] },
    { unique: true, fields: ['documentId', 'versionNumber'] }
  ]
});

export default DocumentVersion;
