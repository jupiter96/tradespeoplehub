import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs, JobQuote } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
import {
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  MessageCircle,
  Eye,
  Edit,
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
import { resolveAvatarUrl } from "./orders/utils";

export default function MyJobsSection() {
  const navigate = useNavigate();
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

  // Get user's jobs
  const userJobs = getUserJobs(userInfo?.id || "client-1");

  // Filter jobs based on status and search
  const filteredJobs = userJobs.filter((job) => {
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const currentJob = selectedJob ? jobs.find(j => j.id === selectedJob) : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "awaiting-accept":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTimingIcon = (timing: string) => {
    if (timing === "urgent") return <Flame className="w-4 h-4 text-red-500" />;
    if (timing === "flexible") return <Clock className="w-4 h-4 text-blue-500" />;
    return <Calendar className="w-4 h-4 text-gray-500" />;
  };

  const handleDeleteJob = (jobId: string) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      deleteJob(jobId);
      toast.success("Job deleted successfully");
    }
  };

  const handleAcceptQuote = (quoteId: string) => {
    if (currentJob) {
      updateQuoteStatus(currentJob.id, quoteId, "accepted");
      toast.success("Quote accepted! The professional will be notified.");
    }
  };

  const handleRejectQuote = (quoteId: string) => {
    if (currentJob) {
      updateQuoteStatus(currentJob.id, quoteId, "rejected");
      toast.success("Quote rejected");
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

  return (
    <div>
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="awaiting-accept">Awaiting Accept</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
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
              className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                          {job.title}
                        </h3>
                        {getTimingIcon(job.timing)}
                        <Badge className={`${getStatusBadge(job.status)} border font-['Poppins',sans-serif] text-[11px]`}>
                          {job.status === "awaiting-accept" ? "Awaiting Accept" : job.status === "in-progress" ? "In Progress" : job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          £{job.budgetAmount} ({job.budgetType})
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Posted {formatDate(job.postedAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4" />
                          {job.quotes.length} Quote{job.quotes.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/job/${job.id}`)}
                    className="font-['Poppins',sans-serif] hover:bg-[#E3F2FD] hover:text-[#1976D2] hover:border-[#1976D2]"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    View ({job.quotes.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedJob(job.id);
                      setIsEditDialogOpen(true);
                    }}
                    className="font-['Poppins',sans-serif] hover:bg-[#FFF5EB] hover:text-[#FE8A0F] hover:border-[#FE8A0F]"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteJob(job.id)}
                    className="font-['Poppins',sans-serif] hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
                        {currentJob.location} ({currentJob.postcode})
                      </p>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                        Budget
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        £{currentJob.budgetAmount} ({currentJob.budgetType})
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      Description
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
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
                              <Avatar className="w-12 h-12">
                                {resolveAvatarUrl(quote.professionalAvatar) && (
                                  <AvatarImage src={resolveAvatarUrl(quote.professionalAvatar)} />
                                )}
                                <AvatarFallback className="bg-[#1976D2] text-white font-['Poppins',sans-serif]">
                                  {quote.professionalName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                                  {quote.professionalName}
                                </h4>
                                <div className="flex items-center gap-3 text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif]">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-[#FE8A0F] fill-[#FE8A0F]" />
                                    {quote.professionalRating} ({quote.professionalReviews})
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {quote.deliveryTime}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-1">
                                £{quote.price}
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

      {/* Edit Job Dialog (Simplified) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[70vw]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
              Edit Job
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px]">
              Update your job details
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Job editing functionality will be available soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
