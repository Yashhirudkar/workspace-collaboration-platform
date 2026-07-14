import { Server as NetServer, Socket } from 'net';
import { Server as HttpServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { initSocketService } from '@/services/socket.service';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface SocketServer extends NetServer {
  io?: ServerIO;
}

interface SocketWithIO extends Socket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...');
    const httpServer = res.socket.server as unknown as HttpServer;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    
    initSocketService(io);
    
    res.socket.server.io = io;
  }
  res.end();
}
