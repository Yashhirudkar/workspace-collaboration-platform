import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Document extends Model {
  public id!: string;
  public title!: string;
  public content!: Record<string, unknown>;
  public createdBy!: string;
  public lastEditedBy!: string;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public deletedReason!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Document.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lastEditedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deletedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  deletedReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'documents',
});

export default Document;
