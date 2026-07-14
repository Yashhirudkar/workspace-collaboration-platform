import { io, Socket } from 'socket.io-client';

class SocketClientService {
  private socket: Socket | null = null;
  private isConnectionDisabled = false;

  connect(token: string): Socket | null {
    if (this.isConnectionDisabled) return null;
    if (this.socket?.connected) return this.socket;

    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

    if (isVercel && !serverUrl) {
      console.warn('Socket.IO is disabled in production (Vercel) because NEXT_PUBLIC_SOCKET_SERVER_URL is not configured.');
      this.isConnectionDisabled = true;
      return null;
    }

    const connectionUrl = serverUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const options: any = {
      autoConnect: true,
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    };

    if (!serverUrl) {
      options.path = '/api/socket';
    }

    this.socket = io(connectionUrl, options);

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
