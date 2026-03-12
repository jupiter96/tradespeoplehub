import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
import { useSectors } from "../hooks/useSectorsAndCategories";
import { getMainCategoriesBySector } from "./categoriesHierarchy";
import {
  FileText,
  MapPin,
  Calendar,
  Banknote,
  Send,
  Flame,
  Clock,
  Search,
  Filter,
  Eye,
  X,
  Plus,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { resolveApiUrl } from "../config/api";
import { formatNumber } from "../utils/formatNumber";
import { useCurrency } from "./CurrencyContext";
import { formatJobLocationCityOnly } from "./orders/utils";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

export default function AvailableJobsSection() {
  const navigate = useNavigate();
  const { getAvailableJobs, addQuoteToJob } = useJobs();
  const { userInfo } = useAccount();
  const { startConversation } = useMessenger();
  const { sectors: sectorsList } = useSectors();
  const { formatPrice, symbol, toGBP } = useCurrency();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Quote form state
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteDeliveryTime, setQuoteDeliveryTime] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [aiQuoteMessageGenerating, setAiQuoteMessageGenerating] = useState(false);
  
  // Milestone state
  const [milestones, setMilestones] = useState<Array<{ description: string; amount: string }>>([
    { description: "", amount: "" }
  ]);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);

  // Open jobs only; exclude jobs the pro has already submitted a quote for (those appear in My Quotes)
  const availableJobs = getAvailableJobs().filter(
    (job) => !(job.quotes || []).some((q) => q.professionalId === userInfo?.id)
  );

  // User's sector IDs (user.sector is now stored as ID)
  const userSectorIds = userInfo?.sectors || (userInfo?.sector ? [userInfo.sector] : []);
  const userSectorNames = userSectorIds
    .map((id) => sectorsList.find((s) => String(s._id) === String(id))?.name)
    .filter(Boolean) as string[];
  const userCategories: string[] = [];
  userSectorNames.forEach((sectorName) => {
    const sectorCategories = getMainCategoriesBySector(sectorName);
    sectorCategories.forEach((cat) => {
      if (!userCategories.includes(cat.name)) {
        userCategories.push(cat.name);
      }
    });
  });

  // Filter jobs
  const filteredJobs = availableJobs.filter((job) => {
    const matchesCategory = filterCategory === "all" || job.categories.some(cat => cat === filterCategory);
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentJob = selectedJob ? availableJobs.find(j => j.id === selectedJob) : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTimingIcon = (timing: string) => {
    if (timing === "urgent") return <Flame className="w-4 h-4 text-red-500" />;
    if (timing === "flexible") return <Clock className="w-4 h-4 text-blue-500" />;
    return <Calendar className="w-4 h-4 text-gray-500" />;
  };

  // Generate random distance between 0.5 and 25 miles
  const getDistance = (jobId: string) => {
    // Use job ID to generate consistent distance for each job
    const hash = jobId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const distance = (hash % 245) / 10 + 0.5; // Range: 0.5 to 25 miles
    return formatNumber(distance, 1);
  };

  const handleSubmitQuote = async () => {
    if (userInfo?.isBlocked) {
      toast.error("Your account has been blocked. You cannot submit quotes. Please contact support.");
      return;
    }
    if (!currentJob || !quotePrice || !quoteDeliveryTime || !quoteMessage) {
      toast.error("Please fill in all fields");
      return;
    }
    const priceInSelected = parseFloat(quotePrice);
    if (isNaN(priceInSelected) || priceInSelected <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    const priceGBP = toGBP(priceInSelected);
    const minPrice = currentJob.budgetMin ?? currentJob.budgetAmount;
    const maxPrice = currentJob.budgetMax ?? currentJob.budgetAmount * 1.2;
    if (priceGBP < minPrice || priceGBP > maxPrice) {
      toast.error(`Price must be between ${formatPrice(minPrice)} and ${formatPrice(maxPrice)} (job budget range)`);
      return;
    }
    try {
      const cleanedSuggestedMilestones = milestones
        .map((m) => {
          const description = (m.description || "").trim();
          const amountInSelected = m.amount != null && m.amount !== "" ? Number(m.amount) : NaN;
          if (!description || isNaN(amountInSelected) || amountInSelected <= 0) return null;
          return { description, amount: toGBP(amountInSelected) };
        })
        .filter((m): m is { description: string; amount: number } => !!m);

      await addQuoteToJob(currentJob.id, {
        professionalId: userInfo?.id || "",
        professionalName: userInfo?.businessName || userInfo?.name || "Professional",
        professionalAvatar: userInfo?.avatar,
        professionalRating: 4.8,
        professionalReviews: 127,
        price: priceGBP,
        deliveryTime: quoteDeliveryTime,
        message: quoteMessage,
          suggestedMilestones: cleanedSuggestedMilestones,
      });
      toast.success("Quote sent successfully!");
      setIsQuoteDialogOpen(false);
      setSelectedJob(null);
      setQuotePrice("");
      setQuoteDeliveryTime("");
      setQuoteMessage("");
      setMilestones([{ description: "", amount: "" }]);
    } catch (e: any) {
      toast.error(e?.message || "Failed to send quote");
    }
  };

  const handleGenerateQuoteMessage = async () => {
    if (!currentJob) return;
    setAiQuoteMessageGenerating(true);
    try {
      const res = await fetch(resolveApiUrl("/api/jobs/generate-quote-message"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle: currentJob.title,
          jobDescription: currentJob.description,
          sectorName: currentJob.sectorName ?? currentJob.sector,
          keyPoints: quoteMessage.trim() || undefined,
          tradingName: userInfo?.businessName || userInfo?.tradingName || userInfo?.name || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to generate message");
        return;
      }
      if (data.message) setQuoteMessage(data.message);
      toast.success("Message generated. You can edit it before sending.");
    } catch {
      toast.error("Failed to generate message. Please try again.");
    } finally {
      setAiQuoteMessageGenerating(false);
    }
  };

  // Milestone functions
  const addMilestone = () => {
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

  // No longer needed - we use categories from user's sectors instead

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-['Poppins',sans-serif] text-[14px]"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-[200px] font-['Poppins',sans-serif] text-[14px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {userCategories.length > 0 ? (
              userCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-categories" disabled>
                No categories available
              </SelectItem>
            )}
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
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              {searchQuery || filterCategory !== "all"
                ? "Try adjusting your filters"
                : "No jobs are currently available"}
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-[#FE8A0F]"
              onClick={() => navigate(`/job/${job.slug || job.id}`)}
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
                        <Badge className="bg-[#E3F2FD] text-[#1976D2] border-[#1976D2]/30 font-['Poppins',sans-serif] text-[11px]">
                          {job.sector}
                        </Badge>
                      </div>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3 line-clamp-2 whitespace-pre-wrap">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {formatJobLocationCityOnly(job)} • {getDistance(job.id)} miles
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Banknote className="w-4 h-4" />
                          {job.budgetMin != null && job.budgetMax != null
                          ? `${formatPrice(job.budgetMin)} - ${formatPrice(job.budgetMax)} budget`
                          : `${formatPrice(job.budgetAmount ?? 0)} budget`}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Posted {formatDate(job.postedAt)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {job.categories.map((category, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-[#FFF5EB] text-[#FE8A0F] border-[#FE8A0F]/30 font-['Poppins',sans-serif] text-[11px]"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const hasSubmittedQuote = (job.quotes || []).some((q) => q.professionalId === userInfo?.id);
                      if (!hasSubmittedQuote) {
                        toast.info("Please send a quote first. You can chat after your quote is submitted.");
                        return;
                      }
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
                    className="font-['Poppins',sans-serif] hover:bg-[#E3F2FD] hover:text-[#1976D2] hover:border-[#1976D2]"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    Chat
                  </Button>
                  {(job.quotes || []).some((q) => q.professionalId === userInfo?.id) ? (
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                      Quote Submitted
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job.id);
                        setIsQuoteDialogOpen(true);
                      }}
                      className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      Send Quote
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send Quote Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 pb-4 mb-6">
            <DialogTitle className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f]">
              Send Quote
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[15px] text-[#6b6b6b] mt-2">
              Submit your quote for: <span className="text-[#FE8A0F]">{currentJob?.title}</span>
            </DialogDescription>
          </DialogHeader>

          {currentJob && (
            <div className="space-y-6">
              {/* Job Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#1976D2] mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Job Summary
                </h3>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 leading-relaxed whitespace-pre-wrap">
                    {currentJob.description}
                  </p>
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="font-['Poppins',sans-serif] text-[28px] text-[#059669]">
                      {currentJob.budgetMin != null && currentJob.budgetMax != null
                      ? `${formatPrice(currentJob.budgetMin)} - ${formatPrice(currentJob.budgetMax)}`
                      : formatPrice(currentJob.budgetAmount ?? 0)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[#2c353f] text-[14px] font-['Poppins',sans-serif]">
                      <MapPin className="w-4 h-4 text-red-600" />
                      {formatJobLocationCityOnly(currentJob)} ({getDistance(currentJob.id)} miles)
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Details Section */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] mb-4 flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Quote Details
                </h3>
                <div className="space-y-5">
                  <div className="bg-white rounded-lg p-4 border border-orange-100">
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Your Price ({symbol}) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="Enter your price"
                      min={currentJob.budgetMin ?? currentJob.budgetAmount}
                      max={currentJob.budgetMax ?? currentJob.budgetAmount * 1.2}
                      step="0.01"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      onBlur={() => {
                        const v = parseFloat(quotePrice);
                        if (quotePrice !== "" && !isNaN(v)) {
                          const minB = currentJob.budgetMin ?? currentJob.budgetAmount;
                          const maxB = currentJob.budgetMax ?? currentJob.budgetAmount * 1.2;
                          const clamped = Math.min(maxB, Math.max(minB, v));
                          if (clamped !== v) setQuotePrice(String(clamped));
                        }
                      }}
                      className="font-['Poppins',sans-serif] text-[15px] border-2 border-gray-200 focus:border-[#FE8A0F] h-12"
                    />
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2 bg-yellow-50 px-3 py-1 rounded-md inline-block">
                      💡 Client's budget: {currentJob.budgetMin != null && currentJob.budgetMax != null
                      ? `${formatPrice(currentJob.budgetMin)} - ${formatPrice(currentJob.budgetMax)}`
                      : formatPrice(currentJob.budgetAmount ?? 0)}
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
                        value={quoteDeliveryTime}
                        onChange={(e) => setQuoteDeliveryTime(e.target.value)}
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
                      placeholder="Enter key points or a few words, then use Generate text by AI to write a full message..."
                      value={quoteMessage}
                      onChange={(e) => setQuoteMessage(e.target.value)}
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
                        {aiQuoteMessageGenerating ? "Generating…" : "Generate text by AI"}
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
                      onClick={addMilestone}
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
                    setIsQuoteDialogOpen(false);
                    setQuotePrice("");
                    setQuoteDeliveryTime("");
                    setQuoteMessage("");
                  }}
                  className="flex-1 font-['Poppins',sans-serif] h-12 text-[15px] border-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitQuote}
                  disabled={userInfo?.isBlocked}
                  className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] h-12 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Quote
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
