import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJobs } from "./JobsContext";
import { useOrders } from "./OrdersContext";
import { useAccount } from "./AccountContext";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { MessageCircle, Clock, AlertCircle, Send, Paperclip, X, XCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";
import SEOHead from "./SEOHead";
import { resolveApiUrl } from "../config/api";
import { resolveAvatarUrl, getTwoLetterInitials } from "./orders/utils";

export default function DisputeDiscussionPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const { getDisputeById, getJobById, addDisputeMessage, makeDisputeOffer } = useJobs();
  const { getOrderDisputeById, addOrderDisputeMessage, makeOrderDisputeOffer, acceptDisputeOffer, rejectDisputeOffer, cancelDispute, orders } = useOrders();
  const { currentUser } = useAccount();
  
  // Try to get dispute from both contexts
  const [dispute, setDispute] = useState<any | null>(null);
  const [job, setJob] = useState<any | undefined>(undefined);
  const [order, setOrder] = useState<any | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [newOffer, setNewOffer] = useState("");
  const [showMilestones, setShowMilestones] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [hasReplied, setHasReplied] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  
  // Determine if this is an order dispute or job dispute
  const isOrderDispute = dispute && "orderId" in dispute;

  useEffect(() => {
    const jobDispute = getDisputeById(disputeId || "");
    const orderDispute = getOrderDisputeById(disputeId || "");
    const currentDispute = jobDispute || orderDispute;
    setDispute(currentDispute);
    
    if (currentDispute) {
      if ("jobId" in currentDispute) {
        setJob(getJobById(currentDispute.jobId));
      } else if ("orderId" in currentDispute) {
        const foundOrder = orders.find(o => o.disputeId === disputeId);
        setOrder(foundOrder);
      }
    }
  }, [disputeId, getDisputeById, getOrderDisputeById, getJobById, orders]);

  // Calculate time left until response deadline
  useEffect(() => {
    if (!dispute?.responseDeadline && !dispute?.negotiationDeadline) return;

    const updateTimer = () => {
      const now = Date.now();
      const deadline = dispute.negotiationDeadline || dispute.responseDeadline;
      const deadlineTime = new Date(deadline).getTime();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setTimeLeft("Deadline passed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${days} days, ${hours} hours`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dispute?.responseDeadline, dispute?.negotiationDeadline]);

  const handleSendMessage = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || !disputeId) return;
    try {
      if (isOrderDispute) {
        const order = orders.find(o => o.disputeId === disputeId);
        if (!order) {
          toast.error("Order not found");
          return;
        }

        const formData = new FormData();
        formData.append('message', message.trim() || '');
        selectedFiles.forEach((file) => {
          formData.append('attachments', file);
        });

        const response = await fetch(resolveApiUrl(`/api/orders/${order.id}/dispute/message`), {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send message');
        }

        setMessage("");
        setSelectedFiles([]);
        setHasReplied(true);
        toast.success("Message sent");
        
        // Refresh orders to get updated dispute
        window.location.reload();
      } else {
        addDisputeMessage(disputeId, message);
        setMessage("");
        setSelectedFiles([]);
        setHasReplied(true);
        toast.success("Message sent");
      }
      
      // Refresh dispute
      if (isOrderDispute) {
        setDispute(getOrderDisputeById(disputeId));
      } else {
        setDispute(getDisputeById(disputeId));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const resolveFileUrl = (filePath: string) => {
    if (!filePath) return '';
    
    // Already a full URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // Normalize the path - handle both absolute and relative paths
    let normalizedPath = filePath.replace(/\\/g, '/'); // Convert backslashes to forward slashes
    
    // Extract the uploads path from absolute paths
    // e.g., "E:/trades_new/server/uploads/disputes/file.jpg" -> "/uploads/disputes/file.jpg"
    const uploadsMatch = normalizedPath.match(/(uploads\/.+)$/i);
    if (uploadsMatch) {
      normalizedPath = '/' + uploadsMatch[1];
    } else if (!normalizedPath.startsWith('/')) {
      // If it's a relative path without /uploads, add it
      normalizedPath = '/uploads/' + normalizedPath;
    } else if (!normalizedPath.startsWith('/uploads')) {
      // If it starts with / but not /uploads, prepend uploads
      normalizedPath = '/uploads' + normalizedPath;
    }
    
    // Use resolveApiUrl to get full URL
    return resolveApiUrl(normalizedPath);
  };

  const getFileType = (fileName: string): 'image' | 'video' | 'other' => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video';
    return 'other';
  };

  const handleMakeOffer = async () => {
    if (!newOffer || !disputeId || !dispute) return;
    if (isRespondent && !respondentHasReplied) {
      toast.error("You cannot submit an offer without first replying to the dispute.");
      return;
    }
    const amount = parseFloat(newOffer);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!isCurrentUserClient && typeof userOffer === "number" && amount > userOffer) {
      toast.error("You cannot make an offer higher than your initial offer.");
      return;
    }
    if (isCurrentUserClient && typeof userOffer === "number" && amount < userOffer) {
      toast.error("You cannot make an offer lower than your initial offer.");
      return;
    }
    if (amount > maxOfferAmount) {
      toast.error(`Offer cannot exceed ${isOrderDispute ? "order" : "milestone"} amount of £${maxOfferAmount.toFixed(2)}`);
      return;
    }
    try {
      if (isOrderDispute) {
        await makeOrderDisputeOffer(disputeId, amount);
      } else {
        makeDisputeOffer(disputeId, amount);
      }
      setNewOffer("");
      toast.success("Offer submitted");
      // Refresh dispute
      if (isOrderDispute) {
        setDispute(getOrderDisputeById(disputeId));
      } else {
        setDispute(getDisputeById(disputeId));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit offer");
    }
  };

  const handleAcceptOffer = async () => {
    if (!disputeId) return;
    try {
      const acceptAction = isOrderDispute ? acceptDisputeOffer(disputeId) : Promise.resolve();
      await toast.promise(acceptAction, {
        loading: "Processing...",
        success: "Dispute resolved successfully",
        error: (e: any) => e?.message || "Failed to accept offer",
      });
      if (isOrderDispute && order?.id) {
        navigate(`/account?tab=orders&orderId=${order.id}`);
      } else {
        const jobId = (job as any)?.id || (job as any)?._id;
        navigate(jobId ? `/account?tab=jobs&jobId=${jobId}` : "/account?tab=jobs");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to accept offer");
    }
  };

  const handleRejectOffer = async () => {
    if (!disputeId) return;
    try {
      if (isOrderDispute) {
        await rejectDisputeOffer(disputeId);
      }
      toast.success("Offer rejected");
      // Refresh dispute
      if (isOrderDispute) {
        setDispute(getOrderDisputeById(disputeId));
      } else {
        setDispute(getDisputeById(disputeId));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reject offer");
    }
  };

  const handleCancelDispute = async () => {
    if (!disputeId || !order) return;
    try {
      await cancelDispute(order.id);
      toast.success("Dispute cancelled successfully");
      setIsCancelConfirmOpen(false);
      navigate(isOrderDispute ? "/account?tab=orders" : "/account?tab=jobs");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel dispute");
    }
  };

  if (!dispute || (!job && !order)) {
    return (
      <>
        <SEOHead
          title="Dispute Not Found"
          description="Dispute not found"
          robots="noindex,nofollow"
        />
        <div className="min-h-screen bg-[#f0f0f0]">
          <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
            <Nav />
          </header>
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-20 mt-[50px] md:mt-0 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
              Dispute Not Found
            </h1>
            <Button
              onClick={() => navigate(isOrderDispute ? "/account?tab=orders" : "/account?tab=jobs")}
              className="mt-4 bg-[#FE8A0F] hover:bg-[#FFB347]"
            >
              Go to My {isOrderDispute ? "Orders" : "Jobs"}
            </Button>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  // Determine if current user is client or professional
  // Convert to string to handle both ObjectId and string types
  const claimantIdStr = typeof dispute.claimantId === 'object'
    ? (dispute.claimantId as any)?._id?.toString() || dispute.claimantId?.toString()
    : dispute.claimantId;
  const respondentIdStr = typeof dispute.respondentId === 'object'
    ? (dispute.respondentId as any)?._id?.toString() || dispute.respondentId?.toString()
    : dispute.respondentId;
  const isClaimant = currentUser?.id === claimantIdStr;
  const isRespondent = currentUser?.id === respondentIdStr;
  const respondentHasReplied = Boolean(
    (dispute.messages || []).some((msg: any) => {
      const msgUserId = typeof msg.userId === "object"
        ? (msg.userId as any)?._id?.toString() || msg.userId?.toString()
        : msg.userId;
      return respondentIdStr && msgUserId && String(msgUserId) === String(respondentIdStr);
    }) || (isRespondent && hasReplied)
  );
  // For order disputes, check order.clientId, for job disputes use claimantId
  let isCurrentUserClient = false;
  if (order) {
    // Order dispute: check if current user is the client
    isCurrentUserClient = currentUser?.id === order.clientId || currentUser?.id === order.client;
  } else if (job) {
    // Job dispute: client is the one who posted the job (claimant)
    isCurrentUserClient = currentUser?.id === dispute.claimantId;
  }
  
  const userRole = isCurrentUserClient ? "Client (you)" : "Professional (you)";
  const otherRole = isCurrentUserClient ? `Professional (${dispute.respondentName || dispute.claimantName})` : `Client (${dispute.claimantName || dispute.respondentName})`;

  // Client's offer = what they want to pay, Professional's offer = what they want to receive
  const userOffer = isCurrentUserClient ? (dispute as any).clientOffer : (dispute as any).professionalOffer;
  const otherOffer = isCurrentUserClient ? (dispute as any).professionalOffer : (dispute as any).clientOffer;
  const maxOfferAmount = isOrderDispute
    ? (order?.refundableAmount ?? dispute.amount)
    : dispute.amount;
  const newOfferValue = parseFloat(newOffer);
  const isOfferOverLimit = !Number.isNaN(newOfferValue) && newOfferValue > maxOfferAmount;

  const hasUserMadeOffer = userOffer !== undefined && userOffer !== null;
  const hasOtherMadeOffer = otherOffer !== undefined && otherOffer !== null;

  const milestone = job?.milestones?.find((m) => m.id === (dispute as any).milestoneId);

  return (
    <>
      <SEOHead
        title="Dispute Discussion"
        description="Dispute discussion page"
        robots="noindex,nofollow"
      />
      <div className="min-h-screen bg-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 mt-[50px] md:mt-0">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-md p-6 border-b border-gray-200">
            <h1 className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] text-[#2c353f]">
              {isOrderDispute ? "Order payment dispute" : "Milestone payment dispute"}
            </h1>
            {isOrderDispute && order && (
              <Button
                onClick={() => navigate(`/account?tab=orders&orderId=${order.id}`)}
                variant="ghost"
                className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] hover:text-[#2C5AA0] hover:bg-transparent"
              >
                Go Back to Order Details
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4">
            {/* Dispute Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                    Dispute ID:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                    {dispute.id.replace("DISP-", "").replace("dispute-", "")}
                  </p>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                    Case status:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                    {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                    Opened by:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                    {dispute.claimantName}
                  </p>
                </div>
              </div>

              {/* Claimant Info Section */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex gap-3 items-start">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    {resolveAvatarUrl(dispute.claimantAvatar) && (
                      <AvatarImage src={resolveAvatarUrl(dispute.claimantAvatar)} />
                    )}
                    <AvatarFallback className="bg-[#3D78CB] text-white">
                      {getTwoLetterInitials(dispute.claimantName, 'C')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                      Claimant:
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[15px] text-[#3D78CB] font-medium mb-2">
                      {dispute.claimantName}
                    </p>
                    {dispute.evidenceFiles && dispute.evidenceFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                          Evidence Files:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {dispute.evidenceFiles.map((file: string, idx: number) => {
                            const fileUrl = resolveFileUrl(file);
                            const fileName = file.split('/').pop() || '';
                            const fileType = getFileType(fileName);
                            
                            return (
                              <div key={idx} className="relative group">
                                {fileType === 'image' ? (
                                  <img
                                    src={fileUrl}
                                    alt={fileName}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(fileUrl, '_blank')}
                                  />
                                ) : fileType === 'video' ? (
                                  <video
                                    src={fileUrl}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer"
                                    controls
                                  />
                                ) : (
                                  <div
                                    className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={() => window.open(fileUrl, '_blank')}
                                  >
                                    <Paperclip className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                                <p className="font-['Poppins',sans-serif] text-[10px] text-[#6b6b6b] mt-1 truncate" title={fileName}>
                                  {fileName}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="space-y-4">
                {dispute.messages && dispute.messages.length > 0 ? (
                  dispute.messages.map((msg: any, index: number) => {
                    const isCurrentUser = msg.userId === currentUser?.id;
                    const senderName = msg.userName || (msg.userId === dispute.claimantId ? dispute.claimantName : dispute.respondentName);
                    const isClaimant = msg.userId === dispute.claimantId?.toString();
                    const showDeadline = index === dispute.messages.length - 1 && isClaimant;

                    return (
                      <div key={msg.id} className={`border rounded-lg p-4 ${showDeadline ? 'bg-orange-50 border-orange-200' : 'border-gray-200'}`}>
                        <div className="flex gap-3">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            {resolveAvatarUrl(msg.userAvatar) && (
                              <AvatarImage src={resolveAvatarUrl(msg.userAvatar)} />
                            )}
                            <AvatarFallback className="bg-[#3D78CB] text-white">
                              {getTwoLetterInitials(senderName, 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                {isClaimant && (
                                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                                    Claimant:
                                  </p>
                                )}
                                <p className="font-['Poppins',sans-serif] text-[15px] text-[#3D78CB] font-medium">
                                  {senderName}
                                </p>
                                {showDeadline && timeLeft && (
                                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#d97706] mt-1">
                                    Deadline: {timeLeft}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 whitespace-pre-wrap">
                              {msg.message}
                            </p>
                            
                            {/* Message Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {msg.attachments.map((attachment: any, attIdx: number) => {
                                  const fileUrl = resolveFileUrl(attachment.url || attachment);
                                  const fileName = attachment.fileName || (typeof attachment === 'string' ? attachment.split('/').pop() : '');
                                  const fileType = attachment.fileType || getFileType(fileName);
                                  
                                  return (
                                    <div key={attIdx} className="relative group">
                                      {fileType === 'image' ? (
                                        <img
                                          src={fileUrl}
                                          alt={fileName}
                                          className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => window.open(fileUrl, '_blank')}
                                        />
                                      ) : fileType === 'video' ? (
                                        <video
                                          src={fileUrl}
                                          className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer"
                                          controls
                                        />
                                      ) : (
                                        <div
                                          className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                          onClick={() => window.open(fileUrl, '_blank')}
                                        >
                                          <Paperclip className="w-6 h-6 text-gray-600" />
                                        </div>
                                      )}
                                      <p className="font-['Poppins',sans-serif] text-[10px] text-[#6b6b6b] mt-1 truncate" title={fileName}>
                                        {fileName}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] text-right mt-2">
                              {new Date(msg.timestamp).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).replace(',', '')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      No messages yet
                    </p>
                  </div>
                )}
              </div>

              {/* Reply Section */}
              {(dispute.status === "open" || dispute.status === "negotiation") && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="font-['Poppins',sans-serif] text-[14px] mb-3 resize-none"
                    rows={3}
                  />
                  
                  {/* File Upload */}
                  <div className="mb-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Paperclip className="w-4 h-4 text-[#3D78CB]" />
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#3D78CB]">
                        Attach Files
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*"
                      />
                    </label>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <Paperclip className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] flex-1 truncate">
                              {file.name}
                            </span>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() && selectedFiles.length === 0}
                    className="bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif]"
                  >
                    Reply
                  </Button>
                </div>
              )}
            </div>
          </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
            {/* Response Timeline Card */}
            {(dispute.status === "open" || dispute.status === "negotiation") && timeLeft && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-['Poppins',sans-serif] text-[32px] text-[#2c353f] font-bold text-center mb-2">
                  {timeLeft}
                </p>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] text-center">
                  left for {isCurrentUserClient ? dispute.respondentName : dispute.claimantName} to respond
                </p>
              </div>
            )}
            
            {/* Amount Disputed Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                Total disputed {isOrderDispute ? "order" : "milestone"}
              </p>
              <p className="font-['Poppins',sans-serif] text-[42px] text-[#2c353f] font-bold mb-4">
                £ {dispute.amount.toFixed(0)}
              </p>

              {!isOrderDispute && showMilestones && milestone && (
                <div className="mt-4 p-3 bg-[#f8f9fa] rounded-lg text-left">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                    Milestone:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {milestone.description}
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mt-2">
                    £{milestone.amount.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Current Offer Status */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3 text-center">
                  Current Offer Status
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      {isCurrentUserClient ? "Client (you)" : "Professional (you)"}<br />{isCurrentUserClient ? "wants to pay:" : "want to receive:"}
                    </p>
                    {hasUserMadeOffer && userOffer !== undefined ? (
                      <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-bold">
                        £{userOffer.toFixed(2)}
                      </p>
                    ) : (
                      <Button
                        className="w-full bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] text-[11px] h-auto py-2"
                        disabled
                      >
                        You've not made an offer yet
                      </Button>
                    )}
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      {isCurrentUserClient ? "Professional" : "Client"}<br />{isCurrentUserClient ? "want to receive:" : "wants to pay:"}
                    </p>
                    {hasOtherMadeOffer && otherOffer !== undefined ? (
                      <>
                        <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-bold">
                          £{otherOffer.toFixed(2)}
                        </p>
                        <div className="mt-3 space-y-2">
                          <Button
                            onClick={handleAcceptOffer}
                            className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                          >
                            Accept and close
                          </Button>
                          <Button
                            onClick={handleRejectOffer}
                            variant="outline"
                            className="w-full border-red-500 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif]"
                          >
                            Reject
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] italic">
                        No offer yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Offer Input Card - Only show if dispute is open or in negotiation */}
            {(dispute.status === "open" || dispute.status === "negotiation") && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3">
                  Make a new offer you wish to {isCurrentUserClient ? "pay" : "receive"}:
                </p>
                
                {!hasOtherMadeOffer && (
                  <div className="mb-3">
                    <Button
                      className="w-full bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] text-[13px]"
                      disabled
                    >
                      {isClaimant ? dispute.respondentName : dispute.claimantName} has not made an offer yet
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      £
                    </span>
                    <Input
                      type="number"
                      value={newOffer}
                      onChange={(e) => setNewOffer(e.target.value)}
                      placeholder="0.00"
                      className="pl-7 font-['Poppins',sans-serif] text-[14px]"
                      step="0.01"
                      min="0"
                      max={maxOfferAmount}
                    />
                  </div>
                  <Button
                    onClick={handleMakeOffer}
                    disabled={!newOffer}
                    className="bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] px-6"
                  >
                    SUBMIT
                  </Button>
                </div>
                <p
                  className={`mt-2 font-['Poppins',sans-serif] text-[12px] ${
                    isOfferOverLimit ? "text-red-600 font-medium" : "text-[#6b6b6b]"
                  }`}
                >
                  {`Must be between £0.00 and £${maxOfferAmount.toFixed(2)}`}
                </p>
                
                {hasUserMadeOffer && (
                  <p className="font-['Poppins',sans-serif] text-[11px] text-green-600 mt-2 text-center">
                    Your current offer: £{userOffer?.toFixed(2)}
                  </p>
                )}
                
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-2 text-center">
                  Enter an amount between £0 and £{dispute.amount.toFixed(2)} GBP
                </p>

                {/* Cancel Dispute Button - Only for claimant (dispute creator) */}
                {isClaimant && isOrderDispute && (dispute.status === "open" || dispute.status === "negotiation") && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => setIsCancelConfirmOpen(true)}
                      variant="outline"
                      className="w-full border-red-500 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif] text-[13px]"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Dispute
                    </Button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Cancel Dispute Confirmation Dialog */}
        <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
          <DialogContent className="w-[90vw] max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                Cancel Dispute?
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Are you sure you want to cancel this dispute? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setIsCancelConfirmOpen(false)}
                variant="outline"
                className="flex-1 font-['Poppins',sans-serif]"
              >
                No, Keep It
              </Button>
              <Button
                onClick={handleCancelDispute}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif]"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Yes, Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </>
  );
}