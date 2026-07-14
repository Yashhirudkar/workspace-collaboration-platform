import DocumentVersion from '../models/DocumentVersion';
import Document from '../models/Document';
import Operation from '../models/Operation';
import { NotFoundError } from '../utils/errors';
import { sequelize } from '../config/database';
import { randomUUID } from 'crypto';

export class VersionService {
  static async createSnapshot(userId: string, documentId: string) {
    const document = await Document.findByPk(documentId);
    if (!document) throw new NotFoundError('Document not found');

    const maxVersion = await DocumentVersion.max('versionNumber', { where: { documentId } }) as number | null;
    const nextVersion = (maxVersion || 0) + 1;
    
    const version = await DocumentVersion.create({
      documentId,
      versionNumber: nextVersion,
      snapshot: document.content,
      createdBy: userId,
    });

    return version;
  }

  static async listVersions(documentId: string) {
    return DocumentVersion.findAll({
      where: { documentId },
      order: [['versionNumber', 'DESC']],
      attributes: ['id', 'versionNumber', 'createdAt', 'createdBy'],
    });
  }

  static async getVersion(versionId: string) {
    const version = await DocumentVersion.findByPk(versionId);
    if (!version) throw new NotFoundError('Version not found');
    return version;
  }

  static async restoreVersion(userId: string, documentId: string, versionId: string) {
    const version = await this.getVersion(versionId);
    
    const t = await sequelize.transaction();
    try {
      const restoreOp = await Operation.create({
        id: randomUUID(),
        documentId,
        userId,
        timestamp: Date.now(),
        operationType: 'RESTORE',
        payload: version.snapshot,
        status: 'SYNCED',
      }, { transaction: t });

      await Document.update(
        { content: version.snapshot, lastEditedBy: userId },
        { where: { id: documentId }, transaction: t }
      );

      await t.commit();
      return restoreOp;
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }
}
