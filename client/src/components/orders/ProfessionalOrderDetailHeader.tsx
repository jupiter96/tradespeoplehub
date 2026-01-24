import { ArrowLeft, AlertTriangle, MoreVertical } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Order } from "./types";
import { getStatusBadge, getStatusIcon, getStatusLabel } from "./utils";

interface ProfessionalOrderDetailHeaderProps {
  order: Order;
  onBack: () => void;
  onOpenDispute: () => void;
}

export default function ProfessionalOrderDetailHeader({
  order,
  onBack,
  onOpenDispute,
}: ProfessionalOrderDetailHeaderProps) {
  const cancellationRequest = (order as any).cancellationRequest ?? order.metadata?.cancellationRequest;
  const displayStatus =
    cancellationRequest?.status === "pending" ? "Cancellation Pending" : order.status;

  return (
    <>
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-4 font-['Poppins',sans-serif] text-[13px] hover:text-[#FE8A0F]"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </Button>

      {/* Header Section with Title and Status */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
            {order.service}
          </h2>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Order ID: {order.id}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`${getStatusBadge(displayStatus)} font-['Poppins',sans-serif] text-[11px]`}
          >
            <span className="flex items-center gap-1">
              {getStatusIcon(displayStatus)}
              {getStatusLabel(displayStatus)}
            </span>
          </Badge>
          
          {(order.deliveryStatus === "pending" || order.deliveryStatus === "active") && 
           order.deliveryFiles && order.deliveryFiles.length > 0 && (
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
                <DropdownMenuItem
                  onClick={onOpenDispute}
                  className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Open Dispute
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </>
  );
}
