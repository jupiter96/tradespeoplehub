import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs, JobQuote } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
import { getTwoLetterInitials } from "./orders/utils";
import {
  FileText,
  MapPin,
  Calendar,
  Banknote,
  MessageCircle,
  Eye,
  Trash2,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Flame,
  ChevronDown,
  Filter,
  Search,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { formatNumber } from "../utils/formatNumber";
import { useCurrency } from "./CurrencyContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner@2.0.3";
import { resolveAvatarUrl, formatJobLocationCityOnly } from "./orders/utils";
import JobSkillBadges from "./JobSkillBadges";
import { ClientJobListStatusBadge } from "./JobListCardStatusBadge";

export default function MyJobsSection() {
  const navigate = useNavigate();
  const { formatPriceWhole } = useCurrency();
  const { jobs, getUserJobs, deleteJob, updateJob, updateQuoteStatus } = useJobs();
  const { userInfo } = useAccount();
  const { startConversation } = useMessenger();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<JobQuote | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [newQuoteJobIds, setNewQuoteJobIds] = useState<Set<string>>(new Set());

  // Get user's jobs (from API-backed list when client)
  const userJobs = getUserJobs(userInfo?.id ?? "");

  const quoteCountStorageKey = useMemo(
    () => `myJobsQuoteCounts:${userInfo?.id || "anon"}`,
    [userInfo?.id]
  );

  // Detect "first quote arrived" (0 -> 1+) per job and show a flashy badge
  useEffect(() => {
    if (!userInfo?.id) return;
    let prevCounts: Record<string, number> = {};
    try {
      prevCounts = JSON.parse(localStorage.getItem(quoteCountStorageKey) || "{}") || {};
    } catch {
      prevCounts = {};
    }

    const nextCounts: Record<string, number> = { ...prevCounts };
    const newlyTriggered: string[] = [];

    userJobs.forEach((j) => {
      const prev = Number(prevCounts[j.id] ?? 0);
      const curr = Number((j.quotes || []).length ?? 0);
      nextCounts[j.id] = curr;
      if (prev === 0 && curr > 0) {
        newlyTriggered.push(j.id);
      }
    });

    if (newlyTriggered.length > 0) {
      setNewQuoteJobIds((prev) => {
        const next = new Set(prev);
        newlyTriggered.forEach((id) => next.add(id));
        return next;
      });
    }

    try {
      localStorage.setItem(quoteCountStorageKey, JSON.stringify(nextCounts));
    } catch {
      // ignore storage failures
    }
  }, [userInfo?.id, quoteCountStorageKey, userJobs]);

  const markJobQuotesSeen = (jobId: string) => {
    setNewQuoteJobIds((prev) => {
      if (!prev.has(jobId)) return prev;
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
    // Persist current count as seen baseline
    try {
      const prevCounts = JSON.parse(localStorage.getItem(quoteCountStorageKey) || "{}") || {};
      const job = userJobs.find((j) => j.id === jobId);
      const curr = Number((job?.quotes || []).length ?? 0);
      prevCounts[jobId] = curr;
      localStorage.setItem(quoteCountStorageKey, JSON.stringify(prevCounts));
    } catch {
      // ignore
    }
  };

  // Filter jobs based on status and search
  const filteredJobs = userJobs.filter((job) => {
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const currentJob = selectedJob ? jobs.find(j => j.id === selectedJob) : null;

  const getTimingIcon = (timing: string) => {
    if (timing === "urgent") {
      return (
        <Badge className="bg-red-600 text-white border-red-600 font-['Poppins',sans-serif] text-[11px]">
          Urgent
        </Badge>
      );
    }
    if (timing === "flexible") return <Clock className="w-4 h-4 text-blue-500" />;
    return <Calendar className="w-4 h-4 text-gray-500" />;
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await deleteJob(jobId);
      toast.success("Job deleted successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete job");
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    if (!currentJob) return;
    try {
      await updateQuoteStatus(currentJob.id, quoteId, "accepted");
      toast.success("Quote accepted! The professional will be notified.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to accept quote");
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    if (!currentJob) return;
    try {
      await updateQuoteStatus(currentJob.id, quoteId, "rejected");
      toast.success("Quote rejected");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject quote");
    }
  };

  const handleStartChat = (quote: JobQuote) => {
    startConversation({
      id: `prof-${quote.professionalId}`,
      name: quote.professionalName,
      avatar: quote.professionalAvatar,
      online: true,
      jobId: currentJob?.id,
      jobTitle: currentJob?.title
    });
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      toast.success("Message sent to " + selectedQuote?.professionalName);
      setChatMessage("");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTruncatedDescription = (description: string, maxLength: number = 250) => {
    if (!description) return "";
    const singleLine = description.replace(/\s+/g, " ").trim();
    if (singleLine.length <= maxLength) return singleLine;
    return singleLine.slice(0, maxLength) + "...";
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

  const formatDeliveryDisplay = (v: string) => {
    const n = parseInt(String(v).trim(), 10);
    if (Number.isNaN(n)) return v;
    return n === 1 ? "1 day" : `${n} days`;
  };

  return (
    <div>
      <style>{`
        @keyframes gotNewQuoteTextPulse {
          0% { color: #ffffff; }
          50% { color: #ef4444; }
          100% { color: #ffffff; }
        }
      `}</style>
      <div className="flex flex-col gap-3 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
              My Jobs
            </h2>
            <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
              Manage your posted jobs and view quotes from professionals
            </p>
          </div>
          <Button
            onClick={() => navigate("/post-job")}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] w-full sm:w-auto whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 md:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-['Poppins',sans-serif] text-[14px]"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[200px] font-['Poppins',sans-serif] text-[14px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="awaiting-accept">Awaiting Accept</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">
              No jobs found
            </h3>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Post your first job to get started"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button
                onClick={() => window.location.href = "/post-job"}
                className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
              >
                Post a Job
              </Button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-[#FE8A0F]"
              onClick={() => {
                markJobQuotesSeen(job.id);
                navigate(`/job/${job.slug || job.id}`);
              }}
            >
              {/* Two-column layout (70% left / 30% right) */}
              <div className="flex flex-col md:flex-row gap-5">
                {/* Left column: title, budget (one line), description, skills, address, time, quote count */}
                <div className="md:w-[70%] min-w-0">
                  <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] truncate mb-2">
                    {job.title}
                  </h3>
                  <p className="font-['Poppins',sans-serif] text-[14px] mb-2 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                    <span className="text-[#6b6b6b]">Budget: &nbsp; </span>
                    <span className="text-[#2c353f] font-bold">
                      {job.budgetMin != null && job.budgetMax != null
                        ? `${formatPriceWhole(job.budgetMin)} - ${formatPriceWhole(job.budgetMax)}`
                        : formatPriceWhole(job.budgetAmount ?? 0)}
                    </span>
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3 w-[80%]">
                    {getTruncatedDescription(job.description)}
                  </p>
                  <div className="mb-4">
                    <JobSkillBadges
                      categories={(job as { categories?: string[] }).categories}
                      jobSlug={job.slug}
                      jobId={job.id}
                    />
                  </div>

                  <div className="pt-3 flex flex-wrap items-center text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{formatJobLocationCityOnly(job)}</span>
                    </div>
                    <span className="hidden sm:inline text-[#c7c7c7]" aria-hidden="true">•</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Posted {getRelativeTime(job.postedAt)}</span>
                    </div>
                    <span className="hidden sm:inline text-[#c7c7c7]" aria-hidden="true">•</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {job.quotes.length} {job.quotes.length === 1 ? "Quote" : "Quotes"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Right column: status (top), new-quote badge, view quotes */}
                <div className="md:w-[30%] flex flex-col gap-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end w-full">
                    <ClientJobListStatusBadge status={job.status} />
                  </div>
                  <div className="flex items-start justify-end">
                    {newQuoteJobIds.has(job.id) && (
                      <div className="relative">
                        <span className="absolute -inset-1 rounded-full bg-[#FE8A0F]/30 animate-ping" />
                        <span
                          className="inline-flex items-center rounded-full bg-gradient-to-r from-[#FE8A0F] to-[#FFB347] px-3 py-1 text-[11px] font-['Poppins',sans-serif] font-semibold shadow-md ring-2 ring-[#FE8A0F]/30"
                          style={{ animation: "gotNewQuoteTextPulse 1.4s ease-in-out infinite" }}
                        >
                          Got New Quotes
                        </span>
                      </div>
                    )}
                  </div>

                  {(job.quotes?.length ?? 0) > 0 && (
                    <div className="mt-auto flex justify-end">
                      <Button
                        variant="outline"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          markJobQuotesSeen(job.id);
                          navigate(`/job/${job.slug || job.id}?tab=quotes`);
                        }}
                        className="w-full font-['Poppins',sans-serif] hover:bg-[#E3F2FD] hover:text-[#1976D2] hover:border-[#1976D2]"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        View Quotes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Job Dialog with Quotes */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[24px]">
              {currentJob?.title}
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px]">
              Job details and quotes from professionals
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {currentJob && (
              <div className="space-y-6">
                {/* Job Details */}
                <div className="bg-[#f8f9fa] rounded-xl p-6">
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4">
                    Job Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                        Sector
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        {currentJob.sector}
                      </p>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                        Categories
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        {currentJob.categories.join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                        Location
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        {formatJobLocationCityOnly(currentJob)}
                      </p>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                        Budget: &nbsp; 
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        {currentJob.budgetMin != null && currentJob.budgetMax != null
                        ? `${formatPriceWhole(currentJob.budgetMin)} - ${formatPriceWhole(currentJob.budgetMax)}`
                        : formatPriceWhole(currentJob.budgetAmount ?? 0)} ({currentJob.budgetType})
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      Description
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] whitespace-pre-wrap">
                      {currentJob.description}
                    </p>
                  </div>
                </div>

                {/* Quotes */}
                <div>
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4">
                    Quotes ({currentJob.quotes.length})
                  </h3>
                  {currentJob.quotes.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                      <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        No quotes yet. Professionals will start sending quotes soon.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentJob.quotes.map((quote) => (
                        <div
                          key={quote.id}
                          className={`border-2 rounded-xl p-5 ${
                            quote.status === "accepted"
                              ? "border-green-500 bg-green-50"
                              : quote.status === "rejected"
                              ? "border-gray-300 bg-gray-50 opacity-60"
                              : "border-gray-200 hover:border-[#1976D2] hover:shadow-md"
                          } transition-all duration-300`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <a href={`/profile/${quote.professionalId}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Avatar className="w-14 h-14 cursor-pointer hover:opacity-90 transition-opacity">
                                  {resolveAvatarUrl(quote.professionalAvatar) && (
                                    <AvatarImage src={resolveAvatarUrl(quote.professionalAvatar)} />
                                  )}
                                  <AvatarFallback className="bg-[#1976D2] text-white font-['Poppins',sans-serif]">
                                    {getTwoLetterInitials(quote.professionalName, "P")}
                                  </AvatarFallback>
                                </Avatar>
                              </a>
                              <div>
                                <a href={`/profile/${quote.professionalId}`} target="_blank" rel="noopener noreferrer" className="block hover:underline" onClick={(e) => e.stopPropagation()}>
                                  <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                                    {quote.professionalName}
                                  </h4>
                                </a>
                                <div className="flex items-center gap-3 text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif]">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-[#FE8A0F] fill-[#FE8A0F]" />
                                    {formatNumber(Number(quote.professionalRating), 1)} ({quote.professionalReviews} {quote.professionalReviews === 1 ? 'review' : 'reviews'})
                                  </div>
                                </div>
                                {!!(quote as any).professionalProfileTitle && (
                                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-bold mt-1">
                                    {(quote as any).professionalProfileTitle}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <p className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-1">
                                {formatPriceWhole(Number(quote.price))} in {formatDeliveryDisplay(quote.deliveryTime || "")}
                              </p>
                              {quote.status === "accepted" && (
                                <Badge className="bg-green-100 text-green-700 border-green-300">
                                  Accepted
                                </Badge>
                              )}
                              {quote.status === "rejected" && (
                                <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                                  Rejected
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-4">
                            {quote.message}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mb-4">
                            Submitted {formatDate(quote.submittedAt)}
                          </p>
                          {quote.status === "pending" && (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleAcceptQuote(quote.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif]"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Accept Quote
                              </Button>
                              <Button
                                onClick={() => handleStartChat(quote)}
                                variant="outline"
                                className="font-['Poppins',sans-serif] hover:bg-[#E3F2FD] hover:text-[#1976D2] hover:border-[#1976D2]"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Message
                              </Button>
                              <Button
                                onClick={() => handleRejectQuote(quote.id)}
                                variant="outline"
                                className="font-['Poppins',sans-serif] hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {quote.status === "accepted" && (
                            <Button
                              onClick={() => handleStartChat(quote)}
                              className="bg-[#1976D2] hover:bg-[#1565C0] text-white font-['Poppins',sans-serif]"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat with Professional
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="w-[70vw] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
              Chat with {selectedQuote?.professionalName}
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px]">
              Discuss the job details and finalize the arrangement
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col h-[400px]">
            <ScrollArea className="flex-1 p-4 bg-[#f8f9fa] rounded-lg mb-4">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                    Chat started • {new Date().toLocaleDateString()}
                  </p>
                </div>
                {/* Mock messages */}
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg px-4 py-2 max-w-[70%]">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                      {selectedQuote?.professionalName}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Thanks for considering my quote! I'm available to start this week.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 font-['Poppins',sans-serif] text-[14px]"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-[#1976D2] hover:bg-[#1565C0] text-white font-['Poppins',sans-serif]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
