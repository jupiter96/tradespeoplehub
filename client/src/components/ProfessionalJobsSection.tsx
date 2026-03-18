import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import AvailableJobsSection from "./AvailableJobsSection";
import MyQuotesSection from "./MyQuotesSection";
import { useJobs } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Search,
  ArrowUpDown,
  Eye,
  MessageCircle,
  Calendar,
  MapPin,
  CheckCircle,
  Briefcase,
  Star,
  Send,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { formatNumber } from "../utils/formatNumber";
import { useCurrency } from "./CurrencyContext";
import { formatJobLocationCityOnly } from "./orders/utils";
import { cn } from "./ui/utils";
import JobDeliverWorkModal from "./JobDeliverWorkModal";
import type { Job } from "./JobsContext";

export default function ProfessionalJobsSection() {
  const [activeTab, setActiveTab] = useState("available");
  const { getProfessionalActiveJobs, getProfessionalQuotes, getAvailableJobs } = useJobs();
  const { userInfo } = useAccount();
  const { formatPrice } = useCurrency();

  // Get counts for badges (Available Jobs: exclude jobs the pro already quoted)
  const availableJobsCount = getAvailableJobs().filter(
    (job) => !(job.quotes || []).some((q) => q.professionalId === userInfo?.id)
  ).length;
  const myQuotesTotalCount = getProfessionalQuotes(userInfo?.id || "").length;
  const activeJobsCount = getProfessionalActiveJobs(userInfo?.id || "").length;
  const [myQuotesVisibleCount, setMyQuotesVisibleCount] = useState(myQuotesTotalCount);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
          My Jobs
        </h2>
        <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
          Manage available jobs, your quotes, and active projects
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full sm:grid sm:grid-cols-3 bg-gray-100 p-1 rounded-xl h-auto gap-1">
            <TabsTrigger
              value="available"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Briefcase className="w-4 h-4" />
              Available Jobs
              {availableJobsCount > 0 && (
                <Badge className="bg-[#FE8A0F] text-white ml-2">
                  {availableJobsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="quotes"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              My Quotes
              {(activeTab === "quotes" ? myQuotesVisibleCount : myQuotesTotalCount) > 0 && (
                <Badge className="bg-[#FE8A0F] text-white ml-2">
                  {activeTab === "quotes" ? myQuotesVisibleCount : myQuotesTotalCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <CheckCircle className="w-4 h-4" />
              Active Jobs
              {activeJobsCount > 0 && (
                <Badge className="bg-green-600 text-white ml-2">
                  {activeJobsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Available Jobs Tab */}
        <TabsContent value="available" className="mt-0">
          <AvailableJobsSection />
        </TabsContent>

        {/* My Quotes Tab */}
        <TabsContent value="quotes" className="mt-0">
          <MyQuotesSection onVisibleCountChange={setMyQuotesVisibleCount} />
        </TabsContent>

        {/* Active Jobs Tab */}
        <TabsContent value="active" className="mt-0">
          <ActiveJobsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Active Jobs Section Component
function ActiveJobsSection() {
  const navigate = useNavigate();
  const { getProfessionalActiveJobs, fetchJobById } = useJobs();
  const { userInfo } = useAccount();
  const { startConversation } = useMessenger();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showDeliverWorkModal, setShowDeliverWorkModal] = useState(false);
  const [jobForDeliver, setJobForDeliver] = useState<Job | null>(null);

  const activeJobs = getProfessionalActiveJobs(userInfo?.id || "");

  // Filter and sort
  const filteredJobs = activeJobs
    .filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison =
            new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
          break;
        case "budget":
          comparison = (a.budgetMax ?? a.budgetAmount) - (b.budgetMax ?? b.budgetAmount);
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

  const getTruncatedDescription = (description: string, maxLength: number = 250) => {
    if (!description) return "";
    const singleLine = description.replace(/\s+/g, " ").trim();
    if (singleLine.length <= maxLength) return singleLine;
    return singleLine.slice(0, maxLength) + "...";
  };

  return (
    <div>
      {/* Stats Card */}
      <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
              Active Projects
            </p>
            <h3 className="font-['Poppins',sans-serif] text-[32px] text-[#2c353f]">
              {activeJobs.length}
            </h3>
          </div>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
          <Input
            placeholder="Search active jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-['Poppins',sans-serif]"
          />
        </div>

        <Select value={sortField} onValueChange={setSortField}>
          <SelectTrigger className="w-full md:w-[180px] font-['Poppins',sans-serif]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
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

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">
            No active jobs
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
            {searchQuery
              ? "No jobs match your search"
              : "Submit quotes on available jobs to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const acceptedQuote = job.quotes.find(
              (q) => q.professionalId === userInfo?.id && q.status === "accepted"
            );

            return (
              <div
                key={job.id}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-[#FE8A0F]"
                onClick={() => navigate(`/job/${job.slug || job.id}?tab=payment`)}
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                        {job.title}
                      </h3>
                      <Badge
                        className={`font-['Poppins',sans-serif] whitespace-nowrap ${
                          job.status === "delivered"
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-green-600 text-white border-green-600"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {job.status === "delivered" ? "Delivered" : "In Progress"}
                      </Badge>
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-bold mb-2">
                      Budget{" "}
                      {job.budgetMin != null && job.budgetMax != null
                        ? `${formatPrice(job.budgetMin)} - ${formatPrice(job.budgetMax)}`
                        : formatPrice(job.budgetAmount ?? 0)}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3">
                      {getTruncatedDescription(job.description)}
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

                    <div className="flex items-center gap-2 flex-wrap">
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
                        className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                      {job.status === "in-progress" && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setJobForDeliver(job);
                            setShowDeliverWorkModal(true);
                          }}
                          variant="outline"
                          className="font-['Poppins',sans-serif] border-[#1976D2] text-[#1976D2] hover:bg-[#E3F2FD] hover:text-[#1976D2]"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Deliver Work
                        </Button>
                      )}
                      {job.status === "delivered" && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/job/${job.slug || job.id}?tab=payment`);
                          }}
                          variant="outline"
                          className="font-['Poppins',sans-serif] border-[#1976D2] text-[#1976D2] hover:bg-[#E3F2FD] hover:text-[#1976D2]"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Delivery
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <JobDeliverWorkModal
        open={showDeliverWorkModal}
        onOpenChange={(open) => {
          setShowDeliverWorkModal(open);
          if (!open) setJobForDeliver(null);
        }}
        job={jobForDeliver}
        onSuccess={() => {
          setShowDeliverWorkModal(false);
          setJobForDeliver(null);
          if (jobForDeliver?.id) fetchJobById(jobForDeliver.id);
        }}
      />
    </div>
  );
}
