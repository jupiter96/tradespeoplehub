import { createContext, useContext, useState, ReactNode } from "react";
import { useAccount } from "./AccountContext";
import { toast } from "sonner";
import defaultAvatar from "../assets/c1e5f236e69ba84c123ce1336bb460f448af2762.png";

export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  jobId?: string;
  jobTitle?: string;
  serviceId?: string;
  serviceName?: string;
  servicePrice?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  type: "text" | "image" | "file" | "order" | "system";
  fileUrl?: string;
  fileName?: string;
  orderId?: string;
  orderDetails?: {
    service: string;
    amount: string;
    date: string;
    status: string;
  };
}

interface MessengerContextType {
  contacts: Contact[];
  getContactById: (id: string) => Contact | undefined;
  getOrCreateContact: (contact: Omit<Contact, "lastMessage" | "timestamp" | "unread">) => Contact;
  getMessages: (contactId: string) => Message[];
  addMessage: (contactId: string, message: Omit<Message, "id" | "timestamp">) => void;
  openMessenger: () => void;
  closeMessenger: () => void;
  isOpen: boolean;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  startConversation: (contact: Omit<Contact, "lastMessage" | "timestamp" | "unread">) => void;
  userRole: "client" | "professional" | null;
  setUserRole: (role: "client" | "professional" | null) => void;
}

const MessengerContext = createContext<MessengerContextType | undefined>(undefined);

