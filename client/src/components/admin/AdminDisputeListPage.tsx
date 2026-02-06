import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Eye } from "lucide-react";
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

interface AdminDisputeOrder {
  id: string;
  orderNumber: string;
  disputeId?: string;
  clientName: string;
  clientEmail: string;
  professionalName: string;
  professionalEmail: string;
  serviceTitle: string;
  amount: string;
  amountValue: number;
  status: string;
  createdAt: string | null;
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

export default function AdminDisputeListPage() {
  useAdminRouteGuard();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminDisputeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      params.append("sortBy", sortField);
      params.append("sortOrder", sortDirection);
      params.append("status", "disputed");
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(resolveApiUrl(`/api/admin/orders?${params.toString()}`), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.totalPages ?? 1);
        setTotalCount(data.totalCount ?? 0);
      } else {
        toast.error("Failed to fetch disputes");
        setOrders([]);
      }
    } catch {
      toast.error("Error fetching disputes");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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

  const handleViewDispute = (disputeId: string) => {
    navigate(`/admin/dispute/${encodeURIComponent(disputeId)}`);
  };

  return (
    <AdminPageLayout
      title="Dispute List"
      description="View all disputed orders. Open a dispute discussion in observer mode from the View action."
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by order number, client, professional, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              className="pl-10 border-gray-300 focus:border-[#FE8A0F] focus:ring-[#FE8A0F]"
            />
          </div>
        </div>

        <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F] mr-2" />
              <span className="text-black">Loading disputes...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-black">No disputed orders found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-0 hover:bg-transparent shadow-sm">
                      <SortableHeader
                        column="orderNumber"
                        label="Order #"
                        currentSort={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                      <TableHead className="text-[#FE8A0F] font-semibold">Dispute ID</TableHead>
                      <TableHead className="text-[#FE8A0F] font-semibold">Client</TableHead>
                      <TableHead className="text-[#FE8A0F] font-semibold">Professional</TableHead>
                      <TableHead className="text-[#FE8A0F] font-semibold">Service</TableHead>
                      <SortableHeader
                        column="total"
                        label="Amount"
                        currentSort={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                      <TableHead className="text-[#FE8A0F] font-semibold">Status</TableHead>
                      <SortableHeader
                        column="createdAt"
                        label="Date"
                        currentSort={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                      <TableHead className="text-[#FE8A0F] font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="border-0 hover:bg-[#FE8A0F]/5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <TableCell className="text-black font-medium">{order.orderNumber}</TableCell>
                        <TableCell className="text-black text-sm font-mono">
                          {order.disputeId || "—"}
                        </TableCell>
                        <TableCell className="text-black">
                          <div>
                            <p className="text-sm font-medium">{order.clientName}</p>
                            <p className="text-xs text-gray-500">{order.clientEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-black">
                          <div>
                            <p className="text-sm font-medium">{order.professionalName}</p>
                            <p className="text-xs text-gray-500">{order.professionalEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-black">
                          <p className="text-sm max-w-[200px] truncate" title={order.serviceTitle}>
                            {order.serviceTitle}
                          </p>
                        </TableCell>
                        <TableCell className="text-black font-medium">£{order.amount}</TableCell>
                        <TableCell className="text-black">
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 border text-xs">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-black text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-black">
                          {order.disputeId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                              onClick={() => handleViewDispute(order.disputeId!)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Resolve
                            </Button>
                          ) : (
                            "—"
                          )}
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
