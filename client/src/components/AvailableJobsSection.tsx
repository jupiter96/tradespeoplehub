import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { getMainCategoriesBySector } from "./categoriesHierarchy";
import {
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  Send,
  Flame,
  Clock,
  Search,
  Filter,
  Eye,
  X,
  Plus,
  ChevronDown,
} from "lucide-react";
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
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Quote form state
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteDeliveryTime, setQuoteDeliveryTime] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  
  // Milestone state
  const [milestones, setMilestones] = useState<Array<{ description: string; amount: string }>>([
    { description: "", amount: "" }
  ]);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);

  const availableJobs = getAvailableJobs();

  // Get user's selected sectors (professional only)
  const userSectors = userInfo?.sectors || (userInfo?.sector ? [userInfo.sector] : []);
  
  // Get all categories from user's selected sectors
  const userCategories: string[] = [];
  userSectors.forEach(sector => {
    const sectorCategories = getMainCategoriesBySector(sector);
    sectorCategories.forEach(cat => {
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
    return distance.toFixed(1);
  };

  const handleSubmitQuote = () => {
    // Check if user is blocked
    if (userInfo?.isBlocked) {
      toast.error("Your account has been blocked. You cannot submit quotes. Please contact support.");
      return;
    }

    if (!currentJob || !quotePrice || !quoteDeliveryTime || !quoteMessage) {
      toast.error("Please fill in all fields");
      return;
    }

    const price = parseFloat(quotePrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    addQuoteToJob(currentJob.id, {
      professionalId: userInfo?.id || "pro-1",
      professionalName: userInfo?.businessName || userInfo?.name || "Professional",
      professionalAvatar: userInfo?.avatar,
      professionalRating: 4.8,
      professionalReviews: 127,
      price: price,
      deliveryTime: quoteDeliveryTime,
      message: quoteMessage,
    });

    toast.success("Quote sent successfully!");
    setIsQuoteDialogOpen(false);
    setSelectedJob(null);
    setQuotePrice("");
    setQuoteDeliveryTime("");
    setQuoteMessage("");
    setMilestones([{ description: "", amount: "" }]);
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
                        <Badge className="bg-[#E3F2FD] text-[#1976D2] border-[#1976D2]/30 font-['Poppins',sans-serif] text-[11px]">
                          {job.sector}
                        </Badge>
                      </div>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {job.location} • {getDistance(job.id)} miles
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          £{job.budgetAmount} budget
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
                    onClick={() => navigate(`/job/${job.id}`)}
                    className="font-['Poppins',sans-serif] hover:bg-[#E3F2FD] hover:text-[#1976D2] hover:border-[#1976D2]"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedJob(job.id);
                      setIsQuoteDialogOpen(true);
                    }}
                    className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    Send Quote
                  </Button>
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
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 leading-relaxed">
                    {currentJob.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="font-['Poppins',sans-serif] text-[28px] text-[#059669]">
                      £{currentJob.budgetAmount}
                    </div>
                    <div className="flex items-center gap-1.5 text-[#2c353f] text-[14px] font-['Poppins',sans-serif]">
                      <MapPin className="w-4 h-4 text-red-600" />
                      {currentJob.location} ({getDistance(currentJob.id)} miles)
                    </div>
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
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      className="font-['Poppins',sans-serif] text-[15px] border-2 border-gray-200 focus:border-[#FE8A0F] h-12"
                    />
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2 bg-yellow-50 px-3 py-1 rounded-md inline-block">
                      💡 Client's budget: £{currentJob.budgetAmount}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-orange-100">
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Delivery Time <span className="text-red-500">*</span>
                    </Label>
                    <Select value={quoteDeliveryTime} onValueChange={setQuoteDeliveryTime}>
                      <SelectTrigger className="font-['Poppins',sans-serif] text-[15px] border-2 border-gray-200 focus:border-[#FE8A0F] h-12">
                        <SelectValue placeholder="Select delivery time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Same day">Same day</SelectItem>
                        <SelectItem value="Within 24 hours">Within 24 hours</SelectItem>
                        <SelectItem value="1-2 days">1-2 days</SelectItem>
                        <SelectItem value="3-5 days">3-5 days</SelectItem>
                        <SelectItem value="1 week">1 week</SelectItem>
                        <SelectItem value="2 weeks">2 weeks</SelectItem>
                        <SelectItem value="1 month">1 month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-orange-100">
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Message to Client <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      placeholder="Explain your approach, experience, and why you're the best fit for this job..."
                      value={quoteMessage}
                      onChange={(e) => setQuoteMessage(e.target.value)}
                      className="font-['Poppins',sans-serif] text-[14px] min-h-[180px] border-2 border-gray-200 focus:border-[#FE8A0F] resize-none"
                    />
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
