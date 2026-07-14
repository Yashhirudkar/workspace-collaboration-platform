import { openDB, IDBPDatabase } from 'idb';
import type { Document } from '@/types';

const DB_NAME = 'docflow_db';
const DB_VERSION = 1;

class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Store cached documents
          if (!db.objectStoreNames.contains('documents')) {
            db.createObjectStore('documents', { keyPath: 'id' });
          }
          // Store pending offline updates.
          // Keyed by documentId to naturally collapse multiple offline updates into the latest state.
          if (!db.objectStoreNames.contains('sync_queue')) {
            db.createObjectStore('sync_queue', { keyPath: 'documentId' });
          }
        },
      });
    }
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      throw new Error('IndexedDB is not supported or not initialized');
    }
    return this.dbPromise;
  }

  // --- Document Cache Operations ---

  async saveDocument(doc: Document): Promise<void> {
    const db = await this.getDB();
    await db.put('documents', doc);
  }

  async getDocument(id: string): Promise<Document | null> {
    const db = await this.getDB();
    const doc = await db.get('documents', id);
    return doc || null;
  }

  async listDocuments(): Promise<Document[]> {
    const db = await this.getDB();
    return db.getAll('documents');
  }

  // --- Sync Queue Operations ---

  async enqueueUpdate(documentId: string, title: string, content: Record<string, unknown>): Promise<void> {
    const db = await this.getDB();
    await db.put('sync_queue', {
      documentId,
      title,
      content,
      timestamp: Date.now(),
    });
  }

  async getPendingUpdates(): Promise<Array<{ documentId: string; title: string; content: Record<string, unknown>; timestamp: number }>> {
    const db = await this.getDB();
    return db.getAll('sync_queue');
  }

  async dequeueUpdate(documentId: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('sync_queue', documentId);
  }

  async clearQueue(): Promise<void> {
    const db = await this.getDB();
    await db.clear('sync_queue');
  }
}

export const idbService = new IndexedDBService();
