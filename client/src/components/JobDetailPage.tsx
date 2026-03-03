import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useJobs, JobQuote, Milestone } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
import { resolveAvatarUrl, getTwoLetterInitials } from "./orders/utils";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import {
  MapPin,
  Calendar,
  DollarSign,
  MessageCircle,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Flag,
  ChevronLeft,
  User,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Flame,
  X,
  Plus,
  ChevronDown,
  Info,
  Inbox,
  Sparkles,
} from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { toast } from "sonner@2.0.3";
import { resolveApiUrl } from "../config/api";
import awardImage from "figma:asset/5c876de928ca711ee9770734c2254c71ec8d2988.png";
import milestoneStep1 from "figma:asset/a0de430b25f40690ee801be2a6d5041990689f12.png";
import milestoneStep2 from "figma:asset/e1c037263ad447fb88ea0f991b3910b9cdd26dec.png";
import milestoneStep3 from "figma:asset/27504741573e0946b791d837bb57de9ad9c0f981.png";
import InviteToQuoteModal from "./InviteToQuoteModal";
import InviteProfessionalsList from "./InviteProfessionalsList";

export default function JobDetailPage() {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getJobById, fetchJobById, updateQuoteStatus, addQuoteToJob, awardJobWithMilestone, awardJobWithoutMilestone, acceptAward, rejectAward, updateMilestoneStatus, updateJob, addMilestone, deleteMilestone, acceptMilestone, requestMilestoneCancel, respondToCancelRequest, createDispute } = useJobs();
  const { userInfo, userRole, isLoggedIn, authReady } = useAccount();
  const { startConversation } = useMessenger();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "details");
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    price: "",
    deliveryTime: "",
    message: "",
  });
  const [aiQuoteMessageGenerating, setAiQuoteMessageGenerating] = useState(false);
  
  // Milestone state for sending quote
  const [milestones, setMilestones] = useState<Array<{ description: string; amount: string }>>([
    { description: "", amount: "" }
  ]);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);

  // Award modal state
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedQuoteForAward, setSelectedQuoteForAward] = useState<JobQuote | null>(null);
  const [awardWithMilestone, setAwardWithMilestone] = useState(true);
  const [awardMilestones, setAwardMilestones] = useState<Array<{ name: string; amount: string }>>([{ name: "", amount: "" }]);

  // Cancel request modal (for milestone)
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [cancelRequestMilestone, setCancelRequestMilestone] = useState<Milestone | null>(null);
  const [cancelRequestReason, setCancelRequestReason] = useState("");

  // New milestone state
  const [showNewMilestoneDialog, setShowNewMilestoneDialog] = useState(false);
  const [newMilestoneForm, setNewMilestoneForm] = useState({
    name: "",
    description: "",
    amount: "",
  });

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMilestone, setDisputeMilestone] = useState<Milestone | null>(null);
  const [disputeForm, setDisputeForm] = useState({
    requirements: "",
    notCompleted: "",
    evidenceFiles: [] as File[],
    selectedMilestones: [] as string[],
  });

  // Invite to quote modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<{ id: string; name: string; category: string } | null>(null);
  const [invitedProfessionals, setInvitedProfessionals] = useState<Set<string>>(new Set());
  const [recommendedProfessionals, setRecommendedProfessionals] = useState<Array<{
    id: string; name: string; title: string; category: string; image: string;
    rating: number; reviewCount: number; completedJobs: number; location: string; skills?: string[];
  }>>([]);
  const [recommendedProfessionalsLoading, setRecommendedProfessionalsLoading] = useState(false);

  // Redirect to login only after auth state is resolved (avoid redirect on refresh before session check)
  useEffect(() => {
    if (authReady && !isLoggedIn) {
      navigate("/login");
    }
  }, [authReady, isLoggedIn, navigate]);

  // Fetch job by id if not in context (e.g. direct URL or refresh)
  const [jobLoading, setJobLoading] = useState(false);
  useEffect(() => {
    if (!jobSlug || !authReady || !isLoggedIn) return;
    const inList = getJobById(jobSlug);
    if (inList) return;
    setJobLoading(true);
    fetchJobById(jobSlug).finally(() => setJobLoading(false));
  }, [jobSlug, authReady, isLoggedIn, getJobById, fetchJobById]);

  const job = getJobById(jobSlug || "");

  // Keep URL canonical: if we have job with slug and URL param differs (e.g. old id), replace with slug so refresh works
  useEffect(() => {
    if (!job?.slug || !jobSlug) return;
    if (job.slug !== jobSlug) {
      navigate(`/job/${job.slug}${window.location.search || ""}`, { replace: true });
    }
  }, [job?.slug, jobSlug, navigate]);

  // Fetch recommended professionals (same sector as job, sorted by rating then reviews)
  useEffect(() => {
    if (!jobSlug || !job?.id) return;
    setRecommendedProfessionalsLoading(true);
    fetch(resolveApiUrl(`/api/jobs/${jobSlug}/recommended-professionals`), { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => setRecommendedProfessionals(data?.professionals ?? []))
      .catch(() => setRecommendedProfessionals([]))
      .finally(() => setRecommendedProfessionalsLoading(false));
  }, [jobSlug, job?.id]);

  // Show loading while auth is resolving (e.g. on refresh) or job is fetching
  if (!authReady || (jobLoading && !job)) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 text-center mt-[50px] md:mt-0">
          <p className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b]">Loading job...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 text-center mt-[50px] md:mt-0">
          <h1 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-4">
            Job not found
          </h1>
          <Button
            onClick={() => navigate("/account?tab=my-jobs")}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
          >
            Back to My Jobs
          </Button>
        </div>
      </div>
    );
  }

  // Check if current user is the job owner (client)
  const isJobOwner = userInfo?.id === job.clientId || userRole === "client";
  // Check if current user already submitted a quote
  const hasSubmittedQuote = job.quotes.some(
    (quote) => quote.professionalId === userInfo?.id
  );
  // Find professional's awarded quote
  const myAwardedQuote = userRole === "professional" ? job.quotes.find(
    (quote) => quote.professionalId === userInfo?.id && quote.status === "awarded"
  ) : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleInviteProfessional = async (pro: typeof recommendedProfessionals[0]) => {
    try {
      const res = await fetch(resolveApiUrl(`/api/jobs/${job.id}/invite-professional`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ professionalId: pro.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send invitation");
      }
      setInvitedProfessionals((prev) => new Set(prev).add(pro.id));
      toast.success(`Sent invitation to ${pro.name} on project "${job.title}"`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to send invitation");
    }
  };

  const handleMessageProfessional = (pro: typeof recommendedProfessionals[0]) => {
    // Start a conversation with the professional
    startConversation(pro.id).then(() => {
      navigate(`/account?tab=messenger`);
    toast.success(`Opening chat with ${pro.name}`);
    });
  };

  const handleGenerateQuoteMessage = async () => {
    if (!job) return;
    setAiQuoteMessageGenerating(true);
    try {
      const res = await fetch(resolveApiUrl("/api/jobs/generate-quote-message"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle: job.title,
          jobDescription: job.description,
          sectorName: job.sector,
          keyPoints: quoteForm.message.trim() || undefined,
          tradingName: userInfo?.businessName || userInfo?.tradingName || userInfo?.name || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to generate message");
        return;
      }
      if (data.message) setQuoteForm((f) => ({ ...f, message: data.message }));
      toast.success("Message generated. You can edit it before sending.");
    } catch {
      toast.error("Failed to generate message. Please try again.");
    } finally {
      setAiQuoteMessageGenerating(false);
    }
  };

  const handleOpenAwardModal = (quote: JobQuote) => {
    setSelectedQuoteForAward(quote);
    setAwardMilestones([{ name: "", amount: quote.price.toString() }]);
    setShowAwardModal(true);
  };

  const handleAwardJob = async () => {
    if (!selectedQuoteForAward) return;

    if (awardWithMilestone) {
      const valid = awardMilestones.filter((m) => m.name?.trim() && m.amount && !isNaN(parseFloat(m.amount)) && parseFloat(m.amount) > 0);
      if (valid.length === 0) {
        toast.error("Add at least one milestone with a name and valid amount");
        return;
      }
      const milestones = valid.map((m) => ({ name: m.name.trim(), amount: parseFloat(m.amount) }));
      try {
        await awardJobWithMilestone(job.id, selectedQuoteForAward.id, selectedQuoteForAward.professionalId, milestones);
        toast.success(`Job awarded with ${milestones.length} milestone(s)!`);
        setShowAwardModal(false);
        setSelectedQuoteForAward(null);
        setAwardMilestones([{ name: "", amount: "" }]);
        setAwardWithMilestone(true);
        setActiveTab("payment");
        navigate(`/job/${job.slug || jobSlug}?tab=payment`, { replace: true });
      } catch (e: any) {
        if (e?.code === "INSUFFICIENT_BALANCE") {
          toast.error("Insufficient balance. Please add funds to your wallet.");
          navigate("/account?tab=billing&section=fund");
        } else {
          toast.error(e?.message || "Failed to award job");
        }
      }
      return;
    }

    try {
      await awardJobWithoutMilestone(job.id, selectedQuoteForAward.id, selectedQuoteForAward.professionalId);
      toast.success("Job awarded successfully!");
      setShowAwardModal(false);
      setSelectedQuoteForAward(null);
      setAwardMilestones([{ name: "", amount: "" }]);
      setAwardWithMilestone(true);
      setActiveTab("payment");
      navigate(`/job/${job.slug || jobSlug}?tab=payment`, { replace: true });
    } catch (e: any) {
      if (e?.code === "INSUFFICIENT_BALANCE") {
        toast.error("Insufficient balance. Please add funds to your wallet.");
        navigate("/account?tab=billing&section=fund");
      } else {
        toast.error(e?.message || "Failed to award job");
      }
    }
  };

  const handleAcceptAward = async () => {
    try {
      await acceptAward(job.id);
      toast.success("Job accepted! You can now start working on it.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to accept");
    }
  };

  const handleRejectAward = async () => {
    try {
      await rejectAward(job.id);
      toast.success("Job award rejected.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject");
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try {
      await updateQuoteStatus(job.id, quoteId, "rejected");
      toast.success("Quote rejected");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject quote");
    }
  };

  const handleCreateMilestone = async () => {
    const nameOrDesc = (newMilestoneForm.name || newMilestoneForm.description || "").trim();
    if (!nameOrDesc || !newMilestoneForm.amount) {
      toast.error("Please fill in milestone name and amount");
      return;
    }

    const amount = parseFloat(newMilestoneForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await addMilestone(job.id, nameOrDesc, amount);
      toast.success("Milestone created successfully!");
      setShowNewMilestoneDialog(false);
      setNewMilestoneForm({ name: "", description: "", amount: "" });
    } catch (e: any) {
      if (e?.code === "INSUFFICIENT_BALANCE") {
        toast.error("Insufficient balance. Please add funds to your wallet.");
        navigate("/account?tab=billing&section=fund");
      } else {
        toast.error(e?.message || "Failed to create milestone");
      }
    }
  };

  const handleOpenDisputeModal = (milestone: Milestone) => {
    setDisputeMilestone(milestone);
    setShowDisputeModal(true);
    setDisputeForm({
      requirements: "",
      notCompleted: "",
      evidenceFiles: [],
      selectedMilestones: [],
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setDisputeForm((prev) => ({
        ...prev,
        evidenceFiles: Array.from(files),
      }));
    }
  };

  const handleMilestoneSelection = (milestoneId: string, checked: boolean) => {
    setDisputeForm((prev) => ({
      ...prev,
      selectedMilestones: checked
        ? [...prev.selectedMilestones, milestoneId]
        : prev.selectedMilestones.filter((id) => id !== milestoneId),
    }));
  };

  const handleSubmitDispute = async () => {
    const reason = [disputeForm.requirements, disputeForm.notCompleted].filter(Boolean).join("\n\n");
    if (!reason.trim()) {
      toast.error("Please describe the reason for the dispute");
      return;
    }
    const milestoneToUse = disputeMilestone || (job.milestones && disputeForm.selectedMilestones[0]
      ? job.milestones.find((m) => m.id === disputeForm.selectedMilestones[0])
      : null);
    if (!milestoneToUse) {
      toast.error("Please select a milestone to dispute");
      return;
    }

    try {
      const evidence = disputeForm.evidenceFiles.length > 0
        ? `${disputeForm.evidenceFiles.length} file(s) attached`
        : undefined;
      const disputeId = await createDispute(job.id, milestoneToUse.id, reason.trim(), evidence);
      toast.success("Dispute submitted successfully");
      setShowDisputeModal(false);
      setDisputeMilestone(null);
      if (disputeId) navigate(`/disputes/${disputeId}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create dispute");
    }
  };

  const handleStartChat = (quote: JobQuote) => {
    startConversation({
      id: quote.professionalId,
      name: quote.professionalName,
      avatar: quote.professionalAvatar,
      online: true,
      jobId: job?.id,
      jobTitle: job?.title,
    });
  };

  const handleSubmitQuote = async () => {
    if (!quoteForm.price || !quoteForm.deliveryTime || !quoteForm.message) {
      toast.error("Please fill in all fields");
      return;
    }
    const price = parseFloat(quoteForm.price);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    const minPrice = job.budgetMin ?? job.budgetAmount;
    const maxPrice = job.budgetMax ?? job.budgetAmount * 1.2;
    if (price < minPrice || price > maxPrice) {
      toast.error(`Price must be between £${minPrice.toFixed(0)} and £${maxPrice.toFixed(0)} (job budget range)`);
      return;
    }
    try {
      await addQuoteToJob(job.id, {
        professionalId: userInfo?.id || "",
        professionalName: userInfo?.businessName || userInfo?.name || "Professional",
        professionalAvatar: userInfo?.avatar,
        professionalRating: 4.8,
        professionalReviews: 0,
        price,
        deliveryTime: quoteForm.deliveryTime,
        message: quoteForm.message,
      });
      toast.success("Quote submitted successfully!");
      setShowQuoteDialog(false);
      setQuoteForm({ price: "", deliveryTime: "", message: "" });
      setMilestones([{ description: "", amount: "" }]);
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit quote");
    }
  };

  // Milestone functions for quote form
  const addMilestoneToForm = () => {
    setMilestones([...milestones, { description: "", amount: "" }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index: number, field: "description" | "amount", value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const getTimingBadge = () => {
    if (job.timing === "urgent") {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 font-['Poppins',sans-serif]">
          <Flame className="w-3 h-3 mr-1" />
          Urgent
        </Badge>
      );
    }
    if (job.timing === "flexible") {
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-['Poppins',sans-serif]">
          <Clock className="w-3 h-3 mr-1" />
          Flexible
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-50 text-gray-700 border-gray-200 font-['Poppins',sans-serif]">
        <Calendar className="w-3 h-3 mr-1" />
        {job.specificDate || "Specific Date"}
      </Badge>
    );
  };

  const getStatusBadge = (size: "normal" | "large" = "normal") => {
    const sizeClasses = size === "large" 
      ? "px-4 py-2 text-[14px] sm:text-[16px]" 
      : "";
    
    switch (job.status) {
      case "active":
        return (
          <Badge className={`bg-green-50 text-green-700 border-green-200 font-['Poppins',sans-serif] ${sizeClasses}`}>
            <CheckCircle2 className={size === "large" ? "w-5 h-5 mr-2" : "w-3 h-3 mr-1"} />
            Active
          </Badge>
        );
      case "awaiting-accept":
        return (
          <Badge className={`bg-blue-50 text-blue-700 border-blue-200 font-['Poppins',sans-serif] ${sizeClasses}`}>
            <Clock className={size === "large" ? "w-5 h-5 mr-2" : "w-3 h-3 mr-1"} />
            Awaiting Accept
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className={`bg-blue-50 text-blue-700 border-blue-200 font-['Poppins',sans-serif] ${sizeClasses}`}>
            <Clock className={size === "large" ? "w-5 h-5 mr-2" : "w-3 h-3 mr-1"} />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className={`bg-purple-50 text-purple-700 border-purple-200 font-['Poppins',sans-serif] ${sizeClasses}`}>
            <CheckCircle2 className={size === "large" ? "w-5 h-5 mr-2" : "w-3 h-3 mr-1"} />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className={`bg-red-50 text-red-700 border-red-200 font-['Poppins',sans-serif] ${sizeClasses}`}>
            <XCircle className={size === "large" ? "w-5 h-5 mr-2" : "w-3 h-3 mr-1"} />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Navigation */}
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>

      {/* Header Section - White */}
      <div className="bg-white py-4 md:py-8 mt-[50px] md:mt-0">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-16">
          <Button
            variant="ghost"
            onClick={() => navigate("/account?tab=my-jobs")}
            className="text-[#2c353f] hover:bg-gray-100 mb-3 md:mb-4 font-['Poppins',sans-serif] text-[13px] md:text-[14px] h-8 md:h-10 px-2 md:px-4"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {isJobOwner ? "Back to My Jobs" : "Back to Available Jobs"}
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-['Poppins',sans-serif] text-[20px] sm:text-[28px] md:text-[40px] text-[#2c353f] leading-tight">
                {job.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Professional: Submit Quote button */}
              {!isJobOwner && job.status === "active" && !hasSubmittedQuote && (
                <Button
                  onClick={() => setShowQuoteDialog(true)}
                  className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] h-9 sm:h-10 px-4 sm:px-6"
                >
                  Submit Quote
                </Button>
              )}
              {/* Professional: Already submitted */}
              {!isJobOwner && hasSubmittedQuote && (
                <Badge className="bg-green-50 text-green-700 border-green-200 font-['Poppins',sans-serif] px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[14px]">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Quote Submitted
                </Badge>
              )}
              {/* Job Status Badge */}
              {getStatusBadge("large")}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-16">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto scrollbar-hide -mx-4 md:mx-0 px-4 md:px-0">
              <TabsList className="bg-transparent border-0 h-auto p-0 gap-2 flex-nowrap inline-flex min-w-full md:min-w-0">
                <TabsTrigger
                  value="details"
                  className="bg-transparent border-0 text-[#6b6b6b] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#FE8A0F] hover:text-[#2c353f] hover:bg-gray-50 rounded-t-lg rounded-b-none px-4 md:px-6 py-3 font-['Poppins',sans-serif] text-[14px] md:text-[15px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                >
                  Details
                </TabsTrigger>
                {/* Only show Quotes tab to Client (job owner) */}
                {isJobOwner && (
                  <TabsTrigger
                    value="quotes"
                    className="bg-transparent border-0 text-[#6b6b6b] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#FE8A0F] hover:text-[#2c353f] hover:bg-gray-50 rounded-t-lg rounded-b-none px-4 md:px-6 py-3 font-['Poppins',sans-serif] text-[14px] md:text-[15px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                  >
                    Quotes ({job.quotes.length})
                  </TabsTrigger>
                )}
                {/* Show Payment tab if job is awarded (awaiting-accept or in-progress) */}
                {(job.status === "awaiting-accept" || job.status === "in-progress") && (
                  <TabsTrigger
                    value="payment"
                    className="bg-transparent border-0 text-[#6b6b6b] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#FE8A0F] hover:text-[#2c353f] hover:bg-gray-50 rounded-t-lg rounded-b-none px-4 md:px-6 py-3 font-['Poppins',sans-serif] text-[14px] md:text-[15px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                  >
                    Payment
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="activity"
                  className="bg-transparent border-0 text-[#6b6b6b] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#FE8A0F] hover:text-[#2c353f] hover:bg-gray-50 rounded-t-lg rounded-b-none px-4 md:px-6 py-3 font-['Poppins',sans-serif] text-[14px] md:text-[15px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                >
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-16 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                    Job Details
                  </h2>
                  <div className="text-right">
                    <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-1">
                      {job.budgetMin != null && job.budgetMax != null
                        ? `£${job.budgetMin.toFixed(0)} - £${job.budgetMax.toFixed(0)}`
                        : `£${job.budgetAmount.toFixed(0)} - £${(job.budgetAmount * 1.2).toFixed(0)}`}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                      Posted: {formatDate(job.postedAt)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="py-3">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-4">
                      {job.description}
                    </p>
                  </div>

                  <div className="py-3 border-t border-gray-100">
                    <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                      Skill Required
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.categories.map((category, idx) => (
                        <Badge
                          key={idx}
                          className="bg-[#E3F2FD] text-[#1976D2] border-[#1976D2]/30 font-['Poppins',sans-serif]"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Status and Timing Badges */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                    {getStatusBadge()}
                    {getTimingBadge()}
                  </div>
                </div>

                {/* Project ID - Bottom Right */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                    {job.id.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Quotes Tab */}
            {activeTab === "quotes" && (
              <div className="space-y-4">
                {/* Professional: Awarded Section */}
                {userRole === "professional" && myAwardedQuote && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
                      Awarded Professionals
                    </h2>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#f8f9fa] p-4 sm:p-5 rounded-lg">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-gray-200 flex-shrink-0">
                          {resolveAvatarUrl(myAwardedQuote.professionalAvatar) && (
                            <AvatarImage src={resolveAvatarUrl(myAwardedQuote.professionalAvatar)} />
                          )}
                          <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[18px]">
                            {getTwoLetterInitials(myAwardedQuote.professionalName, "P")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-[#2c353f] mb-1">
                            {myAwardedQuote.professionalName}
                          </h3>
                          <button className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#3B82F6] hover:underline mb-2">
                            View profile
                          </button>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1 bg-[#FE8A0F] px-2 py-1 rounded">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
                              <span className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-white">
                                {myAwardedQuote.professionalRating}
                              </span>
                            </div>
                            <span className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b]">
                              ({myAwardedQuote.professionalReviews} reviews)
                            </span>
                          </div>
                          <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f]">
                            {myAwardedQuote.message || "will do"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <p className="font-['Poppins',sans-serif] text-[20px] sm:text-[24px] text-[#2c353f]">
                            £{myAwardedQuote.price.toFixed(2)} GBP
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b]">
                            in {myAwardedQuote.deliveryTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <Button
                            onClick={() => handleStartChat(myAwardedQuote)}
                            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-5 py-2"
                          >
                            Chat
                          </Button>
                          <Button
                            onClick={handleAcceptAward}
                            className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-5 py-2 transition-all duration-300"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={handleRejectAward}
                            className="bg-[#DC3545] hover:bg-[#C82333] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-5 py-2"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {job.quotes.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 md:p-24 text-center">
                    <div className="mx-auto mb-6 flex justify-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <Inbox className="h-12 w-12" strokeWidth={1.25} aria-hidden />
                      </div>
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[15px] text-[#6b7280] leading-relaxed max-w-xl mx-auto">
                      Thank you for posting your job, our vetted professionals will quote soon.
                    </p>
                  </div>
                ) : (
                  job.quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className={`bg-white rounded-lg border transition-all duration-200 overflow-hidden ${
                        quote.status === "accepted"
                          ? "border-green-500 shadow-sm"
                          : quote.status === "awarded"
                          ? "border-orange-500 shadow-sm"
                          : quote.status === "rejected"
                          ? "border-gray-200 opacity-60"
                          : "border-gray-200 hover:border-[#FE8A0F] hover:shadow-md"
                      }`}
                    >
                      {/* Mobile Layout */}
                      <div className="block sm:hidden p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            {resolveAvatarUrl(quote.professionalAvatar) && (
                              <AvatarImage src={resolveAvatarUrl(quote.professionalAvatar)} />
                            )}
                            <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                              {getTwoLetterInitials(quote.professionalName, "P")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-medium truncate mb-1">
                              {quote.professionalName}
                            </h3>
                            <div className="flex items-center gap-2 text-[12px] text-[#6b6b6b] mb-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-[#FE8A0F] fill-[#FE8A0F]" />
                                <span>{quote.professionalRating}</span>
                              </div>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>{quote.deliveryTime}</span>
                            </div>
                            {quote.status !== "pending" && (
                              <Badge className={`text-[10px] px-2 py-0.5 ${
                                quote.status === "accepted" ? "bg-green-50 text-green-700 border-green-200" :
                                quote.status === "awarded" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                "bg-gray-50 text-gray-700 border-gray-200"
                              }`}>
                                {quote.status === "accepted" ? "Accepted" :
                                 quote.status === "awarded" ? "Awarded" : "Rejected"}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                              £{quote.price}
                            </p>
                          </div>
                        </div>
                        
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3 line-clamp-2">
                          {quote.message}
                        </p>

                        {quote.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleOpenAwardModal(quote)}
                              className="flex-1 bg-[#FE8A0F] hover:bg-[#E57A00] text-white font-['Poppins',sans-serif] text-[13px] h-9"
                            >
                              Award
                            </Button>
                            <Button
                              onClick={() => handleStartChat(quote)}
                              variant="outline"
                              className="flex-1 font-['Poppins',sans-serif] text-[13px] h-9"
                            >
                              Message
                            </Button>
                          </div>
                        )}
                        {quote.status === "accepted" && (
                          <Button
                            onClick={() => handleStartChat(quote)}
                            className="w-full bg-[#1976D2] hover:bg-[#1565C0] text-white font-['Poppins',sans-serif] text-[13px] h-9"
                          >
                            Chat
                          </Button>
                        )}
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:block p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="w-14 h-14 flex-shrink-0">
                              {resolveAvatarUrl(quote.professionalAvatar) && (
                              <AvatarImage src={resolveAvatarUrl(quote.professionalAvatar)} />
                            )}
                              <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                                {getTwoLetterInitials(quote.professionalName, "P")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium mb-1">
                                {quote.professionalName}
                              </h3>
                              <div className="flex items-center gap-4 text-[13px] text-[#6b6b6b]">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-[#FE8A0F] fill-[#FE8A0F]" />
                                  <span>{quote.professionalRating}</span>
                                  <span className="text-[#8d8d8d]">({quote.professionalReviews})</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{quote.deliveryTime}</span>
                                </div>
                              </div>
                            </div>
                            {quote.status !== "pending" && (
                              <Badge className={`text-[12px] px-3 py-1 ${
                                quote.status === "accepted" ? "bg-green-50 text-green-700 border-green-200" :
                                quote.status === "awarded" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                "bg-gray-50 text-gray-700 border-gray-200"
                              }`}>
                                {quote.status === "accepted" ? "Accepted" :
                                 quote.status === "awarded" ? "Awaiting Response" : "Rejected"}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <p className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">
                              £{quote.price}
                            </p>
                          </div>
                        </div>

                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4 pl-[72px]">
                          {quote.message}
                        </p>

                        <div className="pl-[72px]">
                          {quote.status === "pending" && (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleOpenAwardModal(quote)}
                                className="bg-[#FE8A0F] hover:bg-[#E57A00] text-white font-['Poppins',sans-serif] text-[14px] h-10 px-6"
                              >
                                Award
                              </Button>
                              <Button
                                onClick={() => handleStartChat(quote)}
                                variant="outline"
                                className="font-['Poppins',sans-serif] text-[14px] h-10 px-6"
                              >
                                Message
                              </Button>
                            </div>
                          )}
                          {quote.status === "awarded" && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-[13px] text-[#6b6b6b]">
                              Awaiting professional's response
                            </div>
                          )}
                          {quote.status === "accepted" && (
                            <Button
                              onClick={() => handleStartChat(quote)}
                              className="bg-[#1976D2] hover:bg-[#1565C0] text-white font-['Poppins',sans-serif] text-[14px] h-10 px-6"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat with Professional
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Invite Professionals List - dynamic by job sector, sorted by rating/reviews */}
                {isJobOwner && (
                  <>
                    {recommendedProfessionalsLoading ? (
                      <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          Loading professionals who match your job…
                        </p>
                      </div>
                    ) : (
                      <InviteProfessionalsList
                        professionals={recommendedProfessionals}
                        onInvite={handleInviteProfessional}
                        invitedProfessionalIds={invitedProfessionals}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === "payment" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                    Milestone Payments
                  </h2>
                  {isJobOwner && (
                    <Button
                      onClick={() => setShowNewMilestoneDialog(true)}
                      className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Milestone
                    </Button>
                  )}
                </div>

                {/* Professional: Accept/Reject job award when status is awaiting-accept */}
                {!isJobOwner && job.status === "awaiting-accept" && job.awardedProfessionalId === userInfo?.id && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-3">
                      You&apos;ve been awarded this job. Accept to start working or reject to decline.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAcceptAward}
                        className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif]"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRejectAward}
                        className="border-red-300 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif]"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty state if no milestones */}
                {(!job.milestones || job.milestones.length === 0) && (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">
                      No Milestones Yet
                    </h3>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4 max-w-md mx-auto">
                      Milestone payments allow you to pay in stages. Create your first milestone to get started.
                    </p>
                    {isJobOwner && (
                      <Button
                        onClick={() => setShowNewMilestoneDialog(true)}
                        className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Milestone
                      </Button>
                    )}
                  </div>
                )}

                {/* Milestones table */}
                {job.milestones && job.milestones.length > 0 && (
                  <>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full font-['Poppins',sans-serif] text-[14px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-[#2c353f] font-medium">Milestone name</th>
                            <th className="text-left py-3 px-4 text-[#2c353f] font-medium">Created date</th>
                            <th className="text-left py-3 px-4 text-[#2c353f] font-medium">Status</th>
                            <th className="text-right py-3 px-4 text-[#2c353f] font-medium">Amount</th>
                            <th className="text-right py-3 px-4 text-[#2c353f] font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {job.milestones.map((milestone) => (
                            <tr key={milestone.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-3 px-4 text-[#2c353f]">{milestone.name || milestone.description || "Milestone"}</td>
                              <td className="py-3 px-4 text-[#6b6b6b]">{formatDate(milestone.createdAt)}</td>
                              <td className="py-3 px-4">
                                {milestone.status === "awaiting-accept" && (
                                  <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-2 py-0">Funded</Badge>
                                )}
                                {milestone.status === "in-progress" && (
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0">In Progress</Badge>
                                )}
                                {milestone.status === "released" && (
                                  <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] px-2 py-0">Released</Badge>
                                )}
                                {milestone.status === "disputed" && (
                                  <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] px-2 py-0">Disputed</Badge>
                                )}
                                {milestone.status === "cancelled" && (
                                  <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] px-2 py-0">Cancelled</Badge>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right text-[#2c353f]">£{milestone.amount}</td>
                              <td className="py-3 px-4 text-right">
                                {/* Client: awaiting-accept (pro not accepted yet) → Close to cancel and refund */}
                                {isJobOwner && milestone.status === "awaiting-accept" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await deleteMilestone(job.id, milestone.id);
                                        toast.success("Milestone closed and refunded to your balance");
                                      } catch (e: any) {
                                        toast.error(e?.message || "Failed to close milestone");
                                      }
                                    }}
                                    className="h-8 px-3 text-[13px] border-orange-300 text-orange-600 hover:bg-orange-50"
                                  >
                                    Close
                                  </Button>
                                )}
                                {/* Client: in-progress → Cancel request + Dispute (or Accept/Reject if cancel requested by pro) */}
                                {isJobOwner && milestone.status === "in-progress" && (
                                  <div className="flex items-center justify-end gap-1 flex-wrap">
                                    {milestone.cancelRequestStatus === "pending" && milestone.cancelRequestedBy !== userInfo?.id ? (
                                      <>
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-green-600 border-green-300 hover:bg-green-50"
                                          onClick={async () => {
                                            try {
                                              await respondToCancelRequest(job.id, milestone.id, true);
                                              toast.success("Cancel request accepted");
                                            } catch (e: any) {
                                              toast.error(e?.message || "Failed");
                                            }
                                          }}
                                        >
                                          Accept
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 border-red-300 hover:bg-red-50"
                                          onClick={async () => {
                                            try {
                                              await respondToCancelRequest(job.id, milestone.id, false);
                                              toast.success("Cancel request rejected");
                                            } catch (e: any) {
                                              toast.error(e?.message || "Failed");
                                            }
                                          }}
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                                          onClick={async () => {
                                            try {
                                              await updateMilestoneStatus(job.id, milestone.id, "released");
                                              toast.success("Payment released");
                                            } catch (e: any) {
                                              toast.error(e?.message || "Failed");
                                            }
                                          }}
                                        >
                                          Release
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={milestone.cancelRequestStatus === "pending"}
                                          onClick={() => {
                                            setCancelRequestMilestone(milestone);
                                            setCancelRequestReason("");
                                            setShowCancelRequestModal(true);
                                          }}
                                          className="h-8 px-2 text-[13px] border-orange-300 text-orange-600 hover:bg-orange-50"
                                        >
                                          Cancel request
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleOpenDisputeModal(milestone)}
                                          className="h-8 px-2 text-[13px] border-red-300 text-red-600 hover:bg-red-50"
                                        >
                                          <Flag className="w-4 h-4 mr-1" />
                                          Dispute
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                                {/* Pro: awaiting-accept → no per-row action (use banner Accept/Reject) */}
                                {/* Pro: in-progress → Cancel + Open dispute (or Accept/Reject cancel if pending by client) */}
                                {!isJobOwner && milestone.status === "in-progress" && (
                                  <div className="flex items-center justify-end gap-1">
                                    {milestone.cancelRequestStatus === "pending" && milestone.cancelRequestedBy !== userInfo?.id ? (
                                      <>
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-green-600 border-green-300 hover:bg-green-50"
                                          onClick={async () => {
                                            try {
                                              await respondToCancelRequest(job.id, milestone.id, true);
                                              toast.success("Cancel request accepted");
                                            } catch (e: any) {
                                              toast.error(e?.message || "Failed");
                                            }
                                          }}
                                        >
                                          Accept
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 border-red-300 hover:bg-red-50"
                                          onClick={async () => {
                                            try {
                                              await respondToCancelRequest(job.id, milestone.id, false);
                                              toast.success("Cancel request rejected");
                                            } catch (e: any) {
                                              toast.error(e?.message || "Failed");
                                            }
                                          }}
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={milestone.cancelRequestStatus === "pending"}
                                          onClick={() => {
                                            setCancelRequestMilestone(milestone);
                                            setCancelRequestReason("");
                                            setShowCancelRequestModal(true);
                                          }}
                                          className="h-8 px-2 text-[13px] border-red-300 text-red-600 hover:bg-red-50"
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleOpenDisputeModal(milestone)}
                                          className="h-8 px-2 text-[13px] border-orange-300 text-orange-600 hover:bg-orange-50"
                                        >
                                          <Flag className="w-4 h-4 mr-1" />
                                          Open dispute
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">Total Milestones:</p>
                        <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                          £{job.milestones.reduce((sum, m) => sum + m.amount, 0)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Released:</p>
                        <p className="font-['Poppins',sans-serif] text-[16px] text-green-600">
                          £{job.milestones.filter((m) => m.status === "released").reduce((sum, m) => sum + m.amount, 0)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-4">
                  Activity
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-4 pb-4 border-b border-gray-100">
                    <div className="w-2 h-2 bg-[#1976D2] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                        Job posted
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                        {formatDate(job.postedAt)}
                      </p>
                    </div>
                  </div>
                  {job.quotes.map((quote, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 border-b border-gray-100">
                      <div className="w-2 h-2 bg-[#FE8A0F] rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                          Quote received from {quote.professionalName}
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                          {formatDate(quote.submittedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* More Tab */}
            {activeTab === "more" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-4">
                  More Options
                </h2>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start font-['Poppins',sans-serif]"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Edit Job Details
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-['Poppins',sans-serif]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Job Summary
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-['Poppins',sans-serif]"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Cancel Job
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
                About the Client
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    {resolveAvatarUrl(userInfo?.avatar) && (
                      <AvatarImage src={resolveAvatarUrl(userInfo?.avatar)} />
                    )}
                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                      {getTwoLetterInitials(userInfo?.name, "C")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      {userInfo?.name || "Client"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4 text-[#FE8A0F] fill-[#FE8A0F]"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#6b6b6b] font-['Poppins',sans-serif] text-[13px]">
                  <Clock className="w-4 h-4" />
                  Member Since {new Date(job.postedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </div>

                <Separator />

                <div>
                  <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                    Location
                  </h3>
                  <div className="flex items-center gap-2 text-[#2c353f] font-['Poppins',sans-serif] text-[14px]">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                    Category
                  </h3>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                    {job.sector}
                  </p>
                </div>

                <Separator />

                <button className="text-[#1976D2] hover:text-[#1565C0] font-['Poppins',sans-serif] text-[14px] flex items-center gap-2 w-full">
                  <Flag className="w-4 h-4" />
                  Report this job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Quote Submission Dialog for Professionals - same format as Account My Jobs Send Quote */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 pb-4 mb-6">
            <DialogTitle className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f]">
              Send Quote
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[15px] text-[#6b6b6b] mt-2">
              Submit your quote for: <span className="text-[#FE8A0F]">{job.title}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Job Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#1976D2] mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Job Summary
              </h3>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 leading-relaxed">
                  {job.description}
                </p>
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="font-['Poppins',sans-serif] text-[28px] text-[#059669]">
                    {job.budgetMin != null && job.budgetMax != null
                      ? `£${job.budgetMin.toFixed(0)} - £${job.budgetMax.toFixed(0)}`
                      : `£${job.budgetAmount.toFixed(0)} - £${(job.budgetAmount * 1.2).toFixed(0)}`}
                  </div>
                  {job.location && (
                    <div className="flex items-center gap-1.5 text-[#2c353f] text-[14px] font-['Poppins',sans-serif]">
                      <MapPin className="w-4 h-4 text-red-600" />
                      {job.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quote Details Section */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Quote Details
              </h3>
              <div className="space-y-5">
                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Your Price (£) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter your price"
                    min={job.budgetMin ?? job.budgetAmount}
                    max={job.budgetMax ?? job.budgetAmount * 1.2}
                    step="0.01"
                    value={quoteForm.price}
                    onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                    onBlur={() => {
                      const v = parseFloat(quoteForm.price);
                      if (quoteForm.price !== "" && !isNaN(v)) {
                        const maxB = job.budgetMax ?? job.budgetAmount * 1.2;
                        const minB = job.budgetMin ?? job.budgetAmount;
                        const clamped = Math.min(maxB, Math.max(minB, v));
                        if (clamped !== v) setQuoteForm((f) => ({ ...f, price: String(clamped) }));
                      }
                    }}
                    className="font-['Poppins',sans-serif] text-[15px] border-2 border-gray-200 focus:border-[#FE8A0F] h-12"
                  />
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2 bg-yellow-50 px-3 py-1 rounded-md inline-block">
                    💡 Client's budget: £{(job.budgetMin ?? job.budgetAmount).toFixed(0)} - £{(job.budgetMax ?? job.budgetAmount * 1.2).toFixed(0)} (price must be within this range)
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Delivery Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder=""
                      value={quoteForm.deliveryTime}
                      onChange={(e) => setQuoteForm({ ...quoteForm, deliveryTime: e.target.value })}
                      className="font-['Poppins',sans-serif] text-[15px] border-2 border-gray-200 focus:border-[#FE8A0F] h-12 pr-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] font-['Poppins',sans-serif] text-[14px] pointer-events-none">
                      day(s)
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Message to Client <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="Enter key points or a few words, then use Generate by AI to write a full message..."
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                    className="font-['Poppins',sans-serif] text-[14px] min-h-[180px] border-2 border-gray-200 focus:border-[#FE8A0F] resize-none"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateQuoteMessage}
                      disabled={aiQuoteMessageGenerating}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 font-['Poppins',sans-serif] font-semibold text-[15px] px-5 py-2.5 rounded-xl border-2 transition-all duration-200",
                        aiQuoteMessageGenerating
                          ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                          : "bg-white border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB] active:scale-[0.98]"
                      )}
                    >
                      <Sparkles className={cn("w-5 h-5 flex-shrink-0", aiQuoteMessageGenerating && "animate-pulse")} />
                      {aiQuoteMessageGenerating ? "Generating…" : "Generate by AI"}
                    </button>
                  </div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2 bg-green-50 px-3 py-1 rounded-md inline-block">
                    💡 Tip: Mention your relevant experience and availability
                  </p>
                </div>
              </div>
            </div>

            {/* Milestone Section */}
            <Collapsible
              open={isMilestoneOpen}
              onOpenChange={setIsMilestoneOpen}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 shadow-sm"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 hover:bg-transparent font-['Poppins',sans-serif] mb-2"
                >
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#059669] flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Suggest Milestone Payment
                  </h3>
                  <ChevronDown
                    className={`h-5 w-5 text-[#059669] transition-transform duration-200 ${
                      isMilestoneOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4">
                <div className="mb-4 pl-7">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                    Suggest Milestone Payment Break Down!{" "}
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">Optional</span>
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="bg-green-50/50 p-3 rounded-lg border border-green-200">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1 block">
                              Milestone {index + 1} Description
                            </Label>
                            <Input
                              placeholder="Define the tasks that you will complete for this milestone"
                              value={milestone.description}
                              onChange={(e) => updateMilestone(index, "description", e.target.value)}
                              className="font-['Poppins',sans-serif] text-[14px] border-2 border-gray-200"
                            />
                          </div>
                          <div className="w-32">
                            <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1 block">
                              Amount
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b6b6b] font-['Poppins',sans-serif] text-[14px]">
                                £
                              </span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={milestone.amount}
                                onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                                className="pl-7 font-['Poppins',sans-serif] text-[14px] border-2 border-gray-200"
                              />
                            </div>
                          </div>
                          {milestones.length > 1 && (
                            <div className="pt-5">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeMilestone(index)}
                                className="px-3 font-['Poppins',sans-serif] h-10"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMilestoneToForm}
                    className="mt-3 bg-[#059669] text-white hover:bg-[#047857] border-0 font-['Poppins',sans-serif] h-10"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add another milestone
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-6 border-t-2 border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuoteDialog(false);
                  setQuoteForm({ price: "", deliveryTime: "", message: "" });
                  setMilestones([{ description: "", amount: "" }]);
                }}
                className="flex-1 font-['Poppins',sans-serif] h-12 text-[15px] border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitQuote}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] h-12 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Quote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Award Job Modal */}
      <Dialog open={showAwardModal} onOpenChange={setShowAwardModal}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-4 sm:mb-6">
            <DialogTitle className="font-['Poppins',sans-serif] text-[18px] sm:text-[22px] text-[#2c353f] mb-2">
              Set up Milestone Payments
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[12px] sm:text-[14px] text-[#6b6b6b]">
              You only have to pay for work when it has been completed and you're 100% satisfied.
            </DialogDescription>
          </DialogHeader>

          {selectedQuoteForAward && (
            <div className="space-y-4">
              {/* Professional Info */}
              <div className="flex items-center gap-3 bg-[#f8f9fa] p-3 rounded-lg">
                <Avatar className="w-10 h-10 border-2 border-gray-200 flex-shrink-0">
                  {resolveAvatarUrl(selectedQuoteForAward.professionalAvatar) && (
                    <AvatarImage src={resolveAvatarUrl(selectedQuoteForAward.professionalAvatar)} />
                  )}
                  <AvatarFallback className="bg-[#3B82F6] text-white font-['Poppins',sans-serif]">
                    {getTwoLetterInitials(selectedQuoteForAward.professionalName, "P")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[14px] text-[#2c353f]">
                    <strong>{selectedQuoteForAward.professionalName}</strong> has requested the following Milestone Payment:
                  </p>
                </div>
              </div>

              {/* Radio Group */}
              <RadioGroup value={awardWithMilestone ? "with" : "without"} onValueChange={(value) => setAwardWithMilestone(value === "with")}>
                <div className="grid grid-cols-2 gap-3">
                  {/* Award with milestone */}
                  <div 
                    onClick={() => setAwardWithMilestone(true)}
                    className={`relative flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      awardWithMilestone 
                        ? 'border-[#3B82F6] bg-[#EFF6FF]' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="with" id="with-milestone" className="flex-shrink-0 mt-0.5" />
                      <Label htmlFor="with-milestone" className="font-['Poppins',sans-serif] text-[13px] cursor-pointer flex-1">
                        With milestone
                      </Label>
                      {awardWithMilestone && (
                        <CheckCircle2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                      )}
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] pl-6">
                      Pay in stages
                    </p>
                  </div>

                  {/* Award without milestone */}
                  <div 
                    onClick={() => setAwardWithMilestone(false)}
                    className={`relative flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      !awardWithMilestone 
                        ? 'border-[#3B82F6] bg-[#EFF6FF]' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="without" id="without-milestone" className="flex-shrink-0 mt-0.5" />
                      <Label htmlFor="without-milestone" className="font-['Poppins',sans-serif] text-[13px] cursor-pointer flex-1">
                        Without milestone
                      </Label>
                      {!awardWithMilestone && (
                        <CheckCircle2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                      )}
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] pl-6">
                      Pay after completion
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {/* Amount Input - Multiple milestones with name + amount */}
              {awardWithMilestone && (
                <div className="space-y-3">
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">Milestones</Label>
                  {awardMilestones.map((row, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={row.name}
                        onChange={(e) => {
                          const next = [...awardMilestones];
                          next[index] = { ...next[index], name: e.target.value };
                          setAwardMilestones(next);
                        }}
                        placeholder="Milestone name"
                        className="flex-1 font-['Poppins',sans-serif] text-[14px]"
                      />
                      <div className="flex items-center gap-1 w-[120px]">
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">£</span>
                        <Input
                          type="number"
                          value={row.amount}
                          onChange={(e) => {
                            const next = [...awardMilestones];
                            next[index] = { ...next[index], amount: e.target.value };
                            setAwardMilestones(next);
                          }}
                          placeholder="0.00"
                          className="font-['Poppins',sans-serif] text-[14px]"
                        />
                      </div>
                      {awardMilestones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAwardMilestones((prev) => prev.filter((_, i) => i !== index))}
                          className="text-red-600 hover:bg-red-50 h-10 w-10 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAwardMilestones((prev) => [...prev, { name: "", amount: "" }])}
                    className="font-['Poppins',sans-serif] text-[13px]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add another milestone
                  </Button>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4">
                <p className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-[#2c353f]">
                  Total: <strong>£{awardWithMilestone
                    ? awardMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toFixed(2)
                    : selectedQuoteForAward.price} GBP</strong>
                </p>
              </div>

              {/* Info Text */}
              {awardWithMilestone && (
                <div className="bg-[#EFF6FF] border border-[#3B82F6]/30 rounded-lg p-3 sm:p-4">
                  <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[13px] text-[#2c353f] mb-2">
                    <strong>{selectedQuoteForAward.professionalName}</strong> will receive a notification to accept this milestone. Once they accept and complete the work to your satisfaction, you can release the payment.
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[13px] text-[#2c353f]">
                    Milestone Payments are refundable subject to our{" "}
                    <a href="#" className="text-[#3B82F6] underline">
                      terms and conditions
                    </a>
                    . You can cancel the milestone before the professional accepts.
                  </p>
                </div>
              )}

              {/* Award Button */}
              <Button
                onClick={handleAwardJob}
                className="w-full bg-[#FE8A0F] hover:bg-[#E57A00] text-white font-['Poppins',sans-serif] py-5 sm:py-6 text-[14px] sm:text-[16px]"
              >
                {awardWithMilestone
                  ? `Award and Create ${awardMilestones.length} Milestone(s)`
                  : `Award Job`}
              </Button>

              {/* Guide Tip with Steps - Moved below button */}
              <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4">
                <h4 className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] mb-3">
                  How Milestone Payments Work
                </h4>
                
                {/* Steps */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 flex-shrink-0">
                      <img src={milestoneStep1} alt="Step 1" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] leading-tight">
                      Deposit funds to create milestone
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 flex-shrink-0">
                      <img src={milestoneStep2} alt="Step 2" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] leading-tight">
                      Funds held securely while work progresses
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 flex-shrink-0">
                      <img src={milestoneStep3} alt="Step 3" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] leading-tight">
                      Release payment when 100% satisfied
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Milestone Dialog */}
      <Dialog open={showNewMilestoneDialog} onOpenChange={setShowNewMilestoneDialog}>
        <DialogContent className="w-[70vw] p-6 font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">
              Create New Milestone
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Add a new milestone payment to this job. The professional will need to complete this milestone to request payment release.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Name */}
            <div>
              <Label htmlFor="milestone-name" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Milestone name
              </Label>
              <Input
                id="milestone-name"
                value={newMilestoneForm.name}
                onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, name: e.target.value })}
                placeholder="e.g., Phase 1 - Plumbing"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="milestone-description" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Description (optional)
              </Label>
              <Textarea
                id="milestone-description"
                value={newMilestoneForm.description}
                onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, description: e.target.value })}
                placeholder="e.g., Complete plumbing installation"
                className="font-['Poppins',sans-serif] text-[14px] min-h-[60px]"
              />
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="milestone-amount" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Amount (£)
              </Label>
              <div className="flex items-center gap-2">
                <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">£</span>
                <Input
                  id="milestone-amount"
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

            {/* Info Box */}
            <div className="bg-[#EFF6FF] border border-[#3B82F6]/30 rounded-lg p-4">
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
                The milestone will be created with "Pending" status. Once the professional requests release, you can approve the payment.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewMilestoneDialog(false);
                  setNewMilestoneForm({ name: "", description: "", amount: "" });
                }}
                className="flex-1 font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMilestone}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif]"
              >
                Create Milestone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Request Modal */}
      <Dialog open={showCancelRequestModal} onOpenChange={(open) => { setShowCancelRequestModal(open); if (!open) { setCancelRequestMilestone(null); setCancelRequestReason(""); } }}>
        <DialogContent className="max-w-md font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
              Request to cancel milestone
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              {cancelRequestMilestone && (
                <>Request cancellation for &quot;{cancelRequestMilestone.name || cancelRequestMilestone.description}&quot; (£{cancelRequestMilestone.amount}). The other party can accept or reject.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">Reason (optional)</Label>
              <Textarea
                value={cancelRequestReason}
                onChange={(e) => setCancelRequestReason(e.target.value)}
                placeholder="Why do you want to cancel this milestone?"
                className="font-['Poppins',sans-serif] text-[14px] min-h-[80px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCancelRequestModal(false); setCancelRequestMilestone(null); setCancelRequestReason(""); }} className="font-['Poppins',sans-serif]">
                Cancel
              </Button>
              <Button
                className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                onClick={async () => {
                  if (!cancelRequestMilestone) return;
                  try {
                    await requestMilestoneCancel(job.id, cancelRequestMilestone.id, cancelRequestReason);
                    toast.success("Cancel request sent");
                    setShowCancelRequestModal(false);
                    setCancelRequestMilestone(null);
                    setCancelRequestReason("");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to send cancel request");
                  }
                }}
              >
                Send request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={(open) => { setShowDisputeModal(open); if (!open) setDisputeMilestone(null); }}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Open Dispute
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              {disputeMilestone
                ? `Disputing: ${disputeMilestone.name || disputeMilestone.description} - £${disputeMilestone.amount}`
                : "If there's an issue with the milestone, you can raise a dispute. Our support team will review and help resolve the issue."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Info Box - Yellow Background */}
            <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4">
              <ul className="space-y-2 font-['Poppins',sans-serif] text-[13px] text-[#78350F] list-disc list-inside">
                <li>Most disputes are the result of a simple misunderstanding.</li>
                <li>Our dispute resolution system is designed to allow both parties to resolve the issue amongst themselves.</li>
                <li>Most disputes are resolved without arbitration.</li>
                <li>If an agreement cannot be reached, either party may elect to pay an arbitration fee for our dispute team to resolve the matter.</li>
              </ul>
            </div>

            {/* Requirements Description */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Please describe in detail what the requirements were for the milestone and what was not completed.
              </Label>
              <Textarea
                value={disputeForm.requirements}
                onChange={(e) => setDisputeForm({ ...disputeForm, requirements: e.target.value })}
                placeholder="Describe the requirements..."
                className="font-['Poppins',sans-serif] text-[14px] min-h-[80px]"
              />
            </div>

            {/* Not Completed Description */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                What was not completed or what is the issue?
              </Label>
              <Textarea
                value={disputeForm.notCompleted}
                onChange={(e) => setDisputeForm({ ...disputeForm, notCompleted: e.target.value })}
                placeholder="Describe what was not completed..."
                className="font-['Poppins',sans-serif] text-[14px] min-h-[80px]"
              />
            </div>

            {/* Evidence Upload */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Please include evidence of how the milestone requirements we communicated, as well as any other evidence that supports your case.
              </Label>
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="font-['Poppins',sans-serif] text-[14px]"
              />
              {disputeForm.evidenceFiles.length > 0 && (
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-2">
                  {disputeForm.evidenceFiles.length} file(s) selected
                </p>
              )}
            </div>

            {/* Milestone Selection - only when opened without a specific milestone (e.g. from more menu) */}
            {!disputeMilestone && job.milestones && job.milestones.length > 0 && (
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                Select the milestone you want to dispute
              </Label>
              <div className="space-y-2">
                {job.milestones
                  .filter((m) => m.status !== "released" && m.status !== "disputed" && m.status !== "awaiting-accept")
                  .map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={`dispute-${milestone.id}`}
                        checked={disputeForm.selectedMilestones.includes(milestone.id)}
                        onCheckedChange={(checked) => handleMilestoneSelection(milestone.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`dispute-${milestone.id}`}
                        className="flex-1 font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer"
                        onClick={() => { setDisputeMilestone(milestone); setDisputeForm((p) => ({ ...p, selectedMilestones: [milestone.id] })); }}
                      >
                        {milestone.name || milestone.description} - £{milestone.amount}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitDispute}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white font-['Poppins',sans-serif]"
              >
                Submit Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite to Quote Modal */}
      {selectedProfessional && (
        <InviteToQuoteModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedProfessional(null);
          }}
          professional={selectedProfessional}
          jobId={job.id}
          jobTitle={job.title}
        />
      )}
    </div>
  );
}
