import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Smile,
  Paperclip,
  Phone,
  MoreVertical,
  Search,
  Check,
  CheckCheck,
  Minimize2,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { useMessenger } from "./MessengerContext";
import { useAccount } from "./AccountContext";
import { useNavigate } from "react-router-dom";
import CustomOfferModal from "./CustomOfferModal";
import { toast } from "sonner";
import { resolveApiUrl } from "../config/api";

export default function FloatingMessenger() {
  const {
    contacts,
    isOpen,
    isMinimized,
    setIsMinimized,
    selectedContactId,
    setSelectedContactId,
    openMessenger,
    closeMessenger,
    getMessages,
    addMessage,
    uploadFile,
    getContactById,
    userRole,
    startConversation,
    searchProfessionals,
    isTyping: typingIndicators,
    sendTyping,
    markMessagesAsRead,
  } = useMessenger();
  
  const { userInfo } = useAccount();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const selectedContact = selectedContactId ? getContactById(selectedContactId) : null;
  const messages = selectedContactId ? getMessages(selectedContactId) : [];
  const isTyping = selectedContactId ? typingIndicators[selectedContactId] || false : false;

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedContact?.conversationId && selectedContactId) {
      markMessagesAsRead(selectedContact.conversationId);
    }
  }, [selectedContactId, selectedContact?.conversationId, markMessagesAsRead]);

  const emojis = ["😊", "👍", "❤️", "😂", "🎉", "👏", "🙏", "💯", "✨", "🔥"];

  // Filter contacts for display
  const filteredContacts = contacts.filter((contact) =>
    contact.name && contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = contacts.reduce((sum, contact) => sum + contact.unread, 0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedContact) {
      scrollToBottom();
    }
  }, [messages, selectedContact]);

  // Handle search for professionals (clients only)
  useEffect(() => {
    if (userRole !== 'client') {
      setShowSearchResults(false);
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchProfessionals(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching professionals:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, userRole, searchProfessionals]);

  // Handle typing indicator
  useEffect(() => {
    if (!selectedContact?.conversationId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (messageText.trim().length > 0) {
      sendTyping(selectedContact.conversationId, true);
    } else {
      sendTyping(selectedContact.conversationId, false);
    }

    // Auto-stop typing after user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedContact?.conversationId) {
        sendTyping(selectedContact.conversationId, false);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, selectedContact?.conversationId, sendTyping]);

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContactId || !userInfo?.id) return;

    addMessage(selectedContactId, {
      senderId: userInfo.id,
      text: messageText,
      read: false,
      type: "text",
    });

    setMessageText("");
    setShowEmojiPicker(false);

    // Stop typing indicator
    if (selectedContact?.conversationId) {
      sendTyping(selectedContact.conversationId, false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageText(messageText + emoji);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedContactId || !userInfo?.id) return;

    const fileType = file.type.startsWith("image/") ? "image" : "file";
    const text = fileType === "image" ? "" : `Sent ${file.name}`;

    // Upload file to server
    await uploadFile(selectedContactId, file, text);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Stop typing indicator
    if (selectedContact?.conversationId) {
      sendTyping(selectedContact.conversationId, false);
    }
  };

  const handleStartConversation = async (professionalId: string) => {
    await startConversation(professionalId);
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    if (typeof timestamp === 'string' && timestamp === 'now') {
      return 'now';
    }
    
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      
      // Check if date is valid
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'now';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'now';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => openMessenger()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-full flex items-center justify-center transition-all duration-300 z-50 shadow-lg"
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnread > 0 && (
          <Badge className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center bg-red-500 text-white border-2 border-white text-[11px] p-0">
            {totalUnread > 9 ? "9+" : totalUnread}
          </Badge>
        )}
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-white rounded-t-2xl shadow-xl px-4 py-3 flex items-center gap-3 hover:shadow-2xl transition-all"
        >
          <div className="w-10 h-10 bg-[#FE8A0F] rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">Messages</p>
            {totalUnread > 0 && (
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#FE8A0F]">
                {totalUnread} unread
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              closeMessenger();
              setIsMinimized(false);
            }}
            className="ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95vw] sm:w-[600px] md:w-[750px] lg:w-[900px] h-[calc(100vh-2rem)] max-h-[650px] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3D78CB] to-[#2c5aa0] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-white" />
            <h3 className="font-['Poppins',sans-serif] text-[16px] text-white">
              Messages
            </h3>
            {totalUnread > 0 && (
              <Badge className="bg-white/20 text-white border-0 text-[11px]">
                {totalUnread} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
              className="text-white hover:bg-white/10"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                closeMessenger();
                setSelectedContactId(null);
              }}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 border-2 border-t-0 border-gray-200 rounded-b-2xl overflow-hidden">
          <div className="flex h-full">
            {/* Left Side - Contacts List */}
            <div className={`${selectedContact ? 'hidden sm:flex' : 'flex'} w-full sm:w-[40%] flex-col h-full border-r-2 border-gray-200 bg-white relative`}>
              {/* Search */}
              <div className="p-4 flex-shrink-0 border-b border-gray-200 bg-gray-50 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                  <Input
                    type="text"
                    placeholder={userRole === 'client' ? "Search contacts or professionals..." : "Search contacts..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (userRole === 'client' && searchQuery.trim().length >= 2) {
                        setShowSearchResults(true);
                      }
                    }}
                    className="pl-10 h-10 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[13px] bg-white"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d] animate-spin" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && userRole === 'client' && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((pro) => (
                      <button
                        key={pro.id}
                        onClick={() => handleStartConversation(pro.id)}
                        className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-center gap-3"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={pro.avatar} />
                          <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[14px]">
                            {pro.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            {pro.name}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                            Start conversation
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-hidden bg-white">
                <ScrollArea className="h-full">
                  <div className="divide-y divide-gray-100">
                    {filteredContacts.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d]">
                          {userRole === 'client' ? 'No conversations yet. Search for professionals to start chatting.' : 'No conversations yet.'}
                        </p>
                      </div>
                    ) : (
                      filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                          onClick={() => {
                            setSelectedContactId(contact.id);
                            setShowSearchResults(false);
                          }}
                        className={`w-full p-3 hover:bg-gray-50 transition-colors text-left ${
                          selectedContactId === contact.id ? "bg-[#FFF5EB] border-l-4 border-[#FE8A0F]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-11 h-11">
                              <AvatarImage src={contact.avatar} />
                              <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[14px]">
                                {contact.name
                                  ? contact.name.split(" ").map((n) => n[0]).join("")
                                  : "U"}
                              </AvatarFallback>
                            </Avatar>
                            {contact.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] truncate">
                                {contact.name}
                              </h4>
                              <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] whitespace-nowrap flex-shrink-0">
                                  {formatTimestamp(contact.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] truncate flex-1">
                                {contact.lastMessage}
                              </p>
                              {contact.unread > 0 && (
                                <Badge className="bg-[#FE8A0F] text-white border-0 text-[11px] w-5 h-5 flex items-center justify-center p-0 flex-shrink-0">
                                  {contact.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className={`${selectedContact ? 'flex' : 'hidden sm:flex'} w-full sm:w-[60%] flex-col bg-white h-full`}>
              {selectedContact ? (
                <>
                  {/* Chat Header */}
                  <div className="px-6 py-4 flex items-center justify-between border-b-2 border-gray-200 bg-white shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedContactId(null)}
                        className="sm:hidden text-[#6b6b6b]"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </Button>
                      <div className="relative">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src={selectedContact.avatar} />
                          <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[15px]">
                            {selectedContact.name
                              ? selectedContact.name.split(" ").map((n) => n[0]).join("")
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                        {selectedContact.online && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                          {selectedContact.name}
                        </h4>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#10b981]">
                          {selectedContact.online ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-[#3D78CB] hover:bg-[#EFF6FF]">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-[#6b6b6b] hover:bg-gray-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Custom Order Button - Below Header (Only for Professionals) */}
                  {userRole === "professional" && (
                    <div className="px-4 py-3 border-b-2 border-gray-200 bg-gradient-to-r from-[#FFF5EB] to-white flex-shrink-0">
                      <Button
                        onClick={() => setShowOrderModal(true)}
                        className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-lg text-white font-['Poppins',sans-serif] text-[13px] transition-all duration-300"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Create Custom Offer
                      </Button>
                    </div>
                  )}

                  {/* Messages */}
                  <ScrollArea className="flex-1 min-h-0 p-6 bg-gradient-to-br from-gray-50 to-white">
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwnMessage = message.senderId === userInfo?.id;
                        const senderAvatar = isOwnMessage 
                          ? userInfo?.avatar 
                          : (message.senderAvatar || selectedContact?.avatar);
                        const senderName = isOwnMessage
                          ? `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim() || userInfo?.name
                          : (message.senderName || selectedContact?.name);
                        
                        return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-2 ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          {(() => {
                            // Check if message is only emojis
                            const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\s]+$/u;
                            const isOnlyEmojis = message.text.trim() && emojiRegex.test(message.text.trim()) && message.text.trim().length <= 10;
                            
                            if (isOnlyEmojis) {
                              // Render emoji-only message without background, no avatar, no container, 3x larger size (14px * 3 = 42px)
                              return (
                                <div className="px-2 py-1" style={{ background: 'transparent' }}>
                                  <p className="font-['Poppins',sans-serif] text-[42px] leading-none" style={{ background: 'transparent' }}>
                                    {message.text}
                                  </p>
                                </div>
                              );
                            }
                            
                            return (
                              <>
                                {/* Avatar for received messages */}
                                {!isOwnMessage && (
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={senderAvatar} />
                                    <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[12px]">
                                      {senderName
                                        ? senderName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                                        : "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                
                          <div
                            className={`max-w-[70%] ${
                                    isOwnMessage ? "order-2" : "order-1"
                            }`}
                          >
                            {(message.type === "order" || message.type === "custom_offer") && message.orderDetails ? (
                              <div className="bg-white border-2 border-[#FE8A0F] rounded-lg p-4 shadow-md">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-lg bg-[#FE8A0F]/10 flex items-center justify-center flex-shrink-0">
                                    <ShoppingBag className="w-5 h-5 text-[#FE8A0F]" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                                      {message.type === "custom_offer" ? "Custom Offer" : "Order Placed"}
                                    </p>
                                    <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-2">
                                      {message.orderDetails.service}
                                    </h4>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                          Amount:
                                        </span>
                                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F]">
                                          {message.orderDetails.amount}
                                        </span>
                                      </div>
                                      {message.type === "custom_offer" && message.orderDetails.deliveryDays && (
                                        <div className="flex justify-between">
                                          <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                            Delivery:
                                          </span>
                                          <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
                                            {message.orderDetails.deliveryDays} {message.orderDetails.deliveryDays === 1 ? 'day' : 'days'}
                                          </span>
                                        </div>
                                      )}
                                      {message.type === "order" && message.orderDetails.date && (
                                        <div className="flex justify-between">
                                          <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                            Scheduled:
                                          </span>
                                          <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
                                            {message.orderDetails.date}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                          Payment:
                                        </span>
                                        <Badge className="bg-purple-100 text-purple-700 text-[10px] h-5">
                                          {message.orderDetails.paymentType === "milestone" ? "MILESTONE" : "SINGLE"}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                          Status:
                                        </span>
                                        <Badge className="bg-blue-500 text-white text-[10px] h-5">
                                          {message.orderDetails.status.toUpperCase()}
                                        </Badge>
                                      </div>
                                    </div>
                                    {message.type === "custom_offer" && message.orderDetails.description && (
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                          Description:
                                        </p>
                                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
                                          {message.orderDetails.description}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {message.type === "custom_offer" && message.orderDetails.status === "pending" && (
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => {
                                        toast.success("Offer accepted! Order created.");
                                      }}
                                      size="sm"
                                      className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[12px]"
                                    >
                                      Accept Offer
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        toast.info("Offer declined");
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 font-['Poppins',sans-serif] text-[12px]"
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                )}
                                {message.type === "order" && (
                                  <Button
                                    onClick={() => {
                                      navigate(`/account?tab=orders&orderId=${message.orderId}`);
                                      closeMessenger();
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F] hover:text-white font-['Poppins',sans-serif] text-[12px]"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View Order
                                  </Button>
                                )}
                              </div>
                            ) : (
                              // Regular message with background
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isOwnMessage
                                    ? "bg-[#FFF5EB] text-black rounded-br-sm shadow-sm"
                                    : "bg-[#FFF5EB] text-black rounded-bl-sm shadow-sm"
                                }`}
                              >
                                {message.type === "image" && message.fileUrl && (
                                  <a 
                                    href={resolveApiUrl(message.fileUrl)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    download
                                  >
                                  <img
                                      src={resolveApiUrl(message.fileUrl)}
                                    alt="Shared"
                                      className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                                  />
                                  </a>
                                )}
                                {message.type === "file" && message.fileUrl && (
                                  <a
                                    href={resolveApiUrl(message.fileUrl)}
                                    download
                                    className="flex items-center gap-2 mb-2 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity bg-white/50"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                    <span className="font-['Poppins',sans-serif] text-[13px] truncate">
                                      {message.fileName}
                                    </span>
                                  </a>
                                )}
                                {message.text && (
                                <p className="font-['Poppins',sans-serif] text-[14px]">
                                  {message.text}
                                </p>
                                )}
                              </div>
                            )}
                            <div
                              className={`flex items-center gap-1 mt-1 ${
                                      isOwnMessage ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                                      {formatTimestamp(message.timestamp)}
                              </span>
                                    {isOwnMessage && (
                                      <div className={message.read ? "text-blue-500" : "text-[#8d8d8d]"}>
                                    <CheckCheck className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          </div>
                                
                                {/* Avatar for sent messages */}
                                {isOwnMessage && (
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={senderAvatar} />
                                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[12px]">
                                      {senderName
                                        ? senderName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                                        : "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      );
                      })}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-3 border-t-2 border-gray-200 bg-white flex-shrink-0">
                    <div className="relative">
                      {/* Emoji Picker - Positioned absolutely above input */}
                      {showEmojiPicker && (
                        <div 
                          ref={emojiPickerRef}
                          className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 shadow-2xl rounded-t-xl p-3 mb-1 z-50"
                        >
                          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto scrollbar-thin">
                            {emojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleEmojiClick(emoji)}
                                className="text-[28px] hover:scale-110 transition-transform p-1.5 hover:bg-gray-100 rounded-lg flex items-center justify-center"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[#9ca3af] hover:text-[#FE8A0F] hover:bg-[#FFF5EB] h-9 w-8 p-0 flex-shrink-0"
                        >
                          <Paperclip className="w-[18px] h-[18px]" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className={`h-9 w-8 p-0 flex-shrink-0 ${
                            showEmojiPicker 
                              ? "text-[#FE8A0F] bg-[#FFF5EB]" 
                              : "text-[#9ca3af] hover:text-[#FE8A0F] hover:bg-[#FFF5EB]"
                          }`}
                        >
                          <Smile className="w-[18px] h-[18px]" />
                        </Button>
                        <div className="flex-1 relative">
                          <Input
                            type="text"
                            placeholder="Type"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleSendMessage();
                              }
                            }}
                            className="h-9 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-full font-['Poppins',sans-serif] text-[13px] px-4"
                          />
                        </div>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim()}
                          className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 h-9 w-9 p-0 rounded-lg flex-shrink-0"
                        >
                          <Send className="w-[16px] h-[16px]" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                  <div className="text-center px-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#3D78CB]/10 to-[#FE8A0F]/10 flex items-center justify-center mx-auto mb-6">
                      <MessageCircle className="w-12 h-12 text-[#3D78CB]" />
                    </div>
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">
                      Select a Conversation
                    </h3>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d] max-w-xs">
                      {userRole === 'client' 
                        ? 'Choose a contact from the list or search for professionals to start chatting'
                        : 'Choose a contact from the list to start chatting'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Offer Modal */}
      {selectedContact && (
        <CustomOfferModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          clientId={selectedContact.id}
          clientName={selectedContact.name}
        />
      )}
    </>
  );
}
