import api from './api';
import type { ApiResponse, Document, DocumentVersion, Tag } from '@/types';

export const documentService = {
  async list(): Promise<Document[]> {
    const response = await api.get<ApiResponse<Document[]>>('/documents');
    return response.data.data;
  },

  async get(id: string): Promise<Document> {
    const response = await api.get<ApiResponse<Document>>(`/documents/${id}`);
    return response.data.data;
  },

  async create(data: { title: string; content?: Record<string, unknown> }): Promise<Document> {
    const response = await api.post<ApiResponse<Document>>('/documents', data);
    return response.data.data;
  },

  async update(id: string, data: { title?: string; content?: Record<string, unknown> }): Promise<Document> {
    const response = await api.put<ApiResponse<Document>>(`/documents/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  async listVersions(documentId: string): Promise<DocumentVersion[]> {
    const response = await api.get<ApiResponse<DocumentVersion[]>>(`/documents/${documentId}/versions`);
    return response.data.data;
  },

  async createVersion(documentId: string): Promise<DocumentVersion> {
    const response = await api.post<ApiResponse<DocumentVersion>>(`/documents/${documentId}/versions`);
    return response.data.data;
  },

  async restoreVersion(documentId: string, versionId: string): Promise<any> {
    const response = await api.post<ApiResponse<any>>(`/documents/${documentId}/versions/${versionId}`);
    return response.data.data;
  },

  // ─── Favorites ─────────────────────────────────────────────────────────────
  async getFavorites(): Promise<Document[]> {
    const response = await api.get<Document[]>('/documents/favorites');
    return response.data;
  },

  async favorite(id: string): Promise<void> {
    await api.post(`/documents/${id}/favorite`);
  },

  async unfavorite(id: string): Promise<void> {
    await api.delete(`/documents/${id}/favorite`);
  },

  // ─── Pinned ────────────────────────────────────────────────────────────────
  async getPinned(): Promise<Document[]> {
    const response = await api.get<Document[]>('/documents/pinned');
    return response.data;
  },

  async pin(id: string): Promise<void> {
    await api.post(`/documents/${id}/pin`);
  },

  async unpin(id: string): Promise<void> {
    await api.delete(`/documents/${id}/pin`);
  },

  // ─── Recent ────────────────────────────────────────────────────────────────
  async getRecent(): Promise<Document[]> {
    const response = await api.get<Document[]>('/documents/recent');
    return response.data;
  },

  // ─── Duplicate ─────────────────────────────────────────────────────────────
  async duplicate(id: string, copyCollaborators = false): Promise<Document> {
    const response = await api.post<ApiResponse<Document>>(`/documents/${id}/duplicate`, {
      copyCollaborators,
    });
    return response.data.data;
  },

  // ─── Trash ─────────────────────────────────────────────────────────────────
  async getTrash(): Promise<Document[]> {
    const response = await api.get<ApiResponse<Document[]>>('/documents/trash');
    return response.data.data;
  },

  async restore(id: string): Promise<Document> {
    const response = await api.post<ApiResponse<Document>>(`/documents/${id}/restore`);
    return response.data.data;
  },

  async permanentDelete(id: string): Promise<void> {
    await api.delete(`/documents/${id}/permanent`);
  },

  // ─── Tags ──────────────────────────────────────────────────────────────────
  async getTags(): Promise<Tag[]> {
    const response = await api.get<ApiResponse<Tag[]>>('/tags');
    return response.data.data;
  },

  async createTag(name: string): Promise<Tag> {
    const response = await api.post<ApiResponse<Tag>>('/tags', { name });
    return response.data.data;
  },

  async addTag(documentId: string, tagId: string): Promise<void> {
    await api.post(`/documents/${documentId}/tags`, { tagId });
  },

  async removeTag(documentId: string, tagId: string): Promise<void> {
    await api.delete(`/documents/${documentId}/tags/${tagId}`);
  },

  // ─── Export URL Helpers ────────────────────────────────────────────────────
  exportUrl(id: string, format: string): string {
    const baseUrl = api.defaults.baseURL || '/api';
    return `${baseUrl}/documents/${id}/export/${format}`;
  },
};

