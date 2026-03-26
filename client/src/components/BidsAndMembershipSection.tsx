import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Loader2, Calendar, ChevronDown, ChevronUp, Search, ArrowUpDown, ArrowUp, ArrowDown, FileText, CreditCard, CircleDollarSign, Eye, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import { resolveApiUrl } from "../config/api";
import { toast } from "sonner@2.0.3";
import { useCurrency } from "./CurrencyContext";
import WalletFundModal from "./WalletFundModal";

interface CreditPurchaseRow {
  kind: "purchase";
  id: string;
  purchasedAt: string;
  credits: number;
  amountPounds: number;
  planName: string;
  invoiceNumber: string;
}

interface QuoteCreditUsageRow {
  kind: "quote_used";
  id: string;
  usedAt: string;
  credits: number;
  jobId: string;
  jobSlug: string;
  jobTitle: string;
  source: "free" | "purchased";
}

type CreditHistoryRow = CreditPurchaseRow | QuoteCreditUsageRow;

function historyRowDate(r: CreditHistoryRow): string {
  return r.kind === "purchase" ? r.purchasedAt : r.usedAt;
}

function historyRowDetail(r: CreditHistoryRow): string {
  return r.kind === "purchase" ? r.planName : r.jobTitle;
}

interface Balance {
  freeBidsRemaining: number;
  purchasedTotal: number;
  totalAvailable: number;
  freeBidsResetAt: string | null;
  purchasedBlocks: { bids: number; expiresAt: string }[];
}

interface Plan {
  id: string;
  _id?: string;
  name: string;
  bids: number;
  amountPence: number;
  amountFormatted: string;
  validityMonths: number;
}

