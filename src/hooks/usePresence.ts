"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';

export interface Collaborator {
  userId: string;
  name: string;
  color: string;
  currentLine?: number; // active block line/index
}

const COLORS = [
  'bg-red-500 text-white',
  'bg-blue-500 text-white',
  'bg-green-500 text-white',
  'bg-yellow-500 text-black',
  'bg-purple-500 text-white',
  'bg-pink-500 text-white',
  'bg-indigo-500 text-white',
];

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

export function usePresence(socket: Socket | null, documentId: string) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Record<string, Collaborator>>({});
  const lastSentLine = useRef<number>(1);

  useEffect(() => {
    if (!socket || !documentId) return;

    // Listeners
    const onUserJoined = (data: { userId: string; name?: string }) => {
      const uName = data.name || 'Anonymous Editor';
      setCollaborators((prev) => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          name: uName,
          color: stringToColor(data.userId),
        },
      }));
      
      // When someone new joins, immediately announce our cursor position to them
      socket.emit('cursor-update', {
        documentId,
        name: user?.name || 'Collaborator',
        position: { line: lastSentLine.current },
      });
      
      toast({ title: `${uName} joined document`, variant: 'default' });
    };

    const onUserLeft = (data: { userId: string; name?: string }) => {
      setCollaborators((prev) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
      if (data.name) {
        toast({ title: `${data.name} left document`, variant: 'default' });
      }
    };

    const onCursorUpdate = (data: { userId: string; name?: string; position: { line?: number } }) => {
      setCollaborators((prev) => {
        const isNew = !prev[data.userId];
        
        // If they are new to us, announce our presence so they discover us too
        if (isNew && user && data.userId !== user.id) {
          socket.emit('cursor-update', {
            documentId,
            name: user.name,
            position: { line: lastSentLine.current },
          });
        }

        const existing = prev[data.userId];
        if (!existing) {
          return {
            ...prev,
            [data.userId]: {
              userId: data.userId,
              name: data.name || 'Collaborator',
              color: stringToColor(data.userId),
              currentLine: data.position?.line,
            },
          };
        }
        return {
          ...prev,
          [data.userId]: {
            ...existing,
            currentLine: data.position?.line,
          },
        };
      });
    };

    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('cursor-update', onCursorUpdate);

    return () => {
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('cursor-update', onCursorUpdate);
    };
  }, [socket, documentId, user]);

  const lastSentTime = useRef<number>(0);

  const broadcastCursor = useCallback((line: number) => {
    if (!socket || !user) return;
    lastSentLine.current = line;
    
    const now = Date.now();
    if (now - lastSentTime.current < 150) return; // 150ms throttle gate
    lastSentTime.current = now;

    socket.emit('cursor-update', {
      documentId,
      name: user.name,
      position: { line },
    });
  }, [socket, documentId, user]);

  return { collaborators: Object.values(collaborators), broadcastCursor };
}
