import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Loader2, Calendar, ChevronDown, ChevronUp, Search, ArrowUpDown, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { resolveApiUrl } from "../config/api";
import { toast } from "sonner@2.0.3";
import { useCurrency } from "./CurrencyContext";

interface CreditPurchaseRecord {
  id: string;
  purchasedAt: string;
  credits: number;
  amountPounds: number;
  planName: string;
  invoiceNumber: string;
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

export default function BidsAndMembershipSection() {
  const { formatPrice, currency } = useCurrency();
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

  const [historyList, setHistoryList] = useState<CreditPurchaseRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySortBy, setHistorySortBy] = useState<"purchasedAt" | "credits" | "amountPounds" | "planName">("purchasedAt");
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([fetchBalance(), fetchPlans()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(resolveApiUrl("/api/bids/history"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
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

  const filteredAndSortedHistory = useMemo(() => {
    let list = [...historyList];
    if (historySearch.trim()) {
      const q = historySearch.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.invoiceNumber.toLowerCase().includes(q) ||
          r.planName.toLowerCase().includes(q) ||
          String(r.credits).includes(q) ||
          String(r.amountPounds).includes(q) ||
          new Date(r.purchasedAt).toLocaleDateString("en-GB").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (historySortBy === "purchasedAt") {
        cmp = new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime();
      } else if (historySortBy === "credits") cmp = a.credits - b.credits;
      else if (historySortBy === "amountPounds") cmp = a.amountPounds - b.amountPounds;
      else if (historySortBy === "planName") cmp = (a.planName || "").localeCompare(b.planName || "");
      return historySortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [historyList, historySearch, historySortBy, historySortDir]);

  const handleViewInvoice = (purchaseId: string) => {
    const url = resolveApiUrl(`/api/bids/invoice/${purchaseId}?currency=${encodeURIComponent(currency)}`);
    window.open(url, "_blank", "noopener,noreferrer");
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
        if (activeTab === "history") await fetchHistory();
      } else {
        const isInsufficient = (data.error || "").toLowerCase().includes("insufficient wallet");
        if (isInsufficient) {
          toast.error("Insufficient wallet balance. Please add funds to your wallet first.");
          navigate("/account?tab=billing&section=fund");
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

  const handlePurchaseCustom = async () => {
    const qty = Math.max(1, Math.min(500, Math.floor(Number(customQuantity)) || 1));
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
        if (activeTab === "history") await fetchHistory();
      } else {
        const isInsufficient = (data.error || "").toLowerCase().includes("insufficient wallet");
        if (isInsufficient) {
          toast.error("Insufficient wallet balance. Please add funds to your wallet first.");
          navigate("/account?tab=billing&section=fund");
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

  const handleBuyCredit = () => {
    if (selectedOption === CUSTOM_OPTION_VALUE) {
      handlePurchaseCustom();
    } else if (selectedOption) {
      handlePurchase(selectedOption);
    }
  };

  const customQty = Math.max(1, Math.min(500, Math.floor(Number(customQuantity)) || 1));
  const customTotal = (customQty * pricePerBid).toFixed(2);
  const selectedPlan = plans.find((p) => p.id === selectedOption);
  const isPurchasing = purchasingPlanId !== null || purchasingCustom;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
          Quote credits
        </h2>
        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
          You use one credit each time you submit a quote on a project. Free credits are refreshed every month. You can buy extra credit packs below.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Quote credits tabs">
          {TABS.map((tab) => (
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

      {/* Balance tab */}
      {activeTab === "balance" && (
        <>
      {/* Balance card */}
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

        {/* Recharge button */}
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

      {/* Expandable Purchase credit section */}
      {purchaseExpanded && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="font-['Poppins',sans-serif] text-[18px] font-medium text-[#2c353f] mb-2">
            Purchase credit
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-6">
            Credits are valid for one month from purchase. Payment is taken from your Billing wallet.
          </p>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: plan options */}
            <div className="lg:min-w-[280px] space-y-3">
              <p className="font-['Poppins',sans-serif] text-[13px] font-medium text-[#2c353f] mb-2">Select an option</p>
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedOption === plan.id
                      ? "border-[#FE8A0F] bg-[#FFF5EB]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="credit-option"
                      value={plan.id}
                      checked={selectedOption === plan.id}
                      onChange={() => setSelectedOption(plan.id)}
                      className="sr-only peer"
                    />
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                        selectedOption === plan.id
                          ? "bg-[#FE8A0F] border-white"
                          : "bg-white border-gray-300"
                      }`}
                      aria-hidden
                    />
                    <div>
                      <span className="font-['Poppins',sans-serif] text-[15px] font-medium text-[#2c353f]">
                        {plan.name}
                      </span>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                        {plan.bids} credit{plan.bids !== 1 ? "s" : ""} · {plan.validityMonths} month{plan.validityMonths !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                    {formatPrice(plan.amountPence / 100)}
                  </span>
                </label>
              ))}
              <label
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedOption === CUSTOM_OPTION_VALUE
                    ? "border-[#FE8A0F] bg-[#FFF5EB]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="credit-option"
                    value={CUSTOM_OPTION_VALUE}
                    checked={selectedOption === CUSTOM_OPTION_VALUE}
                    onChange={() => setSelectedOption(CUSTOM_OPTION_VALUE)}
                    className="sr-only peer"
                  />
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      selectedOption === CUSTOM_OPTION_VALUE
                        ? "bg-[#FE8A0F] border-white"
                        : "bg-white border-gray-300"
                    }`}
                    aria-hidden
                  />
                  <span className="font-['Poppins',sans-serif] text-[15px] font-medium text-[#2c353f]">
                    Custom
                  </span>
                </div>
                <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                  {formatPrice(pricePerBid)}/credit
                </span>
              </label>
            </div>

            {/* Right: custom quantity (when Custom selected) or Buy credit button */}
            <div className="flex-1 flex flex-col justify-center">
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
                      disabled={isPurchasing}
                      className="bg-[#FE8A0F] hover:bg-[#e57d0e] text-white font-['Poppins',sans-serif] h-11"
                    >
                      {purchasingCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy credit"}
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
                        disabled={isPurchasing}
                        className="bg-[#FE8A0F] hover:bg-[#e57d0e] text-white font-['Poppins',sans-serif] h-11 shrink-0"
                      >
                        {purchasingPlanId === selectedOption ? (
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
                  Select an option above to purchase credits.
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
          <h3 className="font-['Poppins',sans-serif] text-[18px] font-medium text-[#2c353f] mb-2">Purchase history</h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
            When and how many credits you purchased. Click "View invoice" to open the PDF invoice.
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by date, plan, amount, invoice #..."
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
                {historyList.length === 0 ? "No purchases yet." : "No results match your search."}
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
                          setHistorySortBy("purchasedAt");
                          setHistorySortDir((d) => (d === "asc" ? "desc" : "asc"));
                        }}
                        className="flex items-center gap-1 hover:text-[#FE8A0F]"
                      >
                        Date
                        {historySortBy === "purchasedAt" ? (historySortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-50" />}
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
                    <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">
                      <button
                        type="button"
                        onClick={() => {
                          setHistorySortBy("planName");
                          setHistorySortDir((d) => (d === "asc" ? "desc" : "asc"));
                        }}
                        className="flex items-center gap-1 hover:text-[#FE8A0F]"
                      >
                        Plan
                        {historySortBy === "planName" ? (historySortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-50" />}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-[#2c353f]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedHistory.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-[#2c353f]">
                        {formatDate(row.purchasedAt)}
                      </td>
                      <td className="py-3 px-4 text-[#2c353f]">{row.credits}</td>
                      <td className="py-3 px-4 text-[#2c353f]">{formatPrice(row.amountPounds || 0)}</td>
                      <td className="py-3 px-4 text-[#2c353f]">{row.planName}</td>
                      <td className="py-3 px-4 text-right">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