function formatDate(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const CUSTOM_OPTION_VALUE = "custom";

type CreditTab = "balance" | "history";

const TABS: { id: CreditTab; label: string }[] = [
  { id: "balance", label: "Balance" },
  { id: "history", label: "History" },
];

function notifyBidsChanged() {
  try {
    window.dispatchEvent(new Event("bids:changed"));
  } catch {
    /* ignore */
  }
}

export default function BidsAndMembershipSection({
  hideHeader = false,
  hideHistoryTab = false,
  purchaseOnlyMode = false,
  onWalletFundModalOpenChange,
  /** After wallet top-up + credit purchase (or balance purchase) succeeds from this UI — e.g. close quote-credits slider so Send Quote modal is visible again. */
  onQuoteCreditsPurchaseSuccess,
}: {
  hideHeader?: boolean;
  hideHistoryTab?: boolean;
  purchaseOnlyMode?: boolean;
  onWalletFundModalOpenChange?: (open: boolean) => void;
  onQuoteCreditsPurchaseSuccess?: () => void;
}) {
  const { formatPrice, currency, rate, fromGBP } = useCurrency();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CreditTab>("balance");
  const [balance, setBalance] = useState<Balance | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pricePerBid, setPricePerBid] = useState<number>(2.5);
  const [loading, setLoading] = useState(true);
  const [purchaseExpanded, setPurchaseExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [customQuantity, setCustomQuantity] = useState<number>(10);
  const [purchasingCustom, setPurchasingCustom] = useState(false);

  // Quote credits purchase payment method
  type QuoteCreditPaymentMethod = "card" | "paypal" | "wallet";
  const [quoteCreditPaymentMethod, setQuoteCreditPaymentMethod] = useState<QuoteCreditPaymentMethod>("card");
  const [showWalletFundModal, setShowWalletFundModal] = useState(false);
  const [waitingForExternalPayment, setWaitingForExternalPayment] = useState(false);
  const pendingPurchaseRef = useRef<{ kind: "custom"; qty: number } | { kind: "plan"; planId: string } | null>(null);
  const [walletFundInitialAmount, setWalletFundInitialAmount] = useState<string>("");
  const [walletBalanceGBP, setWalletBalanceGBP] = useState<number>(0);

  useEffect(() => {
    onWalletFundModalOpenChange?.(showWalletFundModal);
  }, [showWalletFundModal, onWalletFundModalOpenChange]);

  const [historyList, setHistoryList] = useState<CreditHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySortBy, setHistorySortBy] = useState<"date" | "credits" | "amountPounds" | "detail">("date");
  const [historySortDir, setHistorySortDir] = useState<"asc" | "desc">("desc");

  const fetchBalance = async () => {
    try {
      const res = await fetch(resolveApiUrl("/api/bids/balance"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(resolveApiUrl("/api/bids/plans"));
      if (res.ok) {
        const data = await res.json();
        const planList = data.plans ?? (Array.isArray(data) ? data : []);
        const normalized = planList.map((p: Plan) => ({
          ...p,
          id: String(p.id ?? p._id ?? ""),
        }));
        setPlans(normalized);
        if (typeof data.pricePerBid === "number" && data.pricePerBid >= 0) {
          setPricePerBid(data.pricePerBid);
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await fetch(resolveApiUrl("/api/wallet/balance"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setWalletBalanceGBP(typeof data.balance === "number" ? data.balance : 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([fetchBalance(), fetchPlans(), fetchWalletBalance()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Refresh balance when quotes consume credits (JobDetailPage dispatches "bids:changed")
  useEffect(() => {
    const onChanged = () => {
      fetchBalance();
      fetchWalletBalance();
    };
    window.addEventListener("bids:changed", onChanged);
    return () => {
      window.removeEventListener("bids:changed", onChanged);
    };
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(resolveApiUrl("/api/bids/history"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data.items) ? data.items : [];
        setHistoryList(raw as CreditHistoryRow[]);
      }
    } catch {
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  useEffect(() => {
    if (hideHistoryTab && activeTab === "history") {
      setActiveTab("balance");
    }
  }, [hideHistoryTab, activeTab]);

  useEffect(() => {
    if (purchaseOnlyMode) {
      setActiveTab("balance");
      setPurchaseExpanded(true);
    }
  }, [purchaseOnlyMode]);

  const filteredAndSortedHistory = useMemo(() => {
    let list = [...historyList];
    if (historySearch.trim()) {
      const q = historySearch.trim().toLowerCase();
      list = list.filter((r) => {
        const dateStr = new Date(historyRowDate(r)).toLocaleDateString("en-GB").toLowerCase();
        if (dateStr.includes(q) || String(r.credits).includes(q)) return true;
        if (r.kind === "purchase") {
          return (
            r.invoiceNumber.toLowerCase().includes(q) ||
            r.planName.toLowerCase().includes(q) ||
            String(r.amountPounds).includes(q)
          );
        }
        return (
          r.jobTitle.toLowerCase().includes(q) ||
          r.jobId.toLowerCase().includes(q) ||
          (r.jobSlug && r.jobSlug.toLowerCase().includes(q)) ||
          r.source.toLowerCase().includes(q) ||
          (q.length >= 3 && "quote sent".includes(q))
        );
      });
    }
    const amountOf = (r: CreditHistoryRow) => (r.kind === "purchase" ? r.amountPounds : 0);
    list.sort((a, b) => {
      let cmp = 0;
      if (historySortBy === "date") {
        cmp = new Date(historyRowDate(a)).getTime() - new Date(historyRowDate(b)).getTime();
      } else if (historySortBy === "credits") cmp = a.credits - b.credits;
      else if (historySortBy === "amountPounds") cmp = amountOf(a) - amountOf(b);
      else if (historySortBy === "detail")
        cmp = historyRowDetail(a).localeCompare(historyRowDetail(b));
      return historySortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [historyList, historySearch, historySortBy, historySortDir]);

  const handleViewInvoice = (purchaseId: string) => {
    const query = `currency=${encodeURIComponent(currency)}&rate=${encodeURIComponent(String(rate))}`;
    const url = resolveApiUrl(`/api/bids/invoice/${purchaseId}?${query}`);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleViewJobQuotes = (row: QuoteCreditUsageRow) => {
    const path = row.jobSlug || row.jobId;
    if (!path) return;
    navigate(`/job/${path}?tab=quotes`);
  };

  const handlePurchase = async (planId: string) => {
    setPurchasingPlanId(planId);
    try {
      const res = await fetch(resolveApiUrl("/api/bids/purchase"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || "Plan purchased. Your credits have been added.");
        await fetchBalance();
        await fetchWalletBalance();
        notifyBidsChanged();
        if (activeTab === "history") await fetchHistory();
        onQuoteCreditsPurchaseSuccess?.();
      } else {
        const isInsufficient = (data.error || "").toLowerCase().includes("insufficient wallet");
        if (isInsufficient) {
          // Keep user on the same page/modal; fund the shortfall via selected payment method.
          const selectedPlanNow = plans.find((p) => p.id === planId);
          if (selectedPlanNow) {
            const requiredGBP = selectedPlanNow.amountPence / 100;
            const amountSelectedCurrency = fromGBP(Math.max(0, requiredGBP - walletBalanceGBP));
            pendingPurchaseRef.current = { kind: "plan", planId };
            setWalletFundInitialAmount(amountSelectedCurrency.toFixed(2));
            setWaitingForExternalPayment(true);
            setShowWalletFundModal(true);
          } else {
            toast.error("Insufficient wallet balance. Please try again.");
          }
        } else {
          toast.error(data.error || "Purchase failed");
        }
      }
    } catch {
      toast.error("Purchase failed");
    } finally {
      setPurchasingPlanId(null);
    }
  };

  /** `quantityOverride` — use after card/PayPal wallet top-up so the purchased qty matches the amount funded (not stale UI state). */
  const handlePurchaseCustom = async (quantityOverride?: number) => {
    const qty = Math.max(
      1,
      Math.min(
        500,
        Math.floor(Number(quantityOverride ?? customQuantity)) || 1
      )
    );
    setPurchasingCustom(true);
    try {
      const res = await fetch(resolveApiUrl("/api/bids/purchase-custom"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || `${qty} credits purchased.`);
        await fetchBalance();
        await fetchWalletBalance();
        notifyBidsChanged();
        if (activeTab === "history") await fetchHistory();
        onQuoteCreditsPurchaseSuccess?.();
      } else {
        const isInsufficient = (data.error || "").toLowerCase().includes("insufficient wallet");
        if (isInsufficient) {
          // Keep user on the same page/modal; fund the shortfall via selected payment method.
          const requiredGBP = qty * pricePerBid;
          const amountSelectedCurrency = fromGBP(Math.max(0, requiredGBP - walletBalanceGBP));
          pendingPurchaseRef.current = { kind: "custom", qty };
          setWalletFundInitialAmount(amountSelectedCurrency.toFixed(2));
          setWaitingForExternalPayment(true);
          setShowWalletFundModal(true);
        } else {
          toast.error(data.error || "Purchase failed");
        }
      }
    } catch {
      toast.error("Purchase failed");
    } finally {
      setPurchasingCustom(false);
    }
  };

  const handleWalletFundSuccessThenPurchase = async () => {
    setWaitingForExternalPayment(false);
    const pending = pendingPurchaseRef.current;
    pendingPurchaseRef.current = null;
    if (!pending) return;

    // Wallet was just funded via Stripe/PayPal; deduct from wallet and add credits (second step).
    if (pending.kind === "custom") {
      await handlePurchaseCustom(pending.qty);
    } else {
      await handlePurchase(pending.planId);
    }
  };

  const customQty = Math.max(1, Math.min(500, Math.floor(Number(customQuantity)) || 1));
  const selectedPlan = plans.find((p) => p.id === selectedOption);
  const purchaseRequiredGBP =
    selectedOption === CUSTOM_OPTION_VALUE
      ? customQty * pricePerBid
      : selectedPlan
        ? selectedPlan.amountPence / 100
        : 0;
  const walletWillBeUsed = quoteCreditPaymentMethod === "wallet";
  const walletDeductGBP = walletWillBeUsed ? Math.min(walletBalanceGBP, Math.max(0, purchaseRequiredGBP)) : 0;
  const externalShortfallGBP = walletWillBeUsed ? Math.max(0, purchaseRequiredGBP - walletBalanceGBP) : purchaseRequiredGBP;
  const isWalletSufficientForPurchase = purchaseRequiredGBP > 0 && walletBalanceGBP >= purchaseRequiredGBP;
  const walletOptionVisible = purchaseRequiredGBP > 0 && walletBalanceGBP >= purchaseRequiredGBP;

  useLayoutEffect(() => {
    if (quoteCreditPaymentMethod !== "card" && quoteCreditPaymentMethod !== "paypal" && quoteCreditPaymentMethod !== "wallet") {
      setQuoteCreditPaymentMethod("card");
    }
  }, [quoteCreditPaymentMethod]);

  // If user selects a package that is more than wallet balance,
  // hide Wallet option and force Card as default.
  useLayoutEffect(() => {
    if (purchaseRequiredGBP <= 0) return;
    if (!walletOptionVisible && quoteCreditPaymentMethod !== "card") {
      setQuoteCreditPaymentMethod("card");
    }
    // If Wallet is currently selected but the package is not coverable, also switch.
    if (!walletOptionVisible && quoteCreditPaymentMethod === "wallet") {
      setQuoteCreditPaymentMethod("card");
    }
  }, [purchaseRequiredGBP, walletOptionVisible, quoteCreditPaymentMethod]);

  const handleBuyCredit = async () => {
    if (!purchaseRequiredGBP || purchaseRequiredGBP <= 0) {
      toast.error("Please select a credit option first.");
      return;
    }

    if (quoteCreditPaymentMethod === "wallet") {
      // Wallet mode: only allow purchase when wallet balance is sufficient.
      if (!isWalletSufficientForPurchase) {
        toast.error("Insufficient wallet balance for this purchase. Please choose Card or PayPal.");
        return;
      }
      if (selectedOption === CUSTOM_OPTION_VALUE) return handlePurchaseCustom();
      if (selectedPlan?.id) return handlePurchase(selectedPlan.id);
      return;
    }

    // Card/PayPal mode: do NOT consume existing wallet balance.
    // Since the backend purchase deducts from wallet, we fund wallet for the full amount first,
    // then immediately purchase; net effect is external payment for the full price.
    pendingPurchaseRef.current =
      selectedOption === CUSTOM_OPTION_VALUE
        ? { kind: "custom", qty: customQty }
        : selectedPlan?.id
          ? { kind: "plan", planId: selectedPlan.id }
          : null;

    if (!pendingPurchaseRef.current) {
      toast.error("Please select a credit plan first.");
      return;
    }

    const amountSelectedCurrency = fromGBP(purchaseRequiredGBP);
    setWalletFundInitialAmount(amountSelectedCurrency.toFixed(2));
    setWaitingForExternalPayment(true);
    setShowWalletFundModal(true);
  };

  const isPurchasing = purchasingPlanId !== null || purchasingCustom || waitingForExternalPayment;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!hideHeader && (
        <div>
          <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
            Quote credits
          </h2>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            You use one credit each time you submit a quote on a project. Free credits are refreshed every month. You can buy extra credit packs below.
          </p>
        </div>
      )}

      {!purchaseOnlyMode && (
        <div className="border-b border-gray-200">
          <nav className="flex gap-6" aria-label="Quote credits tabs">
            {(hideHistoryTab ? TABS.filter((tab) => tab.id !== "history") : TABS).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`font-['Poppins',sans-serif] text-[15px] font-medium pb-3 -mb-px border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#FE8A0F] text-[#FE8A0F]"
                    : "border-transparent text-[#6b6b6b] hover:text-[#2c353f]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Balance tab */}
      {activeTab === "balance" && (
        <>
      {!purchaseOnlyMode && (
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-[#FFF9F5] to-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#FE8A0F]" />
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">Your credit balance</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Total available</p>
              <p className="font-['Poppins',sans-serif] text-[28px] font-semibold text-[#2c353f]">
                {balance?.totalAvailable ?? 0} <span className="text-[14px] font-normal text-[#6b6b6b]">credits</span>
              </p>
            </div>
            <div>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Free (this month)</p>
              <p className="font-['Poppins',sans-serif] text-[20px] font-medium text-[#2c353f]">
                {balance?.freeBidsRemaining ?? 0} <span className="text-[13px] font-normal text-[#6b6b6b]">credits</span>
              </p>
              {balance?.freeBidsResetAt && (
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Resets {formatDate(balance.freeBidsResetAt)}
                </p>
              )}
            </div>
            <div>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Purchased</p>
              <p className="font-['Poppins',sans-serif] text-[20px] font-medium text-[#2c353f]">
                {balance?.purchasedTotal ?? 0} <span className="text-[13px] font-normal text-[#6b6b6b]">credits</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={() => setPurchaseExpanded((prev) => !prev)}
              variant="outline"
              className="font-['Poppins',sans-serif] border-2 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB] hover:border-[#FE8A0F]"
            >
              {purchaseExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide purchase
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Recharge
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Expandable Purchase credit section */}
      {(purchaseOnlyMode || purchaseExpanded) && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="font-['Poppins',sans-serif] text-[18px] font-medium text-[#2c353f] mb-2">
            Purchase credit
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-6">
            Credits are valid for one month from purchase.{" "}
            {quoteCreditPaymentMethod === "wallet"
              ? "In Wallet mode, your wallet balance will be used."
              : "In Card/PayPal mode, your wallet balance is not used; we charge the selected method for the full amount."}
          </p>

          <div className="mb-6 flex flex-wrap gap-2">
            {(
              [
                { id: "card" as const, label: "Card" },
                { id: "paypal" as const, label: "PayPal" },
                ...(walletOptionVisible ? ([{ id: "wallet" as const, label: "Wallet" }] as const) : []),
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setQuoteCreditPaymentMethod(opt.id)}
                className={[
                  "px-4 py-2 rounded-xl border-2 transition-all font-['Poppins',sans-serif] text-[14px] font-semibold",
                  quoteCreditPaymentMethod === opt.id
                    ? "border-[#FE8A0F] bg-[#FFF5EB] text-[#FE8A0F]"
                    : "border-gray-200 bg-white text-[#2c353f] hover:border-gray-300",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2">
                  {opt.id === "card" && <CreditCard className="w-4 h-4 text-[#FE8A0F]" />}
                  {opt.id === "paypal" && <CircleDollarSign className="w-4 h-4 text-[#FE8A0F]" />}
                  {opt.id === "wallet" && <Wallet className="w-4 h-4 text-[#FE8A0F]" />}
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          {purchaseRequiredGBP > 0 && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-[#f8f9fa] p-4 space-y-2">
              <p className="font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                Invoice summary
              </p>
              <div className="flex justify-between font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f]">
                <span>Total</span>
                <span>{formatPrice(purchaseRequiredGBP)}</span>
              </div>
              <div className="flex justify-between font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f]">
                <span>Wallet Balance Used</span>
                <span>{formatPrice(walletDeductGBP)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-['Poppins',sans-serif] text-[14px] sm:text-[15px] font-semibold text-[#2c353f]">
                <span>{externalShortfallGBP > 0 ? "Remaining to Pay" : "Paid by Wallet"}</span>
                <span>
                  {formatPrice(externalShortfallGBP > 0 ? externalShortfallGBP : purchaseRequiredGBP)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <p className="font-['Poppins',sans-serif] text-[13px] font-medium text-[#2c353f] mb-3">
                Select an option
              </p>
              <div className="grid grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                  className={`flex flex-col gap-2 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all min-h-[132px] ${
                      selectedOption === plan.id
                        ? "border-[#FE8A0F] bg-[#FFF5EB]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="credit-option"
                        value={plan.id}
                        checked={selectedOption === plan.id}
                        onChange={() => setSelectedOption(plan.id)}
                        className="sr-only peer"
                      />
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          selectedOption === plan.id
                            ? "bg-[#FE8A0F] border-white"
                            : "bg-white border-gray-300"
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-['Poppins',sans-serif] text-[14px] sm:text-[15px] font-medium text-[#2c353f] block break-words leading-snug">
                          {plan.name}
                        </span>
                        <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mt-0.5 break-words leading-snug">
                          {plan.bids} credit{plan.bids !== 1 ? "s" : ""} · {plan.validityMonths} month
                          {plan.validityMonths !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-['Poppins',sans-serif] text-[14px] sm:text-[16px] font-semibold text-[#2c353f] pl-7 break-words leading-snug">
                      {formatPrice(plan.amountPence / 100)}
                    </span>
                  </label>
                ))}
                <label
                  className={`flex flex-col gap-2 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all min-h-[132px] ${
                    selectedOption === CUSTOM_OPTION_VALUE
                      ? "border-[#FE8A0F] bg-[#FFF5EB]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="credit-option"
                      value={CUSTOM_OPTION_VALUE}
                      checked={selectedOption === CUSTOM_OPTION_VALUE}
                      onChange={() => setSelectedOption(CUSTOM_OPTION_VALUE)}
                      className="sr-only peer"
                    />
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                        selectedOption === CUSTOM_OPTION_VALUE
                          ? "bg-[#FE8A0F] border-white"
                          : "bg-white border-gray-300"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-['Poppins',sans-serif] text-[14px] sm:text-[15px] font-medium text-[#2c353f] block break-words leading-snug">
                        Custom
                      </span>
                      <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mt-0.5 break-words leading-snug">
                        {formatPrice(pricePerBid)}/credit
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom quantity (when Custom selected) or Buy credit button */}
            <div className="flex flex-col justify-center pt-1 border-t border-gray-100">
              {selectedOption === CUSTOM_OPTION_VALUE ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5">
                  <label htmlFor="customQuantity" className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] block mb-2">
                    Number of credits (1–500)
                  </label>
                  <div className="flex flex-wrap items-end gap-4">
                    <input
                      id="customQuantity"
                      type="number"
                      min={1}
                      max={500}
                      value={customQuantity}
                      onChange={(e) => {
                        const v = e.target.value;
                        const n = parseInt(v, 10);
                        if (v === "") setCustomQuantity(1);
                        else if (!Number.isNaN(n)) setCustomQuantity(Math.max(1, Math.min(500, n)));
                      }}
                      className="w-28 h-11 px-3 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F] focus:outline-none"
                    />
                    <span className="font-['Poppins',sans-serif] text-[18px] font-semibold text-[#2c353f]">
                      Total: {formatPrice(customQuantity * pricePerBid)}
                    </span>
                    <Button
                      onClick={handleBuyCredit}
                      disabled={isPurchasing || (quoteCreditPaymentMethod === "wallet" && !isWalletSufficientForPurchase)}
                      className="bg-[#FE8A0F] hover:bg-[#e57d0e] text-white font-['Poppins',sans-serif] h-11"
                    >
                      {purchasingCustom || waitingForExternalPayment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Buy credit"
                      )}
                    </Button>
                  </div>
                </div>
              ) : selectedOption ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {selectedPlan && (
                    <>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        {selectedPlan.name}: {selectedPlan.bids} credits for {formatPrice(selectedPlan.amountPence / 100)}
                      </p>
                      <Button
                        onClick={handleBuyCredit}
                        disabled={isPurchasing || (quoteCreditPaymentMethod === "wallet" && !isWalletSufficientForPurchase)}
                        className="bg-[#FE8A0F] hover:bg-[#e57d0e] text-white font-['Poppins',sans-serif] h-11 shrink-0"
                      >
                        {waitingForExternalPayment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : purchasingPlanId === selectedOption ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Buy credit"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Select a package above to purchase credits.
                </p>
              )}
            </div>
          </div>

          {plans.length === 0 && (
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mt-4">
              No plans available at the moment. You can use Custom to buy credits at {formatPrice(pricePerBid)} per credit.
            </p>
          )}
        </div>
      )}
        </>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="font-['Poppins',sans-serif] text-[18px] font-medium text-[#2c353f] mb-2">
            Quote credit history
          </h3>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
            Purchases and each time you used a credit to send a quote on a job.
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by date, job, plan, invoice #..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F] focus:outline-none"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
            </div>
          ) : filteredAndSortedHistory.length === 0 ? (
            <div className="py-12 text-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                {historyList.length === 0 ? "No activity yet." : "No results match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full font-['Poppins',sans-serif] text-[14px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">
                      <button
                        type="button"
                        onClick={() => {
                          setHistorySortBy("date");
                          setHistorySortDir((d) => (d === "asc" ? "desc" : "asc"));
                        }}
                        className="flex items-center gap-1 hover:text-[#FE8A0F]"
                      >
                        Date
                        {historySortBy === "date" ? (historySortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-50" />}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">
                      <button
                        type="button"
                        onClick={() => {
                          setHistorySortBy("detail");
                          setHistorySortDir((d) => (d === "asc" ? "desc" : "asc"));
                        }}
                        className="flex items-center gap-1 hover:text-[#FE8A0F]"
                      >
                        Details
                        {historySortBy === "detail" ? (historySortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-50" />}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">
                      <button
                        type="button"
                        onClick={() => {
                          setHistorySortBy("credits");
                          setHistorySortDir((d) => (d === "asc" ? "desc" : "asc"));
                        }}
                        className="flex items-center gap-1 hover:text-[#FE8A0F]"
                      >
                        Credits
                        {historySortBy === "credits" ? (historySortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-50" />}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">
                      <button
                        type="button"
                        onClick={() => {
                          setHistorySortBy("amountPounds");
                          setHistorySortDir((d) => (d === "asc" ? "desc" : "asc"));
                        }}
                        className="flex items-center gap-1 hover:text-[#FE8A0F]"
                      >
                        Amount
                        {historySortBy === "amountPounds" ? (historySortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-50" />}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-[#2c353f]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedHistory.map((row) => (
                    <tr key={`${row.kind}-${row.id}`} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-[#2c353f] whitespace-nowrap">
                        {formatDate(historyRowDate(row))}
                      </td>
                      <td className="py-3 px-4 text-[#2c353f]">
                        {row.kind === "purchase" ? (
                          <span className="inline-flex rounded-md bg-blue-50 text-blue-800 border border-blue-100 px-2 py-0.5 text-[12px] font-medium">
                            Purchase
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md bg-amber-50 text-amber-900 border border-amber-100 px-2 py-0.5 text-[12px] font-medium">
                            Quote sent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#2c353f] max-w-[240px]">
                        {row.kind === "purchase" ? (
                          <span>
                            {row.planName} plan
                            <span className="block text-[12px] text-[#6b6b6b] mt-0.5">{row.invoiceNumber}</span>
                          </span>
                        ) : (
                          <span>
                            {row.jobTitle}
                            <span className="block text-[12px] text-[#6b6b6b] mt-0.5">
                              {row.source === "free" ? "Monthly free credit" : "Purchased credit"}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#2c353f]">{row.credits}</td>
                      <td className="py-3 px-4 text-[#2c353f]">
                        {row.kind === "purchase" ? formatPrice(row.amountPounds || 0) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.kind === "purchase" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(row.id)}
                            className="font-['Poppins',sans-serif] border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                          >
                            <FileText className="w-4 h-4 mr-1.5" />
                            View invoice
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewJobQuotes(row)}
                            className="font-['Poppins',sans-serif] border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <WalletFundModal
        isOpen={showWalletFundModal}
        onClose={() => {
          setShowWalletFundModal(false);
          setWaitingForExternalPayment(false);
          pendingPurchaseRef.current = null;
        }}
        onSuccess={() => {
          void handleWalletFundSuccessThenPurchase();
        }}
        hideTitle
        hideBankOption
        restrictToSelectedPaymentType
        lockAmount
        forQuoteCreditPurchase
        initialPaymentType={quoteCreditPaymentMethod === "wallet" ? "card" : quoteCreditPaymentMethod}
        initialAmount={walletFundInitialAmount}
      />
    </div>
  );
}
