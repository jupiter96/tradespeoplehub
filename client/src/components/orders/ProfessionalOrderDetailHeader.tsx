import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Order } from "./types";
import { getStatusBadge, getStatusIcon, getStatusLabel } from "./utils";

interface ProfessionalOrderDetailHeaderProps {
  order: Order;
  onBack: () => void;
}

export default function ProfessionalOrderDetailHeader({
  order,
  onBack,
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
        </div>
      </div>
    </>
  );
}
