import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Loader2, Plus } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { resolveApiUrl } from "../config/api";
import { useCurrency } from "./CurrencyContext";
import { useJobs, type Job } from "./JobsContext";
import { useAccount } from "./AccountContext";
import paypalLogo from "../assets/paypal-logo.png";
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
  const { symbol, toGBP, fromGBP } = useCurrency();
  const { fetchJobById } = useJobs();
  const { userInfo } = useAccount();
  const [requestPlanRows, setRequestPlanRows] = useState<Array<{ description: string; amount: string }>>([
    { description: "", amount: "" },
  ]);
  const [submittingRequestPlan, setSubmittingRequestPlan] = useState(false);
  const [quotePriceLimitDisplay, setQuotePriceLimitDisplay] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setRequestPlanRows([{ description: "", amount: "" }]);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    async function loadQuoteLimit() {
      if (!open) return;
      if (!fetchJobKey) return;
      const job = await fetchJobById(fetchJobKey);
      if (cancelled) return;
      if (!job) {
        setQuotePriceLimitDisplay(null);
        return;
      }
      const myId = userInfo?.id;
      const awardedQuote =
        myId && Array.isArray(job.quotes)
          ? job.quotes.find((q) => String(q.professionalId) === String(myId))
          : job.awardedProfessionalId && Array.isArray(job.quotes)
            ? job.quotes.find((q) => String(q.professionalId) === String(job.awardedProfessionalId))
            : null;
      const limit = awardedQuote?.price != null ? fromGBP(Number(awardedQuote.price)) : null;
      setQuotePriceLimitDisplay(Number.isFinite(limit as any) ? (limit as number) : null);
    }
    void loadQuoteLimit();
    return () => {
      cancelled = true;
    };
  }, [open, fetchJobKey, fetchJobById, userInfo?.id, fromGBP]);

  const requestPlanTotalDisplay = useMemo(() => {
    return requestPlanRows.reduce((sum, r) => {
      const v = parseFloat(String(r.amount || "").trim());
      if (!Number.isFinite(v) || v <= 0) return sum;
      return sum + v;
    }, 0);
  }, [requestPlanRows]);

  const isOverQuoteLimit =
    quotePriceLimitDisplay != null && requestPlanTotalDisplay > quotePriceLimitDisplay + 0.01;
  const isAtOrOverQuoteLimit =
    quotePriceLimitDisplay != null && requestPlanTotalDisplay >= quotePriceLimitDisplay - 0.01;
  const remainingToLimit =
    quotePriceLimitDisplay != null ? quotePriceLimitDisplay - requestPlanTotalDisplay : null;

  const handleSubmit = async () => {
    if (!jobId) return;
    if (isOverQuoteLimit && quotePriceLimitDisplay != null) {
      toast.error(
        `Milestones total (${symbol}${requestPlanTotalDisplay.toFixed(2)}) cannot exceed the quote price (${symbol}${quotePriceLimitDisplay.toFixed(2)}).`
      );
      return;
    }
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
      onOpenChange={(next: boolean) => {
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
          {quotePriceLimitDisplay != null && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
              <div className="flex items-center justify-between gap-3 text-[13px] font-['Poppins',sans-serif]">
                <span className="text-[#0c4a6e]">Milestones total</span>
                <span className="text-[#0c4a6e] font-semibold tabular-nums">
                  {symbol}
                  {requestPlanTotalDisplay.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-[13px] font-['Poppins',sans-serif]">
                <span className="text-[#0c4a6e]">Quote price limit</span>
                <span className="text-[#0c4a6e] font-semibold tabular-nums">
                  {symbol}
                  {quotePriceLimitDisplay.toFixed(2)}
                </span>
              </div>
              {isOverQuoteLimit ? (
                <p className="mt-2 text-[12px] text-red-700 font-['Poppins',sans-serif]">
                  Total is over by {symbol}
                  {Math.abs(remainingToLimit || 0).toFixed(2)}. Please reduce amounts.
                </p>
              ) : remainingToLimit != null && remainingToLimit > 0.01 ? (
                <p className="mt-2 text-[12px] text-[#075985] font-['Poppins',sans-serif]">
                  You can add up to {symbol}
                  {remainingToLimit.toFixed(2)} more.
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-green-700 font-['Poppins',sans-serif]">
                  Total matches the quote price limit.
                </p>
              )}
            </div>
          )}
          {requestPlanRows.map((row, idx) => (
            <div key={idx} className="rounded-lg border border-sky-100 bg-sky-50/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#0c4a6e]">Milestone {idx + 1}</span>
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
          {!(quotePriceLimitDisplay != null && isAtOrOverQuoteLimit) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-dashed border-sky-300 text-sky-800"
              onClick={() => setRequestPlanRows((prev) => [...prev, { description: "", amount: "" }])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          )}
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
            disabled={submittingRequestPlan || isOverQuoteLimit}
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
      onOpenChange={(next: boolean) => {
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

type QuickPayMilestoneDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | undefined;
  fetchJobKey: string;
  professionalName?: string;
  quoteAmount: number; // selected currency
};

export function QuickPayMilestoneDialog({
  open,
  onOpenChange,
  jobId,
  fetchJobKey,
  professionalName,
  quoteAmount,
}: QuickPayMilestoneDialogProps) {
  const { symbol, toGBP, fromGBP, formatAmountInSelectedCurrency } = useCurrency();
  const { addMilestone, fetchJobById } = useJobs();
  const [rows, setRows] = useState<Array<{ name: string; amount: string }>>([{ name: "Initial milestone", amount: "" }]);
  const [walletBalanceGBP, setWalletBalanceGBP] = useState(0);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | null>(null);
  const [loadingFunding, setLoadingFunding] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows([{ name: "Initial milestone", amount: quoteAmount > 0 ? quoteAmount.toFixed(2) : "" }]);
  }, [open, quoteAmount]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      setLoadingFunding(true);
      try {
        const [balRes, pkRes] = await Promise.all([
          fetch(resolveApiUrl("/api/wallet/balance"), { credentials: "include" }),
          fetch(resolveApiUrl("/api/payment/publishable-key"), { credentials: "include" }),
        ]);
        if (!cancelled && balRes.ok) {
          const b = await balRes.json().catch(() => ({}));
          setWalletBalanceGBP(Number(b.balance) || 0);
        }
        if (!cancelled && pkRes.ok) {
          const d = await pkRes.json().catch(() => ({}));
          const sEnabled = d.stripeEnabled === true;
          const pEnabled = d.paypalEnabled === true;
          setStripeEnabled(sEnabled);
          setPaypalEnabled(pEnabled);
          if (!paymentMethod) {
            if (sEnabled) setPaymentMethod("card");
            else if (pEnabled) setPaymentMethod("paypal");
          }
        }
      } finally {
        if (!cancelled) setLoadingFunding(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const totalDisplay = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const quoteLimitDisplay = quoteAmount > 0 ? quoteAmount : 0;
  // Compare in cents to avoid floating-point precision glitches (e.g. showing over by 0.00).
  const toCents = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100);
  const totalCents = toCents(totalDisplay);
  const quoteCents = toCents(quoteLimitDisplay);
  const overByCents = Math.max(0, totalCents - quoteCents);
  const remainingCents = Math.max(0, quoteCents - totalCents);
  const overBy = overByCents / 100;
  const remainingDisplay = remainingCents / 100;
  const isOverLimit = overByCents > 0;

  const walletDisplay = fromGBP(walletBalanceGBP);
  const walletUsedDisplay = Math.min(totalDisplay, walletDisplay);
  const externalShortfallDisplay = Math.max(0, totalDisplay - walletUsedDisplay);

  const handlePayNow = () => {
    if (!jobId) return;
    const cleanRows = rows
      .map((r) => ({ name: String(r.name || "").trim(), amount: parseFloat(String(r.amount || "").trim()) }))
      .filter((r) => r.name.length > 0 && Number.isFinite(r.amount) && r.amount > 0);
    if (cleanRows.length === 0) {
      toast.error("Add at least one milestone with name and amount.");
      return;
    }
    if (isOverLimit) {
      toast.error(`Milestones total cannot exceed quote total (${symbol}${quoteLimitDisplay.toFixed(2)}).`);
      return;
    }
    // Close immediately for responsive UX; run network operations in background.
    onOpenChange(false);
    setRows([{ name: "Initial milestone", amount: quoteAmount > 0 ? quoteAmount.toFixed(2) : "" }]);
    const loadingToastId = toast.loading("Processing milestone payment setup...");
    void (async () => {
      try {
        for (const r of cleanRows) {
          await addMilestone(jobId, r.name, toGBP(r.amount));
        }
        if (fetchJobKey) void fetchJobById(fetchJobKey);
        toast.success("Milestone payment setup completed.", { id: loadingToastId });
      } catch (e: unknown) {
        const err = e as Error & { code?: string };
        if (err?.code === "INSUFFICIENT_BALANCE") {
          toast.error("Insufficient wallet balance. Please top up and try again.", { id: loadingToastId });
        } else {
          toast.error(err?.message || "Failed to fund milestone", { id: loadingToastId });
        }
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-2xl p-6 font-['Poppins',sans-serif]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f]">
            Set up Milestone Payments
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            You only have to pay for work when it has been completed and you&apos;re 100% satisfied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] px-3 py-2 font-['Poppins',sans-serif] text-[12px] text-[#1e40af]">
            {professionalName ? (
              <>Setting up milestones for <strong>{professionalName}</strong>. You can split payment into multiple steps.</>
            ) : (
              <>You can split payment into multiple milestones.</>
            )}
          </div>

          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  value={row.name}
                  onChange={(e) =>
                    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))
                  }
                  placeholder="Milestone name"
                  className="flex-1 font-['Poppins',sans-serif] text-[14px]"
                />
                <div className="flex items-center gap-1 w-[140px]">
                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">{symbol}</span>
                  <Input
                    type="number"
                    value={row.amount}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r)))
                    }
                    placeholder="0.00"
                    className="font-['Poppins',sans-serif] text-[14px]"
                    step="0.01"
                    min="0"
                  />
                </div>
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:bg-red-50 h-10 w-10 p-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {remainingDisplay > 0.001 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRows((prev) => [...prev, { name: "", amount: "" }])}
                className="font-['Poppins',sans-serif] text-[13px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add another milestone
              </Button>
            )}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-3 text-[13px] font-['Poppins',sans-serif]">
                <span className="text-[#6b6b6b]">Milestones total</span>
                <span className="text-[#2c353f] font-semibold">{symbol}{totalDisplay.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-[13px] font-['Poppins',sans-serif]">
                <span className="text-[#6b6b6b]">Quote price</span>
                <span className="text-[#2c353f] font-semibold">{symbol}{quoteLimitDisplay.toFixed(2)}</span>
              </div>
              {isOverLimit ? (
                <p className="mt-2 text-[12px] text-red-700 font-['Poppins',sans-serif]">
                  Total is over by {symbol}{overBy.toFixed(2)}. Please reduce amounts.
                </p>
              ) : remainingDisplay > 0.001 ? (
                <p className="mt-2 text-[12px] text-[#0f766e] font-['Poppins',sans-serif]">
                  Remaining: {symbol}{remainingDisplay.toFixed(2)}
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-green-700 font-['Poppins',sans-serif]">
                  Total matches quote price.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 bg-white">
            <p className="text-[13px] text-[#6b6b6b] mb-2">Payment method</p>
            {loadingFunding ? (
              <div className="flex items-center gap-2 text-[13px] text-[#6b6b6b]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading payment options...
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant={paymentMethod === "card" ? "default" : "outline"}
                className={paymentMethod === "card" ? "bg-[#3B82F6] hover:bg-[#2563eb] text-white" : ""}
                onClick={() => setPaymentMethod("card")}
                disabled={!stripeEnabled}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Card
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "paypal" ? "default" : "outline"}
                className={paymentMethod === "paypal" ? "bg-[#3B82F6] hover:bg-[#2563eb] text-white" : ""}
                onClick={() => setPaymentMethod("paypal")}
                disabled={!paypalEnabled}
              >
                <img src={paypalLogo} alt="" className="w-8 h-8 object-contain mr-2" />
                PayPal
              </Button>
            </div>
            )}
            <p className="mt-2 text-[11px] text-[#6b6b6b]">
              We always deduct your wallet balance first. If your balance is not enough, only the shortfall is charged via {paymentMethod === "paypal" ? "PayPal" : "Card"}.
            </p>
          </div>

          {totalDisplay > 0 && (
            <div className="rounded-lg border border-gray-200 bg-[#f8f9fa] p-4 space-y-2">
              <p className="font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                Invoice summary
              </p>
              <div className="flex justify-between font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                <span>Total</span>
                <span>{formatAmountInSelectedCurrency(totalDisplay)}</span>
              </div>
              <div className="flex justify-between font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                <span>Wallet Balance Used</span>
                <span>{formatAmountInSelectedCurrency(walletUsedDisplay)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-['Poppins',sans-serif] text-[15px] font-semibold text-[#2c353f]">
                <span>{externalShortfallDisplay > 0 ? "Remaining to Pay" : "Paid by Wallet"}</span>
                <span>{formatAmountInSelectedCurrency(externalShortfallDisplay > 0 ? externalShortfallDisplay : totalDisplay)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
              disabled={isOverLimit || totalDisplay <= 0}
              onClick={handlePayNow}
            >
              {`Pay and Create ${rows.length} Milestone(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AcceptSuggestedMilestonesPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | undefined;
  fetchJobKey: string;
  suggestedMilestones: Array<{ id: string; description: string; amount: number }>;
  totalAmount: number; // in selected currency
};

export function AcceptSuggestedMilestonesPaymentDialog({
  open,
  onOpenChange,
  jobId,
  fetchJobKey,
  suggestedMilestones,
  totalAmount,
}: AcceptSuggestedMilestonesPaymentDialogProps) {
  const { symbol, toGBP, fromGBP, formatAmountInSelectedCurrency } = useCurrency();
  const { fetchJobById } = useJobs();
  const [walletBalanceGBP, setWalletBalanceGBP] = useState(0);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | null>(null);
  const [loadingFunding, setLoadingFunding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      setLoadingFunding(true);
      try {
        const [balRes, pkRes] = await Promise.all([
          fetch(resolveApiUrl("/api/wallet/balance"), { credentials: "include" }),
          fetch(resolveApiUrl("/api/payment/publishable-key"), { credentials: "include" }),
        ]);
        if (!cancelled && balRes.ok) {
          const b = await balRes.json().catch(() => ({}));
          setWalletBalanceGBP(Number(b.balance) || 0);
        }
        if (!cancelled && pkRes.ok) {
          const d = await pkRes.json().catch(() => ({}));
          const sEnabled = d.stripeEnabled === true;
          const pEnabled = d.paypalEnabled === true;
          setStripeEnabled(sEnabled);
          setPaypalEnabled(pEnabled);
          if (!paymentMethod) {
            if (sEnabled) setPaymentMethod("card");
            else if (pEnabled) setPaymentMethod("paypal");
          }
        }
      } finally {
        if (!cancelled) setLoadingFunding(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const totalDisplayAmount = totalAmount;
  const walletDisplay = fromGBP(walletBalanceGBP);
  const walletUsedDisplay = Math.min(totalDisplayAmount, walletDisplay);
  const externalShortfallDisplay = Math.max(0, totalDisplayAmount - walletUsedDisplay);

  const handlePayNow = async () => {
    if (!jobId) return;
    setIsProcessing(true);
    const loadingToastId = toast.loading("Processing payment and accepting milestones...");
    try {
      // Get the awarded quote ID from the API
      const jobRes = await fetch(resolveApiUrl(`/api/jobs/${jobId}`), { credentials: "include" });
      if (!jobRes.ok) throw new Error("Failed to fetch job");
      const job = await jobRes.json();
      
      const awardedQuote = Array.isArray(job.quotes) 
        ? job.quotes.find((q: any) => q.status === "awarded")
        : null;
      
      if (!awardedQuote?.id) {
        throw new Error("No awarded quote found");
      }

      // Accept all pending suggested milestones
      for (const m of suggestedMilestones) {
        const res = await fetch(
          resolveApiUrl(
            `/api/jobs/${jobId}/quotes/${awardedQuote.id}/suggested-milestones/${m.id}/accept`
          ),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ paymentMethod }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to accept a milestone");
        }
      }

      if (fetchJobKey) await fetchJobById(fetchJobKey);
      toast.success("Payment processed and all milestones accepted.", { id: loadingToastId });
      onOpenChange(false);
    } catch (e: any) {
      if (fetchJobKey) void fetchJobById(fetchJobKey);
      toast.error(e?.message || "Failed to process payment", { id: loadingToastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-2xl p-6 font-['Poppins',sans-serif]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f]">
            Accept Suggested Milestone Payment Plan
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Review and pay for the professional&apos;s suggested milestones. You only pay when work is completed and you&apos;re satisfied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] px-3 py-2 font-['Poppins',sans-serif] text-[12px] text-[#1e40af]">
            Review the {suggestedMilestones.length} milestone(s) below and select your payment method.
          </div>

          <div className="space-y-2">
            <p className="font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">Milestones</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              <table className="w-full font-['Poppins',sans-serif] text-[13px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left py-2.5 px-3 font-medium text-[#2c353f]">Description</th>
                    <th className="text-right py-2.5 px-3 font-medium text-[#2c353f]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestedMilestones.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 last:border-0 bg-white">
                      <td className="py-2.5 px-3 text-[#2c353f]">{m.description || "Milestone"}</td>
                      <td className="py-2.5 px-3 text-right text-[#2c353f]">
                        {formatAmountInSelectedCurrency(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 bg-white">
            <p className="text-[13px] text-[#6b6b6b] mb-2">Payment method</p>
            {loadingFunding ? (
              <div className="flex items-center gap-2 text-[13px] text-[#6b6b6b]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading payment options...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className={paymentMethod === "card" ? "bg-[#3B82F6] hover:bg-[#2563eb] text-white" : ""}
                  onClick={() => setPaymentMethod("card")}
                  disabled={!stripeEnabled}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "paypal" ? "default" : "outline"}
                  className={paymentMethod === "paypal" ? "bg-[#3B82F6] hover:bg-[#2563eb] text-white" : ""}
                  onClick={() => setPaymentMethod("paypal")}
                  disabled={!paypalEnabled}
                >
                  <img src={paypalLogo} alt="" className="w-8 h-8 object-contain mr-2" />
                  PayPal
                </Button>
              </div>
            )}
            <p className="mt-2 text-[11px] text-[#6b6b6b]">
              We always deduct your wallet balance first. If your balance is not enough, only the shortfall is charged via {paymentMethod === "paypal" ? "PayPal" : "Card"}.
            </p>
          </div>

          {totalDisplayAmount > 0 && (
            <div className="rounded-lg border border-gray-200 bg-[#f8f9fa] p-4 space-y-2">
              <p className="font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                Invoice summary
              </p>
              <div className="flex justify-between font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                <span>Total</span>
                <span>{formatAmountInSelectedCurrency(totalDisplayAmount)}</span>
              </div>
              <div className="flex justify-between font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                <span>Wallet Balance Used</span>
                <span>{formatAmountInSelectedCurrency(walletUsedDisplay)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-['Poppins',sans-serif] text-[15px] font-semibold text-[#2c353f]">
                <span>{externalShortfallDisplay > 0 ? "Remaining to Pay" : "Paid by Wallet"}</span>
                <span>{formatAmountInSelectedCurrency(externalShortfallDisplay > 0 ? externalShortfallDisplay : totalDisplayAmount)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white disabled:opacity-50"
              disabled={isProcessing || !paymentMethod}
              onClick={handlePayNow}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay Now and Accept ${suggestedMilestones.length} Milestone(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AcceptRequestedMilestonesPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | undefined;
  fetchJobKey: string;
  requestedMilestones: Array<{ id: string; description: string; amount: number }>;
  totalAmount: number; // in selected currency
};

export function AcceptRequestedMilestonesPaymentDialog({
  open,
  onOpenChange,
  jobId,
  fetchJobKey,
  requestedMilestones,
  totalAmount,
}: AcceptRequestedMilestonesPaymentDialogProps) {
  const { symbol, toGBP, fromGBP, formatAmountInSelectedCurrency } = useCurrency();
  const { fetchJobById } = useJobs();
  const [walletBalanceGBP, setWalletBalanceGBP] = useState(0);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | null>(null);
  const [loadingFunding, setLoadingFunding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      setLoadingFunding(true);
      try {
        const [balRes, pkRes] = await Promise.all([
          fetch(resolveApiUrl("/api/wallet/balance"), { credentials: "include" }),
          fetch(resolveApiUrl("/api/payment/publishable-key"), { credentials: "include" }),
        ]);
        if (!cancelled && balRes.ok) {
          const b = await balRes.json().catch(() => ({}));
          setWalletBalanceGBP(Number(b.balance) || 0);
        }
        if (!cancelled && pkRes.ok) {
          const d = await pkRes.json().catch(() => ({}));
          const sEnabled = d.stripeEnabled === true;
          const pEnabled = d.paypalEnabled === true;
          setStripeEnabled(sEnabled);
          setPaypalEnabled(pEnabled);
          if (!paymentMethod) {
            if (sEnabled) setPaymentMethod("card");
            else if (pEnabled) setPaymentMethod("paypal");
          }
        }
      } finally {
        if (!cancelled) setLoadingFunding(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const totalDisplayAmount = totalAmount;
  const walletDisplay = fromGBP(walletBalanceGBP);
  const walletUsedDisplay = Math.min(totalDisplayAmount, walletDisplay);
  const externalShortfallDisplay = Math.max(0, totalDisplayAmount - walletUsedDisplay);

  const handlePayNow = async () => {
    if (!jobId) return;
    setIsProcessing(true);
    const loadingToastId = toast.loading("Processing payment and accepting milestones...");
    try {
      // Accept all pending requested milestones
      for (const m of requestedMilestones) {
        const res = await fetch(
          resolveApiUrl(
            `/api/jobs/${jobId}/requested-milestones/${m.id}/accept`
          ),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ paymentMethod }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to accept a milestone");
        }
      }

      if (fetchJobKey) await fetchJobById(fetchJobKey);
      toast.success("Payment processed and all milestone requests accepted.", { id: loadingToastId });
      onOpenChange(false);
    } catch (e: any) {
      if (fetchJobKey) void fetchJobById(fetchJobKey);
      toast.error(e?.message || "Failed to process payment", { id: loadingToastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-2xl p-6 font-['Poppins',sans-serif]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f]">
            Accept Professional&apos;s Milestone Plan Request
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Review and pay for the professional&apos;s requested payment milestones. You only pay when work is completed and you&apos;re satisfied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] px-3 py-2 font-['Poppins',sans-serif] text-[12px] text-[#1e40af]">
            Review the {requestedMilestones.length} milestone(s) below and select your payment method.
          </div>

          <div className="space-y-2">
            <p className="font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">Milestones</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              <table className="w-full font-['Poppins',sans-serif] text-[13px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left py-2.5 px-3 font-medium text-[#2c353f]">Description</th>
                    <th className="text-right py-2.5 px-3 font-medium text-[#2c353f]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {requestedMilestones.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 last:border-0 bg-white">
                      <td className="py-2.5 px-3 text-[#2c353f]">{m.description || "Milestone"}</td>
                      <td className="py-2.5 px-3 text-right text-[#2c353f]">
                        {formatAmountInSelectedCurrency(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 bg-white">
            <p className="text-[13px] text-[#6b6b6b] mb-2">Payment method</p>
            {loadingFunding ? (
              <div className="flex items-center gap-2 text-[13px] text-[#6b6b6b]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading payment options...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className={paymentMethod === "card" ? "bg-[#3B82F6] hover:bg-[#2563eb] text-white" : ""}
                  onClick={() => setPaymentMethod("card")}
                  disabled={!stripeEnabled}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "paypal" ? "default" : "outline"}
                  className={paymentMethod === "paypal" ? "bg-[#3B82F6] hover:bg-[#2563eb] text-white" : ""}
                  onClick={() => setPaymentMethod("paypal")}
                  disabled={!paypalEnabled}
                >
                  <img src={paypalLogo} alt="" className="w-8 h-8 object-contain mr-2" />
                  PayPal
                </Button>
              </div>
            )}
            <p className="mt-2 text-[11px] text-[#6b6b6b]">
              We always deduct your wallet balance first. If your balance is not enough, only the shortfall is charged via {paymentMethod === "paypal" ? "PayPal" : "Card"}.
            </p>
          </div>

          {totalDisplayAmount > 0 && (
            <div className="rounded-lg border border-gray-200 bg-[#f8f9fa] p-4 space-y-2">
              <p className="font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                Invoice summary
              </p>
              <div className="flex justify-between font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                <span>Total</span>
                <span>{formatAmountInSelectedCurrency(totalDisplayAmount)}</span>
              </div>
              <div className="flex justify-between font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                <span>Wallet Balance Used</span>
                <span>{formatAmountInSelectedCurrency(walletUsedDisplay)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-['Poppins',sans-serif] text-[15px] font-semibold text-[#2c353f]">
                <span>{externalShortfallDisplay > 0 ? "Remaining to Pay" : "Paid by Wallet"}</span>
                <span>{formatAmountInSelectedCurrency(externalShortfallDisplay > 0 ? externalShortfallDisplay : totalDisplayAmount)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white disabled:opacity-50"
              disabled={isProcessing || !paymentMethod}
              onClick={handlePayNow}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay Now and Accept ${requestedMilestones.length} Milestone(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
