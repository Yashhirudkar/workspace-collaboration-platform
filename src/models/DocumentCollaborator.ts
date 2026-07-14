import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { DOCUMENT_ROLES, DocumentRole } from '../constants/roles';

class DocumentCollaborator extends Model {
  public id!: string;
  public userId!: string;
  public documentId!: string;
  public role!: DocumentRole;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DocumentCollaborator.init({
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
  role: {
    type: DataTypes.ENUM(DOCUMENT_ROLES.OWNER, DOCUMENT_ROLES.EDITOR, DOCUMENT_ROLES.VIEWER),
    allowNull: false,
    defaultValue: DOCUMENT_ROLES.VIEWER,
  }
}, {
  sequelize,
  tableName: 'document_collaborators',
  indexes: [
    { fields: ['userId'] },
    { fields: ['documentId'] },
    { unique: true, fields: ['userId', 'documentId'] }
  ]
});

export default DocumentCollaborator;
