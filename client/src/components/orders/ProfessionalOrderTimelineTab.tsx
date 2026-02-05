import React, { useState } from "react";
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
  Download,
  ExternalLink,
  X,
  ShoppingBag,
} from "lucide-react";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Order, TimelineEvent } from "./types";
import { buildProfessionalTimeline, formatDate, formatDateTime, formatDateOrdinal, resolveFileUrl } from "./index";
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
  onOpenModal: (modalName: 'delivery' | 'extension' | 'completion' | 'dispute' | 'disputeResponse' | 'revisionResponse' | 'withdrawCancellation' | 'acceptCancellation' | 'rejectCancellation' | 'professionalReview') => void;
  onStartConversation: (params: {
    id: string;
    name: string;
    avatar?: string;
    online?: boolean;
    jobId?: string;
    jobTitle?: string;
  }) => void;
  onRespondToCancellation: (action: 'approve' | 'reject') => void | Promise<void>;
  onRespondToRevision: (action: 'accept' | 'reject') => void | Promise<void>;
  onRequestArbitration: () => void | Promise<void>;
  onCancelDispute: () => void | Promise<void>;
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
  offerResponseDeadline?: Date | string | null;
  offerResponseCountdown?: { days: number; hours: number; minutes: number; seconds: number; total: number; expired: boolean };
  onWithdrawOffer?: () => void | Promise<void>;
  extensionCountdown?: { days: number; hours: number; minutes: number; seconds: number; total: number; expired: boolean };
  effectiveExpectedDelivery?: string; // When extension approved, use this for "Expected delivery" and countdown
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
  offerResponseDeadline,
  offerResponseCountdown,
  onWithdrawOffer,
  extensionCountdown,
  effectiveExpectedDelivery,
}: ProfessionalOrderTimelineTabProps) {
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    fileName: string;
    type: "image" | "pdf" | "other";
  } | null>(null);

  // Helper: show "Request Time Extension" when expected delivery timer has 1 day (24h) or less left; same source as expected delivery timer (effectiveExpectedDelivery when extension approved).
  const isWithin24HoursOfDelivery = () => {
    if (!currentOrder) return false;

    // Don't show button if delivery work has already been submitted
    if (currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0) {
      return false;
    }

    let deliveryDateTime: Date | null = null;
    if (effectiveExpectedDelivery) {
      deliveryDateTime = new Date(effectiveExpectedDelivery);
    } else if (currentOrder.booking?.date) {
      const dateStr = currentOrder.booking.date;
      const timeStr = currentOrder.booking.starttime || "00:00";
      deliveryDateTime = new Date(`${dateStr}T${timeStr}`);
    } else if (currentOrder.scheduledDate) {
      deliveryDateTime = new Date(currentOrder.scheduledDate);
    }

    if (!deliveryDateTime || isNaN(deliveryDateTime.getTime())) {
      return false;
    }

    const now = new Date();
    const timeDiff = deliveryDateTime.getTime() - now.getTime();
    const hoursUntilDelivery = timeDiff / (1000 * 60 * 60);

    // Show only when 1 day (24h) or less remaining, and not past delivery time
    return hoursUntilDelivery <= 24 && hoursUntilDelivery >= 0;
  };

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
      {/* STATUS MESSAGE CARDS - Display above timeline (No action buttons) */}

      {/* Custom Offer Awaiting Response – offer created status (professional) */}
      {currentOrder.status === "offer created" && (
        <>
          <div className="bg-[#EFF6FF] border border-[#3B82F6]/30 rounded-lg p-4 sm:p-6 shadow-md mb-4 md:mb-6">
            <h3 className="font-['Poppins',sans-serif] text-[18px] sm:text-[20px] text-[#2c353f] font-semibold mb-2">
              Custom offer awaiting client response
            </h3>
            <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b] break-words">
              Your custom offer has been sent and is now awaiting the client&apos;s response. Once the client reviews and accepts the offer, you can proceed to the next steps. If needed, feel free to reach out to the client for any further discussions regarding the offer.
            </p>
          </div>
          {/* Expected response time + Withdraw – same countdown style as other orders */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6 shadow-md mb-4 md:mb-6">
            <div className="flex items-start gap-2 sm:gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-['Poppins',sans-serif] text-[14px] sm:text-[16px] text-[#2c353f] mb-2 break-words">
                  Expected Response Time
                </h4>
                {offerResponseDeadline && offerResponseCountdown ? (
                  offerResponseCountdown.expired ? (
                    <p className="font-['Poppins',sans-serif] text-[13px] text-red-600 font-medium">
                      This offer has expired
                    </p>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 shadow-lg mt-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#FE8A0F]/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-[#FE8A0F]" />
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] uppercase tracking-wider">
                          Time remaining to respond
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-gray-100 rounded-xl p-4 text-center">
                          <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                            {String(offerResponseCountdown.days).padStart(2, '0')}
                          </div>
                          <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                            Days
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-xl p-4 text-center">
                          <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                            {String(offerResponseCountdown.hours).padStart(2, '0')}
                          </div>
                          <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                            Hours
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-xl p-4 text-center">
                          <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                            {String(offerResponseCountdown.minutes).padStart(2, '0')}
                          </div>
                          <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                            Minutes
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-xl p-4 text-center">
                          <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                            {String(offerResponseCountdown.seconds).padStart(2, '0')}
                          </div>
                          <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                            Seconds
                          </div>
                        </div>
                      </div>
                      {typeof offerResponseCountdown.total === 'number' && (
                        <div className="mt-4 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#FE8A0F] to-[#FFB347] rounded-full transition-all duration-1000"
                              style={{
                                width: `${Math.min(100, Math.max(0, 100 - (offerResponseCountdown.total / (24 * 60 * 60 * 1000) * 100)))}%`
                              }}
                            />
                          </div>
                          <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                            {offerResponseCountdown.days > 0 ? `${offerResponseCountdown.days}d remaining` : 'Today'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">—</p>
                )}
              </div>
            </div>
            {offerResponseDeadline && offerResponseCountdown && !offerResponseCountdown.expired && onWithdrawOffer && (
              <div className="mt-4 pt-4 border-t border-amber-200">
                <Button
                  onClick={() => onWithdrawOffer()}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif] text-[13px] sm:text-[14px]"
                >
                  Withdraw Offer
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Order Cancellation Initiated – Professional sent cancel request (pending) or already cancelled */}
      {((currentOrder as any).metadata?.customOfferStatus === "rejected" &&
        (currentOrder as any).metadata?.customOfferRejectedBy === "client") && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md mb-6">
          <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold mb-2">
            Your offer was rejected!
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            {((currentOrder as any).metadata?.customOfferRejectedAt)
              ? `Your custom offer was rejected on ${formatDateTime((currentOrder as any).metadata.customOfferRejectedAt)}.`
              : "Your custom offer was rejected by the client."}
          </p>
        </div>
      )}
      {/* Order Cancellation Initiated – Professional sent cancel request (pending) or already cancelled */}
      {(() => {
        const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
        const isProfessionalRequest = cr?.requestedBy?.toString() === userInfo?.id?.toString();
        const isPending = cr?.status === "pending";
        const isWithdrawn = cr?.status === "withdrawn";
        const isCancelled = currentOrder.status === "Cancelled";
        const showDeliveredMessage = isWithdrawn || isCancelled;
        
        if (((currentOrder.status === "Cancellation Pending" || isPending) && isProfessionalRequest) ||
            (showDeliveredMessage && isProfessionalRequest)) {
          if (showDeliveredMessage) {
            const cancelledAt = cr?.respondedAt || cr?.updatedAt || currentOrder.updatedAt;
            const cancelledAtStr = cancelledAt ? (() => {
              const date = new Date(cancelledAt);
              if (isNaN(date.getTime())) return "";
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              const day = date.getDate();
              const dayName = dayNames[date.getDay()];
              const month = monthNames[date.getMonth()];
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              const daySuffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
              return `${dayName} ${day}${daySuffix} ${month}, ${year} ${hours}:${minutes}`;
            })() : "";
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md mb-6">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] whitespace-pre-line">
                  {`You have cancelled the order payment dispute${cancelledAtStr ? ` on ${cancelledAtStr}` : ""}\nOrder payment dispute has been cancelled and withdrawn by you.`}
                </p>
              </div>
            );
          }
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md mb-6">
              <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold mb-2">
                {isCancelled ? "Order Cancelled" : "Cancellation Request Initiated"}
              </h3>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                {isCancelled
                  ? `You have initiated the cancellation of this order. The order has been cancelled.${cr?.reason ? ` Reason: ${cr.reason}` : ''}`
                  : `You have initiated the cancellation of this order. ${(currentOrder as any).client ? `Please wait for ${(currentOrder as any).client} to respond.` : 'Please wait for the client to respond.'} If they fail to respond before the deadline, the order will be automatically canceled in your favor.`}
              </p>
            </div>
          );
        }
        return null;
      })()}

      {/* Order Cancellation Initiated by Client – Show when client sent cancel request */}
      {(() => {
        const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
        const isClientRequest = cr?.requestedBy && cr.requestedBy.toString() !== userInfo?.id?.toString();
        const isPending = cr?.status === "pending";
        const isWithdrawn = cr?.status === "withdrawn";
        const isCancelled = currentOrder.status === "Cancelled";
        const showDeliveredMessage = isWithdrawn || (isCancelled && cr?.status === "approved");
        
        if (isClientRequest && showDeliveredMessage) {
          const cancelledAt = cr?.respondedAt || cr?.updatedAt || (currentOrder as any).updatedAt;
          const cancelledAtStr = cancelledAt ? (() => {
            const date = new Date(cancelledAt);
            if (isNaN(date.getTime())) return "";
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const day = date.getDate();
            const dayName = dayNames[date.getDay()];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const daySuffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
            return `${dayName} ${day}${daySuffix} ${month}, ${year} ${hours}:${minutes}`;
          })() : "";
          const clientName = (currentOrder as any).client || "Client";
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md mb-6">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] whitespace-pre-line">
                {`${clientName} has cancelled the order payment dispute${cancelledAtStr ? ` on ${cancelledAtStr}` : ""}\n${clientName} has cancelled the order payment dispute.`}
              </p>
            </div>
          );
        }

        if (isPending && isClientRequest) {
          return (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 shadow-md mb-6">
              <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold mb-2">
                Order Cancellation Initiated
              </h3>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                {(currentOrder as any).client || "The client"} has initiated the cancellation of the order. Please respond to the request, as failure to do so before the deadline will result in the automatic cancellation of the order.
              </p>
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
                ? `${formatDate(currentOrder.booking.date)} ${currentOrder.booking?.starttime || currentOrder.booking?.timeSlot || ''}`
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
              {(!(currentOrder as any).extensionRequest || (currentOrder as any).extensionRequest?.status !== "pending") && isWithin24HoursOfDelivery() && (
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
                  Request Time Extension
                </Button>
              )}
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

      {/* Service Delivery Pending - Show above countdown when order is In Progress and not delivered */}
      {currentOrder.status === "In Progress" &&
        (currentOrder.deliveryStatus === "active" || currentOrder.deliveryStatus === "pending" || workElapsedTime.started) &&
        currentOrder.deliveryStatus !== "delivered" &&
        currentOrder.deliveryStatus !== "completed" &&
        !((currentOrder as any).cancellationRequest?.status === "pending" &&
          (currentOrder as any).cancellationRequest?.requestedBy &&
          (currentOrder as any).cancellationRequest?.requestedBy.toString() !== userInfo?.id?.toString()) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-md">
          <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
            Service Delivery Pending
          </h4>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
            {(() => {
              const deliverySource = currentOrder.scheduledDate || currentOrder.expectedDelivery || (currentOrder as any).booking?.date;
              const startTime = (currentOrder as any).booking?.starttime || (currentOrder as any).booking?.timeSlot;
              const endTime = (currentOrder as any).booking?.endtime;
              let expectedStr = "TBD";
              if (deliverySource) {
                const d = new Date(deliverySource);
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const day = d.getDate();
                const daySuffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
                expectedStr = `${dayNames[d.getDay()]} ${day}${daySuffix} ${monthNames[d.getMonth()]}, ${d.getFullYear()}`;
                const hasTimeInDate = typeof deliverySource === "string" && /T\d{2}:\d{2}/.test(deliverySource);
                if (hasTimeInDate) {
                  const hours = d.getHours().toString().padStart(2, "0");
                  const minutes = d.getMinutes().toString().padStart(2, "0");
                  expectedStr += ` ${hours}:${minutes}`;
                  if (endTime) expectedStr += `-${endTime}`;
                } else if (startTime) {
                  expectedStr += ` ${startTime}`;
                  if (endTime) expectedStr += `-${endTime}`;
                  else expectedStr += "-12:00";
                } else {
                  expectedStr += " 10:00-12:00";
                }
              }
              return (
                <>
                  Your client has completed payment and is awaiting your service delivery. Expected delivery: <span className="text-[#2c353f]">{expectedStr}</span> Feel free to reach out if you have any questions using the chat button.
                </>
              );
            })()}
          </p>
          {(currentOrder as any).extensionRequest?.status === "pending" && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-blue-700">
                  Your order delivery extension request is pending!
                </h5>
              </div>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                Your request to extend the order delivery time has been sent to the client. Please wait for their response.
              </p>
            </div>
          )}
          {(currentOrder as any).extensionRequest?.status === "approved" && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-green-700">
                  Extension Request Approved
                </h5>
              </div>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                New delivery date & time:{" "}
                {(currentOrder as any).extensionRequest?.newDeliveryDate
                  ? (() => {
                      const d = new Date((currentOrder as any).extensionRequest.newDeliveryDate);
                      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " at " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                    })()
                  : "N/A"}
              </p>
            </div>
          )}
          {currentOrder.deliveryStatus !== "delivered" && (
            <div className="flex gap-3 flex-wrap">
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
            </div>
          )}
        </div>
      )}

      {/* Revision Status Alert */}
      {currentOrder.status === "Revision" && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 shadow-md">
          <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
            Your order is now under revision.
          </h4>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
            {currentOrder.client || "The client"} has requested changes or updates to the order you delivered. Please redeliver the order once the revisions are complete.
          </p>
          <Button
            onClick={() => {
              onOpenModal('delivery');
              onSetDeliveryMessage("");
              onSetDeliveryFiles([]);
            }}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
          >
            <Truck className="w-4 h-4 mr-2" />
            Re-Deliver Work
          </Button>
        </div>
      )}

      {timelineTimer}

      {/* Order Completed Status Alert */}
      {currentOrder.status === "Completed" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-md">
          <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
            {((currentOrder as any).disputeInfo?.autoClosed &&
              ((currentOrder as any).disputeInfo?.winnerId?.toString?.() === userInfo?.id?.toString() ||
               (currentOrder as any).disputeInfo?.winnerId?.toString() === userInfo?.id?.toString()))
              ? "Dispute automatically closed & Order completed!"
              : ((currentOrder as any).disputeInfo?.autoClosed
                ? "Dispute automatically closed & Order completed!"
                : "Order Completed Successfully!")}
          </h4>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4 whitespace-pre-line">
            {((currentOrder as any).disputeInfo?.autoClosed &&
              ((currentOrder as any).disputeInfo?.winnerId?.toString?.() === userInfo?.id?.toString() ||
               (currentOrder as any).disputeInfo?.winnerId?.toString() === userInfo?.id?.toString()))
              ? `The dispute was automatically decided and closed, with the order marked as completed due to no response from ${(currentOrder as any).client || "the client"}.`
              : ((currentOrder as any).disputeInfo?.autoClosed
                ? "The dispute was automatically decided and closed, with the order marked as completed due to no response from you."
                : `This order has been completed successfully. ${currentOrder.rating ? `The client has left a ${currentOrder.rating}-star review.` : 'The client may leave a review for this order.'}`)}
          </p>
          <Button
            onClick={() => onOpenModal('professionalReview')}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            View Review
          </Button>
        </div>
      )}

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
                {(() => {
                  const isClaimant = (currentOrder as any).disputeInfo?.claimantId?.toString() === userInfo?.id?.toString();
                  const hasReply = Boolean((currentOrder as any).disputeInfo?.respondedAt);
                  const disputeInfo = (currentOrder as any).disputeInfo;
                  const arbitrationPayments = disputeInfo?.arbitrationPayments || [];
                  const hasPaidArbitration = arbitrationPayments.some(
                    (p: any) => p?.userId?.toString?.() === userInfo?.id?.toString()
                  );
                  const onlyOnePaid = arbitrationPayments.length === 1;
                  const hasOtherPaid = arbitrationPayments.some(
                    (p: any) => p?.userId?.toString?.() !== userInfo?.id?.toString()
                  );
                  const arbitrationDeadline = disputeInfo?.arbitrationFeeDeadline
                    ? new Date(disputeInfo.arbitrationFeeDeadline).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "the deadline";
                  if (hasPaidArbitration && onlyOnePaid) {
                    return `The arbitration fees is paid.\nYou have paid your arbitration fees to ask our arbitration team to step in and decide the case. ${currentOrder.client || "The client"} has been notified and expected to complete payment before ${arbitrationDeadline}.`;
                  }
                  if (!hasPaidArbitration && onlyOnePaid && hasOtherPaid) {
                    const clientName = currentOrder.client || "The client";
                    return `The arbitration fees paid by ${clientName}.\n${clientName} has paid their arbitration fees to request our dispute team to review and decide the case. Please ensure you pay yours before the deadline on ${arbitrationDeadline}, as failure to do so will result in a decision in favor of ${clientName}.`;
                  }
                  if (isClaimant && hasReply) {
                    return `${currentOrder.client || "The client"} has responded to your dispute, so it will no longer close automatically. Both parties have 5 days to negotiate a resolution. If a settlement is not reached within this period, you can ask for arbitration to decide.`;
                  }
                  if (!isClaimant && hasReply) {
                    return "You have responded to the dispute, so it will no longer close automatically. Both parties have 5 days to negotiate a resolution. If a settlement is not reached within this period, you can ask for arbitration to  step in.";
                  }
                  return isClaimant
                    ? `You are disputing the order. ${currentOrder.client || "The client"} has been notified and is currently reviewing the issue. Please wait for their response. Click "View Dispute" to reply, add additional information, make an offer, or even cancel the dispute.`
                    : `${currentOrder.client || "The client"} is disputing the work you have delivered. They are currently waiting for your response. Please respond before the deadline. Click "View Dispute" to reply, add additional information, make, reject, or accept an offer.`;
                })()}
              </p>
              {((currentOrder as any).disputeInfo?.claimantId?.toString() !== userInfo?.id?.toString()) && (
                <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b]">
                    You have until {currentOrder.disputeInfo?.responseDeadline ? formatDateOrdinal(currentOrder.disputeInfo.responseDeadline) : "the deadline"} to respond. Not responding within the time frame will result in closing the case and deciding in {(currentOrder.client || "The client") + "´s"} favour. Any decision reached is final and irrevocable. Once a case has been closed, it can't be reopened.
                  </p>
                </div>
              )}
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

          return timelineEvents
            .filter(e => e.label !== "Order Placed")
            .map((event, index) => {
            // Get delivery number if this is a "Work Delivered" event
            const deliveryNumber = event.label === "Work Delivered" 
              ? deliveryNumberMap.get(event.at || 'no-date')
              : null;

            return (
              <div key={`${event.id}-${event.at || "na"}-${index}`} className="flex gap-4 mb-0 relative group">
                <div className="flex flex-col items-center pt-1 relative">
                  {/* Icon with consistent timeline styling */}
                  <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center flex-shrink-0 relative z-10 text-blue-600">
                    {event.icon}
                  </div>
                  {/* Connecting line - gray consistent style */}
                  <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                </div>
                <div className="flex-1 pb-6">
                  {/* Card Container for Timeline Content */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                    {/* Title and Date */}
                    <div className="mb-3">
                      <p className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-semibold mb-1">
                        {deliveryNumber ? `#${deliveryNumber} ${event.label}` : event.label}
                      </p>
                      {event.at && (
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                          {formatDateTime(event.at)}
                        </p>
                      )}
                    </div>
                    
                    {/* Description */}
                    {event.description && (
                      <div className="mb-3 bg-gray-50 border-l-4 border-blue-500 rounded p-3">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] leading-relaxed whitespace-pre-line">
                          {event.description}
                        </p>
                      </div>
                    )}

                    {/* Extension Requested: countdown to new delivery date */}
                    {event.label === "Extension Requested" && event.id === "extension-requested" && (currentOrder as any).extensionRequest?.status === "pending" && extensionCountdown && (
                      <div className="mb-3 bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          <p className="font-['Poppins',sans-serif] text-[12px] text-indigo-700 uppercase tracking-wider">
                            Time until new delivery deadline
                          </p>
                        </div>
                        
                        {extensionCountdown.expired ? (
                          <p className="font-['Poppins',sans-serif] text-[13px] text-red-600 font-medium">
                            New delivery deadline has passed
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-white rounded-xl p-3 text-center border border-indigo-100">
                              <div className="font-['Poppins',sans-serif] text-[22px] md:text-[26px] font-medium text-[#2c353f] leading-none">
                                {String(extensionCountdown.days).padStart(2, '0')}
                              </div>
                              <div className="font-['Poppins',sans-serif] text-[10px] text-[#6b6b6b] uppercase tracking-wider mt-1">Days</div>
                            </div>
                            <div className="bg-white rounded-xl p-3 text-center border border-indigo-100">
                              <div className="font-['Poppins',sans-serif] text-[22px] md:text-[26px] font-medium text-[#2c353f] leading-none">
                                {String(extensionCountdown.hours).padStart(2, '0')}
                              </div>
                              <div className="font-['Poppins',sans-serif] text-[10px] text-[#6b6b6b] uppercase tracking-wider mt-1">Hours</div>
                            </div>
                            <div className="bg-white rounded-xl p-3 text-center border border-indigo-100">
                              <div className="font-['Poppins',sans-serif] text-[22px] md:text-[26px] font-medium text-[#2c353f] leading-none">
                                {String(extensionCountdown.minutes).padStart(2, '0')}
                              </div>
                              <div className="font-['Poppins',sans-serif] text-[10px] text-[#6b6b6b] uppercase tracking-wider mt-1">Min</div>
                            </div>
                            <div className="bg-white rounded-xl p-3 text-center border border-indigo-100">
                              <div className="font-['Poppins',sans-serif] text-[22px] md:text-[26px] font-medium text-[#2c353f] leading-none">
                                {String(extensionCountdown.seconds).padStart(2, '0')}
                              </div>
                              <div className="font-['Poppins',sans-serif] text-[10px] text-[#6b6b6b] uppercase tracking-wider mt-1">Sec</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Message/Reason - Highlighted */}
                    {event.message && (
                      <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-blue-700 font-medium mb-1">
                          Message:
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] leading-relaxed">
                          {event.message}
                        </p>
                      </div>
                    )}
                  
                    {/* Attachments - for Cancellation Requested show after reason, before warning (order: reason → attachments → warning → withdraw) */}
                    {event.label === "Cancellation Requested" && event.id === "cancellation-requested" && event.files && event.files.length > 0 && (
                      <div className="mb-3">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="font-['Poppins',sans-serif] text-[12px] text-gray-700 font-medium mb-3 flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            Attachments ({event.files.length})
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
                                      className="block max-w-full max-h-48 min-h-24 w-auto h-auto object-contain rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                      onClick={() => setPreviewAttachment({
                                        url: resolvedUrl,
                                        fileName: fileName,
                                        type: "image"
                                      })}
                                    />
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="font-['Poppins',sans-serif] text-[12px] text-left justify-start truncate max-w-full hover:bg-blue-50"
                                      onClick={() => {
                                        const isPdf = /\.pdf$/i.test(fileUrl) || /\.pdf$/i.test(fileName);
                                        setPreviewAttachment({
                                          url: resolvedUrl,
                                          fileName: fileName,
                                          type: isPdf ? "pdf" : "other"
                                        });
                                      }}
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
                      </div>
                    )}

                    {/* Warning message card for Cancellation Requested (professional-initiated) – after reason & attachments */}
                    {event.label === "Cancellation Requested" && 
                     event.id === "cancellation-requested" &&
                     (() => {
                       const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
                       return cr?.requestedBy?.toString() === userInfo?.id?.toString() && cr?.status === "pending";
                     })() && (
                      <div className="mb-3">
                        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-sm">
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] leading-relaxed break-words">
                            {(currentOrder as any).client || "The client"} has until{" "}
                            <span className="font-semibold text-orange-700">
                              {(() => {
                                const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
                                if (cr?.responseDeadline) {
                                  const deadline = new Date(cr.responseDeadline);
                                  const day = deadline.getDate();
                                  const daySuffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
                                  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                  const month = monthNames[deadline.getMonth()];
                                  const year = deadline.getFullYear();
                                  return `${day}${daySuffix} ${month} ${year}`;
                                }
                                return "the deadline";
                              })()}
                            </span>{" "}
                            to respond to the cancellation request. If no response is received, the order will be automatically canceled, and the amount will be credited to the client's Wallet.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Withdraw button for Cancellation Requested event (professional-initiated) – at bottom */}
                    {event.label === "Cancellation Requested" && 
                     event.id === "cancellation-requested" &&
                     (() => {
                       const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
                       return cr?.requestedBy?.toString() === userInfo?.id?.toString() && cr?.status === "pending";
                     })() && (
                      <div className="mt-3">
                        <Button
                          onClick={() => onOpenModal('withdrawCancellation')}
                          variant="outline"
                          className="font-['Poppins',sans-serif] border-red-500 text-red-600 hover:bg-red-100 text-[13px] shadow-sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Withdraw Request
                        </Button>
                      </div>
                    )}
                      
                    {/* Attachments Section (for non-Cancellation Requested events) */}
                    {event.files && event.files.length > 0 && event.id !== "cancellation-requested" && (
                      <div className="mt-3">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                          <p className="font-['Poppins',sans-serif] text-[12px] text-gray-700 font-medium mb-3 flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            Attachments ({event.files.length})
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
                                      className="block max-w-full max-h-48 min-h-24 w-auto h-auto object-contain rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                      onClick={() => setPreviewAttachment({
                                        url: resolvedUrl,
                                        fileName: fileName,
                                        type: "image"
                                      })}
                                    />
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="font-['Poppins',sans-serif] text-[12px] text-left justify-start truncate max-w-full hover:bg-blue-50"
                                      onClick={() => {
                                        const isPdf = /\.pdf$/i.test(fileUrl) || /\.pdf$/i.test(fileName);
                                        setPreviewAttachment({
                                          url: resolvedUrl,
                                          fileName: fileName,
                                          type: isPdf ? "pdf" : "other"
                                        });
                                      }}
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
                      </div>
                    )}

                    {/* Action Message Card for client-initiated cancellation - Display below "Cancellation Requested" event */}
                    {event.label === "Cancellation Requested" && 
                     event.id === "cancellation-requested" &&
                     (() => {
                       const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
                       return cr?.requestedBy && cr.requestedBy.toString() !== userInfo?.id?.toString() && cr?.status === "pending";
                     })() && (
                      <div className="mt-3">
                        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              {(() => {
                                const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
                                return (
                                  <>
                                    {/* Deadline Information */}
                                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] leading-relaxed">
                                        You have until{" "}
                                        <span className="font-semibold text-orange-700">
                                          {cr?.responseDeadline ? (
                                            <>
                                              {(() => {
                                                const deadline = new Date(cr.responseDeadline);
                                                const day = deadline.getDate();
                                                const daySuffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
                                                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                                const month = monthNames[deadline.getMonth()];
                                                const year = deadline.getFullYear();
                                                return `${day}${daySuffix} ${month} ${year}`;
                                              })()}
                                            </>
                                          ) : (
                                            "the deadline"
                                          )}
                                        </span>{" "}
                                        to respond to the cancellation request. If no response is received, the order will be automatically canceled, and the amount will be credited to the client's Wallet.
                                      </p>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-3 flex-wrap">
                                      <Button
                                        onClick={() => onOpenModal('acceptCancellation')}
                                        className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif] text-[13px] shadow-sm"
                                      >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Accept Request
                                      </Button>
                                      <Button
                                        onClick={() => onOpenModal('rejectCancellation')}
                                        variant="outline"
                                        className="font-['Poppins',sans-serif] border-red-500 text-red-600 hover:bg-red-50 text-[13px] shadow-sm"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Decline
                                      </Button>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Order Placed / Order Created / Order Started - order from top: Placed, Created, Started (bottom) */}
      <div className="space-y-0">
        {/* Created Milestones - table above Order Placed (custom offer milestone payment) */}
        {(currentOrder as any).metadata?.paymentType === "milestone" &&
          Array.isArray((currentOrder as any).metadata?.milestones) &&
          (currentOrder as any).metadata.milestones.length > 0 && (
            <div className="mb-6">
              <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-semibold mb-3">
                Created Milestones
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full font-['Poppins',sans-serif] text-[13px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Milestone Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Delivery Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Hours</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((currentOrder as any).metadata.milestones as Array<{
                      name?: string;
                      description?: string;
                      amount?: number;
                      price?: number;
                      dueInDays?: number;
                      deliveryInDays?: number;
                      hours?: number;
                      noOf?: number;
                      chargePer?: string;
                    }>).map((m, idx) => {
                      const orderDate = currentOrder.date ? new Date(currentOrder.date) : new Date();
                      const deliveryDate = new Date(orderDate);
                      const days = m.deliveryInDays ?? m.dueInDays ?? 0;
                      deliveryDate.setDate(deliveryDate.getDate() + (typeof days === "number" ? days : 0));
                      const unitPrice = m.price ?? m.amount ?? 0;
                      const noOfVal = m.noOf ?? m.hours ?? 1;
                      const amt = unitPrice * (typeof noOfVal === "number" ? noOfVal : 1);
                      return (
                        <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                          <td className="py-3 px-4 text-[#2c353f]">{m.name || `Milestone ${idx + 1}`}</td>
                          <td className="py-3 px-4 text-[#2c353f]">{formatDateOrdinal(deliveryDate.toISOString())}</td>
                          <td className="py-3 px-4 text-[#2c353f]">{typeof noOfVal === "number" ? noOfVal : "—"}</td>
                          <td className="py-3 px-4 text-[#6b6b6b] max-w-[200px] truncate">{m.description || (m.chargePer ? `${m.chargePer} x${noOfVal}` : "—")}</td>
                          <td className="py-3 px-4 text-[#FE8A0F] font-medium">£{typeof amt === "number" ? amt.toFixed(2) : "0.00"}</td>
                          <td className="py-3 px-4 text-[#2c353f]">Offer created</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Order Placed - top */}
        {currentOrder.date && (
          <div className="flex gap-4">
            <div className="flex flex-col items-center pt-1">
              <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
            </div>
            <div className="flex-1 pb-6">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                Order Placed
              </p>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                {(currentOrder as any).client || "Client"} placed this order.
              </p>
              {currentOrder.date && (
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
                  {formatDate(currentOrder.date)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Order Created - middle */}
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

      </div>

      {/* Attachment Preview Modal - Inline React Modal (not Radix UI) */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center px-4"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewAttachment(null);
            }
          }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000000 }}
          />
          <div
            className="relative bg-white rounded-lg shadow-xl w-full max-w-[1400px] max-h-[95vh] overflow-hidden"
            style={{ position: "relative", zIndex: 1000001 }}
          >
            <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between gap-4">
              <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] truncate">
                {previewAttachment.fileName}
              </h3>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewAttachment.url;
                    link.download = previewAttachment.fileName;
                    link.click();
                  }}
                  className="font-['Poppins',sans-serif] text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewAttachment.url, "_blank")}
                  className="font-['Poppins',sans-serif] text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(95vh-120px)] flex items-center justify-center bg-gray-50">
              {previewAttachment.type === "image" ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : previewAttachment.type === "pdf" ? (
                <iframe
                  src={previewAttachment.url}
                  className="w-full h-[calc(95vh-180px)] min-h-[600px] border-0 rounded-lg"
                  title={previewAttachment.fileName}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-4">
                    Preview not available for this file type
                  </p>
                  <Button
                    onClick={() => window.open(previewAttachment.url, "_blank")}
                    className="font-['Poppins',sans-serif] bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Document
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
