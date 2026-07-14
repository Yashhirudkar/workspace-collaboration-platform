import api from './api';
import type { ApiResponse, Document, DocumentVersion } from '@/types';

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
};
