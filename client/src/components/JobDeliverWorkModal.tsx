import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Upload, XCircle, Send } from "lucide-react";
import { useJobs } from "./JobsContext";
import type { Job, Milestone } from "./JobsContext";
import { toast } from "sonner@2.0.3";
import { resolveApiUrl } from "../config/api";

type JobDeliverWorkModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  jobId?: string;
  /** When set, preselect this milestone index and optionally hide selector (single milestone delivery) */
  preselectedMilestoneIndex?: number | null;
  onSuccess?: () => void;
};

export default function JobDeliverWorkModal({
  open,
  onOpenChange,
  job: jobProp,
  jobId: jobIdProp,
  preselectedMilestoneIndex = null,
  onSuccess,
}: JobDeliverWorkModalProps) {
  const { getJobById, fetchJobById, deliverJobMilestone } = useJobs();
  const [job, setJob] = useState<Job | null>(jobProp || null);
  const [loading, setLoading] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number | null>(preselectedMilestoneIndex ?? null);

  const effectiveJobId = job?.id || jobIdProp;
  const effectiveJob = job || (effectiveJobId ? getJobById(effectiveJobId) : null);

  useEffect(() => {
    if (open && effectiveJobId && !effectiveJob) {
      fetchJobById(effectiveJobId).then((j) => {
        setJob(j || null);
        if (j && preselectedMilestoneIndex != null) setSelectedMilestoneIndex(preselectedMilestoneIndex);
      });
    }
    if (open && jobProp) setJob(jobProp);
    if (open && preselectedMilestoneIndex != null) setSelectedMilestoneIndex(preselectedMilestoneIndex);
  }, [open, effectiveJobId, jobProp, preselectedMilestoneIndex, fetchJobById, getJobById]);

  const milestones = effectiveJob?.milestones || [];
  const deliveries = effectiveJob?.milestoneDeliveries || [];
  const deliverableMilestones: { index: number; milestone: Milestone; isRevision: boolean }[] = [];
  (milestones as Milestone[]).forEach((m, idx) => {
    if (m.status !== "in-progress") return;
    const delivery = deliveries.find((d) => d.milestoneIndex === idx);
    if (!delivery) {
      deliverableMilestones.push({ index: idx, milestone: m, isRevision: false });
      return;
    }
    if (delivery.revisionRequestedAt) {
      deliverableMilestones.push({ index: idx, milestone: m, isRevision: true });
    }
  });

  useEffect(() => {
    if (!open || !effectiveJob || preselectedMilestoneIndex != null) return;
    const list = deliverableMilestones;
    if (list.length === 1 && selectedMilestoneIndex === null) setSelectedMilestoneIndex(list[0].index);
  }, [open, effectiveJob?.id, deliverableMilestones.length, preselectedMilestoneIndex]);

  useEffect(() => {
    if (!open) {
      setDeliveryMessage("");
      setDeliveryFiles([]);
      setSelectedMilestoneIndex(preselectedMilestoneIndex ?? null);
    }
  }, [open, preselectedMilestoneIndex]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const list = Array.from(e.target.files);
    const valid = list.filter((f) =>
      ["image/", "video/", "application/pdf"].some((t) => f.type.startsWith(t.split("/")[0]))
    );
    setDeliveryFiles((prev) => [...prev, ...valid].slice(0, 10));
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setDeliveryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!effectiveJob?.id) {
      toast.error("Job not found");
      return;
    }
    const idx = selectedMilestoneIndex;
    if (idx === null || idx === undefined || idx < 0 || idx >= milestones.length) {
      toast.error("Please select a milestone");
      return;
    }
    if (!deliveryMessage.trim() && deliveryFiles.length === 0) {
      toast.error("Please add a message or attach files");
      return;
    }
    setLoading(true);
    try {
      await deliverJobMilestone(
        effectiveJob.id,
        idx,
        deliveryMessage.trim(),
        deliveryFiles.length > 0 ? deliveryFiles : undefined
      );
      toast.success("Work delivered successfully.");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to deliver work");
    } finally {
      setLoading(false);
    }
  };

  const singleMilestone = deliverableMilestones.length === 1 && preselectedMilestoneIndex != null;
  const showMilestoneSelect = deliverableMilestones.length > 1 || (deliverableMilestones.length === 1 && preselectedMilestoneIndex == null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
            Deliver Work
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Upload files and add a message for the milestone delivery. The client will be able to review and approve or request revisions.
          </DialogDescription>
        </DialogHeader>

        {!effectiveJob && effectiveJobId && (
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Loading job...</p>
        )}

        {effectiveJob && (
          <div className="space-y-4">
            {showMilestoneSelect && (
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Select milestone
                </Label>
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {deliverableMilestones.map(({ index, milestone, isRevision }) => (
                    <label
                      key={index}
                      className="flex items-center gap-2 cursor-pointer font-['Poppins',sans-serif] text-[13px] text-[#2c353f]"
                    >
                      <input
                        type="radio"
                        name="milestone"
                        checked={selectedMilestoneIndex === index}
                        onChange={() => setSelectedMilestoneIndex(index)}
                        className="rounded-full"
                      />
                      <span>
                        Milestone {index + 1}: {milestone.name || milestone.description || "Milestone"}
                        {isRevision && " (Re-deliver for revision)"}
                      </span>
                    </label>
                  ))}
                </div>
                {deliverableMilestones.length === 0 && (
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    No milestones available to deliver (all in-progress milestones are already delivered and not awaiting revision).
                  </p>
                )}
                {deliverableMilestones.some((m) => m.isRevision) && (
                  <p className="font-['Poppins',sans-serif] text-[12px] text-amber-600 mt-2">
                    Tip: Options marked “(Re-deliver for revision)” are milestones where the client requested changes. Re-deliver work for these when ready.
                  </p>
                )}
              </div>
            )}

            {singleMilestone && deliverableMilestones.length === 1 && (
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                Delivering for: <strong>Milestone {deliverableMilestones[0].index + 1}: {deliverableMilestones[0].milestone.name || deliverableMilestones[0].milestone.description}</strong>
              </p>
            )}

            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Describe what you've completed and any important details..."
                value={deliveryMessage}
                onChange={(e) => setDeliveryMessage(e.target.value)}
                rows={4}
                className="font-['Poppins',sans-serif] text-[13px]"
              />
            </div>

            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Attach files (optional)
              </Label>
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="job-delivery-files"
              />
              <label
                htmlFor="job-delivery-files"
                className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FE8A0F] transition-colors"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    Click to upload files (max 10)
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
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  (deliverableMilestones.length > 0 && selectedMilestoneIndex === null) ||
                  (!deliveryMessage.trim() && deliveryFiles.length === 0)
                }
                className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Submitting..." : "Submit Delivery"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
