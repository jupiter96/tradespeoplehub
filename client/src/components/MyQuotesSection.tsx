import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  MessageCircle,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function MyQuotesSection() {
  const navigate = useNavigate();
  const { getProfessionalQuotes } = useJobs();
  const { userInfo } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 font-['Roboto',sans-serif]">
            <Hourglass className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 font-['Roboto',sans-serif]">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "awarded":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-['Roboto',sans-serif]">
            <CheckCircle className="w-3 h-3 mr-1" />
            Awarded
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 font-['Roboto',sans-serif]">
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

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#E3F2FD] to-white border-2 border-[#3B82F6] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
              Total
            </p>
            <MessageCircle className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <p className="font-['Roboto',sans-serif] text-[28px] text-[#2c353f]">
            {stats.total}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#FFF9E6] to-white border-2 border-[#FFB347] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
              Pending
            </p>
            <Hourglass className="w-5 h-5 text-[#FFB347]" />
          </div>
          <p className="font-['Roboto',sans-serif] text-[28px] text-[#2c353f]">
            {stats.pending}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#E8F5E9] to-white border-2 border-[#4CAF50] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
              Accepted
            </p>
            <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
          </div>
          <p className="font-['Roboto',sans-serif] text-[28px] text-[#2c353f]">
            {stats.accepted}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#E0F2F1] to-white border-2 border-[#00897B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
              Awarded
            </p>
            <CheckCircle className="w-5 h-5 text-[#00897B]" />
          </div>
          <p className="font-['Roboto',sans-serif] text-[28px] text-[#2c353f]">
            {stats.awarded}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#FFEBEE] to-white border-2 border-[#F44336] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
              Rejected
            </p>
            <XCircle className="w-5 h-5 text-[#F44336]" />
          </div>
          <p className="font-['Roboto',sans-serif] text-[28px] text-[#2c353f]">
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
            className="pl-10 font-['Roboto',sans-serif]"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] font-['Roboto',sans-serif]">
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
          <SelectTrigger className="w-full md:w-[180px] font-['Roboto',sans-serif]">
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
          className="font-['Roboto',sans-serif]"
        >
          {sortDirection === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f] mb-2">
            No quotes found
          </h3>
          <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Start bidding on available jobs to see your quotes here"}
          </p>
          {searchQuery === "" && statusFilter === "all" && (
            <Button
              onClick={() => navigate("/account")}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Roboto',sans-serif]"
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
              onClick={() => navigate(`/job/${job.id}`)}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left Side - Job & Quote Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f] mb-2">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {getStatusBadge(quote.status)}
                        <span className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">
                          Submitted: {formatDate(quote.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2 text-[#6b6b6b] font-['Roboto',sans-serif] text-[13px]">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-[#6b6b6b] font-['Roboto',sans-serif] text-[13px]">
                      <Calendar className="w-4 h-4" />
                      Posted: {formatDate(job.postedAt)}
                    </div>
                  </div>

                  {/* Quote Message Preview */}
                  <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b] line-clamp-2 mb-3">
                    {quote.message}
                  </p>
                </div>

                {/* Right Side - Quote Details */}
                <div className="flex flex-col items-start md:items-end gap-3">
                  <div className="text-right">
                    <p className="font-['Roboto',sans-serif] text-[24px] text-[#2c353f]">
                      £{quote.price}
                    </p>
                    <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">
                      Your Quote
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[#6b6b6b] font-['Roboto',sans-serif] text-[13px]">
                    <Clock className="w-4 h-4" />
                    {quote.deliveryTime}
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/job/${job.id}`);
                    }}
                    variant="outline"
                    className="w-full md:w-auto font-['Roboto',sans-serif]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Job
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
