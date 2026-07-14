"use client";

import { useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

interface RealtimeUpdate {
  title?: string;
  content?: Record<string, unknown>;
}

export function useRealtimeDocument(
  socket: Socket | null,
  documentId: string,
  onRemoteChange: (update: RealtimeUpdate) => void
) {
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !documentId) return;

    // Join the document room
    socket.emit('join-document', { documentId, name: user?.name || 'Anonymous Editor' });

    // ── Path 1: Real-time socket relay (peer-to-peer while both are online) ──
    // Triggered when a collaborator types and their client emits 'document-operation'.
    const onDocumentOperation = (data: { userId: string; operations: any[] }) => {
      // Prevent feedback loops: ignore operations relayed from our own socket
      if (data.userId === user?.id) return;

      const op = data.operations?.[0];
      if (op && op.type === 'DOCUMENT_UPDATE') {
        onRemoteChange({
          title: op.payload?.title,
          content: op.payload?.content,
        });
      }
    };

    // ── Path 2: HTTP autosave broadcast (cross-device sync: mobile → PC, etc.) ──
    // Triggered when any device autosaves via PUT /api/documents/:id.
    // The server emits 'workspace:document-updated' to this socket's room.
    const onWorkspaceDocumentUpdated = (data: {
      documentId: string;
      changes: { title?: string; content?: Record<string, unknown> };
      fromSocketId?: string;
    }) => {
      // Only apply if this event is for the document currently open
      if (data.documentId !== documentId) return;
      // Skip if this event came from THIS exact browser tab (same socket connection).
      // This prevents applying our own autosave back on top of what we're typing.
      // Note: different devices of the same user have DIFFERENT socket IDs,
      // so mobile→PC sync is NOT blocked by this check.
      if (data.fromSocketId && data.fromSocketId === socket.id) return;

      onRemoteChange({
        title: data.changes?.title,
        content: data.changes?.content,
      });
    };

    socket.on('document-operation', onDocumentOperation);
    socket.on('workspace:document-updated', onWorkspaceDocumentUpdated);

    return () => {
      socket.emit('leave-document', { documentId, name: user?.name || 'Anonymous Editor' });
      socket.off('document-operation', onDocumentOperation);
      socket.off('workspace:document-updated', onWorkspaceDocumentUpdated);
    };
  }, [socket, documentId, user, onRemoteChange]);

  // Broadcasts a live keystroke change to all collaborators in the same doc room
  const broadcastChange = useCallback((title: string, content: Record<string, unknown>) => {
    if (!socket || !user) return;

    socket.emit('document-operation', {
      documentId,
      operations: [
        {
          type: 'DOCUMENT_UPDATE',
          payload: { title, content },
        },
      ],
    });
  }, [socket, documentId, user]);

  return { broadcastChange };
}
