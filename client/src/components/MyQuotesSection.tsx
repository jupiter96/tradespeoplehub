import { useState, useEffect } from "react";
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
  Calendar,
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
import { formatJobLocationCityOnly } from "./orders/utils";
import { cn } from "./ui/utils";
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

export default function MyQuotesSection({ onVisibleCountChange }: MyQuotesSectionProps = {}) {
  const navigate = useNavigate();
  const { getProfessionalQuotes, withdrawQuote, updateQuoteByProfessional } = useJobs();
  const { userInfo } = useAccount();
  const { startConversation } = useMessenger();
  const { formatPrice, toGBP, fromGBP } = useCurrency();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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

  const getTruncatedMessage = (text: string, maxLength: number = 250) => {
    if (!text) return "";
    const singleLine = text.replace(/\s+/g, " ").trim();
    if (singleLine.length <= maxLength) return singleLine;
    return singleLine.slice(0, maxLength) + "...";
  };

  const formatDeliveryDisplay = (v: string) => {
    const n = parseInt(String(v).trim(), 10);
    if (Number.isNaN(n)) return v;
    return n === 1 ? "1 day" : `${n} days`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 font-['Poppins',sans-serif]">
            <Hourglass className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 font-['Poppins',sans-serif]">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "awarded":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-['Poppins',sans-serif]">
            <CheckCircle className="w-3 h-3 mr-1" />
            Awarded
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 font-['Poppins',sans-serif]">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
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
          {filteredQuotes.map(({ job, quote }) => (
            <div
              key={quote.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-[#FE8A0F]"
              onClick={() => navigate(`/job/${job.slug || job.id}`)}
            >
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                      {job.title}
                    </h3>
                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] whitespace-nowrap">
                      £{formatNumber(Number(quote.price))}{" "}
                      <span className="text-[#6b6b6b]">
                        in {formatDeliveryDisplay(quote.deliveryTime || "")}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getStatusBadge(quote.status)}
                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                      Submitted {getRelativeTime(quote.submittedAt)}
                    </span>
                  </div>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                    {getTruncatedMessage(quote.message)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.categories?.map((category, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-[#E3F2FD] text-[#1976D2] border-[#1976D2]/30 font-['Poppins',sans-serif] text-[11px]"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif]">
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const count = job.clientReviewCount ?? 0;
                        const hasReviews = count > 0 && job.clientRatingAverage != null;
                        return (
                          <>
                            <Star
                              className={cn(
                                "w-4 h-4",
                                hasReviews ? "text-[#FE8A0F] fill-[#FE8A0F]" : "text-gray-300"
                              )}
                            />
                            {hasReviews ? (
                              <span>
                                {formatNumber(job.clientRatingAverage as number, 1)} ({count}{" "}
                                {count === 1 ? "review" : "reviews"})
                              </span>
                            ) : (
                              <span>0 review</span>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {formatJobLocationCityOnly(job)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{getRelativeTime(job.postedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => {
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
                      className="font-['Poppins',sans-serif] hover:bg-[#E3F2FD] hover:text-[#1976D2] hover:border-[#1976D2]"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>

                    {quote.status === "pending" && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuoteToWithdraw({ jobId: job.id, quoteId: quote.id });
                          }}
                          variant="outline"
                          className="font-['Poppins',sans-serif] border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Undo2 className="w-4 h-4 mr-2" />
                          Withdraw
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(job, quote);
                          }}
                          variant="outline"
                          className="font-['Poppins',sans-serif] border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Withdraw confirmation */}
      <AlertDialog open={!!quoteToWithdraw} onOpenChange={(open) => !open && setQuoteToWithdraw(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
      <Dialog open={!!editingQuote} onOpenChange={(open) => !open && setEditingQuote(null)}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
