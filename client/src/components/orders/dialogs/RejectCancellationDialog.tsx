import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";

interface RejectCancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
}

export default function RejectCancellationDialog({
  open,
  onOpenChange,
  onSubmit,
  onCancel,
}: RejectCancellationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[45vw] min-w-[280px] max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
            Reject Cancellation Request
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Are you sure you want to reject the cancellation request? The order will continue as normal.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="font-['Poppins',sans-serif]"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif]"
          >
            Yes, Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
