import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class FavoriteDocument extends Model {
  public id!: string;
  public userId!: string;
  public documentId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FavoriteDocument.init({
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
}, {
  sequelize,
  tableName: 'favorite_documents',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'documentId'],
    }
  ]
});

export default FavoriteDocument;
