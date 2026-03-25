import { useMemo, useState, type ComponentType, type MouseEvent } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import AvailableJobsSection from "./AvailableJobsSection";
import MyQuotesSection from "./MyQuotesSection";
import { useJobs } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Search,
  ArrowUpDown,
  Eye,
  MessageCircle,
  Calendar,
  MapPin,
  Briefcase,
  Handshake,
  Send,
  Archive,
  Package,
  XCircle,
  FolderOpen,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useCurrency } from "./CurrencyContext";
import { formatJobLocationCityOnly } from "./orders/utils";
import JobDeliverWorkModal from "./JobDeliverWorkModal";
import type { Job } from "./JobsContext";
import JobSkillBadges from "./JobSkillBadges";
import {
  JobUrgentTitleBadge,
  ProActiveJobListStatusBadge,
  StatusCountBadge,
} from "./JobListCardStatusBadge";
import {
  RequestMilestonesDialog,
  proCanRequestMilestones,
} from "./JobMilestonePaymentDialogs";

function jobHasDisputedMilestone(job: Job): boolean {
  return (job.milestones ?? []).some((m) => m.status === "disputed");
}

type ProMyJobListCardMode = "active" | "completed";

function ProMyJobListCard({
  job,
  mode,
  userInfoId,
  onDeliverWork,
  onRequestMilestones,
}: {
  job: Job;
  mode: ProMyJobListCardMode;
  userInfoId?: string;
  onDeliverWork?: () => void;
  onRequestMilestones?: () => void;
}) {
  const navigate = useNavigate();
  const { startConversation } = useMessenger();
  const { formatPriceWhole } = useCurrency();

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

  return (
    <div
      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-[#FE8A0F]"
      onClick={() => navigate(`/job/${job.slug || job.id}?tab=payment`)}
    >
      <div className="flex flex-col md:flex-row gap-5">
        <div className="md:w-[70%] min-w-0">
          <div>
            <div className="mb-1 flex w-full min-w-0 flex-nowrap items-center gap-2">
              <h3 className="min-w-0 truncate font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                {job.title}
              </h3>
              <JobUrgentTitleBadge timing={job.timing} />
            </div>

            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 flex flex-wrap items-center gap-x-4 gap-y-0.5">
              <span className="text-[#6b6b6b]">Budget: &nbsp; </span>
              <span className="font-bold">
                {job.budgetMin != null && job.budgetMax != null
                  ? `${formatPriceWhole(job.budgetMin)} - ${formatPriceWhole(job.budgetMax)}`
                  : formatPriceWhole(job.budgetAmount ?? 0)}
              </span>
            </p>

            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3">
              {getTruncatedDescription(job.description)}
            </p>

            <div className="mt-1">
              <JobSkillBadges categories={job.categories} jobSlug={job.slug} jobId={job.id} />
            </div>

            <div className="pt-2 border-t border-gray-100 mt-3 flex flex-wrap items-center gap-3 text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif]">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {formatJobLocationCityOnly(job)}
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{getRelativeTime(job.postedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="md:w-[30%] flex flex-col gap-3 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end w-full">
            <ProActiveJobListStatusBadge status={job.status} />
          </div>
          <div className="mt-auto flex items-center gap-2 flex-wrap">
            <Button
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
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
              &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Message&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
            </Button>
            {mode === "active" && (
              <>
                {proCanRequestMilestones(job, userInfoId) && onRequestMilestones && (
                  <Button
                    type="button"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      onRequestMilestones();
                    }}
                    variant="outline"
                    className="bg-green-500 text-white hover:bg-green-600 hover:text-white border-green-500 font-['Poppins',sans-serif]"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Request milestones
                  </Button>
                )}
                {job.status === "in-progress" && onDeliverWork && (
                  <Button
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      onDeliverWork();
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
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      navigate(`/job/${job.slug || job.id}?tab=payment`);
                    }}
                    variant="outline"
                    className="font-['Poppins',sans-serif] border-[#1976D2] text-[#1976D2] hover:bg-[#E3F2FD] hover:text-[#1976D2]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    &nbsp; &nbsp; &nbsp; View Delivery &nbsp; &nbsp; &nbsp; 
                  </Button>
                )}
              </>
            )}
            {mode === "completed" && (
              <Button
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  navigate(`/job/${job.slug || job.id}?tab=review`);
                }}
                variant="outline"
                className="font-['Poppins',sans-serif] border-[#1976D2] text-[#1976D2] hover:bg-[#E3F2FD] hover:text-[#1976D2]"
              >
                <Eye className="w-4 h-4 mr-2" />
                &nbsp; &nbsp; &nbsp; View Review &nbsp; &nbsp; &nbsp; &nbsp; 
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type ProMyJobsTabId =
  | "available"
  | "quoted"
  | "awarded"
  | "delivered"
  | "completed"
  | "cancelled"
  | "other";

export default function ProfessionalJobsSection() {
  const [activeTab, setActiveTab] = useState<ProMyJobsTabId>("available");
  const {
    jobs,
    getProfessionalActiveJobs,
    getProfessionalCompletedJobs,
    getProfessionalQuotes,
    getAvailableJobs,
    isJobInProfessionalSector,
    professionalHasStakeInJob,
  } = useJobs();
  const { userInfo } = useAccount();
  const proId = userInfo?.id || "";

  const availableJobs = useMemo(
    () =>
      getAvailableJobs().filter(
        (job) => !(job.quotes || []).some((q) => String(q.professionalId) === String(proId))
      ),
    [getAvailableJobs, proId, jobs]
  );

  const quotedEntries = getProfessionalQuotes(proId);
  const myQuotesTotalCount = quotedEntries.length;
  const quotedJobs = useMemo(() => {
    const map = new Map<string, Job>();
    quotedEntries.forEach(({ job }) => map.set(job.id, job));
    return Array.from(map.values());
  }, [quotedEntries]);

  const activeJobs = useMemo(() => getProfessionalActiveJobs(proId), [getProfessionalActiveJobs, proId, jobs]);

  const awardedJobs = useMemo(
    () =>
      activeJobs.filter(
        (j) =>
          !jobHasDisputedMilestone(j) &&
          (j.status === "awaiting-accept" || j.status === "in-progress")
      ),
    [activeJobs]
  );

  const deliveredJobs = useMemo(
    () =>
      activeJobs.filter(
        (j) => !jobHasDisputedMilestone(j) && j.status === "delivered"
      ),
    [activeJobs]
  );

  const completedJobs = useMemo(
    () => getProfessionalCompletedJobs(proId),
    [getProfessionalCompletedJobs, proId, jobs]
  );

  const cancelledJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          isJobInProfessionalSector(j) &&
          j.status === "cancelled" &&
          professionalHasStakeInJob(j, proId)
      ),
    [jobs, proId, isJobInProfessionalSector, professionalHasStakeInJob]
  );

  const otherJobs = useMemo(() => {
    const covered = new Set<string>([
      ...availableJobs.map((j) => j.id),
      ...quotedJobs.map((j) => j.id),
      ...awardedJobs.map((j) => j.id),
      ...deliveredJobs.map((j) => j.id),
      ...completedJobs.map((j) => j.id),
      ...cancelledJobs.map((j) => j.id),
    ]);
    return jobs.filter(
      (j) =>
        isJobInProfessionalSector(j) &&
        professionalHasStakeInJob(j, proId) &&
        !covered.has(j.id)
    );
  }, [
    jobs,
    proId,
    availableJobs,
    quotedJobs,
    awardedJobs,
    deliveredJobs,
    completedJobs,
    cancelledJobs,
    isJobInProfessionalSector,
    professionalHasStakeInJob,
  ]);

  const [myQuotesVisibleCount, setMyQuotesVisibleCount] = useState(myQuotesTotalCount);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
          My Jobs
        </h2>
        <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
          Browse open work, track quotes, awarded work, delivery, completion, and everything else in one place
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as ProMyJobsTabId)} className="w-full">
        <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-max min-w-full sm:min-w-0 gap-1 bg-gray-100 p-1 rounded-xl h-auto flex-nowrap">
            <TabsTrigger
              value="available"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 px-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Briefcase className="w-4 h-4" />
              Available
              {availableJobs.length > 0 && (
                <StatusCountBadge
                  status="open"
                  count={availableJobs.length}
                  variant="client"
                  className="ml-1"
                />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="quoted"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 px-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              Quoted
              {(activeTab === "quoted" ? myQuotesVisibleCount : myQuotesTotalCount) > 0 && (
                <StatusCountBadge
                  status="awaiting-accept"
                  count={activeTab === "quoted" ? myQuotesVisibleCount : myQuotesTotalCount}
                  variant="client"
                  className="ml-1"
                />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="awarded"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 px-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Handshake className="w-4 h-4" />
              Awarded
              {awardedJobs.length > 0 && (
                <StatusCountBadge
                  status="in-progress"
                  count={awardedJobs.length}
                  variant="pro"
                  className="ml-1"
                />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="delivered"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 px-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Package className="w-4 h-4" />
              Delivered
              {deliveredJobs.length > 0 && (
                <StatusCountBadge
                  status="delivered"
                  count={deliveredJobs.length}
                  variant="pro"
                  className="ml-1"
                />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 px-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Archive className="w-4 h-4" />
              Completed
              {completedJobs.length > 0 && (
                <StatusCountBadge
                  status="completed"
                  count={completedJobs.length}
                  variant="pro"
                  className="ml-1"
                />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 px-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <XCircle className="w-4 h-4" />
              Cancelled
              {cancelledJobs.length > 0 && (
                <StatusCountBadge
                  status="cancelled"
                  count={cancelledJobs.length}
                  variant="pro"
                  className="ml-1"
                />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="other"
              className="font-['Poppins',sans-serif] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm rounded-lg py-3 px-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <FolderOpen className="w-4 h-4" />
              Other jobs
              {otherJobs.length > 0 && (
                <StatusCountBadge
                  status="open"
                  count={otherJobs.length}
                  variant="client"
                  className="ml-1"
                />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="available" className="mt-0">
          <AvailableJobsSection />
        </TabsContent>

        <TabsContent value="quoted" className="mt-0">
          <MyQuotesSection onVisibleCountChange={setMyQuotesVisibleCount} />
        </TabsContent>

        <TabsContent value="awarded" className="mt-0">
          <ProPipelineJobsList
            jobs={awardedJobs}
            statLabel="Awarded work"
            statIcon={Briefcase}
            statGradient="from-green-50 to-white border-green-200"
            statIconBg="bg-green-100"
            statIconColor="text-green-600"
            emptyTitle="No awarded jobs"
            emptyHint="When a client awards you a project, it will appear here until you deliver."
            searchPlaceholder="Search awarded jobs..."
          />
        </TabsContent>

        <TabsContent value="delivered" className="mt-0">
          <ProPipelineJobsList
            jobs={deliveredJobs}
            statLabel="Delivered"
            statIcon={Package}
            statGradient="from-purple-50 to-white border-purple-200"
            statIconBg="bg-purple-100"
            statIconColor="text-purple-600"
            emptyTitle="No delivered jobs"
            emptyHint="When the client marks delivery, jobs move here until completion."
            searchPlaceholder="Search delivered jobs..."
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <CompletedJobsSection />
        </TabsContent>

        <TabsContent value="cancelled" className="mt-0">
          <ProPipelineJobsList
            jobs={cancelledJobs}
            statLabel="Cancelled"
            statIcon={XCircle}
            statGradient="from-red-50 to-white border-red-200"
            statIconBg="bg-red-100"
            statIconColor="text-red-600"
            emptyTitle="No cancelled jobs"
            emptyHint="Jobs that were cancelled will appear here."
            searchPlaceholder="Search cancelled jobs..."
          />
        </TabsContent>

        <TabsContent value="other" className="mt-0">
          <ProPipelineJobsList
            jobs={otherJobs}
            statLabel="Other"
            statIcon={FolderOpen}
            statGradient="from-amber-50 to-white border-amber-200"
            statIconBg="bg-amber-100"
            statIconColor="text-amber-700"
            emptyTitle="No other jobs"
            emptyHint="Closed jobs, disputes, or edge cases that don’t fit the tabs above appear here."
            searchPlaceholder="Search other jobs..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProPipelineJobsList({
  jobs: sourceJobs,
  statLabel,
  statIcon: StatIcon,
  statGradient,
  statIconBg,
  statIconColor,
  emptyTitle,
  emptyHint,
  searchPlaceholder,
}: {
  jobs: Job[];
  statLabel: string;
  statIcon: ComponentType<{ className?: string }>;
  statGradient: string;
  statIconBg: string;
  statIconColor: string;
  emptyTitle: string;
  emptyHint: string;
  searchPlaceholder: string;
}) {
  const { fetchJobById } = useJobs();
  const { userInfo } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showDeliverWorkModal, setShowDeliverWorkModal] = useState(false);
  const [jobForDeliver, setJobForDeliver] = useState<Job | null>(null);
  const [requestMilestoneJob, setRequestMilestoneJob] = useState<Job | null>(null);

  // Filter and sort
  const filteredJobs = sourceJobs
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

  return (
    <div>
      {/* Stats Card */}
      <div className={`bg-gradient-to-br border-2 rounded-xl p-6 mb-6 ${statGradient}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
              {statLabel}
            </p>
            <h3 className="font-['Poppins',sans-serif] text-[32px] text-[#2c353f]">
              {sourceJobs.length}
            </h3>
          </div>
          <div className={`w-16 h-16 ${statIconBg} rounded-full flex items-center justify-center`}>
            <StatIcon className={`w-8 h-8 ${statIconColor}`} />
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
          <Input
            placeholder={searchPlaceholder}
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
            {emptyTitle}
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
            {searchQuery ? "No jobs match your search" : emptyHint}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <ProMyJobListCard
              key={job.id}
              job={job}
              mode="active"
              userInfoId={userInfo?.id}
              onDeliverWork={() => {
                setJobForDeliver(job);
                setShowDeliverWorkModal(true);
              }}
              onRequestMilestones={() => setRequestMilestoneJob(job)}
            />
          ))}
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
      <RequestMilestonesDialog
        open={!!requestMilestoneJob}
        onOpenChange={(open) => {
          if (!open) setRequestMilestoneJob(null);
        }}
        jobId={requestMilestoneJob?.id}
        fetchJobKey={requestMilestoneJob?.slug || requestMilestoneJob?.id || ""}
      />
    </div>
  );
}

function CompletedJobsSection() {
  const { getProfessionalCompletedJobs } = useJobs();
  const { userInfo } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("completed");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const completedJobs = getProfessionalCompletedJobs(userInfo?.id || "");

  const filteredJobs = completedJobs
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
          comparison = new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
          break;
        case "completed":
          comparison =
            new Date(a.completedAt || a.postedAt).getTime() -
            new Date(b.completedAt || b.postedAt).getTime();
          break;
        case "budget":
          comparison = (a.budgetMax ?? a.budgetAmount) - (b.budgetMax ?? b.budgetAmount);
          break;
        default:
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  return (
    <div>
      <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">Completed Projects</p>
            <h3 className="font-['Poppins',sans-serif] text-[32px] text-[#2c353f]">{completedJobs.length}</h3>
          </div>
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Archive className="w-8 h-8 text-slate-600" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
          <Input
            placeholder="Search completed jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-['Poppins',sans-serif]"
          />
        </div>

        <Select value={sortField} onValueChange={setSortField}>
          <SelectTrigger className="w-full md:w-[200px] font-['Poppins',sans-serif]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="completed">Completed date</SelectItem>
            <SelectItem value="date">Posted date</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
          className="font-['Poppins',sans-serif]"
        >
          {sortDirection === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">No completed jobs</h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
            {searchQuery ? "No jobs match your search" : "Finished jobs will appear here after all milestones are released"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <ProMyJobListCard key={job.id} job={job} mode="completed" userInfoId={userInfo?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
