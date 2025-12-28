import { Server } from 'socket.io';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

let io = null;
// Store user socket mappings (moved outside to make accessible)
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId

export const initializeSocket = (server) => {
  // Parse CORS origins
  let corsOrigin = 'http://localhost:5000';
  if (process.env.CLIENT_ORIGINS) {
    corsOrigin = process.env.CLIENT_ORIGINS;
  } else if (process.env.CLIENT_ORIGIN) {
    corsOrigin = process.env.CLIENT_ORIGIN;
  }

  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  io.use(async (socket, next) => {
    // Get user from session cookie
    // In production, you should use express-session middleware here
    // For now, we'll accept userId from handshake and verify it
    const userId = socket.handshake.auth?.userId;
    if (!userId) {
      return next(new Error('Authentication required'));
    }

    // Verify user exists and is valid
    try {
      const user = await User.findById(userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      if (user.isBlocked) {
        return next(new Error('User is blocked'));
      }
      if (user.isDeleted) {
        return next(new Error('User account deleted'));
      }
      socket.userId = userId;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle connection errors
  io.engine.on('connection_error', (err) => {
    console.error('Socket.io connection error:', err.req?.socket?.remoteAddress, err.message);
  });

  io.on('connection', (socket) => {
    const userId = socket.userId.toString();
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Check if user already has an active connection
    const existingSocketId = userSockets.get(userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      // Disconnect the old socket
      const oldSocket = io.sockets.sockets.get(existingSocketId);
      if (oldSocket) {
        console.log(`Disconnecting old socket ${existingSocketId} for user ${userId}`);
        oldSocket.disconnect(true);
      }
    }

    // Store socket mapping
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Emit online status to user's conversations (only if this is a new connection)
    if (!existingSocketId || existingSocketId !== socket.id) {
      socket.broadcast.emit('user:online', { userId });
    }

    console.log(`User ${userId} connected (socket: ${socket.id})`);

    // Handle typing indicator
    socket.on('typing', async (data) => {
      const { conversationId } = data;
      if (!conversationId) return;

      // Verify user is part of conversation
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Check if user is a participant
        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          return;
        }

        // Emit to other participants
        const otherParticipants = conversation.participants.filter(
          (p) => p.toString() !== userId
        );
        otherParticipants.forEach((participantId) => {
          const participantIdStr = participantId.toString();
          io.to(`user:${participantIdStr}`).emit('typing', {
            conversationId,
            userId,
            isTyping: data.isTyping,
          });
        });
      } catch (error) {
        console.error('Error handling typing:', error);
      }
    });

    // Handle stop typing
    socket.on('stop-typing', async (data) => {
      const { conversationId } = data;
      if (!conversationId) return;

      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Check if user is a participant
        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          return;
        }

        const otherParticipants = conversation.participants.filter(
          (p) => p.toString() !== userId
        );
        otherParticipants.forEach((participantId) => {
          const participantIdStr = participantId.toString();
          io.to(`user:${participantIdStr}`).emit('typing', {
            conversationId,
            userId,
            isTyping: false,
          });
        });
      } catch (error) {
        console.error('Error handling stop typing:', error);
      }
    });

    // Handle new message
    socket.on('new-message', async (data) => {
      const { conversationId, text, type, fileUrl, fileName } = data;
      if (!conversationId || (!text && !fileUrl)) return;

      try {
        // Verify conversation and user participation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('error', { message: 'Invalid conversation' });
          return;
        }

        // Check if user is a participant
        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          socket.emit('error', { message: 'Invalid conversation' });
          return;
        }

        // Create message
        const message = new Message({
          conversation: conversationId,
          sender: userId,
          text,
          type: type || 'text',
          fileUrl,
          fileName,
        });
        await message.save();

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();

        // Update unread counts
        const otherParticipants = conversation.participants.filter(
          (p) => p.toString() !== userId
        );
        otherParticipants.forEach((participantId) => {
          const participantIdStr = participantId.toString();
          const currentCount = conversation.unreadCount.get(participantIdStr) || 0;
          conversation.unreadCount.set(participantIdStr, currentCount + 1);
        });

        await conversation.save();

        // Populate message for response
        await message.populate('sender', 'firstName lastName avatar role tradingName');

        // Emit to all participants
        const messageData = {
          id: message._id.toString(),
          conversationId: conversationId.toString(),
          senderId: message.sender._id.toString(),
          senderName: message.sender.role === 'professional'
            ? message.sender.tradingName || `${message.sender.firstName} ${message.sender.lastName}`
            : `${message.sender.firstName} ${message.sender.lastName}`,
          senderAvatar: message.sender.avatar,
          text: message.text,
          timestamp: message.createdAt,
          read: false,
          type: message.type,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
        };

        conversation.participants.forEach((participantId) => {
          const participantIdStr = participantId.toString();
          io.to(`user:${participantIdStr}`).emit('new-message', messageData);
        });

        // Emit conversation update
        const conversationUpdate = {
          id: conversationId.toString(),
          lastMessage: {
            text: message.text || 'Sent a file',
            timestamp: message.createdAt,
          },
          lastMessageAt: conversation.lastMessageAt,
        };

        conversation.participants.forEach((participantId) => {
          const participantIdStr = participantId.toString();
          io.to(`user:${participantIdStr}`).emit('conversation-updated', conversationUpdate);
        });
      } catch (error) {
        console.error('Error handling new message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read
    socket.on('mark-read', async (data) => {
      const { conversationId } = data;
      if (!conversationId) return;

      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Check if user is a participant
        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          return;
        }

        // Mark messages as read
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: userId },
            read: false,
          },
          {
            read: true,
            readAt: new Date(),
          }
        );

        // Reset unread count
        conversation.unreadCount.set(userId.toString(), 0);
        await conversation.save();

        // Notify other participants
        const otherParticipants = conversation.participants.filter(
          (p) => p.toString() !== userId
        );
        otherParticipants.forEach((participantId) => {
          const participantIdStr = participantId.toString();
          io.to(`user:${participantIdStr}`).emit('messages-read', {
            conversationId,
            userId,
          });
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      // Only remove mapping if this is the current socket
      if (userSockets.get(userId) === socket.id) {
        userSockets.delete(userId);
      }
      socketUsers.delete(socket.id);

      // Emit offline status only if user has no other connections
      if (!userSockets.has(userId)) {
        socket.broadcast.emit('user:offline', { userId });
        console.log(`User ${userId} disconnected (socket: ${socket.id}, reason: ${reason})`);
      } else {
        console.log(`User ${userId} socket ${socket.id} disconnected but has other connections`);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Check if a user is online
export const isUserOnline = (userId) => {
  return userSockets.has(userId.toString());
};

// Get all online users
export const getOnlineUsers = () => {
  return Array.from(userSockets.keys());
};

