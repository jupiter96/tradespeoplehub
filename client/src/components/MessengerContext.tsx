import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";
import { useAccount } from "./AccountContext";
import { toast } from "sonner";
import { resolveApiUrl } from "../config/api";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  conversationId?: string;
  participantId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  text: string;
  timestamp: string | Date;
  read: boolean;
  type: "text" | "image" | "file" | "order" | "custom_offer" | "system";
  fileUrl?: string;
  fileName?: string;
  orderId?: string;
  orderDetails?: {
    service?: string;
    serviceName?: string;
    amount?: string;
    date?: string;
    status?: string;
    orderId?: string;
    offerId?: string;
    deliveryDays?: number;
    description?: string;
    paymentType?: string;
    price?: number;
    quantity?: number;
    chargePer?: string;
  };
}

interface MessengerContextType {
  contacts: Contact[];
  getContactById: (id: string) => Contact | undefined;
  getOrCreateContact: (contact: Omit<Contact, "lastMessage" | "timestamp" | "unread">) => Contact;
  getMessages: (contactId: string) => Message[];
  refreshMessages: (contactId: string) => Promise<void>;
  addMessage: (contactId: string, message: Omit<Message, "id" | "timestamp">) => void;
  uploadFile: (contactId: string, file: File, text?: string) => Promise<void>;
  openMessenger: () => void;
  closeMessenger: () => void;
  isOpen: boolean;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  startConversation: (participantId: string | { id: string; [key: string]: any }) => Promise<void>;
  userRole: "client" | "professional" | null;
  setUserRole: (role: "client" | "professional" | null) => void;
  searchProfessionals: (query: string) => Promise<Array<{ id: string; name: string; avatar?: string }>>;
  isTyping: Record<string, boolean>;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  markMessagesAsRead: (conversationId: string) => void;
}

const MessengerContext = createContext<MessengerContextType | undefined>(undefined);

