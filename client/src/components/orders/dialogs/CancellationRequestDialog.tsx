import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { toast } from "sonner";

interface CancellationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancellationReason: string;
  onCancellationReasonChange: (reason: string) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

export default function CancellationRequestDialog({
  open,
  onOpenChange,
  cancellationReason,
  onCancellationReasonChange,
  onSubmit,
  onCancel,
}: CancellationRequestDialogProps) {
  const handleSubmit = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
            Request Order Cancellation
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Submit a cancellation request. The client will need to approve it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cancellation-reason" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Reason for Cancellation *
            </Label>
            <Textarea
              id="cancellation-reason"
              value={cancellationReason}
              onChange={(e) => onCancellationReasonChange(e.target.value)}
              placeholder="Explain why you need to cancel this order..."
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
              onClick={handleSubmit}
              disabled={!cancellationReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif] text-[13px] disabled:opacity-50"
            >
              Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
