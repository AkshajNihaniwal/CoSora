import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer, frontendUrl: string) {
  io = new SocketServer(httpServer, {
    cors: { origin: frontendUrl, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
    });
    socket.on('join:admin', () => {
      socket.join('admins');
    });
    socket.on('join:audit', () => {
      socket.join('audit');
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitToAdmins(event: string, data: unknown) {
  io?.to('admins').emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitTaskUpdate(taskId: string, data: unknown) {
  io?.to('admins').emit('task:update', { taskId, ...data as object });
}

export function emitAuditLog(entry: unknown) {
  io?.to('audit').emit('audit:new', entry);
  io?.to('admins').emit('audit:new', entry);
}
