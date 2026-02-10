import { useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";
import { Order } from "../types";

interface CancellationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancellationReason: string;
  onCancellationReasonChange: (reason: string) => void;
  onSubmit: (files?: File[]) => void | Promise<void>;
  onCancel: () => void;
  /** For milestone custom-offer orders: current order (to derive milestones & deliveries) */
  currentOrder?: Order | null;
  /** For milestone custom-offer orders: selected milestone indices (0-based) to cancel. */
  selectedMilestoneIndices?: number[];
  onSelectedMilestoneIndicesChange?: (indices: number[]) => void;
}

export default function CancellationRequestDialog({
  open,
  onOpenChange,
  cancellationReason,
  onCancellationReasonChange,
  onSubmit,
  onCancel,
  currentOrder,
  selectedMilestoneIndices = [],
  onSelectedMilestoneIndicesChange,
}: CancellationRequestDialogProps) {
  const [cancellationFiles, setCancellationFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meta = (currentOrder as any)?.metadata || {};
  const isMilestoneOrder =
    !!currentOrder &&
    meta.fromCustomOffer &&
    meta.paymentType === "milestone" &&
    Array.isArray(meta.milestones) &&
    meta.milestones.length > 0;
  const milestones = (meta.milestones || []) as Array<{
    name?: string;
    description?: string;
    price?: number;
    amount?: number;
    noOf?: number;
  }>;
  const milestoneDeliveries = meta.milestoneDeliveries as Array<{ milestoneIndex: number }> | undefined;
  const deliveredMilestoneIndices: number[] = useMemo(
    () =>
      Array.isArray(milestoneDeliveries)
        ? milestoneDeliveries
            .map((d) => (d && typeof d.milestoneIndex === "number" ? d.milestoneIndex : -1))
            .filter((idx) => idx >= 0 && idx < milestones.length)
        : [],
    [milestoneDeliveries, milestones.length]
  );
  const cancellableMilestoneIndices: number[] = useMemo(
    () =>
      isMilestoneOrder
        ? milestones.map((_, idx) => idx).filter((idx) => !deliveredMilestoneIndices.includes(idx))
        : [],
    [isMilestoneOrder, milestones, deliveredMilestoneIndices]
  );

  const handleSubmit = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    if (isMilestoneOrder && onSelectedMilestoneIndicesChange) {
      if (cancellableMilestoneIndices.length === 0) {
        toast.error("There are no cancellable milestones remaining.");
        return;
      }
      if (selectedMilestoneIndices.length === 0) {
        toast.error("Please select at least one milestone to cancel");
        return;
      }
    }
    if (cancellationFiles.length === 0) {
      toast.error("Please upload at least one attachment");
      return;
    }
    await onSubmit(cancellationFiles);
    setCancellationFiles([]);
  };

  const handleCancelClick = () => {
    if (onSelectedMilestoneIndicesChange) {
      onSelectedMilestoneIndicesChange([]);
    }
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
      <DialogContent className="w-[45vw] min-w-[280px] max-w-[360px]">
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
              Attachments <span className="text-red-500">*</span>
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
          {/* Milestone selection for milestone custom-offer orders – only undelivered milestones are cancellable */}
          {isMilestoneOrder && onSelectedMilestoneIndicesChange && cancellableMilestoneIndices.length > 0 && (
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Select milestone(s) to cancel *
              </Label>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
                Only milestones that have not yet been delivered can be cancelled.
              </p>
              <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
                <label className="flex items-center gap-2 cursor-pointer font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                  <input
                    type="checkbox"
                    checked={
                      cancellableMilestoneIndices.length > 0 &&
                      cancellableMilestoneIndices.every((idx) => selectedMilestoneIndices.includes(idx))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectedMilestoneIndicesChange(cancellableMilestoneIndices);
                      } else {
                        onSelectedMilestoneIndicesChange([]);
                      }
                    }}
                  />
                  Select all cancellable milestones
                </label>
                {cancellableMilestoneIndices.map((idx) => {
                  const m = milestones[idx];
                  const p = m?.price ?? m?.amount ?? 0;
                  const noOf = m?.noOf ?? 1;
                  const total = p * noOf;
                  const checked = selectedMilestoneIndices.includes(idx);
                  return (
                    <label
                      key={idx}
                      className="flex items-center gap-2 cursor-pointer font-['Poppins',sans-serif] text-[13px] text-[#2c353f]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            onSelectedMilestoneIndicesChange(
                              selectedMilestoneIndices.filter((i) => i !== idx)
                            );
                          } else {
                            onSelectedMilestoneIndicesChange(
                              [...selectedMilestoneIndices, idx].sort((a, b) => a - b)
                            );
                          }
                        }}
                      />
                      <span>
                        Milestone {idx + 1}{m?.name ? `: ${m.name}` : ""} — £{total.toFixed(2)}
                        {m?.description && (
                          <span className="block text-[11px] text-[#6b6b6b]">{m.description}</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleCancelClick} className="font-['Poppins',sans-serif] text-[13px]">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!cancellationReason.trim() || cancellationFiles.length === 0}
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
