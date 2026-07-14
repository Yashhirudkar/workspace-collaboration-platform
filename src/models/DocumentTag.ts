import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class DocumentTag extends Model {
  public id!: string;
  public documentId!: string;
  public tagId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DocumentTag.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  tagId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'document_tags',
  indexes: [
    {
      unique: true,
      fields: ['documentId', 'tagId'],
    }
  ]
});

export default DocumentTag;
