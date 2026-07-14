"use client";

import { useEffect, useCallback, useRef } from 'react';
import { socketClientService } from '@/services/socket.client';
import { useAuth } from '@/contexts/AuthContext';
import type { Document, Tag } from '@/types';

// ─── Workspace Socket Event Payloads ─────────────────────────────────────────

export interface WorkspaceDocumentCreatedPayload {
  document: Document;
}

export interface WorkspaceDocumentUpdatedPayload {
  documentId: string;
  changes: Partial<Document>;
}

export interface WorkspaceDocumentDeletedPayload {
  documentId: string;
}

export interface WorkspaceDocumentRestoredPayload {
  document: Document;
}

export interface WorkspaceDocumentFavoritedPayload {
  documentId: string;
  isFavorite: boolean;
}

export interface WorkspaceDocumentPinnedPayload {
  documentId: string;
  isPinned: boolean;
}

export interface WorkspaceDocumentTagAddedPayload {
  documentId: string;
  tag: Tag;
}

export interface WorkspaceDocumentTagRemovedPayload {
  documentId: string;
  tagId: string;
}

// ─── Callback Interface ───────────────────────────────────────────────────────

export interface WorkspaceCallbacks {
  onDocumentCreated?: (payload: WorkspaceDocumentCreatedPayload) => void;
  onDocumentUpdated?: (payload: WorkspaceDocumentUpdatedPayload) => void;
  onDocumentDeleted?: (payload: WorkspaceDocumentDeletedPayload) => void;
  onDocumentRestored?: (payload: WorkspaceDocumentRestoredPayload) => void;
  onDocumentPermanentlyDeleted?: (payload: WorkspaceDocumentDeletedPayload) => void;
  onDocumentFavorited?: (payload: WorkspaceDocumentFavoritedPayload) => void;
  onDocumentPinned?: (payload: WorkspaceDocumentPinnedPayload) => void;
  onDocumentTagAdded?: (payload: WorkspaceDocumentTagAddedPayload) => void;
  onDocumentTagRemoved?: (payload: WorkspaceDocumentTagRemovedPayload) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useWorkspace — subscribe to all workspace-level socket events.
 *
 * Call this hook in any page or component that needs real-time updates
 * when documents are created, deleted, favorited, pinned, tagged, etc.
 *
 * Uses stable callback refs so consumers don't need to memoize handlers.
 */
export function useWorkspace(callbacks: WorkspaceCallbacks) {
  const { token, isAuthenticated } = useAuth();

  // Store callbacks in a ref so we never need to re-subscribe when they change.
  // This prevents the useEffect from running on every render.
  const cbRef = useRef<WorkspaceCallbacks>(callbacks);
  useEffect(() => {
    cbRef.current = callbacks;
  });

  const stableOnCreated = useCallback((p: WorkspaceDocumentCreatedPayload) => cbRef.current.onDocumentCreated?.(p), []);
  const stableOnUpdated = useCallback((p: WorkspaceDocumentUpdatedPayload) => cbRef.current.onDocumentUpdated?.(p), []);
  const stableOnDeleted = useCallback((p: WorkspaceDocumentDeletedPayload) => cbRef.current.onDocumentDeleted?.(p), []);
  const stableOnRestored = useCallback((p: WorkspaceDocumentRestoredPayload) => cbRef.current.onDocumentRestored?.(p), []);
  const stableOnPermDeleted = useCallback((p: WorkspaceDocumentDeletedPayload) => cbRef.current.onDocumentPermanentlyDeleted?.(p), []);
  const stableOnFavorited = useCallback((p: WorkspaceDocumentFavoritedPayload) => cbRef.current.onDocumentFavorited?.(p), []);
  const stableOnPinned = useCallback((p: WorkspaceDocumentPinnedPayload) => cbRef.current.onDocumentPinned?.(p), []);
  const stableOnTagAdded = useCallback((p: WorkspaceDocumentTagAddedPayload) => cbRef.current.onDocumentTagAdded?.(p), []);
  const stableOnTagRemoved = useCallback((p: WorkspaceDocumentTagRemovedPayload) => cbRef.current.onDocumentTagRemoved?.(p), []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = socketClientService.connect(token);
    if (!socket) return;

    socket.on('workspace:document-created', stableOnCreated);
    socket.on('workspace:document-updated', stableOnUpdated);
    socket.on('workspace:document-deleted', stableOnDeleted);
    socket.on('workspace:document-restored', stableOnRestored);
    socket.on('workspace:document-permanently-deleted', stableOnPermDeleted);
    socket.on('workspace:document-favorited', stableOnFavorited);
    socket.on('workspace:document-pinned', stableOnPinned);
    socket.on('workspace:document-tag-added', stableOnTagAdded);
    socket.on('workspace:document-tag-removed', stableOnTagRemoved);

    return () => {
      socket.off('workspace:document-created', stableOnCreated);
      socket.off('workspace:document-updated', stableOnUpdated);
      socket.off('workspace:document-deleted', stableOnDeleted);
      socket.off('workspace:document-restored', stableOnRestored);
      socket.off('workspace:document-permanently-deleted', stableOnPermDeleted);
      socket.off('workspace:document-favorited', stableOnFavorited);
      socket.off('workspace:document-pinned', stableOnPinned);
      socket.off('workspace:document-tag-added', stableOnTagAdded);
      socket.off('workspace:document-tag-removed', stableOnTagRemoved);
    };
  }, [
    isAuthenticated, token,
    stableOnCreated, stableOnUpdated, stableOnDeleted, stableOnRestored,
    stableOnPermDeleted, stableOnFavorited, stableOnPinned,
    stableOnTagAdded, stableOnTagRemoved,
  ]);
}
