import Operation from '../models/Operation';
import Document from '../models/Document';
import { PushOperationsInput } from '../schemas/sync.schema';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

export class SyncService {
  static async pushOperations(userId: string, documentId: string, data: PushOperationsInput) {
    // Sort operations strictly by timestamp (LWW)
    const sortedOps = [...data.operations].sort((a, b) => a.timestamp - b.timestamp);
    
    // Prepare bulk insert
    const records = sortedOps.map(op => ({
      id: op.id,
      documentId,
      userId,
      timestamp: op.timestamp,
      operationType: op.operationType,
      payload: op.payload,
      status: 'SYNCED' as const,
    }));

    try {
      // ON CONFLICT DO NOTHING (ignore duplicates / replay attacks)
      await Operation.bulkCreate(records, { ignoreDuplicates: true });
    } catch (error) {
      logger.error('Failed bulk inserting operations', error);
      throw new Error('Database error during sync');
    }

    // Apply Last-Write-Wins on the document strictly once (prevents N+1 queries)
    const latestUpdateOp = [...sortedOps].reverse().find(o => o.operationType === 'UPDATE' || o.operationType === 'RESTORE');
    
    if (latestUpdateOp) {
      await Document.update(
        { content: latestUpdateOp.payload, lastEditedBy: userId },
        { where: { id: documentId } }
      );
    }

    // Since duplicates are ignored and valid ops are inserted, all requested IDs are technically "accepted"
    // The client can safely clear its offline queue for these IDs.
    const acceptedIds = sortedOps.map(o => o.id);
    const latestServerTimestamp = sortedOps.length > 0 ? sortedOps[sortedOps.length - 1].timestamp : Date.now();

    return {
      acceptedIds,
      latestServerTimestamp,
    };
  }

  static async pullOperations(documentId: string, sinceTimestamp: number) {
    const operations = await Operation.findAll({
      where: {
        documentId,
        timestamp: {
          [Op.gt]: sinceTimestamp,
        },
        status: 'SYNCED',
      },
      order: [['timestamp', 'ASC']],
    });

    return operations;
  }
}
