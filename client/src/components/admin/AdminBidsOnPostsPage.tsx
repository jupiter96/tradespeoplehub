import React, { useState, useEffect } from "react";
import { Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
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
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { toast } from "sonner";

interface BidRow {
  jobId: string;
  clientName: string;
  bidUserName: string;
  jobTitle: string;
  description: string;
  bidAmount: number;
  createDate: string | null;
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
    <TableHead className="text-[#FE8A0F] font-semibold whitespace-nowrap">
      <button
        type="button"
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

const SORT_FIELDS: { value: string; label: string }[] = [
  { value: "createDate", label: "Create date" },
  { value: "jobTitle", label: "Job title" },
  { value: "bidAmount", label: "Bid amount" },
  { value: "jobId", label: "Job ID" },
  { value: "clientName", label: "Client name" },
  { value: "bidUserName", label: "Bid user name" },
];

export default function AdminBidsOnPostsPage() {
  useAdminRouteGuard();
  const [bids, setBids] = useState<BidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const fetchBids = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(resolveApiUrl(`/api/admin/job-bids?${params.toString()}`), {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBids(data.bids || []);
        setTotalPages(data.totalPages ?? 1);
        setTotalCount(data.totalCount ?? 0);
      } else {
        toast.error("Failed to fetch bids");
        setBids([]);
      }
    } catch {
      toast.error("Error fetching bids");
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [page, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const truncate = (str: string, maxLen: number) => {
    if (!str) return "—";
    const s = String(str).trim();
    return s.length <= maxLen ? s : s.slice(0, maxLen) + "...";
  };

  return (
    <AdminPageLayout
      title="Bids on Posts"
      description="View all quotes (bids) submitted by professionals on jobs. Search, filter, and sort."
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by job ID, client, bid user, title, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {SORT_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F] mr-2" />
              <span>Loading bids...</span>
            </div>
          ) : bids.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No bids found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      column="jobId"
                      label="Job ID"
                      currentSort={sortBy}
                      sortDirection={sortOrder}
                      onSort={handleSort}
                    />
                    <TableHead className="text-[#FE8A0F] font-semibold">Client name</TableHead>
                    <TableHead className="text-[#FE8A0F] font-semibold">Bid user name</TableHead>
                    <TableHead className="text-[#FE8A0F] font-semibold">Job title</TableHead>
                    <TableHead className="text-[#FE8A0F] font-semibold">Description</TableHead>
                    <SortableHeader
                      column="bidAmount"
                      label="Bid amount"
                      currentSort={sortBy}
                      sortDirection={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      column="createDate"
                      label="Create date"
                      currentSort={sortBy}
                      sortDirection={sortOrder}
                      onSort={handleSort}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid, idx) => (
                    <TableRow key={`${bid.jobId}-${bid.bidUserName}-${idx}`}>
                      <TableCell className="font-mono text-xs">{bid.jobId.slice(-8)}</TableCell>
                      <TableCell>{bid.clientName || "—"}</TableCell>
                      <TableCell>{bid.bidUserName || "—"}</TableCell>
                      <TableCell title={bid.jobTitle}>{truncate(bid.jobTitle, 25)}</TableCell>
                      <TableCell title={bid.description}>
                        {truncate(bid.description, 25)}
                      </TableCell>
                      <TableCell>£{Number(bid.bidAmount ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(bid.createDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Page <span className="font-semibold text-[#FE8A0F]">{page}</span> of{" "}
                    <span className="font-semibold text-[#FE8A0F]">{totalPages}</span>
                    {totalCount >= 0 && <span className="ml-2">({totalCount} total)</span>}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
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
