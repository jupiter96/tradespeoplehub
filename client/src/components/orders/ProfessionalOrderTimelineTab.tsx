import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  MessageCircle,
  Calendar,
  Send,
  FileText,
  PlayCircle,
  Edit,
  ChevronDown,
  Paperclip,
} from "lucide-react";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Order, TimelineEvent } from "./types";
import { buildProfessionalTimeline, formatDate, formatDateTime, resolveFileUrl } from "./index";
import { toast } from "sonner";

interface ProfessionalOrderTimelineTabProps {
  order: Order;
  userInfo: any;
  timelineEvents: TimelineEvent[];
  workElapsedTime: { started: boolean; hours: number; minutes: number; seconds: number };
  timelineTimer: React.ReactNode;
  appointmentCountdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
    expired: boolean;
  };
  appointmentDeadline: Date | null;
  showDisputeSection: boolean;
  getOrderDisputeById: (disputeId: string) => any;
  onOpenModal: (modalName: 'delivery' | 'extension' | 'completion' | 'dispute' | 'disputeResponse' | 'revisionResponse' | 'withdrawCancellation' | 'professionalReview') => void;
  onStartConversation: (params: {
    id: string;
    name: string;
    avatar?: string;
    online?: boolean;
    jobId?: string;
    jobTitle?: string;
  }) => void;
  onRespondToCancellation: (action: 'approve' | 'reject') => Promise<void>;
  onRespondToRevision: (action: 'accept' | 'reject') => Promise<void>;
  onRequestArbitration: () => Promise<void>;
  onCancelDispute: () => Promise<void>;
  onSetExtensionNewDate: (date: string) => void;
  onSetExtensionNewTime: (time: string) => void;
  onSetExtensionReason: (reason: string) => void;
  onSetDeliveryMessage: (message: string) => void;
  onSetDeliveryFiles: (files: File[]) => void;
  onSetRevisionResponseAction: (action: 'accept' | 'reject') => void;
  onSetRevisionAdditionalNotes: (notes: string) => void;
  onSetDisputeResponseMessage: (message: string) => void;
  onSetBuyerRating: (rating: number) => void;
  onSetBuyerReview: (review: string) => void;
  navigate: (path: string) => void;
}

