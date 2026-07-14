import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Operation extends Model {
  public id!: string;
  public documentId!: string;
  public userId!: string;
  public timestamp!: number;
  public operationType!: 'INSERT' | 'DELETE' | 'UPDATE' | 'RESTORE';
  public payload!: Record<string, unknown>;
  public status!: 'PENDING' | 'SYNCED' | 'FAILED';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Operation.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  operationType: {
    type: DataTypes.ENUM('INSERT', 'DELETE', 'UPDATE', 'RESTORE'),
    allowNull: false,
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SYNCED', 'FAILED'),
    allowNull: false,
    defaultValue: 'SYNCED',
  }
}, {
  sequelize,
  tableName: 'operations',
  indexes: [
    {
      unique: true,
      fields: ['id', 'documentId']
    },
    {
      fields: ['documentId', 'timestamp']
    },
    {
      fields: ['userId']
    }
  ]
});

export default Operation;
