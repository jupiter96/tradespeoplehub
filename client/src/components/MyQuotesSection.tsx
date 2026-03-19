import { useState, useEffect } from "react";
import type React from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
import type { Job, JobQuote } from "./JobsContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Search,
  Filter,
  ArrowUpDown,
  MessageCircle,
  Banknote,
  MapPin,
  CheckCircle,
  XCircle,
  Hourglass,
  Pencil,
  Undo2,
  FileText,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import { formatNumber } from "../utils/formatNumber";
import { useCurrency } from "./CurrencyContext";
import { formatJobLocationCityOnly, resolveAvatarUrl, getTwoLetterInitials } from "./orders/utils";
import { cn } from "./ui/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import VerificationBadge from "./VerificationBadge";
import ReactCountryFlag from "react-country-flag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { resolveApiUrl } from "../config/api";
import { toast } from "sonner@2.0.3";

type MyQuotesSectionProps = {
  onVisibleCountChange?: (count: number) => void;
};

function iso2FromCountry(country?: string): string | null {
  const c = String(country || "").trim();
  if (!c) return null;
  if (/^[A-Za-z]{2}$/.test(c)) return c.toUpperCase();
  const key = c.toLowerCase();
  const map: Record<string, string> = {
    "united kingdom": "GB",
    uk: "GB",
    england: "GB",
    scotland: "GB",
    wales: "GB",
    "northern ireland": "GB",
    "united states": "US",
    usa: "US",
    ireland: "IE",
    australia: "AU",
    canada: "CA",
    france: "FR",
    germany: "DE",
    spain: "ES",
    italy: "IT",
    netherlands: "NL",
    belgium: "BE",
    poland: "PL",
    india: "IN",
  };
  return map[key] || null;
}

