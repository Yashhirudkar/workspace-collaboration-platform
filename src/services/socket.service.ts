import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

interface JwtPayload {
  userId: string;
  exp?: number;
}

// ─── Global IO Singleton ──────────────────────────────────────────────────────
// Stored on global so it survives Next.js hot-reloads and is accessible
// from API route handlers without circular imports.
declare global {
  // eslint-disable-next-line no-var
  var __io: Server | undefined;
}

/**
 * Returns the active Socket.IO server instance.
 * Returns null if called before the socket server is initialized
 * (e.g., during SSR or before the first client connects).
 */
export function getIO(): Server | null {
  return global.__io ?? null;
}

/**
 * Emit a workspace event to ALL connected tabs of a specific user.
 * Safe to call from any API route — gracefully no-ops if socket is not ready.
 */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  const io = getIO();
  if (!io) return;
  io.to(`workspace:${userId}`).emit(event, payload);
}

// ─── Socket Server Initialization ────────────────────────────────────────────
export function initSocketService(io: Server) {
  // Store singleton for use by API routes
  global.__io = io;

  // Middleware: JWT Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
    if (!token) {
      logger.warn('Socket Auth Failed: Missing token');
      return next(new Error('Authentication error: Missing token'));
    }

    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), ENV.JWT_SECRET) as JwtPayload;
      socket.data.userId = decoded.userId;
      socket.data.tokenExp = decoded.exp;
      socket.data.rawToken = token.replace('Bearer ', '');
      next();
    } catch {
      logger.warn('Socket Auth Failed: Invalid token');
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info(`Socket connected: User ${userId} [Socket ID: ${socket.id}]`);

    // ── Auto-join personal workspace room ──────────────────────────────────
    // Every tab of the same user shares this room.
    // API routes use emitToUser(userId, ...) to broadcast to all their tabs.
    socket.join(`workspace:${userId}`);
    logger.info(`User ${userId} joined workspace room`);

    // ── JWT Expiry Guard ───────────────────────────────────────────────────
    const expiryInterval = setInterval(() => {
      try {
        jwt.verify(socket.data.rawToken, ENV.JWT_SECRET);
      } catch {
        logger.warn(`Socket expired for user ${userId}. Disconnecting.`);
        socket.emit('session-expired', { message: 'Your session has expired. Please log in again.' });
        socket.disconnect(true);
        clearInterval(expiryInterval);
      }
    }, 60_000);

    socket.on('disconnect', () => {
      clearInterval(expiryInterval);
      logger.info(`Socket disconnected: User ${userId}`);
    });

    // ── Document Collaboration Room Events ────────────────────────────────

    socket.on('join-document', (data: string | { documentId: string; name?: string }) => {
      const docId = typeof data === 'string' ? data : data.documentId;
      const name = typeof data === 'string' ? undefined : data.name;
      socket.join(`doc-${docId}`);
      logger.info(`User ${userId} (${name || 'Anonymous'}) joined room doc-${docId}`);
      socket.to(`doc-${docId}`).emit('presence:joined', { userId, name });
    });

    socket.on('leave-document', (data: string | { documentId: string; name?: string }) => {
      const docId = typeof data === 'string' ? data : data.documentId;
      const name = typeof data === 'string' ? undefined : data.name;
      socket.leave(`doc-${docId}`);
      logger.info(`User ${userId} (${name || 'Anonymous'}) left room doc-${docId}`);
      socket.to(`doc-${docId}`).emit('presence:left', { userId, name });
    });

    socket.on('cursor-update', (data: { documentId: string; name?: string; position: unknown }) => {
      socket.to(`doc-${data.documentId}`).emit('cursor-update', {
        userId,
        name: data.name,
        position: data.position,
      });
    });

    // ── Document Content Operations ───────────────────────────────────────
    // Relay content changes to all collaborators in the doc room.
    socket.on('document-operation', (data: { documentId: string; operations: unknown[] }) => {
      socket.to(`doc-${data.documentId}`).emit('document-operation', {
        userId,
        operations: data.operations,
      });
    });

    // ── Typing Indicator ──────────────────────────────────────────────────
    socket.on('typing:start', (data: { documentId: string }) => {
      socket.to(`doc-${data.documentId}`).emit('typing:start', { userId });
    });

    socket.on('typing:stop', (data: { documentId: string }) => {
      socket.to(`doc-${data.documentId}`).emit('typing:stop', { userId });
    });
  });
}
