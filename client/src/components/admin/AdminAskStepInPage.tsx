import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Gavel, AlertTriangle, Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { toast } from "sonner";

interface AskStepInDispute {
  id: string;
  disputeId: string;
  clientName: string;
  clientEmail: string;
  professionalName: string;
  professionalEmail: string;
  amount: string;
  amountValue: number;
  disputeStatus: string;
  reason: string;
  createdAt: string | null;
  updatedAt: string | null;
  respondedAt: string | null;
  bothPaid: boolean;
  lastPaymentDate: string | null;
  arbitrationFeeAmount: number;
  claimantName: string;
  respondentName: string;
}

function SortableHeader({
  column,
  label,
  currentSort,
  sortDirection,
  onSort,
}: {
  column: string;
  label: string;
  currentSort: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  return (
    <TableHead className="text-[#FE8A0F] font-semibold">
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-2 hover:text-[#FFB347] transition-colors"
      >
        {label}
        <ArrowUpDown className="w-4 h-4" />
        {currentSort === column && (
          <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
        )}
      </button>
    </TableHead>
  );
}

// Dispute stages: Initial, Respondent, Negotiation, Arbitration, Final
const getDisputeStage = (dispute: AskStepInDispute) => {
  const status = dispute.disputeStatus?.toLowerCase() || '';
  
  if (status === 'closed') {
    return { stage: 'Final', color: 'gray', icon: CheckCircle2 };
  }
  if (status === 'admin_arbitration') {
    return { stage: 'Arbitration', color: 'purple', icon: Gavel };
  }
  if (status === 'negotiation') {
    return { stage: 'Negotiation', color: 'blue', icon: MessageSquare };
  }
  if (dispute.respondedAt) {
    return { stage: 'Respondent', color: 'amber', icon: Clock };
  }
  return { stage: 'Initial', color: 'red', icon: AlertTriangle };
};

const getStageBadge = (dispute: AskStepInDispute) => {
  const { stage, color, icon: Icon } = getDisputeStage(dispute);
  
  const colorClasses: Record<string, string> = {
    red: 'bg-red-100 text-red-700 border-red-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  
  return (
    <Badge className={`${colorClasses[color]} border text-xs`}>
      <Icon className="w-3 h-3 mr-1" />
      {stage}
    </Badge>
  );
};

export default function AdminAskStepInPage() {
  useAdminRouteGuard();
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<AskStepInDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      params.append("sortBy", sortField);
      params.append("sortOrder", sortDirection);
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(resolveApiUrl(`/api/admin/disputes-ask-step-in?${params.toString()}`), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
        setTotalPages(data.totalPages ?? 1);
        setTotalCount(data.totalCount ?? 0);
      } else {
        toast.error("Failed to fetch disputes");
        setDisputes([]);
      }
    } catch {
      toast.error("Error fetching disputes");
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [page, sortField, sortDirection, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleViewDispute = (disputeId: string) => {
    navigate(`/admin/dispute/${encodeURIComponent(disputeId)}`);
  };

  return (
    <AdminPageLayout
      title="Ask Step In"
      description="Disputes where both parties have paid arbitration fees and are awaiting admin resolution (Arbitration Stage)."
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Gavel className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-['Poppins',sans-serif] text-[14px] text-purple-800 font-medium">
                {totalCount} dispute{totalCount !== 1 ? 's' : ''} in Arbitration Stage
              </p>
              <p className="font-['Poppins',sans-serif] text-[12px] text-purple-600">
                Both parties have paid the arbitration fee - awaiting admin decision
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by dispute ID, claimant, or respondent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              className="pl-10 border-gray-300 focus:border-[#FE8A0F] focus:ring-[#FE8A0F]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F] mr-2" />
              <span className="text-black">Loading disputes...</span>
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-black font-medium">No disputes awaiting resolution</p>
              <p className="text-gray-500 text-sm mt-1">
                Disputes will appear here when both parties pay the arbitration fee
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-0 hover:bg-transparent shadow-sm">
                      <TableHead className="text-[#FE8A0F] font-semibold">Dispute ID</TableHead>
                      <TableHead className="text-[#FE8A0F] font-semibold">Claimant</TableHead>
                      <TableHead className="text-[#FE8A0F] font-semibold">Respondent</TableHead>
                      <SortableHeader
                        column="amountValue"
                        label="Amount"
                        currentSort={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                      <TableHead className="text-[#FE8A0F] font-semibold">Arb. Fee</TableHead>
                      <TableHead className="text-[#FE8A0F] font-semibold">Stage</TableHead>
                      <SortableHeader
                        column="createdAt"
                        label="Opened"
                        currentSort={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                      <TableHead className="text-[#FE8A0F] font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((dispute) => (
                      <TableRow
                        key={dispute.id}
                        className="border-0 hover:bg-[#FE8A0F]/5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <TableCell className="text-black text-sm font-mono font-medium">
                          {dispute.disputeId || "—"}
                        </TableCell>
                        <TableCell className="text-black">
                          <div>
                            <p className="text-sm font-medium">{dispute.claimantName || dispute.clientName}</p>
                            <p className="text-xs text-gray-500">{dispute.clientEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-black">
                          <div>
                            <p className="text-sm font-medium">{dispute.respondentName || dispute.professionalName}</p>
                            <p className="text-xs text-gray-500">{dispute.professionalEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-black font-medium">£{dispute.amount}</TableCell>
                        <TableCell className="text-black">
                          <span className="text-sm text-purple-600 font-medium">
                            £{(dispute.arbitrationFeeAmount * 2).toFixed(2)}
                          </span>
                          <p className="text-xs text-gray-500">Both paid</p>
                        </TableCell>
                        <TableCell className="text-black">
                          {getStageBadge(dispute)}
                        </TableCell>
                        <TableCell className="text-black text-sm text-gray-600">
                          {formatDate(dispute.createdAt)}
                        </TableCell>
                        <TableCell className="text-black">
                          <Button
                            size="sm"
                            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
                            onClick={() => handleViewDispute(dispute.disputeId)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-0 shadow-sm">
                  <p className="text-sm text-black">
                    Page <span className="text-[#FE8A0F] font-semibold">{page}</span> of{" "}
                    <span className="text-[#FE8A0F] font-semibold">{totalPages}</span>
                    {totalCount >= 0 && (
                      <span className="ml-2 text-gray-500">({totalCount} total)</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-0 shadow-md shadow-gray-200 text-[#FE8A0F] hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="border-0 shadow-md shadow-gray-200 text-[#FE8A0F] hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}
