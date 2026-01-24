import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface DeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryMessage: string;
  onDeliveryMessageChange: (message: string) => void;
  deliveryFiles: File[];
  onDeliveryFilesChange: (files: File[]) => void;
  onSubmit: () => Promise<void>;
  isRevisionCompletion?: boolean;
}

export default function DeliveryDialog({
  open,
  onOpenChange,
  deliveryMessage,
  onDeliveryMessageChange,
  deliveryFiles,
  onDeliveryFilesChange,
  onSubmit,
  isRevisionCompletion = false,
}: DeliveryDialogProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onDeliveryFilesChange([...deliveryFiles, ...newFiles].slice(0, 10));
    }
  };

  const handleRemoveFile = (index: number) => {
    onDeliveryFilesChange(deliveryFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!deliveryMessage.trim() && deliveryFiles.length === 0) {
      toast.error("Please add a delivery message or upload files");
      return;
    }
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[70vw]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
            {isRevisionCompletion ? "Complete Revision" : "Deliver Order"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isRevisionCompletion 
              ? "Submit your revision completion to the client"
              : "Submit your completed work to the client"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Delivery Message
            </Label>
            <Textarea
              placeholder="Describe what you've completed and any important details..."
              value={deliveryMessage}
              onChange={(e) => onDeliveryMessageChange(e.target.value)}
              rows={4}
              className="font-['Poppins',sans-serif] text-[13px]"
            />
          </div>

          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Attach Files (Optional)
            </Label>
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="delivery-files"
            />
            <label
              htmlFor="delivery-files"
              className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FE8A0F] transition-colors"
            >
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                  Click to upload files
                </p>
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                  Images, videos, PDFs or documents (max 10)
                </p>
              </div>
            </label>
            {deliveryFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {deliveryFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] truncate">
                        {file.name}
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
              💡 You can also attach files by uploading them in the messenger
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isRevisionCompletion ? "Complete Revision" : "Submit Delivery"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
