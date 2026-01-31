import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Order } from "../types";

interface RevisionResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisionResponseAction: 'accept' | 'reject';
  revisionAdditionalNotes: string;
  onRevisionAdditionalNotesChange: (notes: string) => void;
  currentOrder: Order | null;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
}

export default function RevisionResponseDialog({
  open,
  onOpenChange,
  revisionResponseAction,
  revisionAdditionalNotes,
  onRevisionAdditionalNotesChange,
  currentOrder,
  onSubmit,
  onCancel,
}: RevisionResponseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[45vw] min-w-[280px] max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
            {revisionResponseAction === 'accept' ? 'Accept Revision Request' : 'Reject Revision Request'}
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            {revisionResponseAction === 'accept' 
              ? 'You are accepting the revision request. You can add notes about how you will proceed with the modifications.'
              : 'You are rejecting the revision request. Please provide a reason (optional).'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {currentOrder?.revisionRequest?.reason && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                Client's Request:
              </p>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                {currentOrder.revisionRequest.reason}
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="revision-notes" className="font-['Poppins',sans-serif] text-[14px] mb-2 block">
              {revisionResponseAction === 'accept' ? 'Additional Notes (Optional)' : 'Reason for Rejection (Optional)'}
            </Label>
            <Textarea
              id="revision-notes"
              placeholder={revisionResponseAction === 'accept' 
                ? "Describe how you will proceed with the revision..."
                : "Explain why you are rejecting this revision request..."}
              value={revisionAdditionalNotes}
              onChange={(e) => onRevisionAdditionalNotesChange(e.target.value)}
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
            className={`font-['Poppins',sans-serif] ${
              revisionResponseAction === 'accept'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {revisionResponseAction === 'accept' ? 'Accept Revision' : 'Reject Revision'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
