import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import AvailableJobsSection from "./AvailableJobsSection";
import MyQuotesSection from "./MyQuotesSection";
import { useJobs } from "./JobsContext";
import { useAccount } from "./AccountContext";
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function ProfessionalJobsSection() {
  const [activeTab, setActiveTab] = useState("available");
  const { getProfessionalActiveJobs, getProfessionalQuotes, getAvailableJobs } = useJobs();
  const { userInfo } = useAccount();

  // Get counts for badges
  const availableJobsCount = getAvailableJobs().length;
  const myQuotesCount = getProfessionalQuotes(userInfo?.id || "").length;
  const activeJobsCount = getProfessionalActiveJobs(userInfo?.id || "").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="font-['Roboto',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
          My Jobs
        </h2>
        <p className="font-['Roboto',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
          Manage available jobs, your quotes, and active projects
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full sm:grid sm:grid-cols-3 bg-gray-100 p-1 rounded-xl h-auto gap-1">
            <TabsTrigger
              value="available"
              className="font-['Roboto',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
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
              className="font-['Roboto',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              My Quotes
              {myQuotesCount > 0 && (
                <Badge className="bg-[#FE8A0F] text-white ml-2">
                  {myQuotesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="font-['Roboto',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
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
          <MyQuotesSection />
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
  const { getProfessionalActiveJobs } = useJobs();
  const { userInfo } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
          comparison = a.budgetAmount - b.budgetAmount;
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

  return (
    <div>
      {/* Stats Card */}
      <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
              Active Projects
            </p>
            <h3 className="font-['Roboto',sans-serif] text-[32px] text-[#2c353f]">
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
            className="pl-10 font-['Roboto',sans-serif]"
          />
        </div>

        <Select value={sortField} onValueChange={setSortField}>
          <SelectTrigger className="w-full md:w-[180px] font-['Roboto',sans-serif]">
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
          className="font-['Roboto',sans-serif]"
        >
          {sortDirection === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f] mb-2">
            No active jobs
          </h3>
          <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
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
                className="border border-gray-200 rounded-xl p-6 hover:border-[#FE8A0F] transition-all cursor-pointer"
                onClick={() => navigate(`/job/${job.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left Side */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f] mb-2">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Badge className="bg-green-50 text-green-700 border-green-200 font-['Roboto',sans-serif]">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-[#6b6b6b] font-['Roboto',sans-serif] text-[13px]">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-[#6b6b6b] font-['Roboto',sans-serif] text-[13px]">
                        <Calendar className="w-4 h-4" />
                        Started: {formatDate(job.postedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col items-start md:items-end gap-3">
                    <div className="text-right">
                      <p className="font-['Roboto',sans-serif] text-[24px] text-[#2c353f]">
                        £{acceptedQuote?.price || job.budgetAmount}
                      </p>
                      <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">
                        Your Quote
                      </p>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/job/${job.id}`);
                      }}
                      className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Roboto',sans-serif]"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
