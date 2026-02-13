import { Clock, Truck, Check, PlayCircle, Info, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Order, TimelineEvent } from "./types";
import { buildProfessionalTimeline } from "./buildProfessionalTimeline";
import { formatDateTime, resolveFileUrl } from "./utils";
import { toast } from "sonner";

interface ProfessionalOrderDeliveryTabProps {
  order: Order;
  onOpenReviewModal: () => void;
  onStartConversation: (params: {
    id: string;
    name: string;
    avatar?: string;
  }) => void;
}

export default function ProfessionalOrderDeliveryTab({
  order,
  onOpenReviewModal,
  onStartConversation,
}: ProfessionalOrderDeliveryTabProps) {
  const timeline = buildProfessionalTimeline(order);
  const deliveryEvents = timeline.filter(event => event.label === "Work Delivered");
  
  // Sort chronologically (oldest first for proper #1, #2, #3 numbering)
  const sortedDeliveries = [...deliveryEvents].sort((a, b) => {
    const aTime = a.at ? new Date(a.at).getTime() : 0;
    const bTime = b.at ? new Date(b.at).getTime() : 0;
    return aTime - bTime;
  });

  if (sortedDeliveries.length > 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="space-y-6">
          {sortedDeliveries.map((delivery, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center pt-1">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                {index < sortedDeliveries.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "40px" }} />
                )}
              </div>
              <div className="flex-1 pb-6">
                <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                  #{index + 1} Work Delivered
                </h4>
                <p className="font-['Poppins',sans-serif] text-[13px] mb-3">
                  <span className="text-purple-600">You</span>{" "}
                  <span className="text-[#6b6b6b]">delivered the work</span>{" "}
                  <span className="text-[#6b6b6b] italic">
                    {delivery.at ? formatDateTime(delivery.at) : formatDateTime(new Date().toISOString())}
                  </span>
                </p>

                {/* Delivery Content Box - Show delivery message and files */}
                {(delivery.message || (delivery.files && delivery.files.length > 0)) && (
                  <div className="border border-purple-200 rounded-lg p-4 mb-4 bg-purple-50/30">
                    {delivery.message && (
                      <div className="mb-3">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                          Delivery message:
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {delivery.message}
                        </p>
                      </div>
                    )}
                    
                    {/* Delivery Attachments */}
                    {delivery.files && delivery.files.length > 0 && (
                      <div>
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                          📎 Attachments ({delivery.files.length})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {delivery.files.map((file: any, fileIndex: number) => (
                            <div key={fileIndex} className="relative group">
                              {file.fileType === 'image' ? (
                                <img
                                  src={resolveFileUrl(file.url)}
                                  alt={file.fileName}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                                />
                              ) : (
                                <div
                                  className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                                  onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                                >
                                  <PlayCircle className="w-8 h-8 text-gray-600" />
                                  <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded truncate">
                                    {file.fileName}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status message for latest delivery */}
                {index === sortedDeliveries.length - 1 && order.deliveryStatus === "delivered" && (
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mt-4">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="font-['Poppins',sans-serif] text-[14px] text-blue-900">
                        Waiting for client approval
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No deliveries yet - show status message
  if (order.deliveryStatus === "active" || order.status === "In Progress") {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
            In Progress
          </p>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Complete your work and deliver to the client
          </p>
        </div>
      </div>
    );
  }

  // Order is pending or waiting to start
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
          Pending Start
        </p>
        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
          You can start working on this order
        </p>
      </div>
    </div>
  );
}

// Completion section for delivery tab
export function ProfessionalOrderDeliveryCompletionSection({
  order,
  onOpenReviewModal,
  onStartConversation,
  onViewDispute,
}: {
  order: Order;
  onOpenReviewModal: () => void;
  onStartConversation: (params: { id: string; name: string; avatar?: string }) => void;
  onViewDispute?: () => void;
}) {
  if (order.deliveryStatus !== "completed") return null;

  const showViewDispute = (order as any).disputeInfo?.status === 'closed' && (order as any).disputeId;

  return (
    <div className="text-center py-8 mt-6 pt-6 border-t border-gray-200">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
        Order Completed
      </p>
      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
        This order has been successfully completed
      </p>
      <div className="flex gap-3 justify-center">
        {showViewDispute && onViewDispute ? (
          <Button
            onClick={onViewDispute}
            className="bg-[#FE8A0F] hover:bg-[#e07a0d] text-white font-['Poppins',sans-serif] text-[13px]"
          >
            View Dispute
          </Button>
        ) : (
          <Button
            onClick={onOpenReviewModal}
            className="bg-[#FE8A0F] hover:bg-[#e07a0d] text-white font-['Poppins',sans-serif] text-[13px]"
          >
            View Review
          </Button>
        )}
        <Button
          onClick={() => {
            if (order.client && order.clientId) {
              onStartConversation({
                id: order.clientId,
                name: order.client,
                avatar: order.clientAvatar || "",
              });
            } else {
              toast.error("Unable to start chat - client information not available");
            }
          }}
          variant="outline"
          className="font-['Poppins',sans-serif] text-[13px] border-gray-300"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Chat
        </Button>
      </div>
    </div>
  );
}

// Service Address Section Component
export function ProfessionalOrderServiceAddressSection({ order }: { order: Order }) {
  if (!order.address) return null;

  return (
    <div className="bg-white rounded-xl p-6 mt-4 md:mt-6 shadow-md">
      <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-3">
        Service Address
      </h3>
      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
        {order.address.addressLine1}
        {order.address.addressLine2 && `, ${order.address.addressLine2}`}
        <br />
        {order.address.city}, {order.address.postcode}
      </p>
    </div>
  );
}
