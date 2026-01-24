import { Eye, MessageCircle, Star, Calendar, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { Order, ServiceThumbnail } from "./types";
import { formatDate, getStatusBadge, getDeliveryStatusBadge, getDeliveryStatusLabel, resolveAvatarUrl } from "./utils";
import serviceVector from "../../assets/service_vector.jpg";

interface OrderCardProps {
  order: Order;
  thumbnail?: ServiceThumbnail;
  onViewDetails: (orderId: string) => void;
  onMessage: (orderId: string) => void;
  onRate?: (orderId: string) => void;
}

export default function OrderCard({
  order,
  thumbnail,
  onViewDetails,
  onMessage,
  onRate,
}: OrderCardProps) {
  const showRateButton = order.status === "Completed" && !order.hasReview;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-32 sm:h-40">
        {thumbnail?.type === "video" ? (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <video
              src={thumbnail.url}
              poster={thumbnail.thumbnail}
              className="w-full h-full object-cover"
              muted
            />
          </div>
        ) : (
          <img
            src={thumbnail?.url || serviceVector}
            alt={order.service}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Status Badge */}
        <Badge
          className={`absolute top-2 right-2 ${getStatusBadge(order.status)} font-['Poppins',sans-serif] text-[10px] sm:text-[11px]`}
        >
          {order.status}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Service Name */}
        <h3 className="font-['Poppins',sans-serif] text-[14px] sm:text-[16px] text-[#2c353f] font-medium mb-2 line-clamp-2">
          {order.service}
        </h3>

        {/* Professional */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-6 h-6">
            {resolveAvatarUrl(order.professionalAvatar) && (
              <AvatarImage src={resolveAvatarUrl(order.professionalAvatar)} />
            )}
            <AvatarFallback className="bg-[#3D78CB] text-white text-[10px]">
              {order.professional?.charAt(0)?.toUpperCase() || "P"}
            </AvatarFallback>
          </Avatar>
          <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
            {order.professional}
          </span>
        </div>

        {/* Order Info */}
        <div className="flex items-center gap-4 mb-3 text-[11px] sm:text-[12px] text-[#6b6b6b]">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="font-['Poppins',sans-serif]">{formatDate(order.date)}</span>
          </div>
          {order.address && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="font-['Poppins',sans-serif] truncate max-w-[100px]">
                {order.address.city}
              </span>
            </div>
          )}
        </div>

        {/* Delivery Status */}
        {order.deliveryStatus && (
          <Badge
            className={`${getDeliveryStatusBadge(order.deliveryStatus)} font-['Poppins',sans-serif] text-[10px] mb-3`}
          >
            {getDeliveryStatusLabel(order.deliveryStatus)}
          </Badge>
        )}

        {/* Amount */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-[#FE8A0F] font-semibold">
            {order.amount}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(order.id)}
            className="flex-1 font-['Poppins',sans-serif] text-[11px] sm:text-[12px]"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMessage(order.id)}
            className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px]"
          >
            <MessageCircle className="w-3 h-3" />
          </Button>
          {showRateButton && onRate && (
            <Button
              size="sm"
              onClick={() => onRate(order.id)}
              className="bg-[#FE8A0F] hover:bg-[#e07d0d] text-white font-['Poppins',sans-serif] text-[11px] sm:text-[12px]"
            >
              <Star className="w-3 h-3 mr-1" />
              Rate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

