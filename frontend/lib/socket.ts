'use client';

import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, { withCredentials: true, autoConnect: false });
  }
  return socket;
}

export function connectSocket(userId: string, role: string) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('join:user', userId);
  if (role === 'ADMIN') s.emit('join:admin');
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
}
