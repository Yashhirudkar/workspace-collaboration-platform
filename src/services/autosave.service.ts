import { documentService } from './documents';
import { idbService } from './indexeddb.service';
import type { Document } from '@/types';

export const autosaveService = {
  /**
   * Performs a local-first save.
   * 1. Updates the IndexedDB cache instantly.
   * 2. If online, pushes directly to the server.
   * 3. If offline, queues the update in IndexedDB to be synced later.
   */
  async save(
    documentId: string,
    title: string,
    content: Record<string, unknown>,
    isOnline: boolean,
    existingDoc: Document | null
  ): Promise<'saved' | 'offline'> {
    // 1. Update local cache immediately (Zero Data Loss)
    const updatedDoc: Document = {
      id: documentId,
      title,
      content,
      createdBy: existingDoc?.createdBy || '',
      lastEditedBy: existingDoc?.lastEditedBy || '',
      createdAt: existingDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: existingDoc?.role,
    };
    await idbService.saveDocument(updatedDoc);

    // 2. If offline, enqueue update and return
    if (!isOnline) {
      await idbService.enqueueUpdate(documentId, title, content);
      return 'offline';
    }

    try {
      // 3. If online, sync directly to the server
      await documentService.update(documentId, { title, content });
      // Clean queue for this document in case there was a leftover offline update
      await idbService.dequeueUpdate(documentId);
      return 'saved';
    } catch (error) {
      // If server save fails, don't lose the edits! Retain in IndexedDB and enqueue for retry.
      console.error('Failed to sync to backend, queueing update locally:', error);
      await idbService.enqueueUpdate(documentId, title, content);
      return 'offline'; // Treat as offline/pending sync
    }
  },

  /**
   * Processes all pending updates in the IndexedDB sync queue.
   * Runs when the app detects it has returned online.
   */
  async processSyncQueue(onSyncSuccess?: (doc: Document) => void): Promise<void> {
    const pending = await idbService.getPendingUpdates();
    if (pending.length === 0) return;

    console.info(`Processing ${pending.length} pending offline updates...`);

    for (const update of pending) {
      try {
        const syncedDoc = await documentService.update(update.documentId, {
          title: update.title,
          content: update.content,
        });
        
        // Remove from offline queue after successful upload
        await idbService.dequeueUpdate(update.documentId);
        
        // Trigger callback to update UI
        if (onSyncSuccess) {
          onSyncSuccess(syncedDoc);
        }
      } catch (error) {
        console.error(`Failed to sync queued document ${update.documentId}:`, error);
        // Do not dequeue so we retry next time
      }
    }
  }
};
