import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";

interface DisputeResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disputeResponseMessage: string;
  onDisputeResponseMessageChange: (message: string) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

export default function DisputeResponseDialog({
  open,
  onOpenChange,
  disputeResponseMessage,
  onDisputeResponseMessageChange,
  onSubmit,
  onCancel,
}: DisputeResponseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[45vw] min-w-[280px] max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
            Respond to Dispute
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Send a response to the dispute. This will be visible to the client.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="dispute-response" className="font-['Poppins',sans-serif] text-[14px] mb-2 block">
              Response
            </Label>
            <Textarea
              id="dispute-response"
              placeholder="Write your response..."
              value={disputeResponseMessage}
              onChange={(e) => onDisputeResponseMessageChange(e.target.value)}
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
            onClick={onSubmit}
            className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif]"
          >
            Send Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
