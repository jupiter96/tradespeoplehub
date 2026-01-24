import { Calendar, Clock, MessageCircle, Upload, AlertTriangle, MoreVertical, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { VideoThumbnail } from "./VideoThumbnail";
import { Order, ServiceThumbnail } from "./types";
import { formatDate, resolveFileUrl, resolveAvatarUrl, isVideoFile } from "./utils";
import serviceVector from "../../assets/service_vector.jpg";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface ProfessionalOrderDetailSidebarProps {
  order: Order;
  serviceThumbnail?: ServiceThumbnail;
  onStartConversation: (params: {
    id: string;
    name: string;
    avatar?: string;
    online?: boolean;
    jobId?: string;
    jobTitle?: string;
  }) => void;
  onOpenDeliveryModal: () => void;
  onOpenDisputeModal: () => void;
  onOpenCancellationRequest?: () => void;
}

export default function ProfessionalOrderDetailSidebar({
  order,
  serviceThumbnail,
  onStartConversation,
  onOpenDeliveryModal,
  onOpenDisputeModal,
  onOpenCancellationRequest,
}: ProfessionalOrderDetailSidebarProps) {
  const handleStartChat = () => {
    if (order.client && order.clientId) {
      onStartConversation({
        id: order.clientId,
        name: order.client,
        avatar: order.clientAvatar,
        online: true,
        jobId: order.id,
        jobTitle: order.service,
      });
    } else {
      toast.error("Unable to start chat - client information not available");
    }
  };

  // Determine service image/thumbnail
  const getServiceThumbnail = () => {
    // First try to use fetched service thumbnail
    if (serviceThumbnail) {
      if (serviceThumbnail.type === 'video') {
        return (
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
            <VideoThumbnail
              videoUrl={resolveFileUrl(serviceThumbnail.url)}
              thumbnail={serviceThumbnail.thumbnail ? resolveFileUrl(serviceThumbnail.thumbnail) : undefined}
              className="w-full h-full"
            />
          </div>
        );
      } else {
        return (
          <img 
            src={resolveFileUrl(serviceThumbnail.url)}
            alt="Service thumbnail"
            className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = serviceVector;
            }}
          />
        );
      }
    }
    
    // Fallback to order item image
    const serviceImage = order.items && order.items.length > 0 && order.items[0]?.image 
      ? order.items[0].image 
      : (order as any).serviceImage || serviceVector;
    
    const imageUrl = serviceImage !== serviceVector ? resolveFileUrl(serviceImage) : serviceVector;
    const isVideo = isVideoFile(serviceImage);
    
    if (isVideo && serviceImage !== serviceVector) {
      return (
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
          <VideoThumbnail
            videoUrl={imageUrl}
            className="w-full h-full"
          />
        </div>
      );
    } else {
      return (
        <img 
          src={imageUrl}
          alt="Service thumbnail"
          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = serviceVector;
          }}
        />
      );
    }
  };

  const cancellationRequest = (order as any).cancellationRequest ?? order.metadata?.cancellationRequest;

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-xl p-6 sticky top-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
            Order Details
          </h3>
          {/* Three Dots Menu */}
          {order.status !== "Cancelled" && order.status !== "Cancellation Pending" &&
           (order.deliveryStatus === "pending" || order.deliveryStatus === "active") && 
           (!cancellationRequest?.status || cancellationRequest.status !== "pending") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <MoreVertical className="w-5 h-5 text-[#6b6b6b]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {order.deliveryFiles && order.deliveryFiles.length > 0 ? (
                  <DropdownMenuItem
                    onClick={onOpenDisputeModal}
                    className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Open Dispute
                  </DropdownMenuItem>
                ) : onOpenCancellationRequest ? (
                  <DropdownMenuItem
                    onClick={onOpenCancellationRequest}
                    className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Request Cancellation
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Service Preview */}
        <div className="mb-6">
          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
            Service
          </p>
          <div className="flex gap-3 items-start">
            {getServiceThumbnail()}
            <div className="flex-1 min-w-0">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                {order.service}
              </p>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Client */}
        <div className="mb-6">
          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
            Client
          </p>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              {resolveAvatarUrl(order.clientAvatar) && (
                <AvatarImage src={resolveAvatarUrl(order.clientAvatar)} />
              )}
              <AvatarFallback className="bg-[#3D78CB] text-white">
                {order.client?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                {order.client}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                  Online
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleStartChat}
              variant="outline"
              size="sm"
              className="flex-1 font-['Poppins',sans-serif] text-[12px] h-8"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat
            </Button>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Order Date */}
        <div className="mb-6">
          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
            Order Date
          </p>
          <div className="flex items-center gap-2 text-[#2c353f]">
            <Calendar className="w-4 h-4 text-[#6b6b6b]" />
            <span className="font-['Poppins',sans-serif] text-[13px]">
              {formatDate(order.date)}
            </span>
          </div>
        </div>

        {/* Delivery Date and Time */}
        {(order.booking?.date || order.booking?.time || (order as any).scheduledDate) && (
          <div className="mb-6">
            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
              Delivery Date & Time
            </p>
            {(order.booking?.date || (order as any).scheduledDate) && (
              <div className="flex items-center gap-2 text-[#2c353f]">
                <Calendar className="w-4 h-4 text-[#6b6b6b]" />
                <span className="font-['Poppins',sans-serif] text-[13px]">
                  {order.booking?.date ? formatDate(order.booking.date) : ((order as any).scheduledDate ? formatDate((order as any).scheduledDate) : "TBD")}
                </span>
              </div>
            )}
            {(order.booking?.time || order.booking?.timeSlot) && (
              <div className="flex items-center gap-2 text-[#2c353f] mt-2">
                <Clock className="w-4 h-4 text-[#6b6b6b]" />
                <span className="font-['Poppins',sans-serif] text-[13px]">
                  {order.booking.time ? order.booking.time : order.booking.timeSlot}
                  {order.booking.timeSlot && order.booking.time && ` (${order.booking.timeSlot})`}
                </span>
              </div>
            )}
          </div>
        )}

        <Separator className="mb-6" />

        {/* Total Amount */}
        <div className="mb-6">
          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
            Total Amount
          </p>
          <p className="font-['Poppins',sans-serif] text-[24px] text-[#FE8A0F]">
            {order.amount}
          </p>
        </div>

        {/* Action Buttons */}
        {order.deliveryStatus === "active" && (
          <>
            <Separator className="mb-6" />
            <div className="space-y-2">
              <Button
                onClick={onOpenDeliveryModal}
                className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif] text-[13px]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Deliver Order
              </Button>
            </div>
          </>
        )}

        {(order.deliveryStatus === "delivered" || order.deliveryStatus === "completed") && (
          <>
            <Separator className="mb-6" />
            <div className="space-y-2">
              <Button
                onClick={onOpenDisputeModal}
                variant="outline"
                className="w-full font-['Poppins',sans-serif] text-[13px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Open Dispute
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
