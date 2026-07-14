export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: Record<string, unknown>;
  createdBy: string;
  lastEditedBy: string;
  createdAt: string;
  updatedAt: string;
  role?: 'OWNER' | 'EDITOR' | 'VIEWER';
  deletedAt?: string | null;
  deletedBy?: string | null;
  isFavorite?: boolean;
  isPinned?: boolean;
  tags?: Tag[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}

export interface Operation {
  id: string;
  documentId: string;
  userId: string;
  timestamp: number;
  operationType: 'INSERT' | 'DELETE' | 'UPDATE' | 'RESTORE';
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthTokens {
  token: string;
  user: User;
}
