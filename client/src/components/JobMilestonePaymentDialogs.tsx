import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { resolveApiUrl } from "../config/api";
import { useCurrency } from "./CurrencyContext";
import { useJobs, type Job } from "./JobsContext";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

/** Same visibility as JobDetailPage payment tab — pro requests a plan when awarded but no funded milestones yet. */
export function proCanRequestMilestones(job: Job, professionalId: string | undefined): boolean {
  if (!professionalId) return false;
  return (
    !!job.awardedProfessionalId &&
    String(job.awardedProfessionalId) === String(professionalId) &&
    (!job.milestones || job.milestones.length === 0) &&
    (job.status === "awaiting-accept" || job.status === "in-progress")
  );
}

/** Client My Jobs → Awarded: allow creating the first milestone(s) from the list (no funded milestones yet). */
export function clientCanCreateMilestoneOnAwardedList(job: Job): boolean {
  return (
    (!job.milestones || job.milestones.length === 0) &&
    (job.status === "awaiting-accept" || job.status === "in-progress")
  );
}

type RequestMilestonesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | undefined;
  /** Passed to `fetchJobById` after success */
  fetchJobKey: string;
};

export function RequestMilestonesDialog({
  open,
  onOpenChange,
  jobId,
  fetchJobKey,
}: RequestMilestonesDialogProps) {
  const { symbol, toGBP } = useCurrency();
  const { fetchJobById } = useJobs();
  const [requestPlanRows, setRequestPlanRows] = useState<Array<{ description: string; amount: string }>>([
    { description: "", amount: "" },
  ]);
  const [submittingRequestPlan, setSubmittingRequestPlan] = useState(false);

  useEffect(() => {
    if (open) {
      setRequestPlanRows([{ description: "", amount: "" }]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!jobId) return;
    const rows = requestPlanRows
      .map((r) => {
        const parsed = parseFloat(String(r.amount || "").trim());
        return {
          description: String(r.description || "").trim(),
          amount: toGBP(parsed),
        };
      })
      .filter((r) => r.description.length > 0 && !Number.isNaN(r.amount) && r.amount > 0);
    if (rows.length === 0) {
      toast.error("Add at least one milestone with a description and a positive amount.");
      return;
    }
    setSubmittingRequestPlan(true);
    try {
      const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/requested-milestones`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ milestones: rows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send milestone plan");
      }
      if (fetchJobKey) await fetchJobById(fetchJobKey);
      toast.success("Milestone plan sent to the client.");
      onOpenChange(false);
      setRequestPlanRows([{ description: "", amount: "" }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("INSUFFICIENT")) {
        toast.error(msg);
      } else {
        toast.error(msg || "Failed to send milestone plan");
      }
    } finally {
      setSubmittingRequestPlan(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setRequestPlanRows([{ description: "", amount: "" }]);
      }}
    >
      <DialogContent className="w-[90vw] max-w-lg p-6 font-['Poppins',sans-serif]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f]">
            Request milestone payments
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Propose a payment plan for the client. They can accept or decline each step in the Payment tab; accepting
            funds that milestone from their wallet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-1">
          {requestPlanRows.map((row, idx) => (
            <div key={idx} className="rounded-lg border border-sky-100 bg-sky-50/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#0c4a6e]">Step {idx + 1}</span>
                {requestPlanRows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-red-600"
                    onClick={() => setRequestPlanRows((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div>
                <Label className="text-[13px] text-[#2c353f]">Description</Label>
                <Input
                  value={row.description}
                  onChange={(e) =>
                    setRequestPlanRows((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r))
                    )
                  }
                  placeholder="e.g. Materials deposit"
                  className="mt-1 font-['Poppins',sans-serif] text-[14px]"
                />
              </div>
              <div>
                <Label className="text-[13px] text-[#2c353f]">Amount ({symbol})</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#2c353f]">{symbol}</span>
                  <Input
                    type="number"
                    value={row.amount}
                    onChange={(e) =>
                      setRequestPlanRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r))
                      )
                    }
                    placeholder="0.00"
                    className="flex-1 font-['Poppins',sans-serif] text-[14px]"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-dashed border-sky-300 text-sky-800"
            onClick={() => setRequestPlanRows((prev) => [...prev, { description: "", amount: "" }])}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add step
          </Button>
        </div>
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              setRequestPlanRows([{ description: "", amount: "" }]);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
            disabled={submittingRequestPlan}
            onClick={() => void handleSubmit()}
          >
            {submittingRequestPlan ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Sending…
              </>
            ) : (
              "Send to client"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type CreateNewMilestoneDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | undefined;
  fetchJobKey: string;
};

export function CreateNewMilestoneDialog({
  open,
  onOpenChange,
  jobId,
  fetchJobKey,
}: CreateNewMilestoneDialogProps) {
  const { symbol, toGBP } = useCurrency();
  const { addMilestone, fetchJobById } = useJobs();
  const navigate = useNavigate();
  const [newMilestoneForm, setNewMilestoneForm] = useState({
    name: "",
    description: "",
    amount: "",
  });

  useEffect(() => {
    if (open) {
      setNewMilestoneForm({ name: "", description: "", amount: "" });
    }
  }, [open]);

  const handleCreateMilestone = async () => {
    const nameOrDesc = (newMilestoneForm.name || newMilestoneForm.description || "").trim();
    if (!nameOrDesc || !newMilestoneForm.amount) {
      toast.error("Please fill in milestone name and amount");
      return;
    }

    const amountInSelected = parseFloat(newMilestoneForm.amount);
    if (Number.isNaN(amountInSelected) || amountInSelected <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!jobId) return;

    try {
      await addMilestone(jobId, nameOrDesc, toGBP(amountInSelected));
      toast.success("Milestone created successfully!");
      if (fetchJobKey) await fetchJobById(fetchJobKey);
      onOpenChange(false);
      setNewMilestoneForm({ name: "", description: "", amount: "" });
    } catch (e: unknown) {
      const err = e as Error & { code?: string };
      if (err?.code === "INSUFFICIENT_BALANCE") {
        toast.error("Insufficient balance. Please add funds to your wallet.");
        navigate("/account?tab=billing&section=fund");
      } else {
        toast.error(err?.message || "Failed to create milestone");
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setNewMilestoneForm({ name: "", description: "", amount: "" });
      }}
    >
      <DialogContent className="w-[70vw] p-6 font-['Poppins',sans-serif]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">
            Create New Milestone
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Add a new milestone payment to this job. The professional will need to complete this milestone to request
            payment release.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="milestone-name-list" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Milestone name
            </Label>
            <Input
              id="milestone-name-list"
              value={newMilestoneForm.name}
              onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, name: e.target.value })}
              placeholder="e.g., Phase 1 - Plumbing"
              className="font-['Poppins',sans-serif] text-[14px]"
            />
          </div>

          <div>
            <Label
              htmlFor="milestone-description-list"
              className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block"
            >
              Description (optional)
            </Label>
            <Textarea
              id="milestone-description-list"
              value={newMilestoneForm.description}
              onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, description: e.target.value })}
              placeholder="e.g., Complete plumbing installation"
              className="font-['Poppins',sans-serif] text-[14px] min-h-[60px]"
            />
          </div>

          <div>
            <Label htmlFor="milestone-amount-list" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Amount ({symbol})
            </Label>
            <div className="flex items-center gap-2">
              <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">{symbol}</span>
              <Input
                id="milestone-amount-list"
                type="number"
                value={newMilestoneForm.amount}
                onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, amount: e.target.value })}
                placeholder="0.00"
                className="flex-1 font-['Poppins',sans-serif] text-[14px]"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="bg-[#EFF6FF] border border-[#3B82F6]/30 rounded-lg p-4">
            <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
              The milestone will be created with &quot;Pending&quot; status. Once the professional requests release, you
              can approve the payment.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setNewMilestoneForm({ name: "", description: "", amount: "" });
              }}
              className="flex-1 font-['Poppins',sans-serif]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateMilestone()}
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif]"
            >
              Create Milestone
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
