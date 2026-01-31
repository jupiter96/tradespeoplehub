import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Upload, Image, Film, FileText, X } from "lucide-react";
import { toast } from "sonner";
interface AddInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: { id: string; service?: string } | null;
  onSubmit: (orderId: string, message: string, files?: File[]) => Promise<void>;
}

export default function AddInfoDialog({
  open,
  onOpenChange,
  order,
  onSubmit,
}: AddInfoDialogProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter((file) => {
        const type = file.type;
        return (
          type.startsWith("image/") ||
          type.startsWith("video/") ||
          type === "application/pdf" ||
          type === "application/msword" ||
          type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          type === "text/plain"
        );
      });

      if (validFiles.length !== newFiles.length) {
        toast.error("Some files were not added. Only images, videos, and documents are allowed.");
      }

      setFiles((prev) => [...prev, ...validFiles].slice(0, 10));
      // Reset input
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />;
    if (file.type.startsWith("video/")) return <Film className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const handleSubmit = async () => {
    if (!message.trim() && files.length === 0) {
      toast.error("Please add a message or upload files");
      return;
    }
    if (!order) return;

    const orderId = order.id;
    const msg = message;
    const filesToSend = files.length > 0 ? files : undefined;
    onOpenChange(false);
    setMessage("");
    setFiles([]);
    toast.promise(
      onSubmit(orderId, msg, filesToSend),
      { loading: "Processing...", success: "Additional information submitted successfully!", error: (e: any) => e.message || "Failed to submit additional information" }
    );
  };

  const handleClearAndClose = () => {
    setMessage("");
    setFiles([]);
    onOpenChange(false);
  };

  if (!open) {
    return null;
  }

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClearAndClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 z-[100000]">
        <button
          onClick={handleClearAndClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close dialog"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold">
            Add Remarks
          </h2>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mt-1">
            Add any special requirements or remarks for the service
          </p>
        </div>

        <div className="space-y-6">
          {order ? (
            <>
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                {/* Service Name */}
                <h3 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f] mb-3">
                  {order.service || "Service"}
                </h3>

                {/* Message Input */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Message
                  </Label>
                  <Textarea
                    placeholder="Enter any special requirements, instructions, or additional information..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="font-['Poppins',sans-serif] text-[13px]"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Attachments (Optional) - Max 10 files
                  </Label>
                  <div
                    className="border-2 border-dashed border-[#3D78CB] rounded-lg p-4 text-center hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-[#3D78CB]" />
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#3D78CB] font-medium">
                        Click to upload files ({files.length}/10)
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                        Images, videos, PDF, DOC, DOCX, or TXT files
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected Files */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      Selected Files:
                    </Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                          {getFileIcon(file)}
                          <span className="font-['Poppins',sans-serif] text-[11px] text-[#2c353f] flex-1 truncate">
                            {file.name}
                          </span>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 hover:text-red-700"
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Same as CartPage */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleClearAndClose}
                  className="font-['Poppins',sans-serif]"
                >
                  Clear & Close
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#3D78CB] hover:bg-[#2D5CA3] text-white font-['Poppins',sans-serif]"
                >
                  {isSubmitting ? "Submitting..." : "Done"}
                </Button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Loading order details...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modal, document.body);
}

