import { io, Socket } from 'socket.io-client';
import { resolveApiUrl } from '../config/api';

let socket: Socket | null = null;

export const connectSocket = (userId: string): Socket => {
  // If socket exists, check if it's the same user
  if (socket) {
    const auth = socket.auth as { userId?: string };
    // If same user and socket is connected, reuse it
    if (auth?.userId === userId && socket.connected) {
      return socket;
    }
    // If different user, clean up old socket
    if (auth?.userId !== userId) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    } else if (!socket.connected) {
      // Same user but disconnected - socket.io will auto-reconnect, just return it
      return socket;
    }
  }

  const apiUrl = resolveApiUrl('');
  // Remove /api if present, socket.io connects to root
  const socketUrl = apiUrl.replace('/api', '');

  socket = io(socketUrl, {
    auth: {
      userId,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity, // Keep trying to reconnect
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('Socket.io connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.io disconnected:', reason);
    // Only log if it's not a manual disconnect
    if (reason !== 'io client disconnect') {
      console.log('Reconnecting...');
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error.message);
  });

  socket.on('error', (error) => {
    console.error('Socket.io error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

