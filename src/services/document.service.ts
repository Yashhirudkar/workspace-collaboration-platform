import Document from '../models/Document';
import DocumentCollaborator from '../models/DocumentCollaborator';
import DocumentTag from '../models/DocumentTag';
import UserDocumentActivity from '../models/UserDocumentActivity';
import User from '../models/User';
import { CreateDocumentInput, UpdateDocumentInput } from '../schemas/document.schema';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { DOCUMENT_ROLES } from '../constants/roles';
import { sequelize } from '../config/database';
import { Op } from 'sequelize';

export class DocumentService {
  static async createDocument(userId: string, data: CreateDocumentInput) {
    const document = await Document.create({
      title: data.title,
      content: data.content || {},
      createdBy: userId,
      lastEditedBy: userId,
    });

    await DocumentCollaborator.create({
      userId,
      documentId: document.id,
      role: DOCUMENT_ROLES.OWNER,
    });

    return document;
  }

  static async getDocumentsForUser(userId: string) {
    const collabs = await DocumentCollaborator.findAll({
      where: { userId },
    });
    const docIds = collabs.map(c => c.documentId);
    const documents = await Document.findAll({ 
      where: { id: docIds, deletedAt: null },
      include: [
        {
          model: User,
          as: 'favoritedBy',
          where: { id: userId },
          required: false,
          attributes: ['id']
        },
        {
          model: User,
          as: 'pinnedBy',
          where: { id: userId },
          required: false,
          attributes: ['id']
        },
        {
          association: 'tags',
          required: false,
        }
      ]
    });

    // Map virtual properties
    return documents.map(doc => {
      const docJson = doc.toJSON() as any;
      docJson.isFavorite = !!(docJson.favoritedBy && docJson.favoritedBy.length > 0);
      docJson.isPinned = !!(docJson.pinnedBy && docJson.pinnedBy.length > 0);
      
      // Assign appropriate role based on collaborator record
      const collabRecord = collabs.find(c => c.documentId === doc.id);
      docJson.role = collabRecord ? collabRecord.role : null;

      delete docJson.favoritedBy;
      delete docJson.pinnedBy;
      return docJson;
    });
  }

  static async getDocumentById(userId: string, documentId: string) {
    const collab = await DocumentCollaborator.findOne({
      where: { userId, documentId },
    });

    if (!collab) {
      throw new NotFoundError('Document not found or access denied');
    }

    const document = await Document.findOne({
      where: { id: documentId, deletedAt: null },
      include: [
        {
          model: User,
          as: 'favoritedBy',
          where: { id: userId },
          required: false,
          attributes: ['id']
        },
        {
          model: User,
          as: 'pinnedBy',
          where: { id: userId },
          required: false,
          attributes: ['id']
        },
        {
          association: 'tags',
          required: false,
        }
      ]
    });
    if (!document) throw new NotFoundError('Document not found');

    // Module 3: Log activity
    const now = new Date();
    await UserDocumentActivity.upsert({
      userId,
      documentId,
      lastOpenedAt: now,
      lastViewedAt: now,
    });

    const docJson = document.toJSON() as any;
    docJson.isFavorite = !!(docJson.favoritedBy && docJson.favoritedBy.length > 0);
    docJson.isPinned = !!(docJson.pinnedBy && docJson.pinnedBy.length > 0);
    docJson.role = collab.role;
    delete docJson.favoritedBy;
    delete docJson.pinnedBy;

    return docJson;
  }

  static async updateDocument(userId: string, documentId: string, data: UpdateDocumentInput) {
    const collab = await DocumentCollaborator.findOne({
      where: { userId, documentId },
    });

    if (!collab) {
      throw new NotFoundError('Document not found or access denied');
    }

    if (collab.role === DOCUMENT_ROLES.VIEWER) {
      throw new ForbiddenError('You only have view access to this document');
    }

    const document = await Document.findOne({
      where: { id: documentId, deletedAt: null }
    });
    if (!document) throw new NotFoundError('Document not found');

    await document.update({
      ...data,
      lastEditedBy: userId,
    });

    // Module 3: Log edit activity
    await UserDocumentActivity.upsert({
      userId,
      documentId,
      lastEditedAt: new Date(),
    });

    return document;
  }

  static async deleteDocument(userId: string, documentId: string) {
    const document = await Document.findOne({
      where: { id: documentId, deletedAt: null }
    });
    if (!document) throw new NotFoundError('Document not found');
    
    // Module 5: Soft Delete
    await document.update({
      deletedAt: new Date(),
      deletedBy: userId,
    });
  }

  // Module 5: Permanent Delete
  static async permanentDeleteDocument(userId: string, documentId: string) {
    const document = await Document.findByPk(documentId);
    if (!document) throw new NotFoundError('Document not found');
    await document.destroy();
  }

  // Module 5: Restore Soft Deleted
  static async restoreDocument(userId: string, documentId: string) {
    const document = await Document.findByPk(documentId);
    if (!document) throw new NotFoundError('Document not found');
    
    await document.update({
      deletedAt: null,
      deletedBy: null,
      deletedReason: null,
    });
    return document;
  }

  // Module 5: Get Trash
  static async getTrashForUser(userId: string) {
    const collabs = await DocumentCollaborator.findAll({
      where: { userId, role: DOCUMENT_ROLES.OWNER },
    });
    const docIds = collabs.map(c => c.documentId);

    return Document.findAll({
      where: {
        id: docIds,
        deletedAt: { [Op.ne]: null },
      },
    });
  }

  // Module 4: Duplicate Document
  static async duplicateDocument(userId: string, documentId: string, copyCollaborators = false) {
    const sourceDocument = await Document.findOne({
      where: { id: documentId, deletedAt: null }
    });

    if (!sourceDocument) throw new NotFoundError('Document not found');

    const transaction = await sequelize.transaction();

    try {
      const duplicatedDoc = await Document.create({
        title: `${sourceDocument.title} (Copy)`,
        content: sourceDocument.content,
        createdBy: userId,
        lastEditedBy: userId,
      }, { transaction });

      await DocumentCollaborator.create({
        userId,
        documentId: duplicatedDoc.id,
        role: DOCUMENT_ROLES.OWNER,
      }, { transaction });

      if (copyCollaborators) {
        const existingCollabs = await DocumentCollaborator.findAll({
          where: { documentId: sourceDocument.id },
          transaction,
        });

        const collabsToCreate = existingCollabs
          .filter(c => c.userId !== userId)
          .map(c => ({
            userId: c.userId,
            documentId: duplicatedDoc.id,
            role: c.role,
          }));

        if (collabsToCreate.length > 0) {
          await DocumentCollaborator.bulkCreate(collabsToCreate, { transaction });
        }
      }

      // Priority 2: Copy DocumentTag associations inside same transaction
      const existingTags = await DocumentTag.findAll({
        where: { documentId: sourceDocument.id },
        transaction,
      });

      if (existingTags.length > 0) {
        await DocumentTag.bulkCreate(
          existingTags.map(t => ({ documentId: duplicatedDoc.id, tagId: t.tagId })),
          { transaction },
        );
      }

      await transaction.commit();
      return duplicatedDoc;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
