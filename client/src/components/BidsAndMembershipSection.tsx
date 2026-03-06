import { useState, useEffect, useRef } from "react";
import { Target, Loader2, PoundSterling, Calendar, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { resolveApiUrl } from "../config/api";
import { toast } from "sonner@2.0.3";

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

export default function BidsAndMembershipSection() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pricePerBid, setPricePerBid] = useState<number>(2.5);
  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [customQuantity, setCustomQuantity] = useState<number>(10);
  const [purchasingCustom, setPurchasingCustom] = useState(false);
  const plansSectionRef = useRef<HTMLDivElement>(null);

  const scrollToBuyPlans = () => {
    plansSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
        toast.success(data.message || "Plan purchased. Your bids have been added.");
        await fetchBalance();
      } else {
        toast.error(data.error || "Purchase failed");
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
        toast.success(data.message || `${qty} bids purchased.`);
        await fetchBalance();
      } else {
        toast.error(data.error || "Purchase failed");
      }
    } catch {
      toast.error("Purchase failed");
    } finally {
      setPurchasingCustom(false);
    }
  };

  const customTotal = (Math.max(1, Math.min(500, Math.floor(Number(customQuantity)) || 1)) * pricePerBid).toFixed(2);

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
          Bids & Membership
        </h2>
        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
          You use one bid each time you submit a quote on a project. Free bids are refreshed every month. You can buy extra bid packs below.
        </p>
      </div>

      {/* Balance card */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-[#FFF9F5] to-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#FE8A0F]" />
          <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">Your bid balance</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Total available</p>
            <p className="font-['Poppins',sans-serif] text-[28px] font-semibold text-[#2c353f]">
              {balance?.totalAvailable ?? 0} <span className="text-[14px] font-normal text-[#6b6b6b]">bids</span>
            </p>
          </div>
          <div>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Free (this month)</p>
            <p className="font-['Poppins',sans-serif] text-[20px] font-medium text-[#2c353f]">
              {balance?.freeBidsRemaining ?? 0} <span className="text-[13px] font-normal text-[#6b6b6b]">bids</span>
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
              {balance?.purchasedTotal ?? 0} <span className="text-[13px] font-normal text-[#6b6b6b]">bids</span>
            </p>
            {balance?.purchasedBlocks && balance.purchasedBlocks.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {balance.purchasedBlocks.slice(0, 3).map((b, i) => (
                  <li key={i} className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                    {b.bids} bid{b.bids !== 1 ? "s" : ""} until {formatDate(b.expiresAt)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Membership plan cards – buy bids */}
      <div ref={plansSectionRef} className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="font-['Poppins',sans-serif] text-[18px] font-medium text-[#2c353f] mb-2">
          Membership plans – Buy more bids
        </h3>
        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-6">
          Each plan adds bids to your account. Bids from a plan are valid for one month from purchase. Payment is taken from your Billing wallet.
        </p>

        {/* Custom quantity – price per bid */}
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 mb-6">
          <h4 className="font-['Poppins',sans-serif] text-[16px] font-medium text-[#2c353f] mb-2">Buy custom quantity</h4>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
            Price per bid: £{pricePerBid.toFixed(2)}. Choose how many bids you need (valid one month from purchase).
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="customQuantity" className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] block mb-1">Number of bids</label>
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
            </div>
            <div className="font-['Poppins',sans-serif] text-[18px] font-semibold text-[#2c353f]">
              Total: £{customTotal}
            </div>
            <Button
              onClick={handlePurchaseCustom}
              disabled={purchasingCustom || purchasingPlanId !== null}
              className="bg-[#FE8A0F] hover:bg-[#e57d0e] text-white font-['Poppins',sans-serif] h-11"
            >
              {purchasingCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy bids"}
            </Button>
          </div>
        </div>

        {plans.length === 0 ? (
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] py-4">No plans available at the moment. Check back later or contact support.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border-2 border-gray-200 bg-gray-50/50 p-6 shadow-sm hover:border-[#FE8A0F] hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <PoundSterling className="w-5 h-5 text-[#FE8A0F]" />
                  <span className="font-['Poppins',sans-serif] text-[18px] font-semibold text-[#2c353f]">
                    {plan.name}
                  </span>
                </div>
                <p className="font-['Poppins',sans-serif] text-[28px] font-bold text-[#2c353f] mb-1">
                  {plan.amountFormatted}
                </p>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-6">
                  {plan.bids} bid{plan.bids !== 1 ? "s" : ""} · valid {plan.validityMonths} month{plan.validityMonths !== 1 ? "s" : ""}
                </p>
                <Button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={purchasingPlanId !== null}
                  className="mt-auto w-full bg-[#FE8A0F] hover:bg-[#e57d0e] text-white font-['Poppins',sans-serif] h-11"
                >
                  {purchasingPlanId === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Buy now"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