export function MessengerProvider({ children }: { children: ReactNode }) {
  const { userInfo } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"client" | "professional" | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messagesByContact, setMessagesByContact] = useState<Record<string, Message[]>>({});
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const socketInitialized = useRef(false);

  // Initialize socket when user is logged in (only once)
  useEffect(() => {
    if (!userInfo?.id) {
      // User logged out - disconnect socket
      if (socketInitialized.current) {
        disconnectSocket();
        socketInitialized.current = false;
      }
      return;
    }

    // Get or create socket (will reuse if already exists and connected)
    const socket = connectSocket(userInfo.id);
    
    // If already initialized, don't re-register listeners
    if (socketInitialized.current) {
      return;
    }

    socketInitialized.current = true;

    // Listen for new messages
    const handleNewMessage = async (messageData: any) => {
      const conversationId = messageData.conversationId;
      
      // Find contact by conversationId - use current state
      setContacts(prevContacts => {
        let contact = prevContacts.find(c => c.conversationId === conversationId);
        
        // If contact not found, it might be a new conversation - reload conversations
        if (!contact) {
          // Use setTimeout to avoid state update during render
          setTimeout(() => {
            fetchConversations();
          }, 0);
          return prevContacts; // Return unchanged for now, will update after fetch
        }

        const formattedMessage: Message = {
          id: messageData.id,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          senderAvatar: messageData.senderAvatar,
          text: messageData.text || '',
          timestamp: new Date(messageData.timestamp),
          read: messageData.read,
          type: messageData.type || 'text',
          fileUrl: messageData.fileUrl,
          fileName: messageData.fileName,
          orderId: messageData.orderId,
          orderDetails: messageData.orderDetails,
        };

        // Check if this is a duplicate (optimistic update already added it)
        setMessagesByContact(prev => {
          const existingMessages = prev[contact.id] || [];
          // Check if message already exists (by ID or by temp ID matching)
          const isDuplicate = existingMessages.some(msg => {
            // If it's a temp message from optimistic update, replace it
            if (msg.id.startsWith('temp-') && msg.senderId === formattedMessage.senderId && 
                msg.text === formattedMessage.text && 
                Math.abs(new Date(msg.timestamp).getTime() - formattedMessage.timestamp.getTime()) < 5000) {
              return true;
            }
            // If it's the same message ID, it's a duplicate
            return msg.id === formattedMessage.id;
          });

          if (isDuplicate) {
            // Replace temp message with real one
            return {
              ...prev,
              [contact.id]: existingMessages.map(msg => {
                if (msg.id.startsWith('temp-') && msg.senderId === formattedMessage.senderId && 
                    msg.text === formattedMessage.text) {
                  return formattedMessage;
                }
                return msg;
              }).filter((msg, index, arr) => {
                // Remove duplicates by ID
                return arr.findIndex(m => m.id === msg.id) === index;
              }),
            };
          }

          // Add new message
          return {
            ...prev,
            [contact.id]: [...existingMessages, formattedMessage],
          };
        });

        // Show notification if not current conversation
        setSelectedContactId(prevSelected => {
          if (prevSelected !== contact.id && messageData.senderId !== userInfo.id) {
            toast.info(`New message from ${contact.name}`);
          }
          return prevSelected;
        });

        // Return updated contacts
        return prevContacts.map(c =>
          c.id === contact.id
            ? {
                ...c,
                lastMessage: formattedMessage.text || 'Sent a file',
                timestamp: new Date(formattedMessage.timestamp).toLocaleDateString(),
                unread: messageData.senderId !== userInfo.id ? (c.unread || 0) + 1 : c.unread,
              }
            : c
        );
      });
    };

    // Listen for typing indicators
    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.userId === userInfo.id) return;
      
      setContacts(prevContacts => {
        const contact = prevContacts.find(c => c.conversationId === data.conversationId);
        if (contact) {
          setIsTyping(prev => ({
            ...prev,
            [contact.id]: data.isTyping,
          }));
        }
        return prevContacts;
      });
    };

    // Listen for conversation updates
    const handleConversationUpdated = (data: any) => {
      setContacts(prev =>
        prev.map(c =>
          c.conversationId === data.id
            ? {
                ...c,
                lastMessage: data.lastMessage?.text || c.lastMessage,
                timestamp: data.lastMessageAt ? new Date(data.lastMessageAt).toLocaleDateString() : c.timestamp,
              }
            : c
        )
      );
    };

    // Listen for user online/offline
    const handleUserOnline = (data: { userId: string }) => {
      console.log('🟢 User came online:', data.userId);
      setContacts(prev =>
        prev.map(c => {
          if (c.participantId === data.userId) {
            console.log('✅ Updated contact to online:', c.name);
            return { ...c, online: true };
          }
          return c;
        })
      );
    };

    const handleUserOffline = (data: { userId: string }) => {
      console.log('🔴 User went offline:', data.userId);
      setContacts(prev =>
        prev.map(c => {
          if (c.participantId === data.userId) {
            console.log('✅ Updated contact to offline:', c.name);
            return { ...c, online: false };
          }
          return c;
        })
      );
    };

    // Listen for messages read event (when other participant reads messages)
    const handleMessagesRead = (data: { conversationId: string; userId: string }) => {
      setContacts(prevContacts => {
        const contact = prevContacts.find(c => c.conversationId === data.conversationId);
        if (contact) {
          // Update read status for messages sent by current user
          setMessagesByContact(prev => {
            const messages = prev[contact.id] || [];
            return {
              ...prev,
              [contact.id]: messages.map(msg => 
                msg.senderId === userInfo.id ? { ...msg, read: true } : msg
              ),
            };
          });
        }
        return prevContacts;
      });
    };

    // Register event listeners
    socket.on('new-message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('conversation-updated', handleConversationUpdated);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('messages-read', handleMessagesRead);

    // Cleanup: remove event listeners when user changes or component unmounts
    return () => {
      // Remove all event listeners to prevent memory leaks
      socket.off('new-message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('conversation-updated', handleConversationUpdated);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('messages-read', handleMessagesRead);
      
      // Only disconnect and reset if user is logging out
      // Don't disconnect on every re-render, just remove listeners
      socketInitialized.current = false;
    };
  }, [userInfo?.id]); // Only depend on userInfo?.id

  // Set user role from account
  useEffect(() => {
    if (userInfo?.role) {
      setUserRole(userInfo.role as "client" | "professional");
    }
  }, [userInfo?.role]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!userInfo?.id) return;

    try {
      const response = await fetch(resolveApiUrl('/api/chat/conversations'), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const formattedContacts: Contact[] = data.conversations.map((conv: any) => {
          const isOnline = Boolean(conv.online);
          console.log(`📇 Contact: ${conv.participant.name} - Online: ${isOnline}`);
          return {
          id: conv.participant.id,
          name: conv.participant.name,
          avatar: conv.participant.avatar, // Use actual profile image, no default fallback
          lastMessage: conv.lastMessage?.text || 'Start a conversation',
          timestamp: conv.lastMessage?.timestamp
            ? new Date(conv.lastMessage.timestamp).toLocaleDateString()
            : new Date(conv.timestamp).toLocaleDateString(),
          unread: conv.unread || 0,
            online: isOnline,
          conversationId: conv.id,
          participantId: conv.participant.id,
          };
        });

        console.log(`✅ Loaded ${formattedContacts.length} contacts, ${formattedContacts.filter(c => c.online).length} online`);
        setContacts(formattedContacts);

        // Fetch messages for each conversation
        for (const contact of formattedContacts) {
          if (contact.conversationId) {
            await fetchMessages(contact.conversationId, contact.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [userInfo?.id]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string, contactId: string) => {
    try {
      const response = await fetch(
        resolveApiUrl(`/api/chat/conversations/${conversationId}/messages?limit=100`),
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        const formattedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          text: msg.text || '',
          timestamp: new Date(msg.timestamp),
          read: msg.read,
          type: msg.type || 'text',
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          orderId: msg.orderId,
          orderDetails: msg.orderDetails,
        }));

        setMessagesByContact(prev => ({
          ...prev,
          [contactId]: formattedMessages,
        }));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  // Load conversations when user is logged in
  useEffect(() => {
    if (userInfo?.id) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.id]);

  const getContactById = (id: string) => {
    return contacts.find(c => c.id === id);
  };

  const getOrCreateContact = (contactData: Omit<Contact, "lastMessage" | "timestamp" | "unread">) => {
    const existing = contacts.find(c => c.id === contactData.id);
    if (existing) {
      return existing;
    }

    if (userInfo?.isBlocked) {
      throw new Error("Your account has been blocked. You can only message users already in your chat list.");
    }

    const newContact: Contact = {
      ...contactData,
      lastMessage: "Start a conversation",
      timestamp: "now",
      unread: 0,
    };

    setContacts(prev => [...prev, newContact]);
    return newContact;
  };

  const getMessages = (contactId: string) => {
    return messagesByContact[contactId] || [];
  };

  const refreshMessages = useCallback(async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact?.conversationId) {
      await fetchMessages(contact.conversationId, contactId);
    }
  }, [contacts, fetchMessages]);

  const addMessage = (contactId: string, messageData: Omit<Message, "id" | "timestamp">) => {
    if (userInfo?.isBlocked) {
      const contactExists = contacts.find(c => c.id === contactId);
      if (!contactExists) {
        toast.error("Your account has been blocked. You can only message users already in your chat list.");
        return;
      }
    }

    const contact = contacts.find(c => c.id === contactId);
    if (!contact?.conversationId) {
      toast.error("Conversation not found");
      return;
    }

    const socket = getSocket();
    if (!socket) {
      toast.error("Not connected to chat server");
      return;
    }

    // Send via socket
    socket.emit('new-message', {
      conversationId: contact.conversationId,
      text: messageData.text,
      type: messageData.type || 'text',
      fileUrl: messageData.fileUrl,
      fileName: messageData.fileName,
    });

    // Optimistically add message to UI
    const newMessage: Message = {
      ...messageData,
      id: `temp-${Date.now()}`,
      timestamp: new Date(),
    };

    setMessagesByContact(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMessage],
    }));

    // Update contact's last message
    setContacts(prev =>
      prev.map(c =>
        c.id === contactId
          ? {
              ...c,
              lastMessage: messageData.text,
              timestamp: "now",
            }
          : c
      )
    );
  };

  const uploadFile = async (contactId: string, file: File, text?: string) => {
    if (userInfo?.isBlocked) {
      const contactExists = contacts.find(c => c.id === contactId);
      if (!contactExists) {
        toast.error("Your account has been blocked. You can only message users already in your chat list.");
        return;
      }
    }

    const contact = contacts.find(c => c.id === contactId);
    if (!contact?.conversationId) {
      toast.error("Conversation not found");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (text) {
        formData.append('text', text);
      }

      const response = await fetch(
        resolveApiUrl(`/api/chat/conversations/${contact.conversationId}/upload`),
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await response.json();
      const message = data.message;

      // Add message to local state
      const newMessage: Message = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        senderAvatar: message.senderAvatar,
        text: message.text,
        timestamp: message.timestamp,
        read: message.read,
        type: message.type,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
      };

      setMessagesByContact(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), newMessage],
      }));

      // Update contact's last message
      setContacts(prev =>
        prev.map(c =>
          c.id === contactId
            ? {
                ...c,
                lastMessage: message.text || 'Sent a file',
                timestamp: "now",
              }
            : c
        )
      );

      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };

  const openMessenger = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeMessenger = () => {
    setIsOpen(false);
  };

  const startConversation = async (participantId: string | { id: string; [key: string]: any }) => {
    if (!userInfo?.id) {
      toast.error("Please log in to start a conversation");
      return;
    }

    // Extract ID if object is passed
    const actualParticipantId = typeof participantId === 'string' ? participantId : participantId.id;

    if (!actualParticipantId) {
      toast.error("Invalid participant ID");
      return;
    }

    try {
      const response = await fetch(resolveApiUrl('/api/chat/conversations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ participantId: actualParticipantId }),
      });

      if (response.ok) {
        const data = await response.json();
        const conv = data.conversation;

        const newContact: Contact = {
          id: conv.participant.id,
          name: conv.participant.name,
          avatar: conv.participant.avatar, // Use actual profile image, no default fallback
          lastMessage: conv.lastMessage?.text || 'Start a conversation',
          timestamp: conv.lastMessage?.timestamp
            ? new Date(conv.lastMessage.timestamp).toLocaleDateString()
            : 'now',
          unread: conv.unread || 0,
          online: Boolean(conv.online),
          conversationId: conv.id,
          participantId: conv.participant.id,
        };

        setContacts(prev => {
          const existing = prev.find(c => c.id === newContact.id);
          if (existing) {
            return prev;
          }
          return [newContact, ...prev];
        });

        setSelectedContactId(newContact.id);
      openMessenger();

        // Fetch messages
        if (newContact.conversationId) {
          await fetchMessages(newContact.conversationId, newContact.id);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const searchProfessionals = useCallback(async (query: string): Promise<Array<{ id: string; name: string; avatar?: string }>> => {
    if (!userInfo?.id || userInfo.role !== 'client') {
      return [];
    }

    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const response = await fetch(
        resolveApiUrl(`/api/chat/search-professionals?query=${encodeURIComponent(query)}`),
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.professionals.map((pro: any) => ({
          id: pro.id,
          name: pro.name,
          avatar: pro.avatar, // Use actual profile image, no default fallback
        }));
      }
    } catch (error) {
      console.error('Error searching professionals:', error);
    }

    return [];
  }, [userInfo?.id]);

  const sendTyping = useCallback((conversationId: string, isTypingValue: boolean) => {
    const socket = getSocket();
    if (!socket) return;

    const contact = contacts.find(c => c.conversationId === conversationId);
    if (!contact) return;

    // Clear existing timeout
    if (typingTimeouts.current[conversationId]) {
      clearTimeout(typingTimeouts.current[conversationId]);
    }

    if (isTypingValue) {
      socket.emit('typing', { conversationId, isTyping: true });

      // Auto-stop typing after 3 seconds
      typingTimeouts.current[conversationId] = setTimeout(() => {
        socket.emit('stop-typing', { conversationId });
        setIsTyping(prev => ({
          ...prev,
          [contact.id]: false,
        }));
      }, 3000);
    } else {
      socket.emit('stop-typing', { conversationId });
      setIsTyping(prev => ({
        ...prev,
        [contact.id]: false,
      }));
    }
  }, [contacts]);

  const markMessagesAsRead = useCallback((conversationId: string) => {
    const socket = getSocket();
    if (socket && userInfo?.id && conversationId) {
      socket.emit('mark-read', { conversationId });
      
      // Optimistically update unread count
      setContacts(prev =>
        prev.map(c =>
          c.conversationId === conversationId ? { ...c, unread: 0 } : c
        )
      );
    }
  }, [userInfo?.id]);

  return (
    <MessengerContext.Provider
      value={{
        contacts,
        getContactById,
        getOrCreateContact,
        getMessages,
        refreshMessages,
        addMessage,
        uploadFile,
        openMessenger,
        closeMessenger,
        isOpen,
        isMinimized,
        setIsMinimized,
        selectedContactId,
        setSelectedContactId,
        startConversation,
        userRole,
        setUserRole,
        searchProfessionals,
        isTyping,
        sendTyping,
        markMessagesAsRead,
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
}

export function useMessenger() {
  const context = useContext(MessengerContext);
  if (context === undefined) {
    throw new Error("useMessenger must be used within a MessengerProvider");
  }
  return context;
}
