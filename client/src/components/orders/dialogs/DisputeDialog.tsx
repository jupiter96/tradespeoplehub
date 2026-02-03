import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { AlertTriangle, Paperclip, PoundSterling, X } from "lucide-react";
import { Order } from "../types";

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disputeRequirements: string;
  onDisputeRequirementsChange: (value: string) => void;
  disputeUnmetRequirements: string;
  onDisputeUnmetRequirementsChange: (value: string) => void;
  disputeEvidenceFiles: File[];
  onDisputeEvidenceFilesChange: (files: File[]) => void;
  disputeOfferAmount: string;
  onDisputeOfferAmountChange: (value: string) => void;
  currentOrder: Order | null;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

export default function DisputeDialog({
  open,
  onOpenChange,
  disputeRequirements,
  onDisputeRequirementsChange,
  disputeUnmetRequirements,
  onDisputeUnmetRequirementsChange,
  disputeEvidenceFiles,
  onDisputeEvidenceFilesChange,
  disputeOfferAmount,
  onDisputeOfferAmountChange,
  currentOrder,
  onSubmit,
  onCancel,
}: DisputeDialogProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onDisputeEvidenceFilesChange(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    onDisputeEvidenceFilesChange(disputeEvidenceFiles.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[48vw] sm:w-[42vw] md:w-[38vw] lg:w-[35vw] min-w-[280px] max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
            Open a Dispute
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Information Message Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ul className="font-['Poppins',sans-serif] text-[13px] text-yellow-800 space-y-2 list-disc list-inside">
              <li>Most disputes are the result of a simple misunderstanding.</li>
              <li>Our dispute resolution system is designed to allow both parties to resolve the issue amongst themselves.</li>
              <li>Most disputes are resolved without arbitration.</li>
              <li>If an agreement cannot be reached, either party may elect to pay an arbitration fee for our dispute team to resolve the matter.</li>
            </ul>
          </div>
          
          {/* Order Requirements Field */}
          <div>
            <Label htmlFor="dispute-requirements" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Please describe in detail what the requirements were for the order(s) you wish to dispute. *
            </Label>
            <Textarea
              id="dispute-requirements"
              value={disputeRequirements}
              onChange={(e) => onDisputeRequirementsChange(e.target.value)}
              placeholder="Describe the original requirements and expectations for this order..."
              rows={4}
              className="font-['Poppins',sans-serif] text-[14px]"
            />
          </div>

          {/* Unmet Requirements Field */}
          <div>
            <Label htmlFor="dispute-unmet" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Please describe in detail which of these requirements were not completed. *
            </Label>
            <Textarea
              id="dispute-unmet"
              value={disputeUnmetRequirements}
              onChange={(e) => onDisputeUnmetRequirementsChange(e.target.value)}
              placeholder="Explain specifically which requirements were not met or completed..."
              rows={4}
              className="font-['Poppins',sans-serif] text-[14px]"
            />
          </div>

          {/* Evidence File Upload */}
          <div>
            <Label htmlFor="dispute-evidence-files" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Please include evidence of how the order requirements we communicated, as well as any other evidence that supports your case. <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#3D5A80] transition-colors">
              <input
                id="dispute-evidence-files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="dispute-evidence-files"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Paperclip className="w-8 h-8 text-gray-400 mb-2" />
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                  Click to upload evidence files
                </p>
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#999]">
                  Screenshots, documents, or any supporting materials
                </p>
              </label>
            </div>
            {disputeEvidenceFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {disputeEvidenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        {file.name}
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[11px] text-[#999]">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Offer Amount Field */}
          <div>
            <Label htmlFor="dispute-offer" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Offer the amount you want to receive *
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <PoundSterling className="w-4 h-4 text-gray-500" />
              </div>
              <Input
                id="dispute-offer"
                type="number"
                min="0"
                max={currentOrder?.amountValue || undefined}
                step="0.01"
                value={disputeOfferAmount}
                onChange={(e) => onDisputeOfferAmountChange(e.target.value)}
                placeholder="0.00"
                className="font-['Poppins',sans-serif] text-[14px] pl-10"
              />
            </div>
            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
              Must be between £0.00 and £{currentOrder?.amountValue?.toFixed(2) || '0.00'} (order amount)
            </p>
          </div>

          {/* Caution Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
              <span className="text-red-600 font-semibold">Caution!</span> You are entering the amount of the order that you want to receive from the client. You may increase your offer in the future but you may not lower it.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              onClick={onCancel}
              variant="outline"
              className="font-['Poppins',sans-serif]"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!disputeRequirements.trim() || !disputeUnmetRequirements.trim() || !disputeOfferAmount || disputeEvidenceFiles.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Open Dispute
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
