import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class UserDocumentActivity extends Model {
  public id!: string;
  public userId!: string;
  public documentId!: string;
  public lastOpenedAt!: Date | null;
  public lastEditedAt!: Date | null;
  public lastViewedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserDocumentActivity.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lastOpenedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastEditedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastViewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'user_document_activity',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'documentId'],
    }
  ]
});

export default UserDocumentActivity;
