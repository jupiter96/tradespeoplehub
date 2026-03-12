import { useState } from "react";
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
  Eye,
  MessageCircle,
  Calendar,
  Banknote,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
  Pencil,
  Undo2,
  FileText,
  Send,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatNumber";
import { useCurrency } from "./CurrencyContext";
import { formatJobLocationCityOnly } from "./orders/utils";
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

export default function MyQuotesSection() {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
              className="border border-gray-200 rounded-xl p-6 hover:border-[#FE8A0F] transition-all cursor-pointer"
              onClick={() => navigate(`/job/${job.slug || job.id}`)}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left Side - Job & Quote Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        {getStatusBadge(quote.status)}
                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                          Submitted: {formatDate(quote.submittedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0 whitespace-nowrap">
                      <span className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">£{formatNumber(Number(quote.price))}</span>
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]"> in {formatDeliveryDisplay(quote.deliveryTime || "")}</span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2 text-[#6b6b6b] font-['Poppins',sans-serif] text-[13px]">
                      <MapPin className="w-4 h-4" />
                      {formatJobLocationCityOnly(job)}
                    </div>
                    <div className="flex items-center gap-2 text-[#6b6b6b] font-['Poppins',sans-serif] text-[13px]">
                      <Calendar className="w-4 h-4" />
                      Posted: {formatDate(job.postedAt)}
                    </div>
                  </div>

                  {/* Quote Message Preview */}
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] line-clamp-2 mb-3 whitespace-pre-wrap">
                    {quote.message}
                  </p>
                </div>

                {/* Right Side - Actions (price & delivery shown on same row as job title above) */}
                <div className="flex flex-col items-start md:items-end gap-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      startConversation({
                        id: `client-${job.clientId}`,
                        name: job.clientName || "Client",
                        avatar: job.clientAvatar,
                        online: true,
                        jobId: job.id,
                        jobTitle: job.title,
                      });
                      navigate(`/account?tab=messenger`);
                    }}
                    variant="outline"
                    className="w-full md:w-auto font-['Poppins',sans-serif]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>

                  {quote.status === "pending" && (
                    <div className="flex items-center gap-2 justify-end w-full">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuoteToWithdraw({ jobId: job.id, quoteId: quote.id });
                        }}
                        variant="outline"
                        className="flex-none font-['Poppins',sans-serif] border-red-200 text-red-600 hover:bg-red-50"
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
                        className="flex-none font-['Poppins',sans-serif] border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  )}
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
