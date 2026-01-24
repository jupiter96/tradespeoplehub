import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Upload, CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completionMessage: string;
  onCompletionMessageChange: (message: string) => void;
  completionFiles: File[];
  onCompletionFilesChange: (files: File[]) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

export default function CompletionDialog({
  open,
  onOpenChange,
  completionMessage,
  onCompletionMessageChange,
  completionFiles,
  onCompletionFilesChange,
  onSubmit,
  onCancel,
}: CompletionDialogProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onCompletionFilesChange([...completionFiles, ...newFiles].slice(0, 10));
    }
  };

  const handleRemoveFile = (index: number) => {
    onCompletionFilesChange(completionFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!completionMessage.trim() && completionFiles.length === 0) {
      toast.error("Please add a completion message or upload verification files");
      return;
    }
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
            Submit Completion Request
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Upload verification data (images/videos) and add a message to request order completion. The client will review and approve to release funds to your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Upload Verification Files (Images/Videos) <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#3D78CB] transition-colors">
              <input
                type="file"
                id="completion-files"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="completion-files"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                  Images (PNG, JPG, GIF, WEBP) or Videos (MP4, MPEG, MOV, AVI, WEBM) - Max 100MB each
                </p>
              </label>
            </div>
            
            {/* Selected Files Preview */}
            {completionFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                  Selected Files ({completionFiles.length}/10):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {completionFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <PlayCircle className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
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
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Completion Message */}
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Completion Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Add a message about the completed work and verification data..."
              value={completionMessage}
              onChange={(e) => onCompletionMessageChange(e.target.value)}
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
              disabled={(!completionMessage.trim() && completionFiles.length === 0)}
              className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Submit Completion Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