function QuoteCardStarRating({
  rating,
  size = "sm",
  className = "",
}: {
  rating: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const r = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const w = size === "xs" ? "w-3 h-3" : size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fillPct = Math.max(0, Math.min(1, r - i)) * 100;
        return (
          <span key={i} className={`relative inline-block ${w}`}>
            <Star className={`absolute inset-0 ${w} text-[#FE8A0F]/30`} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
              <Star className={`absolute inset-0 ${w} text-[#FE8A0F] fill-[#FE8A0F]`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function isFullyVerifiedProfessional(userInfo: any): boolean {
  const v = userInfo?.verification;
  const ok = (s: any) => s === "verified" || s === "completed";
  // 6-step verification: email, phone, address, id, payment method, insurance
  return !!(
    ok(v?.email?.status) &&
    ok(v?.phone?.status) &&
    ok(v?.address?.status) &&
    ok(v?.idCard?.status) &&
    ok(v?.paymentMethod?.status) &&
    ok(v?.publicLiabilityInsurance?.status)
  );
}

export default function MyQuotesSection({ onVisibleCountChange }: MyQuotesSectionProps = {}) {
  const navigate = useNavigate();
  const { getProfessionalQuotes, withdrawQuote, updateQuoteByProfessional } = useJobs();
  const { userInfo } = useAccount();
  const { startConversation, getContactById } = useMessenger();
  const { formatPrice, formatPriceWhole, toGBP, fromGBP } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [quoteToWithdraw, setQuoteToWithdraw] = useState<{ jobId: string; quoteId: string } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [editingQuote, setEditingQuote] = useState<{ job: Job; quote: JobQuote } | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editDeliveryTime, setEditDeliveryTime] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [aiQuoteMessageGenerating, setAiQuoteMessageGenerating] = useState(false);
  const [expandedQuoteMessages, setExpandedQuoteMessages] = useState<Set<string>>(new Set());

  const toggleQuoteMessageExpanded = (quoteId: string) => {
    setExpandedQuoteMessages((prev) => {
      const next = new Set(prev);
      if (next.has(quoteId)) next.delete(quoteId);
      else next.add(quoteId);
      return next;
    });
  };

  // Get all quotes submitted by the professional
  const allQuotes = getProfessionalQuotes(userInfo?.id || "");

  // Filter and sort quotes
  const filteredQuotes = allQuotes
    .filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.job.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || item.quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison =
            new Date(a.quote.submittedAt).getTime() -
            new Date(b.quote.submittedAt).getTime();
          break;
        case "price":
          comparison = a.quote.price - b.quote.price;
          break;
        case "status":
          comparison = a.quote.status.localeCompare(b.quote.status);
          break;
        default:
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  useEffect(() => {
    if (onVisibleCountChange) {
      onVisibleCountChange(filteredQuotes.length);
    }
  }, [filteredQuotes.length, onVisibleCountChange]);

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "just now";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "just now";
    if (diffMinutes === 1) return "a minute ago";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return "an hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "a day ago";
    return `${diffDays} days ago`;
  };

  const formatDeliveryDisplay = (v: string) => {
    const n = parseInt(String(v).trim(), 10);
    if (Number.isNaN(n)) return v;
    return n === 1 ? "1 day" : `${n} days`;
  };

  const stats = {
    total: allQuotes.length,
    pending: allQuotes.filter((q) => q.quote.status === "pending").length,
    accepted: allQuotes.filter((q) => q.quote.status === "accepted").length,
    awarded: allQuotes.filter((q) => q.quote.status === "awarded").length,
    rejected: allQuotes.filter((q) => q.quote.status === "rejected").length,
  };

  const openEditModal = (job: Job, quote: JobQuote) => {
    setEditingQuote({ job, quote });
    setEditPrice(String(fromGBP(quote.price)));
    setEditDeliveryTime(quote.deliveryTime || "");
    setEditMessage(quote.message || "");
  };

  const handleWithdrawConfirm = async () => {
    if (!quoteToWithdraw) return;
    setWithdrawing(true);
    try {
      await withdrawQuote(quoteToWithdraw.jobId, quoteToWithdraw.quoteId);
      toast.success("Quote withdrawn.");
      setQuoteToWithdraw(null);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Failed to withdraw quote");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingQuote) return;
    const priceInSelected = parseFloat(editPrice);
    if (isNaN(priceInSelected) || priceInSelected < 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!editDeliveryTime.trim()) {
      toast.error("Please enter delivery time");
      return;
    }
    if (!editMessage.trim()) {
      toast.error("Please enter a message to the client");
      return;
    }
    const priceGBP = toGBP(priceInSelected);
    const minPrice = editingQuote.job.budgetMin ?? editingQuote.job.budgetAmount;
    const maxPrice = editingQuote.job.budgetMax ?? editingQuote.job.budgetAmount * 1.2;
    if (priceGBP < minPrice || priceGBP > maxPrice) {
      toast.error(`Price must be between ${formatPrice(minPrice)} and ${formatPrice(maxPrice)}`);
      return;
    }
    setEditSubmitting(true);
    try {
      await updateQuoteByProfessional(editingQuote.job.id, editingQuote.quote.id, {
        price: priceGBP,
        deliveryTime: editDeliveryTime.trim(),
        message: editMessage.trim(),
      });
      toast.success("Quote updated.");
      setEditingQuote(null);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Failed to update quote");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleGenerateEditMessage = async () => {
    if (!editingQuote) return;
    setAiQuoteMessageGenerating(true);
    try {
      const res = await fetch(resolveApiUrl("/api/jobs/generate-quote-message"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle: editingQuote.job.title,
          jobDescription: editingQuote.job.description,
          sectorName: editingQuote.job.sector,
          keyPoints: editMessage.trim() || undefined,
          tradingName: userInfo?.businessName || userInfo?.tradingName || userInfo?.name || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to generate message");
        return;
      }
      if (data.message) setEditMessage(data.message);
      toast.success("Message generated. You can edit before saving.");
    } catch {
      toast.error("Failed to generate message.");
    } finally {
      setAiQuoteMessageGenerating(false);
    }
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#E3F2FD] to-white border-2 border-[#3B82F6] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              Total
            </p>
            <MessageCircle className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <p className="font-['Poppins',sans-serif] text-[28px] text-[#2c353f]">
            {stats.total}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#FFF9E6] to-white border-2 border-[#FFB347] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              Pending
            </p>
            <Hourglass className="w-5 h-5 text-[#FFB347]" />
          </div>
          <p className="font-['Poppins',sans-serif] text-[28px] text-[#2c353f]">
            {stats.pending}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#E8F5E9] to-white border-2 border-[#4CAF50] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              Accepted
            </p>
            <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
          </div>
          <p className="font-['Poppins',sans-serif] text-[28px] text-[#2c353f]">
            {stats.accepted}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#E0F2F1] to-white border-2 border-[#00897B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              Awarded
            </p>
            <CheckCircle className="w-5 h-5 text-[#00897B]" />
          </div>
          <p className="font-['Poppins',sans-serif] text-[28px] text-[#2c353f]">
            {stats.awarded}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#FFEBEE] to-white border-2 border-[#F44336] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              Rejected
            </p>
            <XCircle className="w-5 h-5 text-[#F44336]" />
          </div>
          <p className="font-['Poppins',sans-serif] text-[28px] text-[#2c353f]">
            {stats.rejected}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
          <Input
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-['Poppins',sans-serif]"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] font-['Poppins',sans-serif]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="awarded">Awarded</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortField} onValueChange={setSortField}>
          <SelectTrigger className="w-full md:w-[180px] font-['Poppins',sans-serif]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date Submitted</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() =>
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
          }
          className="font-['Poppins',sans-serif]"
        >
          {sortDirection === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">
            No quotes found
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Start bidding on available jobs to see your quotes here"}
          </p>
          {searchQuery === "" && statusFilter === "all" && (
            <Button
              onClick={() => navigate("/account")}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
            >
              Browse Available Jobs
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map(({ job, quote }) => {
            const proId = quote.professionalId || userInfo?.id || "";
            const proName =
              quote.professionalName ||
              userInfo?.tradingName ||
              userInfo?.name ||
              "You";
            const quoteAvatarSrc = resolveAvatarUrl(
              quote.professionalAvatar || userInfo?.avatar
            );
            const isOnline = getContactById(proId)?.online === true;
            const proRating = Number(quote.professionalRating) || 0;
            const proReviews = Number(quote.professionalReviews) || 0;
            const proCountry = (quote as { professionalCountry?: string }).professionalCountry;
            const proTownCity = (quote as { professionalTownCity?: string }).professionalTownCity;
            const proProfileTitle = (quote as { professionalProfileTitle?: string }).professionalProfileTitle;
            const proVerified =
              (quote as { professionalFullyVerified?: boolean }).professionalFullyVerified ??
              isFullyVerifiedProfessional(userInfo);
            const msg = quote.message || "";
            const isLongMsg = msg.length > 400;
            const msgExpanded = expandedQuoteMessages.has(quote.id);
            const showMsg = msgExpanded ? msg : isLongMsg ? msg.slice(0, 400) + "..." : msg;
            const isAwarded = quote.status === "awarded";

            return (
              <div
                key={quote.id}
                className={cn(
                  "rounded-lg border transition-all duration-200 overflow-hidden cursor-pointer",
                  quote.status === "accepted"
                    ? "bg-white border-green-500 shadow-sm"
                    : isAwarded
                      ? "bg-orange-50 border-orange-300 shadow-lg"
                      : quote.status === "rejected"
                        ? "bg-white border-gray-200 opacity-60"
                        : "bg-white border-gray-200 hover:border-[#FE8A0F] hover:shadow-md"
                )}
                onClick={() => navigate(`/job/${job.slug || job.id}?tab=quotes`)}
              >
                {/* Mobile — same structure as JobDetailPage Quotes */}
                <div className="block sm:hidden p-4">
                  {!!job?.title && (
                    <p className="font-['Poppins',sans-serif] text-[13px] font-bold text-[#1976D2] truncate mb-3">
                      {job.title}
                    </p>
                  )}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/profile/${proId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative">
                            <Avatar className="w-12 h-12 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                            {quoteAvatarSrc && (
                              <AvatarImage src={quoteAvatarSrc} alt={proName} />
                            )}
                            <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                              {getTwoLetterInitials(proName, "P")}
                            </AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                                isOnline ? "bg-green-500" : "bg-gray-400"
                              )}
                              aria-label={isOnline ? "Online" : "Offline"}
                            />
                          </div>
                        </a>
                        <div className="flex items-center gap-2 min-w-0">
                          <a
                            href={`/profile/${proId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:underline min-w-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <h3 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-medium truncate">
                              {proName}
                            </h3>
                          </a>
                          <VerificationBadge fullyVerified={!!proVerified} size="sm" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-[#6b6b6b] mb-1 flex-wrap mt-1">
                        <div className="flex items-center gap-2">
                          <QuoteCardStarRating rating={proRating} size="xs" />
                          <span>{formatNumber(proRating, 1)}</span>
                          <span className="text-[#8d8d8d]">
                            ({proReviews} {proReviews === 1 ? "review" : "reviews"})
                          </span>
                        </div>
                        {!!proCountry && (
                          <span className="inline-flex items-center gap-1 text-[#6b6b6b]">
                            {(() => {
                              const iso = iso2FromCountry(proCountry);
                              return iso ? (
                                <ReactCountryFlag
                                  countryCode={iso}
                                  svg
                                  className="w-5 h-5 rounded-sm"
                                  aria-label={proCountry}
                                />
                              ) : null;
                            })()}
                            <span className="truncate max-w-[160px]">{proTownCity || proCountry}</span>
                          </span>
                        )}
                      </div>
                      {!!proProfileTitle && (
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-bold">
                          {proProfileTitle}
                        </p>
                      )}
                      {quote.status !== "pending" && (
                        <Badge
                          className={`text-[10px] px-2 py-0.5 ${
                            quote.status === "accepted"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : quote.status === "awarded"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {quote.status === "accepted"
                            ? "Accepted"
                            : quote.status === "awarded"
                              ? "Awarded"
                              : "Rejected"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 whitespace-nowrap">
                      <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                        {formatPriceWhole(Number(quote.price))}
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        {formatDeliveryDisplay(quote.deliveryTime || "")}
                      </p>
                    </div>
                  </div>

                  <div className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                    {msgExpanded ? (
                      <p className="whitespace-pre-wrap">{showMsg}</p>
                    ) : (
                      <span>{showMsg}</span>
                    )}
                    {isLongMsg && (
                      <button
                        type="button"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          toggleQuoteMessageExpanded(quote.id);
                        }}
                        className="text-[#3B82F6] hover:underline ml-1 text-[12px]"
                      >
                        {msgExpanded ? "Read less" : "Read more"}
                      </button>
                    )}
                  </div>

                  {/* Bottom bar: left info + right actions (same line) */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] flex flex-wrap items-center gap-2 min-w-0">
                      <span className="whitespace-nowrap">Submitted {getRelativeTime(quote.submittedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
                      {quote.status === "pending" && (
                        <>
                          <Button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (job.clientId) {
                                startConversation({
                                  id: job.clientId,
                                  name: job.clientName || "Client",
                                  avatar: job.clientAvatar,
                                  jobId: job.id,
                                  jobTitle: job.title,
                                });
                              }
                            }}
                            variant="outline"
                            className="flex-none font-['Poppins',sans-serif] text-[13px] h-9"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                          <Button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setQuoteToWithdraw({ jobId: job.id, quoteId: quote.id });
                            }}
                            variant="outline"
                            className="flex-none font-['Poppins',sans-serif] text-[13px] h-9 border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Undo2 className="w-3 h-3 mr-1" />
                            Withdraw
                          </Button>
                          <Button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              openEditModal(job, quote);
                            }}
                            variant="outline"
                            className="flex-none font-['Poppins',sans-serif] text-[13px] h-9 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </>
                      )}

                      {quote.status === "awarded" && (
                        <span className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-[12px] text-[#6b6b6b]">
                          Awaiting response
                        </span>
                      )}

                      {quote.status === "accepted" && (
                        <Button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            if (job.clientId) {
                              startConversation({
                                id: job.clientId,
                                name: job.clientName || "Client",
                                avatar: job.clientAvatar,
                                jobId: job.id,
                                jobTitle: job.title,
                              });
                            }
                          }}
                          className="bg-[#1976D2] hover:bg-[#1565C0] text-white font-['Poppins',sans-serif] text-[13px] h-9 px-4"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop — 70/30 layout */}
                <div className="hidden sm:block p-5">
                  <div className="flex gap-5">
                    {/* Left column (70%) */}
                    <div className="w-[70%] min-w-0">
                      {!!job?.title && (
                        <p className="font-['Poppins',sans-serif] text-[14px] font-bold text-[#1976D2] truncate mb-3">
                          {job.title}
                        </p>
                      )}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <a
                            href={`/profile/${proId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative">
                              <Avatar className="w-14 h-14 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                                {quoteAvatarSrc && (
                                  <AvatarImage src={quoteAvatarSrc} alt={proName} />
                                )}
                                <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                                  {getTwoLetterInitials(proName, "P")}
                                </AvatarFallback>
                              </Avatar>
                              <span
                                className={cn(
                                  "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white",
                                  isOnline ? "bg-green-500" : "bg-gray-400"
                                )}
                                aria-label={isOnline ? "Online" : "Offline"}
                              />
                            </div>
                          </a>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <a
                              href={`/profile/${proId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block hover:underline min-w-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium truncate">
                                {proName}
                              </h3>
                            </a>
                            <VerificationBadge fullyVerified={!!proVerified} size="sm" />
                          </div>

                          <div className="flex items-center gap-4 text-[13px] text-[#6b6b6b] flex-wrap">
                            <div className="flex items-center gap-2">
                              <QuoteCardStarRating rating={proRating} size="sm" />
                              <span>{formatNumber(proRating, 1)}</span>
                              <span className="text-[#8d8d8d]">
                                ({proReviews} {proReviews === 1 ? "review" : "reviews"})
                              </span>
                            </div>
                            {!!proCountry && (
                              <span className="inline-flex items-center gap-1 text-[#6b6b6b]">
                                {(() => {
                                  const iso = iso2FromCountry(proCountry);
                                  return iso ? (
                                    <ReactCountryFlag
                                      countryCode={iso}
                                      svg
                                      className="w-5 h-5 rounded-sm"
                                      aria-label={proCountry}
                                    />
                                  ) : null;
                                })()}
                                <span className="truncate max-w-[180px]">{proTownCity || proCountry}</span>
                              </span>
                            )}
                          </div>

                          {!!proProfileTitle && (
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-bold mt-1">
                              {proProfileTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4 mt-4">
                        {msgExpanded ? (
                          <p className="whitespace-pre-wrap">{showMsg}</p>
                        ) : (
                          <span>{showMsg}</span>
                        )}
                        {isLongMsg && (
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              toggleQuoteMessageExpanded(quote.id);
                            }}
                            className="text-[#3B82F6] hover:underline ml-1 text-[12px]"
                          >
                            {msgExpanded ? "Read less" : "Read more"}
                          </button>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] flex flex-wrap items-center gap-2 min-w-0">
                          <span className="whitespace-nowrap">
                            Submitted {getRelativeTime(quote.submittedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right column (30%) */}
                    <div
                      className="w-[30%] flex flex-col gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {quote.status !== "pending" && (
                        <div className="flex justify-end">
                          <Badge
                            className={`text-[12px] px-3 py-1 flex-shrink-0 ${
                              quote.status === "accepted"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : quote.status === "awarded"
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {quote.status === "accepted"
                              ? "Accepted"
                              : quote.status === "awarded"
                                ? "Awaiting Response"
                                : "Rejected"}
                          </Badge>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                          {formatPriceWhole(Number(quote.price))}
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          {formatDeliveryDisplay(quote.deliveryTime || "")}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
                        {quote.status === "pending" && (
                          <>
                            <Button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (job.clientId) {
                                  startConversation({
                                    id: job.clientId,
                                    name: job.clientName || "Client",
                                    avatar: job.clientAvatar,
                                    jobId: job.id,
                                    jobTitle: job.title,
                                  });
                                }
                              }}
                              variant="outline"
                              className="flex-none font-['Poppins',sans-serif] text-[14px] h-10 px-6"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message &nbsp; 
                            </Button>
                            <Button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setQuoteToWithdraw({ jobId: job.id, quoteId: quote.id });
                              }}
                              variant="outline"
                              className="flex-none font-['Poppins',sans-serif] text-[14px] h-10 px-5 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Undo2 className="w-4 h-4 mr-2" />
                              Withdraw
                            </Button>
                            <Button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                openEditModal(job, quote);
                              }}
                              variant="outline"
                              className="flex-none font-['Poppins',sans-serif] text-[14px] h-10 px-5 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              &nbsp;  &nbsp; &nbsp; Edit &nbsp; &nbsp; &nbsp; 
                            </Button>
                          </>
                        )}

                        {quote.status === "awarded" && (
                          <span className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-[13px] text-[#6b6b6b]">
                            Awaiting response
                          </span>
                        )}

                        {quote.status === "accepted" && (
                          <Button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (job.clientId) {
                                startConversation({
                                  id: job.clientId,
                                  name: job.clientName || "Client",
                                  avatar: job.clientAvatar,
                                  jobId: job.id,
                                  jobTitle: job.title,
                                });
                              }
                            }}
                            className="bg-[#1976D2] hover:bg-[#1565C0] text-white font-['Poppins',sans-serif] text-[14px] h-10 px-6"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Withdraw confirmation */}
      <AlertDialog open={!!quoteToWithdraw} onOpenChange={(open: boolean) => !open && setQuoteToWithdraw(null)}>
        <AlertDialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Poppins',sans-serif]">Withdraw quote?</AlertDialogTitle>
            <AlertDialogDescription className="font-['Poppins',sans-serif]">
              This will remove your quote from this job. You can submit a new quote later if the job is still open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-['Poppins',sans-serif]">Cancel</AlertDialogCancel>
            <Button
              onClick={handleWithdrawConfirm}
              disabled={withdrawing}
              className="font-['Poppins',sans-serif] bg-red-600 hover:bg-red-700"
            >
              {withdrawing ? "Withdrawing…" : "Withdraw"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit quote modal (Send Quote style) */}
      <Dialog open={!!editingQuote} onOpenChange={(open: boolean) => !open && setEditingQuote(null)}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <DialogHeader className="border-b border-gray-200 pb-4 mb-6">
            <DialogTitle className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f]">
              Edit Quote
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[15px] text-[#6b6b6b] mt-2">
              Update your quote for: <span className="text-[#FE8A0F]">{editingQuote?.job.title}</span>
            </DialogDescription>
          </DialogHeader>

          {editingQuote && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#1976D2] mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Job Summary
                </h3>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 leading-relaxed whitespace-pre-wrap">
                    {editingQuote.job.description}
                  </p>
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-[#2c353f] text-[14px] font-['Poppins',sans-serif]">
                      <MapPin className="w-4 h-4 text-red-600" />
                      {formatJobLocationCityOnly(editingQuote.job)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] mb-4 flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Quote Details
                </h3>
                <div className="space-y-5">
                  <div className="bg-white rounded-lg p-4 border border-orange-100">
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Your Price (£) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={editingQuote.job.budgetMin ?? editingQuote.job.budgetAmount}
                      max={editingQuote.job.budgetMax ?? editingQuote.job.budgetAmount * 1.2}
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="font-['Poppins',sans-serif] text-[15px] border-2 border-gray-200 focus:border-[#FE8A0F] h-12"
                    />
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-orange-100">
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Delivery Time (days) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={editDeliveryTime}
                      onChange={(e) => setEditDeliveryTime(e.target.value)}
                      className="font-['Poppins',sans-serif] text-[15px] border-2 border-gray-200 focus:border-[#FE8A0F] h-12"
                    />
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-orange-100">
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Message to Client <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="font-['Poppins',sans-serif] text-[14px] min-h-[180px] border-2 border-gray-200 focus:border-[#FE8A0F] resize-none"
                    />
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateEditMessage}
                        disabled={aiQuoteMessageGenerating}
                        className="font-['Poppins',sans-serif] border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                      >
                        <Sparkles className={`w-4 h-4 mr-2 ${aiQuoteMessageGenerating ? "animate-pulse" : ""}`} />
                        {aiQuoteMessageGenerating ? "Generating…" : "Generate text by AI"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t-2 border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setEditingQuote(null)}
                  className="flex-1 font-['Poppins',sans-serif] h-12 text-[15px] border-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSubmit}
                  disabled={editSubmitting}
                  className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif] h-12 text-[15px] disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {editSubmitting ? "Updating…" : "Update Quote"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