export default function ProfessionalOrderTimelineTab({
  order: currentOrder,
  userInfo,
  timelineEvents,
  workElapsedTime,
  timelineTimer,
  appointmentCountdown,
  appointmentDeadline,
  showDisputeSection,
  getOrderDisputeById,
  onOpenModal,
  onStartConversation,
  onRespondToCancellation,
  onRespondToRevision,
  onRequestArbitration,
  onCancelDispute,
  onSetExtensionNewDate,
  onSetExtensionNewTime,
  onSetExtensionReason,
  onSetDeliveryMessage,
  onSetDeliveryFiles,
  onSetRevisionResponseAction,
  onSetRevisionAdditionalNotes,
  onSetDisputeResponseMessage,
  onSetBuyerRating,
  onSetBuyerReview,
  navigate,
}: ProfessionalOrderTimelineTabProps) {
  const handleRespondToCancellation = async (action: 'approve' | 'reject') => {
    try {
      await onRespondToCancellation(action);
    } catch (error: any) {
      toast.error(error.message || "Failed to respond to cancellation");
    }
  };

  const handleRequestArbitration = async () => {
    try {
      await onRequestArbitration();
    } catch (error: any) {
      toast.error(error.message || "Failed to request arbitration");
    }
  };

  const handleCancelDispute = async () => {
    try {
      await onCancelDispute();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel dispute");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-6">
      {/* Order Cancellation Initiated – Professional sent cancel request (pending) or already cancelled */}
      {(() => {
        const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
        const isProfessionalRequest = cr?.requestedBy?.toString() === userInfo?.id?.toString();
        const isPending = cr?.status === "pending";
        const isCancelled = currentOrder.status === "Cancelled";
        
        if (((currentOrder.status === "Cancellation Pending" || isPending) && isProfessionalRequest) ||
            (isCancelled && isProfessionalRequest)) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md mb-6">
              <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold mb-2">
                {isCancelled ? "Order Cancelled" : "Cancellation Request Initiated"}
              </h3>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                {isCancelled
                  ? `You have initiated the cancellation of this order. The order has been cancelled.${cr?.reason ? ` Reason: ${cr.reason}` : ''}`
                  : `You have initiated the cancellation of this order. ${(currentOrder as any).client ? `Please wait for ${(currentOrder as any).client} to respond.` : 'Please wait for the client to respond.'}${cr?.responseDeadline ? ' If they fail to respond before the deadline, the order will be automatically canceled.' : ''}`}
              </p>
              {!isCancelled && isPending && (
                <Button
                  onClick={() => onOpenModal('withdrawCancellation')}
                  variant="outline"
                  className="font-['Poppins',sans-serif] border-red-500 text-red-600 hover:bg-red-100 text-[13px] sm:text-[14px]"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Withdraw Request
                </Button>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Order Cancelled Message - Show when professional approved cancellation */}
      {(() => {
        const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
        const isCancelled = currentOrder.status === "Cancelled";
        const isApproved = cr?.status === "approved";
        const isRespondedByProfessional = cr?.respondedBy?.toString() === userInfo?.id?.toString();
        const isNotRequestedByProfessional = cr?.requestedBy?.toString() !== userInfo?.id?.toString();
        
        if (isCancelled && isApproved && isRespondedByProfessional && isNotRequestedByProfessional) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md mb-6">
              <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold mb-2">
                Your order has been cancelled!
              </h3>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Your order has been successfully cancelled, and the payment has been debited.
              </p>
            </div>
          );
        }
        return null;
      })()}

      {/* Completion Message for Completed Orders */}
      {currentOrder.status === "Completed" && (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold mb-2">
            Your order has been completed!
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
            Your order has been completed. Please assist other users on our platform by sharing your experience working with the seller in the feedback form.
          </p>
          <Button
            onClick={() => {
              onOpenModal('professionalReview');
              onSetBuyerRating(0);
              onSetBuyerReview("");
            }}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[14px] px-6"
          >
            View review
          </Button>
        </div>
      )}

      {/* Revision Resume Action */}
      {currentOrder.revisionRequest?.status === "pending" && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mt-4 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                Client requested a modification. Resume work to continue and update the delivery.
              </p>
              <Button
                onClick={async () => {
                  try {
                    await onRespondToRevision("accept");
                    toast.success("Revision accepted. Work resumed.");
                  } catch (error: any) {
                    toast.error(error.message || "Failed to resume work");
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-['Poppins',sans-serif]"
              >
                Resume Work
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Request - Pending (Professional can respond) - Show at top of page */}
      {(() => {
        const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
        if (cr && 
            cr.status === 'pending' && 
            cr.requestedBy && 
            cr.requestedBy.toString() !== userInfo?.id?.toString()) {
          return (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6 shadow-md">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                    Cancellation Request Received
                  </h4>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                    {(currentOrder as any).client || "The client"} has requested to cancel this order.
                  </p>
                  {cr.reason && (
                    <div className="mb-3 p-3 bg-white rounded">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                        Reason:
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        {cr.reason}
                      </p>
                    </div>
                  )}
                  {(cr.files || []).length > 0 && (
                    <div className="mb-3">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">📎 Attachments ({cr.files.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {cr.files.map((file: any, idx: number) => (
                          <Button
                            key={idx}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="font-['Poppins',sans-serif] text-[12px] text-left justify-start truncate max-w-full"
                            onClick={() => window.open(resolveFileUrl(file.url), "_blank")}
                          >
                            <Paperclip className="w-3 h-3 flex-shrink-0 mr-1.5" />
                            <span className="truncate">{file.fileName || "Attachment"}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {cr.responseDeadline && (
                    <p className="font-['Poppins',sans-serif] text-[12px] text-orange-700 mb-4">
                      ⚠️ Response deadline: {new Date(cr.responseDeadline).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      onClick={() => handleRespondToCancellation('approve')}
                      className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif]"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve Cancellation
                    </Button>
                    <Button
                      onClick={() => onOpenModal('withdrawCancellation')}
                      variant="outline"
                      className="font-['Poppins',sans-serif] border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Request
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Status Alert Box - Service Delivery Pending (before work starts) */}
      {currentOrder.deliveryStatus === "pending" &&
        !workElapsedTime.started &&
        currentOrder.status !== "Cancelled" &&
        currentOrder.status !== "Cancellation Pending" &&
        currentOrder.status !== "Completed" &&
        currentOrder.deliveryStatus !== "delivered" && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 shadow-md">
          <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
            Service Delivery Pending
          </h4>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
            Your client has completed payment and is awaiting your service delivery.
          </p>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
            Expected delivery: <span className="text-orange-600 font-medium">
              {currentOrder.booking?.date 
                ? `${formatDate(currentOrder.booking.date)} ${currentOrder.booking?.time || currentOrder.booking?.timeSlot || ''}`
                : currentOrder.scheduledDate 
                  ? formatDate(currentOrder.scheduledDate) 
                  : "TBD"}
            </span> Feel free to reach out if you have any questions using the chat button.
          </p>
          {currentOrder.deliveryStatus !== "delivered" && (
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => onOpenModal('delivery')}
                className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
              >
                <Truck className="w-4 h-4 mr-2" />
                Deliver Work
              </Button>
              <Button
                onClick={() => {
                  if (currentOrder.client && currentOrder.clientId) {
                    onStartConversation({
                      id: currentOrder.clientId,
                      name: currentOrder.client,
                      avatar: currentOrder.clientAvatar || "",
                    });
                  } else {
                    toast.error("Unable to start chat - client information not available");
                  }
                }}
                variant="outline"
                className="border-gray-300 text-[#2c353f] hover:bg-gray-50 font-['Poppins',sans-serif]"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button
                onClick={() => {
                  const currentDate = currentOrder.scheduledDate 
                    ? new Date(currentOrder.scheduledDate) 
                    : new Date();
                  currentDate.setDate(currentDate.getDate() + 7);
                  onSetExtensionNewDate(currentDate.toISOString().split('T')[0]);
                  onSetExtensionNewTime("09:00");
                  onSetExtensionReason("");
                  onOpenModal('extension');
                }}
                variant="outline"
                className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-orange-50 font-['Poppins',sans-serif]"
              >
                <Clock className="w-4 h-4 mr-2" />
                Extend Delivery Time
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Work Delivered Message - Show when status is delivered */}
      {currentOrder.status === "delivered" &&
       currentOrder.status !== "Completed" &&
       currentOrder.status !== "Cancelled" &&
       currentOrder.status !== "Cancellation Pending" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md mb-6">
          <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold mb-2">
            Your work has been delivered!
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            {currentOrder.deliveredDate ? (() => {
              const deliveryDate = new Date(currentOrder.deliveredDate);
              const deadlineDate = new Date(deliveryDate);
              deadlineDate.setDate(deadlineDate.getDate() + 1);
              deadlineDate.setHours(7, 0, 0, 0);
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              const day = deadlineDate.getDate();
              const dayName = dayNames[deadlineDate.getDay()];
              const month = monthNames[deadlineDate.getMonth()];
              const year = deadlineDate.getFullYear();
              const hours = deadlineDate.getHours().toString().padStart(2, "0");
              const minutes = deadlineDate.getMinutes().toString().padStart(2, "0");
              const daySuffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
              const deadlineStr = `${dayName} ${day}${daySuffix} ${month}, ${year} ${hours}:${minutes}`;
              return `You have delivered your work. The client has until ${deadlineStr}, to approve the delivery or request modifications. If no response is received, the order will be automatically completed.`;
            })() : "You have delivered your work. The client has 24 hours to approve the delivery or request modifications. If no response is received, the order will be automatically completed."}
          </p>
        </div>
      )}

      {/* Service In Progress - Only show if no pending cancellation request from client and status is not delivered */}
      {(currentOrder.deliveryStatus === "active" || workElapsedTime.started) &&
        currentOrder.status !== "Cancelled" &&
        currentOrder.status !== "Cancellation Pending" &&
        currentOrder.status !== "Completed" &&
        currentOrder.status !== "disputed" &&
        currentOrder.status !== "delivered" &&
        currentOrder.deliveryStatus !== "delivered" &&
        currentOrder.deliveryStatus !== "pending" &&
        !(currentOrder.cancellationRequest && 
          currentOrder.cancellationRequest.status === 'pending' && 
          currentOrder.cancellationRequest.requestedBy && 
          currentOrder.cancellationRequest.requestedBy.toString() !== userInfo?.id?.toString()) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-md">
          <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
            Service In Progress
          </h4>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
            You are currently working on this service. Expected delivery: <span className="text-[#2c353f]">{currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : "TBD"}</span>. Make sure to deliver the work on time or request an extension if needed.
          </p>
          
          {/* Extension Request Status */}
          {currentOrder.extensionRequest && 
           currentOrder.extensionRequest.status && 
           ['pending', 'approved', 'rejected'].includes(currentOrder.extensionRequest.status) && (
            <div className={`mb-4 p-4 rounded-lg border ${
              currentOrder.extensionRequest.status === 'pending' 
                ? 'bg-yellow-50 border-yellow-200' 
                : currentOrder.extensionRequest.status === 'approved'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {currentOrder.extensionRequest.status === 'pending' && (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
                {currentOrder.extensionRequest.status === 'approved' && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                {currentOrder.extensionRequest.status === 'rejected' && (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h5 className={`font-['Poppins',sans-serif] text-[14px] font-medium ${
                  currentOrder.extensionRequest.status === 'pending' 
                    ? 'text-yellow-700' 
                    : currentOrder.extensionRequest.status === 'approved'
                      ? 'text-green-700'
                      : 'text-red-700'
                }`}>
                  Extension Request {currentOrder.extensionRequest.status === 'pending' ? 'Pending' : currentOrder.extensionRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                </h5>
              </div>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                New delivery date & time:{" "}
                {currentOrder.extensionRequest.newDeliveryDate 
                  ? (() => {
                      const d = new Date(currentOrder.extensionRequest.newDeliveryDate);
                      const dateStr = d.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      const timeStr = d.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return `${dateStr} at ${timeStr}`;
                    })()
                  : 'N/A'}
              </p>
              {currentOrder.extensionRequest.reason && (
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                  Reason: {currentOrder.extensionRequest.reason}
                </p>
              )}
            </div>
          )}

          {currentOrder.deliveryStatus !== "delivered" && (
            <div className="flex gap-3 flex-wrap">
              {/* Deliver Work Button */}
              <Button
                onClick={() => {
                  onOpenModal('delivery');
                  onSetDeliveryMessage("");
                  onSetDeliveryFiles([]);
                }}
                className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif]"
              >
                <Truck className="w-4 h-4 mr-2" />
                Deliver Work
              </Button>
              
              {/* Request Extension Button */}
              {(!currentOrder.extensionRequest || currentOrder.extensionRequest.status !== 'pending') && (
                <Button
                  onClick={() => {
                    const currentDate = currentOrder.scheduledDate 
                      ? new Date(currentOrder.scheduledDate) 
                      : new Date();
                    currentDate.setDate(currentDate.getDate() + 7);
                    onSetExtensionNewDate(currentDate.toISOString().split('T')[0]);
                    onSetExtensionNewTime("09:00");
                    onSetExtensionReason("");
                    onOpenModal('extension');
                  }}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 font-['Poppins',sans-serif]"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Request Time Extension
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {timelineTimer}


      {/* Disputed Status Alert */}
      {currentOrder.status === "disputed" && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 sm:p-6 shadow-md">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-red-700 font-semibold mb-2 break-words">
                Your order is being disputed!
              </h4>
              <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b] mb-4 break-words">
                {currentOrder.client || "The client"} is disputing your order. They are currently waiting for your response. Please respond before the deadline. Click "View Dispute" to reply, add additional information, or make, reject, or accept an offer.
              </p>
              <Button
                onClick={() => navigate(`/dispute/${currentOrder.disputeId}`)}
                className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] w-full sm:w-auto"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                View Dispute
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Countdown - Show for active and pending orders */}
      {(currentOrder.deliveryStatus === "active" || currentOrder.deliveryStatus === "pending") && currentOrder.expectedDelivery && (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            Expected delivery: {formatDateTime(currentOrder.expectedDelivery)}
          </p>
        </div>
      )}

      {/* Timeline Events */}
      <div className="space-y-0">
        {timelineEvents.length === 0 && (
          <div className="text-center py-6 text-[#6b6b6b] text-[13px] font-['Poppins',sans-serif]">
            No timeline events yet.
          </div>
        )}
        {(() => {
          // Get all "Work Delivered" events sorted chronologically (oldest first)
          const deliveryEvents = timelineEvents
            .filter(e => e.label === "Work Delivered")
            .sort((a, b) => {
              const aTime = a.at ? new Date(a.at).getTime() : 0;
              const bTime = b.at ? new Date(b.at).getTime() : 0;
              return aTime - bTime;
            });
          
          // Create a map of delivery event timestamps to their number
          const deliveryNumberMap = new Map();
          deliveryEvents.forEach((event, idx) => {
            const key = event.at || 'no-date';
            deliveryNumberMap.set(key, idx + 1);
          });

          return timelineEvents.map((event, index) => {
            // Get delivery number if this is a "Work Delivered" event
            const deliveryNumber = event.label === "Work Delivered" 
              ? deliveryNumberMap.get(event.at || 'no-date')
              : null;

            return (
              <div key={`${event.id}-${event.at || "na"}-${index}`} className="flex gap-5 mb-8 relative">
                <div className="flex flex-col items-center pt-1 relative">
                  {/* Icon with enhanced modern styling */}
                  <div className="w-12 h-12 rounded-xl bg-[#3D78CB] flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-white transition-all duration-300 hover:scale-110 hover:shadow-xl relative z-10">
                    {event.icon}
                  </div>
                  {/* Bold blue dashed connecting line */}
                  <div className="relative mt-3 flex-1" style={{ minHeight: "40px" }}>
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0 border-l-[3px] border-dashed border-[#3D78CB]" />
                  </div>
                </div>
                <div className="flex-1 pb-2">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                    {deliveryNumber ? `#${deliveryNumber} ${event.label}` : event.label}
                  </p>
                  {event.at && (
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      {formatDateTime(event.at)}
                    </p>
                  )}
                  {event.description && (
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                      {event.description}
                    </p>
                  )}
                  {event.message && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2 shadow-sm">
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        {event.message}
                      </p>
                    </div>
                  )}
                  {event.files && event.files.length > 0 && (
                    <div className="mt-3">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                        📎 Attachments ({event.files.length})
                      </p>
                      <div className="space-y-3">
                        {event.files.map((file: any, index: number) => {
                          const fileUrl = file.url || "";
                          const fileName = file.fileName || "attachment";
                          const isImage =
                            file.fileType === "image" ||
                            /\.(png|jpe?g|gif|webp)$/i.test(fileUrl) ||
                            /\.(png|jpe?g|gif|webp)$/i.test(fileName);
                          const resolvedUrl = resolveFileUrl(fileUrl);
                          return (
                            <div key={index} className="relative group">
                              {isImage ? (
                                <img
                                  src={resolvedUrl}
                                  alt={fileName}
                                  className="block max-w-full max-h-48 min-h-24 w-auto h-auto object-contain rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(resolvedUrl, "_blank")}
                                />
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="font-['Poppins',sans-serif] text-[12px] text-left justify-start truncate max-w-full"
                                  onClick={() => window.open(resolvedUrl, "_blank")}
                                >
                                  <Paperclip className="w-3 h-3 flex-shrink-0 mr-1.5" />
                                  <span className="truncate">{fileName}</span>
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Order Created Timeline */}
      <div className="space-y-0">
        <div className="flex gap-4">
          <div className="flex flex-col items-center pt-1">
            <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
          </div>
          <div className="flex-1 pb-6">
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                  Order Created
                </p>
                <ChevronDown className="w-4 h-4 text-[#6b6b6b] transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                      Order Date
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      {formatDate(currentOrder.date)}
                    </p>
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                      Client
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      {currentOrder.client}
                    </p>
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                      Order Amount
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F]">
                      {currentOrder.amount}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Order Started */}
        {(currentOrder.deliveryStatus === "active" || currentOrder.deliveryStatus === "delivered") && (
          <div className="flex gap-4">
            <div className="flex flex-col items-center pt-1">
              <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
            </div>
            <div className="flex-1 pb-6">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                Order Started
              </p>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                You accepted this order
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
