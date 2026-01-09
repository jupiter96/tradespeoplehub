import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { isUserOnline, io } from '../services/socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads/attachments directory if it doesn't exist (async, non-blocking)
const attachmentsDir = path.join(__dirname, '..', 'uploads', 'attachments');
// Use async directory creation that doesn't block module loading
fs.mkdir(attachmentsDir, { recursive: true }).catch(() => {
  // Ignore errors - directory might already exist or will be created on first upload
});

// Configure multer for file attachments
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, attachmentsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    // Sanitize filename
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const fileUpload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  // Allow all file types - no fileFilter restriction
});

const uploadMiddleware = fileUpload.single('file');

// Use authentication middleware
const requireAuth = authenticateToken;

// Get all conversations for the current user
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const mongoose = (await import('mongoose')).default;
    const userIdObj = new mongoose.Types.ObjectId(userId);

    const conversations = await Conversation.find({
      participants: userIdObj,
      [`archivedBy.${userId}`]: { $ne: true },
    })
      .populate('participants', 'firstName lastName avatar role tradingName')
      .populate('initiatedBy', 'firstName lastName')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });
      // Note: Not using .lean() because we need Map types for unreadCount

    // Get unread counts and format response
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      
      // unreadCount is a Map, access using .get()
      const unreadCount = conv.unreadCount?.get(userId.toString()) || 0;

      return {
        id: conv._id.toString(),
        participant: {
          id: otherParticipant._id.toString(),
          name: otherParticipant.role === 'professional'
            ? otherParticipant.tradingName || `${otherParticipant.firstName} ${otherParticipant.lastName}`
            : `${otherParticipant.firstName} ${otherParticipant.lastName}`,
          avatar: otherParticipant.avatar,
          role: otherParticipant.role,
        },
        lastMessage: conv.lastMessage
          ? {
              text: conv.lastMessage.text || 'Sent a file',
              timestamp: conv.lastMessage.createdAt,
            }
          : null,
        timestamp: conv.lastMessageAt,
        unread: unreadCount,
        online: isUserOnline(otherParticipant?._id), // Check actual online status
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get or create a conversation between current user and another user
router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    // Only clients can initiate conversations with professionals
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can start new conversations' });
    }

    // Check if participant is a professional
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.role !== 'professional') {
      return res.status(403).json({ error: 'Can only start conversations with professionals' });
    }

    // Convert to ObjectId
    const mongoose = (await import('mongoose')).default;
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const participantIdObj = new mongoose.Types.ObjectId(participantId);

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userIdObj, participantIdObj] },
      $expr: { $eq: [{ $size: '$participants' }, 2] },
    })
      .populate('participants', 'firstName lastName avatar role tradingName')
      .populate('lastMessage');

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [userIdObj, participantIdObj],
        initiatedBy: userIdObj,
        unreadCount: new Map([
          [userId.toString(), 0],
          [participantId.toString(), 0],
        ]),
      });
      await conversation.save();

      await conversation.populate('participants', 'firstName lastName avatar role tradingName');
    }

    const otherParticipant = conversation.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    res.json({
      conversation: {
        id: conversation._id.toString(),
        participant: {
          id: otherParticipant._id.toString(),
          name: otherParticipant.role === 'professional'
            ? otherParticipant.tradingName || `${otherParticipant.firstName} ${otherParticipant.lastName}`
            : `${otherParticipant.firstName} ${otherParticipant.lastName}`,
          avatar: otherParticipant.avatar,
          role: otherParticipant.role,
        },
        lastMessage: conversation.lastMessage
          ? {
              text: conversation.lastMessage.text || 'Sent a file',
              timestamp: conversation.lastMessage.createdAt,
            }
          : null,
        timestamp: conversation.lastMessageAt,
        unread: conversation.unreadCount?.get(userId.toString()) || 0,
        online: false,
      },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Convert to ObjectId
    const mongoose = (await import('mongoose')).default;
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userIdObj.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch messages
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'firstName lastName avatar role tradingName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userIdObj },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    // Update unread count
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    // Format messages
    const formattedMessages = messages.reverse().map((msg) => ({
      id: msg._id.toString(),
      senderId: msg.sender._id.toString(),
      senderName: msg.sender.role === 'professional'
        ? msg.sender.tradingName || `${msg.sender.firstName} ${msg.sender.lastName}`
        : `${msg.sender.firstName} ${msg.sender.lastName}`,
      senderAvatar: msg.sender.avatar,
      text: msg.text,
      timestamp: msg.createdAt,
      read: msg.read,
      type: msg.type,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      orderId: msg.orderId,
      orderDetails: msg.orderDetails,
    }));

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Search professionals (for clients to start new conversations)
router.get('/search-professionals', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can search professionals' });
    }

    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.json({ professionals: [] });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const professionals = await User.find({
      role: 'professional',
      isBlocked: false,
      isDeleted: { $ne: true },
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { tradingName: searchRegex },
        { email: searchRegex },
      ],
    })
      .select('firstName lastName avatar tradingName')
      .limit(20)
      .lean();

    const formatted = professionals.map((pro) => ({
      id: pro._id.toString(),
      name: pro.tradingName || `${pro.firstName} ${pro.lastName}`,
      avatar: pro.avatar,
    }));

    res.json({ professionals: formatted });
  } catch (error) {
    console.error('Error searching professionals:', error);
    res.status(500).json({ error: 'Failed to search professionals' });
  }
});

