import { documentService } from './documents';
import type { DocumentVersion } from '@/types';

export const versionClientService = {
  async getHistory(documentId: string): Promise<DocumentVersion[]> {
    return documentService.listVersions(documentId);
  },

  async snapshot(documentId: string): Promise<DocumentVersion> {
    return documentService.createVersion(documentId);
  },

  async restore(documentId: string, versionId: string): Promise<any> {
    return documentService.restoreVersion(documentId, versionId);
  }
};
