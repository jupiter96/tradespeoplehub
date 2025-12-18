import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useJobs, JobQuote, Milestone } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
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
} from "lucide-react";
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
import awardImage from "figma:asset/5c876de928ca711ee9770734c2254c71ec8d2988.png";
import milestoneStep1 from "figma:asset/a0de430b25f40690ee801be2a6d5041990689f12.png";
import milestoneStep2 from "figma:asset/e1c037263ad447fb88ea0f991b3910b9cdd26dec.png";
import milestoneStep3 from "figma:asset/27504741573e0946b791d837bb57de9ad9c0f981.png";
import { allServices } from "./servicesData";
import InviteToQuoteModal from "./InviteToQuoteModal";
import hourglassIcon from "figma:asset/19b8318c4dd036819acec78c2311528585bbfe6b.png";
import InviteProfessionalsList from "./InviteProfessionalsList";

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getJobById, updateQuoteStatus, addQuoteToJob, awardJobWithMilestone, awardJobWithoutMilestone, updateMilestoneStatus, updateJob, addMilestone, deleteMilestone, acceptMilestone, createDispute } = useJobs();
  const { userInfo, userRole, isLoggedIn } = useAccount();
  const { startConversation } = useMessenger();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "details");
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    price: "",
    deliveryTime: "",
    message: "",
  });
  
  // Milestone state for sending quote
  const [milestones, setMilestones] = useState<Array<{ description: string; amount: string }>>([
    { description: "", amount: "" }
  ]);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);

  // Award modal state
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedQuoteForAward, setSelectedQuoteForAward] = useState<JobQuote | null>(null);
  const [awardWithMilestone, setAwardWithMilestone] = useState(true);
  const [milestoneAmount, setMilestoneAmount] = useState("");

  // New milestone state
  const [showNewMilestoneDialog, setShowNewMilestoneDialog] = useState(false);
  const [newMilestoneForm, setNewMilestoneForm] = useState({
    description: "",
    amount: "",
  });

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
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

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  const job = getJobById(jobId || "");

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
            onClick={() => navigate("/account")}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
          >
            Back to Account
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

  // Get recommended professionals matching job categories
  const recommendedProfessionals = allServices
    .filter((service) => {
      // Don't show professionals who already quoted
      const hasntQuoted = !job.quotes.some(quote => quote.professionalName === service.tradingName);
      if (!hasntQuoted) return false;

      // Match by categories, subcategories, or skills
      const matchesCategory = job.categories.some(jobCat => {
        const jobCatLower = jobCat.toLowerCase();
        const categoryLower = service.category.toLowerCase();
        const subcategoryLower = (service.subcategory || "").toLowerCase();
        const detailedSubcategoryLower = (service.detailedSubcategory || "").toLowerCase();
        
        // Check if job category matches service category/subcategory
        if (categoryLower.includes(jobCatLower) || jobCatLower.includes(categoryLower)) {
          return true;
        }
        if (subcategoryLower.includes(jobCatLower) || jobCatLower.includes(subcategoryLower)) {
          return true;
        }
        if (detailedSubcategoryLower.includes(jobCatLower) || jobCatLower.includes(detailedSubcategoryLower)) {
          return true;
        }
        
        // Check if job category matches any of the professional's skills
        if (service.skills && service.skills.length > 0) {
          return service.skills.some(skill => 
            skill.toLowerCase().includes(jobCatLower) || jobCatLower.includes(skill.toLowerCase())
          );
        }
        
        return false;
      });

      return matchesCategory;
    })
    .map((service) => {
      // Calculate relevance score for sorting
      let relevanceScore = 0;
      job.categories.forEach(jobCat => {
        const jobCatLower = jobCat.toLowerCase();
        if (service.category.toLowerCase() === jobCatLower) relevanceScore += 10;
        else if (service.category.toLowerCase().includes(jobCatLower)) relevanceScore += 5;
        if (service.subcategory && service.subcategory.toLowerCase() === jobCatLower) relevanceScore += 8;
        else if (service.subcategory && service.subcategory.toLowerCase().includes(jobCatLower)) relevanceScore += 4;
      });
      
      return {
        id: service.id.toString(),
        name: service.tradingName,
        title: service.specialization || service.category,
        category: service.category,
        image: service.providerImage,
        rating: service.rating,
        reviewCount: service.reviewCount,
        completedJobs: service.completedTasks,
        location: service.location,
        skills: service.skills || [],
        responseTime: service.responseTime || "Within 24 hours",
        portfolioImages: service.portfolioImages || [],
        relevanceScore,
      };
    })
    .sort((a, b) => {
      // Sort by relevance score, then by rating, then by completed jobs
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.completedJobs - a.completedJobs;
    })
    .slice(0, 10); // Show top 10 recommendations

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleInviteProfessional = (pro: typeof recommendedProfessionals[0]) => {
    // Add to invited professionals set
    setInvitedProfessionals(prev => new Set(prev).add(pro.id));
    
    // Show success toast
    toast.success(`Sent invitation to ${pro.name} on project "${job.title}"`);
  };

  const handleMessageProfessional = (pro: typeof recommendedProfessionals[0]) => {
    // Start a conversation with the professional
    const conversation = startConversation(pro.id, pro.name);
    navigate(`/messages?conversation=${conversation.id}`);
    toast.success(`Opening chat with ${pro.name}`);
  };

  const handleOpenAwardModal = (quote: JobQuote) => {
    setSelectedQuoteForAward(quote);
    setMilestoneAmount(quote.price.toString());
    setShowAwardModal(true);
  };

  const handleAwardJob = () => {
    if (!selectedQuoteForAward) return;

    if (awardWithMilestone && !milestoneAmount) {
      toast.error("Please enter the milestone amount");
      return;
    }

    const amount = parseFloat(milestoneAmount);
    if (awardWithMilestone && (isNaN(amount) || amount <= 0)) {
      toast.error("Please enter a valid milestone amount");
      return;
    }

    if (awardWithMilestone) {
      awardJobWithMilestone(job.id, selectedQuoteForAward.id, selectedQuoteForAward.professionalId, amount);
      toast.success(`Job awarded with £${amount} milestone payment!`);
    } else {
      awardJobWithoutMilestone(job.id, selectedQuoteForAward.id, selectedQuoteForAward.professionalId);
      toast.success("Job awarded successfully!");
    }
    
    setShowAwardModal(false);
    setSelectedQuoteForAward(null);
    setMilestoneAmount("");
    setAwardWithMilestone(true);
  };

  const handleAcceptAward = () => {
    if (!myAwardedQuote) return;
    updateQuoteStatus(job.id, myAwardedQuote.id, "accepted");
    updateJob(job.id, { status: "in-progress" });
    
    // Update all awaiting-accept milestones to in-progress status
    if (job.milestones && job.milestones.length > 0) {
      job.milestones.forEach((milestone) => {
        if (milestone.status === "awaiting-accept") {
          updateMilestoneStatus(job.id, milestone.id, "in-progress");
        }
      });
    }
    
    toast.success("Job accepted! You can now start working on it.");
  };

  const handleRejectAward = () => {
    if (!myAwardedQuote) return;
    updateQuoteStatus(job.id, myAwardedQuote.id, "rejected");
    toast.success("Job award rejected.");
  };

  const handleRejectQuote = (quoteId: string) => {
    updateQuoteStatus(job.id, quoteId, "rejected");
    toast.success("Quote rejected");
  };

  const handleCreateMilestone = () => {
    if (!newMilestoneForm.description || !newMilestoneForm.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = parseFloat(newMilestoneForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    addMilestone(job.id, newMilestoneForm.description, amount);
    toast.success("Milestone created successfully!");
    setShowNewMilestoneDialog(false);
    setNewMilestoneForm({ description: "", amount: "" });
  };

  const handleOpenDisputeModal = () => {
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

  const handleSubmitDispute = () => {
    if (!disputeForm.requirements || !disputeForm.notCompleted) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (disputeForm.selectedMilestones.length === 0) {
      toast.error("Please select at least one milestone to dispute");
      return;
    }

    // Create dispute for the first selected milestone and navigate to dispute page
    const milestoneId = disputeForm.selectedMilestones[0];
    const reason = `Requirements: ${disputeForm.requirements}\n\nWhat was not completed: ${disputeForm.notCompleted}`;
    const evidence = disputeForm.evidenceFiles.length > 0 
      ? `${disputeForm.evidenceFiles.length} file(s) attached` 
      : undefined;
    
    const disputeId = createDispute(job.id, milestoneId, reason, evidence);

    if (disputeId) {
      toast.success("Dispute submitted successfully");
      setShowDisputeModal(false);
      navigate(`/disputes/${disputeId}`);
    } else {
      toast.error("Failed to create dispute");
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

  const handleSubmitQuote = () => {
    if (!quoteForm.price || !quoteForm.deliveryTime || !quoteForm.message) {
      toast.error("Please fill in all fields");
      return;
    }

    addQuoteToJob(job.id, {
      professionalId: userInfo?.id || `pro-${Date.now()}`,
      professionalName: userInfo?.businessName || userInfo?.name || "Professional",
      professionalAvatar: userInfo?.avatar,
      professionalRating: 4.8,
      professionalReviews: 0,
      price: parseFloat(quoteForm.price),
      deliveryTime: quoteForm.deliveryTime,
      message: quoteForm.message,
    });

    toast.success("Quote submitted successfully!");
    setShowQuoteDialog(false);
    setQuoteForm({ price: "", deliveryTime: "", message: "" });
    setMilestones([{ description: "", amount: "" }]);
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
            onClick={() => navigate("/account")}
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
                      £{job.budgetAmount.toFixed(0)} - £{(job.budgetAmount * 1.2).toFixed(0)}
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
                          <AvatarImage src={myAwardedQuote.professionalAvatar} />
                          <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[18px]">
                            {myAwardedQuote.professionalName.charAt(0)}
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
                  <div className="bg-white rounded-xl shadow-sm p-16 md:p-20 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-[#3B82F6] rounded-lg">
                      <img src={hourglassIcon} alt="Hourglass" className="w-10 h-10 brightness-0 invert" />
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
                            <AvatarImage src={quote.professionalAvatar} />
                            <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                              {quote.professionalName.charAt(0)}
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
                              <AvatarImage src={quote.professionalAvatar} />
                              <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                                {quote.professionalName.charAt(0)}
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
                              <Button
                                onClick={() => handleRejectQuote(quote.id)}
                                variant="ghost"
                                className="font-['Poppins',sans-serif] text-[14px] h-10 px-6 text-red-600 hover:bg-red-50"
                              >
                                Reject
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

                {/* Invite Professionals List */}
                {isJobOwner && (
                  <InviteProfessionalsList
                    professionals={recommendedProfessionals}
                    onInvite={handleInviteProfessional}
                    invitedProfessionalIds={invitedProfessionals}
                  />
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

                {/* Milestones list */}
                {job.milestones && job.milestones.length > 0 && (
                  <>
                    <div className="space-y-3">
                      {job.milestones.map((milestone) => (
                        <div key={milestone.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-4">
                        {/* Left side - Description and date */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] truncate">
                              {milestone.description}
                            </h3>
                            {/* Status Badge */}
                            {milestone.status === "awaiting-accept" && (
                              <Badge className="bg-orange-50 text-orange-700 border-orange-200 font-['Poppins',sans-serif] text-[10px] px-2 py-0 flex-shrink-0">
                                Awaiting Accept
                              </Badge>
                            )}

                            {milestone.status === "in-progress" && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-['Poppins',sans-serif] text-[10px] px-2 py-0 flex-shrink-0">
                                In Progress
                              </Badge>
                            )}
                            {milestone.status === "released" && (
                              <Badge className="bg-green-50 text-green-700 border-green-200 font-['Poppins',sans-serif] text-[10px] px-2 py-0 flex-shrink-0">
                                Released
                              </Badge>
                            )}
                            {milestone.status === "disputed" && (
                              <Badge className="bg-red-50 text-red-700 border-red-200 font-['Poppins',sans-serif] text-[10px] px-2 py-0 flex-shrink-0">
                                Disputed
                              </Badge>
                            )}
                          </div>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-0.5">
                            Created: {formatDate(milestone.createdAt)}
                            {milestone.releasedAt && ` • Released: ${formatDate(milestone.releasedAt)}`}
                          </p>
                          {/* Status Helper Text */}
                          <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-1 italic">
                            {milestone.status === "awaiting-accept" && isJobOwner && "Waiting for professional to accept"}
                            {milestone.status === "awaiting-accept" && !isJobOwner && "Review and accept this milestone to start work"}
                            {milestone.status === "in-progress" && isJobOwner && "Professional is working on this - review and release when complete"}
                            {milestone.status === "in-progress" && !isJobOwner && "Work in progress - request release when complete"}
                            {milestone.status === "disputed" && "This milestone is under dispute - support will review"}
                            {milestone.status === "released" && "Payment has been released"}
                          </p>
                        </div>

                        {/* Right side - Amount and Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                            £{milestone.amount}
                          </p>
                          
                          {/* Awaiting Accept - Show Cancel button for client or Accept button for professional */}
                          {milestone.status === "awaiting-accept" ? (
                            isJobOwner ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteMilestone(job.id, milestone.id)}
                                className="h-8 px-3 font-['Poppins',sans-serif] text-[13px] border-red-300 text-red-600 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => acceptMilestone(job.id, milestone.id)}
                                className="h-8 px-3 font-['Poppins',sans-serif] text-[13px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white"
                              >
                                Accept
                              </Button>
                            )
                          ) : milestone.status !== "released" ? (
                            // Three-dot menu for other statuses
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 font-['Poppins',sans-serif]">
                                {isJobOwner ? (
                                  <>
                                    {/* Client Actions */}
                                    <DropdownMenuItem
                                      onClick={() => {
                                        updateMilestoneStatus(job.id, milestone.id, "released");
                                        toast.success("Payment released successfully!");
                                      }}
                                      disabled={milestone.status !== "in-progress"}
                                      className="cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                      Release Payment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (milestone.status === "awaiting-accept") {
                                          deleteMilestone(job.id, milestone.id);
                                          toast.success("Milestone cancelled successfully");
                                        } else {
                                          toast.error("Cannot cancel milestone in current status");
                                        }
                                      }}
                                      disabled={milestone.status !== "awaiting-accept"}
                                      className="cursor-pointer text-red-600 focus:text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Cancel Request
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        toast.info("Invoice feature coming soon");
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                      Download Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={handleOpenDisputeModal}
                                      disabled={milestone.status === "pending" || milestone.status === "awaiting-accept"}
                                      className="cursor-pointer text-orange-600 focus:text-orange-600"
                                    >
                                      <Flag className="w-4 h-4 mr-2" />
                                      Dispute Milestone
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    {/* Professional Actions */}
                                    <DropdownMenuItem
                                      onClick={() => {
                                        toast.info("Contact client to request work review and payment release");
                                      }}
                                      disabled={milestone.status !== "in-progress"}
                                      className="cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                      Request Release
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        toast.info("Contact client to cancel this milestone");
                                      }}
                                      className="cursor-pointer text-red-600 focus:text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Cancel Milestone
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        toast.info("Invoice feature coming soon");
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                      Generate Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={handleOpenDisputeModal}
                                      disabled={milestone.status === "awaiting-accept"}
                                      className="cursor-pointer text-orange-600 focus:text-orange-600"
                                    >
                                      <Flag className="w-4 h-4 mr-2" />
                                      Dispute Milestone
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Total Summary */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        Total Milestones:
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                        £{job.milestones.reduce((sum, m) => sum + m.amount, 0)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        Released:
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[16px] text-green-600">
                        £{job.milestones.filter(m => m.status === "released").reduce((sum, m) => sum + m.amount, 0)}
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
                    <AvatarImage src={userInfo?.avatar} />
                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                      {userInfo?.name?.charAt(0) || "C"}
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

      {/* Quote Submission Dialog for Professionals */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="w-[70vw]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
              Submit Your Quote
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px]">
              Provide your best quote for this job. The client will review all quotes and may contact you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="quote-price" className="font-['Poppins',sans-serif] text-[14px]">
                Your Price (£)
              </Label>
              <Input
                id="quote-price"
                type="number"
                placeholder="150"
                value={quoteForm.price}
                onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                className="font-['Poppins',sans-serif] mt-2"
              />
              <p className="text-[12px] text-[#6b6b6b] mt-1 font-['Poppins',sans-serif]">
                Client's budget: £{job.budgetAmount} - £{(job.budgetAmount * 1.2).toFixed(0)}
              </p>
            </div>

            <div>
              <Label htmlFor="quote-delivery" className="font-['Poppins',sans-serif] text-[14px]">
                Delivery Time
              </Label>
              <Input
                id="quote-delivery"
                type="text"
                placeholder="e.g., Same day, 2-3 days, Within a week"
                value={quoteForm.deliveryTime}
                onChange={(e) => setQuoteForm({ ...quoteForm, deliveryTime: e.target.value })}
                className="font-['Poppins',sans-serif] mt-2"
              />
            </div>

            <div>
              <Label htmlFor="quote-message" className="font-['Poppins',sans-serif] text-[14px]">
                Cover Message
              </Label>
              <Textarea
                id="quote-message"
                placeholder="Describe your experience, approach, and why you're the best fit for this job..."
                value={quoteForm.message}
                onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                className="font-['Poppins',sans-serif] mt-2 min-h-[240px]"
              />
            </div>

            {/* Milestone Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setIsMilestoneOpen(!isMilestoneOpen)}
                        className="flex items-center gap-2 text-[#6b6b6b] hover:text-[#2c353f] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="font-['Poppins',sans-serif] text-[12px]">
                          Suggest Milestone Payment
                        </span>
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p className="font-['Poppins',sans-serif] text-[12px]">
                        Break down your quote into smaller milestones to help build trust with the client. 
                        Each milestone represents a stage of work and its corresponding payment.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {isMilestoneOpen && (
                <div className="space-y-3 mt-4">{/* Milestone content will go here */}

                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input
                          placeholder="Define the tasks that you will complete for this"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, "description", e.target.value)}
                          className="flex-1 font-['Poppins',sans-serif] text-[14px]"
                        />
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b6b6b] font-['Poppins',sans-serif] text-[14px]">
                            £
                          </span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={milestone.amount}
                            onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                            className="pl-7 font-['Poppins',sans-serif] text-[14px]"
                          />
                        </div>
                        {milestones.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMilestone(index)}
                            className="px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addMilestoneToForm}
                    className="mt-3 text-[#3B82F6] hover:text-[#2563EB] hover:bg-blue-50 font-['Poppins',sans-serif]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add another milestone
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowQuoteDialog(false)}
              className="flex-1 font-['Poppins',sans-serif]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitQuote}
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
            >
              Submit Quote
            </Button>
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
                  <AvatarImage src={selectedQuoteForAward.professionalAvatar} />
                  <AvatarFallback className="bg-[#3B82F6] text-white font-['Poppins',sans-serif]">
                    {selectedQuoteForAward.professionalName.charAt(0)}
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

              {/* Amount Input */}
              {awardWithMilestone && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-['Poppins',sans-serif] text-[14px] sm:text-[16px] text-[#2c353f] w-6 sm:w-8">£</span>
                    <Input
                      type="number"
                      value={milestoneAmount}
                      onChange={(e) => setMilestoneAmount(e.target.value)}
                      className="flex-1 font-['Poppins',sans-serif] text-[14px] sm:text-[16px]"
                      placeholder="122.00"
                    />
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4">
                <p className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-[#2c353f]">
                  Total: <strong>£{awardWithMilestone ? (milestoneAmount || "0.00") : selectedQuoteForAward.price} GBP</strong>
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
                  ? `Award and Create £${milestoneAmount || "0.00"} GBP Milestone`
                  : `Award Job`
                }
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
            {/* Description */}
            <div>
              <Label htmlFor="milestone-description" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Milestone Description
              </Label>
              <Textarea
                id="milestone-description"
                value={newMilestoneForm.description}
                onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, description: e.target.value })}
                placeholder="e.g., Complete plumbing installation"
                className="font-['Poppins',sans-serif] text-[14px] min-h-[80px]"
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
                  setNewMilestoneForm({ description: "", amount: "" });
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

      {/* Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Dispute Milestone
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              If there's an issue with the milestone, you can raise a dispute. Our support team will review and help resolve the issue.
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
                Please describe in detail what the requirements were for the milestone(s) you wish to dispute.
              </Label>
              <Textarea
                value={disputeForm.requirements}
                onChange={(e) => setDisputeForm({ ...disputeForm, requirements: e.target.value })}
                placeholder="Describe the requirements..."
                className="font-['Poppins',sans-serif] text-[14px] min-h-[120px]"
              />
            </div>

            {/* Not Completed Description */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Please describe in detail which of these requirements were not completed.
              </Label>
              <Textarea
                value={disputeForm.notCompleted}
                onChange={(e) => setDisputeForm({ ...disputeForm, notCompleted: e.target.value })}
                placeholder="Describe what was not completed..."
                className="font-['Poppins',sans-serif] text-[14px] min-h-[120px]"
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

            {/* Milestone Selection */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                Select the milestone you want to dispute
              </Label>
              <div className="space-y-2">
                {job.milestones && job.milestones.length > 0 ? (
                  job.milestones
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
                        >
                          {milestone.description} - £{milestone.amount}
                        </label>
                      </div>
                    ))
                ) : (
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    No milestones available to dispute
                  </p>
                )}
              </div>
            </div>

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
