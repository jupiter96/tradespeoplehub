import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";

interface CancellationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancellationReason: string;
  onCancellationReasonChange: (reason: string) => void;
  onSubmit: (files?: File[]) => Promise<void>;
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
  const [cancellationFiles, setCancellationFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    await onSubmit(cancellationFiles.length > 0 ? cancellationFiles : undefined);
    setCancellationFiles([]);
  };

  const handleCancelClick = () => {
    setCancellationFiles([]);
    onCancel();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen?.length) return;
    const list = Array.from(chosen);
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "video/mp4", "video/mpeg", "video/quicktime", "video/webm", "application/pdf", "text/plain"];
    const valid = list.filter((f) => allowed.includes(f.type));
    if (valid.length < list.length) {
      toast.error("Some files were skipped. Use images, videos, or documents only.");
    }
    setCancellationFiles((prev) => [...prev, ...valid].slice(0, 10));
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setCancellationFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
            Request Order Cancellation
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Submit a cancellation request. The other party will need to approve it.
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
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Attachments (optional)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="font-['Poppins',sans-serif] text-[13px]"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Add files
            </Button>
            {cancellationFiles.length > 0 && (
              <ul className="mt-2 space-y-1 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                {cancellationFiles.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="truncate flex-1">{f.name}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(i)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleCancelClick} className="font-['Poppins',sans-serif] text-[13px]">
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
