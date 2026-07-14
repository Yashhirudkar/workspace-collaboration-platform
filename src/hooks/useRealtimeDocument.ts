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
    socket.emit('join-document', documentId);

    // Listen for peer operations
    const onDocumentOperation = (data: { userId: string; operations: any[] }) => {
      // Prevent feedback loops: ignore operations broadcasted from ourselves
      if (data.userId === user?.id) return;

      const op = data.operations?.[0];
      if (op && op.type === 'DOCUMENT_UPDATE') {
        onRemoteChange({
          title: op.payload?.title,
          content: op.payload?.content,
        });
      }
    };

    socket.on('document-operation', onDocumentOperation);

    return () => {
      socket.emit('leave-document', documentId);
      socket.off('document-operation', onDocumentOperation);
    };
  }, [socket, documentId, user, onRemoteChange]);

  const broadcastChange = useCallback((title: string, content: Record<string, unknown>) => {
    if (!socket || !user) return;

    socket.emit('document-operation', {
      documentId,
      operations: [
        {
          type: 'DOCUMENT_UPDATE',
          payload: {
            title,
            content,
          },
        },
      ],
    });
  }, [socket, documentId, user]);

  return { broadcastChange };
}
