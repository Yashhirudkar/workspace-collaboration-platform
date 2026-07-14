import Document from '../models/Document';
import DocumentCollaborator from '../models/DocumentCollaborator';
import { CreateDocumentInput, UpdateDocumentInput } from '../schemas/document.schema';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { DOCUMENT_ROLES } from '../constants/roles';

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
    return Document.findAll({ where: { id: docIds } });
  }

  static async getDocumentById(userId: string, documentId: string) {
    const collab = await DocumentCollaborator.findOne({
      where: { userId, documentId },
    });

    if (!collab) {
      throw new NotFoundError('Document not found or access denied');
    }

    const document = await Document.findByPk(documentId);
    return document;
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

    const document = await Document.findByPk(documentId);
    if (!document) throw new NotFoundError('Document not found');

    await document.update({
      ...data,
      lastEditedBy: userId,
    });

    return document;
  }

  static async deleteDocument(userId: string, documentId: string) {
    const document = await Document.findByPk(documentId);
    if (!document) throw new NotFoundError('Document not found');
    await document.destroy();
  }
}
