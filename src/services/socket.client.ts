import { io, Socket } from 'socket.io-client';

class SocketClientService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      path: '/api/socket',
      autoConnect: true,
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.info('Socket.io connected successfully.');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinDocument(documentId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-document', documentId);
    }
  }

  leaveDocument(documentId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-document', documentId);
    }
  }

  on(event: string, fn: (...args: any[]) => void) {
    this.socket?.on(event, fn);
  }

  off(event: string, fn: (...args: any[]) => void) {
    this.socket?.off(event, fn);
  }

  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }
}

export const socketClientService = new SocketClientService();
