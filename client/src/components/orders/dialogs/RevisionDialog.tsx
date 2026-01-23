import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { toast } from "sonner";
import type { Order } from "../types";

interface RevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSubmit: (orderId: string, reason: string) => Promise<void>;
}

export default function RevisionDialog({
  open,
  onOpenChange,
  order,
  onSubmit,
}: RevisionDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for revision");
      return;
    }

    if (!order) return;

    setIsSubmitting(true);
    try {
      await onSubmit(order.id, reason);
      toast.success("Revision request submitted successfully");
      setReason("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit revision request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
            Request Revision
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Please describe what changes you would like to request
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Describe what needs to be changed or improved..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={6}
            className="font-['Poppins',sans-serif] text-[13px]"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setReason("");
              onOpenChange(false);
            }}
            className="font-['Poppins',sans-serif]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className="font-['Poppins',sans-serif] bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit Revision Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

