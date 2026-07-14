import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

interface JwtPayload {
  userId: string;
  exp?: number; // JWT standard expiry field (epoch seconds)
}

export function initSocketService(io: Server) {
  // Middleware for Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
    if (!token) {
      logger.warn('Socket Auth Failed: Missing token');
      return next(new Error('Authentication error: Missing token'));
    }

    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), ENV.JWT_SECRET) as JwtPayload;
      socket.data.userId = decoded.userId;
      socket.data.tokenExp = decoded.exp; // store expiry for periodic check
      socket.data.rawToken = token.replace('Bearer ', '');
      next();
    } catch (err) {
      logger.warn('Socket Auth Failed: Invalid token');
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info(`Socket connected: User ${userId} [Socket ID: ${socket.id}]`);

    // --- JWT Expiry Guard ---
    // Check token expiry every 60s. Disconnect the socket if the token has expired.
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

    // Join a document room
    socket.on('join-document', (documentId: string) => {
      socket.join(`doc-${documentId}`);
      logger.info(`User ${userId} joined room doc-${documentId}`);
      
      // Presence: notify others
      socket.to(`doc-${documentId}`).emit('user-joined', { userId });
    });

    // Leave a document room
    socket.on('leave-document', (documentId: string) => {
      socket.leave(`doc-${documentId}`);
      logger.info(`User ${userId} left room doc-${documentId}`);
      
      // Presence: notify others
      socket.to(`doc-${documentId}`).emit('user-left', { userId });
    });

    // Broadcast cursor position (basic)
    socket.on('cursor-update', (data: { documentId: string, position: unknown }) => {
      socket.to(`doc-${data.documentId}`).emit('cursor-update', {
        userId,
        position: data.position
      });
    });

    // Broadcast document operations for realtime collaboration
    // Replay attack protection per operationId happens on the HTTP Sync Push, 
    // but we rebroadcast immediately for fast active collaboration.
    socket.on('document-operation', (data: { documentId: string, operations: unknown[] }) => {
      socket.to(`doc-${data.documentId}`).emit('document-operation', {
        userId,
        operations: data.operations
      });
    });
  });
}
