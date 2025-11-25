import { useState, useRef, useEffect } from "react";
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
    getContactById,
    userRole,
    setUserRole,
  } = useMessenger();
  
  const { userInfo, userRole: accountUserRole } = useAccount();

  // Sync messenger userRole with account userRole
  useEffect(() => {
    if (accountUserRole && accountUserRole !== userRole) {
      setUserRole(accountUserRole);
    }
  }, [accountUserRole, userRole, setUserRole]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const selectedContact = selectedContactId ? getContactById(selectedContactId) : null;
  const messages = selectedContactId ? getMessages(selectedContactId) : [];

  const emojis = ["😊", "👍", "❤️", "😂", "🎉", "👏", "🙏", "💯", "✨", "🔥"];

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
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

    // Simulate typing indicator
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }, 1000);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageText(messageText + emoji);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedContactId || !userInfo?.id) return;

    const fileType = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "file"
      : "file";

    addMessage(selectedContactId, {
      senderId: userInfo.id,
      text: fileType === "image" ? "Sent an image" : `Sent ${file.name}`,
      read: false,
      type: fileType as "text" | "image" | "file",
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
    });
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
            <div className={`${selectedContact ? 'hidden sm:flex' : 'flex'} w-full sm:w-[40%] flex-col h-full border-r-2 border-gray-200 bg-white`}>
              {/* Search */}
              <div className="p-4 flex-shrink-0 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                  <Input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[13px] bg-white"
                  />
                </div>
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-hidden bg-white">
                <ScrollArea className="h-full">
                  <div className="divide-y divide-gray-100">
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContactId(contact.id)}
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
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
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
                                {contact.timestamp}
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
                    ))}
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
                      {/* Back button for mobile */}
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
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
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
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === userInfo?.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] ${
                              message.senderId === userInfo?.id ? "order-2" : "order-1"
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
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  message.senderId === userInfo?.id
                                    ? "bg-[#FE8A0F] text-white rounded-br-sm"
                                    : "bg-white text-[#2c353f] rounded-bl-sm shadow-sm"
                                }`}
                              >
                                {message.type === "image" && message.fileUrl && (
                                  <img
                                    src={message.fileUrl}
                                    alt="Shared"
                                    className="rounded-lg mb-2 max-w-full"
                                  />
                                )}
                                {message.type === "file" && (
                                  <div className="flex items-center gap-2 mb-2 p-2 bg-white/10 rounded-lg">
                                    <Paperclip className="w-4 h-4" />
                                    <span className="font-['Poppins',sans-serif] text-[13px]">
                                      {message.fileName}
                                    </span>
                                  </div>
                                )}
                                <p className="font-['Poppins',sans-serif] text-[14px]">
                                  {message.text}
                                </p>
                              </div>
                            )}
                            <div
                              className={`flex items-center gap-1 mt-1 ${
                                message.senderId === userInfo?.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                                {message.timestamp}
                              </span>
                              {message.senderId === userInfo?.id && (
                                <div className="text-[#8d8d8d]">
                                  {message.read ? (
                                    <CheckCheck className="w-3 h-3" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
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
                      Choose a contact from the list to start chatting
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