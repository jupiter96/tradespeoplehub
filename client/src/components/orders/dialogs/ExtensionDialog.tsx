import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Calendar, Clock } from "lucide-react";
import { formatDate } from "../utils";
import { Order } from "../types";

interface ExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extensionNewDate: string;
  onExtensionNewDateChange: (date: string) => void;
  extensionNewTime: string;
  onExtensionNewTimeChange: (time: string) => void;
  extensionReason: string;
  onExtensionReasonChange: (reason: string) => void;
  currentOrder: Order | null;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

export default function ExtensionDialog({
  open,
  onOpenChange,
  extensionNewDate,
  onExtensionNewDateChange,
  extensionNewTime,
  onExtensionNewTimeChange,
  extensionReason,
  onExtensionReasonChange,
  currentOrder,
  onSubmit,
  onCancel,
}: ExtensionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[45vw] min-w-[280px] max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
            Request Extension
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Request an extension for the delivery deadline. The client will be notified and can approve or reject your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* New Delivery Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                New Delivery Date <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="date"
                  value={extensionNewDate}
                  onChange={(e) => onExtensionNewDateChange(e.target.value)}
                  min={currentOrder?.scheduledDate ? new Date(new Date(currentOrder.scheduledDate).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  className="font-['Poppins',sans-serif] text-[14px] pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                New Delivery Time <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="time"
                  value={extensionNewTime}
                  onChange={(e) => onExtensionNewTimeChange(e.target.value)}
                  className="font-['Poppins',sans-serif] text-[14px] pr-10"
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          
          {/* Current schedule info */}
          {(currentOrder?.scheduledDate || currentOrder?.booking?.date) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                <span className="font-medium">Current scheduled:</span>{" "}
                {currentOrder?.booking?.date 
                  ? `${formatDate(currentOrder.booking.date)} ${currentOrder.booking?.starttime || currentOrder.booking?.timeSlot || ''}`
                  : currentOrder?.scheduledDate 
                    ? formatDate(currentOrder.scheduledDate) 
                    : "TBD"}
              </p>
            </div>
          )}

          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Reason (Optional)
            </Label>
            <Textarea
              placeholder="Explain why you need an extension..."
              value={extensionReason}
              onChange={(e) => onExtensionReasonChange(e.target.value)}
              rows={4}
              className="font-['Poppins',sans-serif] text-[13px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="font-['Poppins',sans-serif] text-[13px]"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!extensionNewDate}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-['Poppins',sans-serif] text-[13px] disabled:opacity-50"
            >
              Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