export function MessengerProvider({ children }: { children: ReactNode }) {
  const { userInfo } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"client" | "professional" | null>("client"); // Default to client
  
  // Client contacts (professionals they're talking to)
  const clientContacts: Contact[] = [
    {
      id: "pro-1",
      name: "John Smith",
      avatar: defaultAvatar,
      lastMessage: "Great! I'll be there on time.",
      timestamp: "Nov 5",
      unread: 0,
      online: false,
      serviceId: "plumbing-1",
      serviceName: "Plumbing Repair",
      servicePrice: "£150",
    },
    {
      id: "pro-2",
      name: "Sarah Johnson",
      avatar: defaultAvatar,
      lastMessage: "I'll bring all the necessary equipment.",
      timestamp: "Nov 8",
      unread: 0,
      online: true,
      serviceId: "electrical-1",
      serviceName: "Electrical Installation",
      servicePrice: "£320",
    },
    {
      id: "pro-3",
      name: "Mike Brown",
      avatar: defaultAvatar,
      lastMessage: "Perfect! I'll start early morning.",
      timestamp: "Nov 10",
      unread: 0,
      online: true,
      serviceId: "painting-1",
      serviceName: "Painting Service",
      servicePrice: "£200",
    },
    {
      id: "pro-4",
      name: "David Wilson",
      avatar: defaultAvatar,
      lastMessage: "Thanks for your order! See you Monday.",
      timestamp: "Nov 12",
      unread: 0,
      online: true,
      serviceId: "carpentry-1",
      serviceName: "Carpentry Work",
      servicePrice: "£275",
    },
    {
      id: "pro-5",
      name: "Emma Taylor",
      avatar: defaultAvatar,
      lastMessage: "I'll be there on Saturday afternoon.",
      timestamp: "Nov 11",
      unread: 0,
      online: false,
      serviceId: "gardening-1",
      serviceName: "Garden Maintenance",
      servicePrice: "£95",
    },
    {
      id: "pro-6",
      name: "Rachel Green",
      avatar: defaultAvatar,
      lastMessage: "I'll bring all cleaning supplies!",
      timestamp: "Nov 9",
      unread: 0,
      online: true,
      serviceId: "cleaning-1",
      serviceName: "Bathroom Cleaning",
      servicePrice: "£85",
    },
    {
      id: "pro-7",
      name: "Tom Baker",
      avatar: defaultAvatar,
      lastMessage: "Thank you! Have a great day!",
      timestamp: "Nov 8",
      unread: 0,
      online: false,
      serviceId: "locksmith-1",
      serviceName: "Locksmith Service",
      servicePrice: "£120",
    },
  ];

  // Professional contacts (clients they're talking to)
  const professionalContacts: Contact[] = [
    {
      id: "client-1",
      name: "James Anderson",
      avatar: defaultAvatar,
      lastMessage: "Thanks! Looking forward to it.",
      timestamp: "Nov 13",
      unread: 2,
      online: true,
      jobId: "job-101",
      jobTitle: "Kitchen Plumbing Installation",
    },
    {
      id: "client-2",
      name: "Emily Roberts",
      avatar: defaultAvatar,
      lastMessage: "Perfect! See you tomorrow.",
      timestamp: "Nov 12",
      unread: 0,
      online: false,
      jobId: "job-102",
      jobTitle: "Bathroom Renovation",
    },
    {
      id: "client-3",
      name: "Michael Chen",
      avatar: defaultAvatar,
      lastMessage: "Can you come earlier?",
      timestamp: "Nov 11",
      unread: 1,
      online: true,
      jobId: "job-103",
      jobTitle: "Emergency Leak Repair",
    },
    {
      id: "client-4",
      name: "Sophie Turner",
      avatar: defaultAvatar,
      lastMessage: "Quote looks good to me!",
      timestamp: "Nov 10",
      unread: 0,
      online: true,
      jobId: "job-104",
      jobTitle: "Boiler Service",
    },
    {
      id: "client-5",
      name: "Oliver Davis",
      avatar: defaultAvatar,
      lastMessage: "Job completed, thank you!",
      timestamp: "Nov 9",
      unread: 0,
      online: false,
      jobId: "job-105",
      jobTitle: "Pipe Installation",
    },
  ];

  // Store contacts based on user role
  const [clientContactsState, setClientContactsState] = useState<Contact[]>(clientContacts);
  const [professionalContactsState, setProfessionalContactsState] = useState<Contact[]>(professionalContacts);

  // Get contacts based on current user role
  const contacts = userRole === "client" ? clientContactsState : professionalContactsState;
  const setContacts = userRole === "client" ? setClientContactsState : setProfessionalContactsState;

  // Client messages (conversations with professionals)
  const clientMessagesByContact: Record<string, Message[]> = {
    "pro-1": [
      {
        id: "msg-1-1",
        senderId: "client-1",
        text: "Hi, I have a leaking kitchen sink that needs urgent repair.",
        timestamp: "Nov 5, 9:00 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-1-2",
        senderId: "pro-1",
        text: "I can help with that! When would you like me to come?",
        timestamp: "Nov 5, 9:10 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-1-3",
        senderId: "client-1",
        text: "Today morning would be perfect if you're available.",
        timestamp: "Nov 5, 9:15 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-1-4",
        senderId: "client-1",
        text: "Order placed: Plumbing Repair",
        timestamp: "Nov 5, 9:20 AM",
        read: true,
        type: "order",
        orderId: "ORD-001",
        orderDetails: {
          service: "Plumbing Repair",
          amount: "£150",
          date: "Nov 5, 2024 10:00",
          status: "completed",
        },
      },
      {
        id: "msg-1-5",
        senderId: "pro-1",
        text: "Great! I'll be there on time.",
        timestamp: "Nov 5, 9:25 AM",
        read: true,
        type: "text",
      },
    ],
    "pro-2": [
      {
        id: "msg-2-1",
        senderId: "client-1",
        text: "Hi, I need new ceiling lights installed in my living room and bedroom.",
        timestamp: "Nov 8, 10:00 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-2-2",
        senderId: "pro-2",
        text: "I can help with that! Do you want LED downlights with dimmer switches?",
        timestamp: "Nov 8, 10:15 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-2-3",
        senderId: "client-1",
        text: "Yes, that would be perfect! When can you do the installation?",
        timestamp: "Nov 8, 10:20 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-2-4",
        senderId: "client-1",
        text: "Order placed: Electrical Installation",
        timestamp: "Nov 8, 10:30 AM",
        read: true,
        type: "order",
        orderId: "ORD-002",
        orderDetails: {
          service: "Electrical Installation",
          amount: "£320",
          date: "Nov 11, 2024 14:00",
          status: "pending",
        },
      },
      {
        id: "msg-2-5",
        senderId: "pro-2",
        text: "I'll bring all the necessary equipment.",
        timestamp: "Nov 8, 10:35 AM",
        read: true,
        type: "text",
      },
    ],
  };

  // Professional messages (conversations with clients)
  const professionalMessagesByContact: Record<string, Message[]> = {
    "client-1": [
      {
        id: "msg-p1-1",
        senderId: "client-1",
        text: "Hi! I saw your profile and I'm interested in your kitchen plumbing services.",
        timestamp: "Nov 13, 8:00 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p1-2",
        senderId: "pro-1",
        text: "Hello! I'd be happy to help. What exactly do you need done?",
        timestamp: "Nov 13, 8:15 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p1-3",
        senderId: "client-1",
        text: "I need to install a new sink and dishwasher connections.",
        timestamp: "Nov 13, 8:20 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p1-4",
        senderId: "pro-1",
        text: "I can do that for you. It should take about 3-4 hours. When would be convenient?",
        timestamp: "Nov 13, 8:25 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p1-5",
        senderId: "client-1",
        text: "Thanks! Looking forward to it.",
        timestamp: "Nov 13, 8:30 AM",
        read: false,
        type: "text",
      },
    ],
    "client-2": [
      {
        id: "msg-p2-1",
        senderId: "client-2",
        text: "Hello, I need a complete bathroom renovation quote.",
        timestamp: "Nov 12, 2:00 PM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p2-2",
        senderId: "pro-1",
        text: "I can provide a quote for that. Can you send me some photos of the bathroom?",
        timestamp: "Nov 12, 2:10 PM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p2-3",
        senderId: "client-2",
        text: "Sure, I'll send them shortly.",
        timestamp: "Nov 12, 2:15 PM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p2-4",
        senderId: "pro-1",
        text: "Based on the photos, I can give you a detailed quote tomorrow.",
        timestamp: "Nov 12, 3:00 PM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p2-5",
        senderId: "client-2",
        text: "Perfect! See you tomorrow.",
        timestamp: "Nov 12, 3:05 PM",
        read: true,
        type: "text",
      },
    ],
    "client-3": [
      {
        id: "msg-p3-1",
        senderId: "client-3",
        text: "Emergency! I have a major leak in my basement.",
        timestamp: "Nov 11, 7:00 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p3-2",
        senderId: "pro-1",
        text: "I'll be there in 30 minutes!",
        timestamp: "Nov 11, 7:05 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p3-3",
        senderId: "client-3",
        text: "Thank you so much for the quick response!",
        timestamp: "Nov 11, 7:10 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p3-4",
        senderId: "pro-1",
        text: "I've fixed the leak. You might want to check other pipes too.",
        timestamp: "Nov 11, 9:30 AM",
        read: true,
        type: "text",
      },
      {
        id: "msg-p3-5",
        senderId: "client-3",
        text: "Can you come earlier?",
        timestamp: "Nov 11, 10:00 AM",
        read: false,
        type: "text",
      },
    ],
  };

  const [clientMessagesState, setClientMessagesState] = useState<Record<string, Message[]>>(clientMessagesByContact);
  const [professionalMessagesState, setProfessionalMessagesState] = useState<Record<string, Message[]>>(professionalMessagesByContact);

  // Get messages based on current user role
  const messagesByContact = userRole === "client" ? clientMessagesState : professionalMessagesState;
  const setMessagesByContact = userRole === "client" ? setClientMessagesState : setProfessionalMessagesState;

  const getContactById = (id: string) => {
    return contacts.find(c => c.id === id);
  };

  const getOrCreateContact = (contactData: Omit<Contact, "lastMessage" | "timestamp" | "unread">) => {
    const existing = contacts.find(c => c.id === contactData.id);
    if (existing) {
      return existing;
    }

    // If user is blocked, prevent creating new contacts
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

  const addMessage = (contactId: string, messageData: Omit<Message, "id" | "timestamp">) => {
    // If user is blocked, only allow messaging existing contacts
    if (userInfo?.isBlocked) {
      const contactExists = contacts.find(c => c.id === contactId);
      if (!contactExists) {
        toast.error("Your account has been blocked. You can only message users already in your chat list.");
        return;
      }
    }

    const newMessage: Message = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
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

  const openMessenger = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeMessenger = () => {
    setIsOpen(false);
  };

  const startConversation = (contactData: Omit<Contact, "lastMessage" | "timestamp" | "unread">) => {
    try {
      const contact = getOrCreateContact(contactData);
      setSelectedContactId(contact.id);
      openMessenger();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Unable to start conversation. Your account may be blocked.");
      }
    }
  };

  return (
    <MessengerContext.Provider
      value={{
        contacts,
        getContactById,
        getOrCreateContact,
        getMessages,
        addMessage,
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
