import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { toast } from "sonner";

interface RejectCancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectCancellationReason: string;
  onRejectCancellationReasonChange: (reason: string) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

export default function RejectCancellationDialog({
  open,
  onOpenChange,
  rejectCancellationReason,
  onRejectCancellationReasonChange,
  onSubmit,
  onCancel,
}: RejectCancellationDialogProps) {
  const handleSubmit = async () => {
    if (!rejectCancellationReason.trim()) {
      toast.error("Please provide a reason for rejecting the cancellation request");
      return;
    }
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[45vw] min-w-[280px] max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
            Reject Cancellation Request
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Please provide a reason for rejecting the cancellation request. This reason will be sent to the client and displayed in the timeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reject-reason" className="font-['Poppins',sans-serif] text-[14px] mb-2 block">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why you are rejecting the cancellation request..."
              value={rejectCancellationReason}
              onChange={(e) => onRejectCancellationReasonChange(e.target.value)}
              className="font-['Poppins',sans-serif] min-h-[120px]"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            className="font-['Poppins',sans-serif]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif]"
          >
            Submit Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