// Upload file attachment
router.post('/conversations/:conversationId/upload', requireAuth, (req, res, next) => {
  console.log(`📤 Upload request received for conversation: ${req.params.conversationId}`);
  console.log(`📋 Content-Type: ${req.get('content-type')}`);
  
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Upload middleware error:', err);
      return res.status(400).json({ error: err.message });
    }
    console.log('✅ Upload middleware passed, file:', req.file?.filename);
    return next();
  });
}, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    console.log(`🔄 Processing upload for user ${userId}, conversation ${conversationId}`);
    const { text } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Convert to ObjectId
    const mongoose = (await import('mongoose')).default;
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userIdObj.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine message type based on file mime type
    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    }

    // Create message with file attachment
    const message = new Message({
      conversation: conversationId,
      sender: userIdObj,
      text: text || '',
      type: messageType,
      fileUrl: `/api/chat/attachments/${req.file.filename}`,
      fileName: req.file.originalname,
      read: false,
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Increment unread count for other participant
    const otherParticipantId = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
    ).toString();
    
    const currentUnread = conversation.unreadCount.get(otherParticipantId) || 0;
    conversation.unreadCount.set(otherParticipantId, currentUnread + 1);

    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'firstName lastName avatar role tradingName');

    // Format response
    const formattedMessage = {
      id: message._id.toString(),
      senderId: message.sender._id.toString(),
      senderName: message.sender.role === 'professional'
        ? message.sender.tradingName || `${message.sender.firstName} ${message.sender.lastName}`
        : `${message.sender.firstName} ${message.sender.lastName}`,
      senderAvatar: message.sender.avatar,
      text: message.text,
      timestamp: message.createdAt,
      read: message.read,
      type: message.type,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
    };

    // Emit socket event
    if (io) {
      io.to(`conversation:${conversationId}`).emit('message:new', formattedMessage);
      io.to(`user:${otherParticipantId}`).emit('conversation:updated', {
        conversationId,
        lastMessage: {
          text: message.text || 'Sent a file',
          timestamp: message.createdAt,
        },
        unread: conversation.unreadCount.get(otherParticipantId),
      });
    }

    console.log('✅ File uploaded successfully:', formattedMessage.id);
    res.json({ message: formattedMessage });
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    // Delete uploaded file if message creation fails
    if (req.file) {
      try {
        unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

// Download file attachment
router.get('/attachments/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(attachmentsDir, filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user has access to this file (must be participant in conversation that contains this file)
    const message = await Message.findOne({ fileUrl: `/api/chat/attachments/${filename}` });
    if (!message) {
      return res.status(404).json({ error: 'File not found' });
    }

    const mongoose = (await import('mongoose')).default;
    const userIdObj = new mongoose.Types.ObjectId(req.user.id);

    const conversation = await Conversation.findById(message.conversation);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userIdObj.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Set appropriate headers for images
    if (ext.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(message.fileName || filename)}"`);
      res.sendFile(filePath);
    } else {
      // For other files, use download
      res.download(filePath, message.fileName || filename);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Log registered routes (moved to end of file to avoid blocking)
// Routes are registered asynchronously, so this log appears after all route definitions

export default router;

