import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { resolveApiUrl } from "../../config/api";

interface BankTransferRequest {
  _id: string;
  id: string;
  userId: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    name: string;
  } | null;
  amount: number;
  commission: number;
  userAmount: number;
  city: string;
  bankAccountName: string;
  dateOfDeposit: string;
  referenceNumber: string;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
  processedBy: {
    firstName: string;
    lastName: string;
    name: string;
  } | null;
  processedAt: string | null;
  adminNotes: string | null;
}

type SortField = "createdAt" | "amount" | "status" | "dateOfDeposit";
type SortOrder = "asc" | "desc";

export default function AdminBankTransferRequestPage() {
  const [requests, setRequests] = useState<BankTransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
  });
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BankTransferRequest | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchRequests();
  }, [page, filters, sortField, sortOrder, pageSize]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy: sortField,
        sortOrder: sortOrder,
      });
      
      if (filters.status && filters.status !== "all") params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(resolveApiUrl(`/api/admin/bank-transfer-requests?${params}`), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        toast.error("Failed to fetch bank transfer requests");
      }
    } catch (error) {
      console.error("Error fetching bank transfer requests:", error);
      toast.error("Failed to fetch bank transfer requests");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      setFilters({ ...filters, search: value });
      setPage(1);
    }, 500);
    
    setSearchDebounce(timeout);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 text-[#FE8A0F]" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-[#FE8A0F]" />
    );
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm("Are you sure you want to approve this bank transfer request?")) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(resolveApiUrl(`/api/admin/wallet/approve/${requestId}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success("Bank transfer request approved successfully");
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const response = await fetch(resolveApiUrl(`/api/admin/wallet/reject/${selectedRequest._id}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          adminNotes: rejectReason,
        }),
      });

      if (response.ok) {
        toast.success("Bank transfer request rejected");
        setIsRejectDialogOpen(false);
        setRejectReason("");
        setSelectedRequest(null);
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500 text-white font-['Poppins',sans-serif] text-[11px]">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 text-white font-['Poppins',sans-serif] text-[11px]">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-orange-500 text-white font-['Poppins',sans-serif] text-[11px]">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <AdminPageLayout
      title="Bank Transfer Homeowner"
      description="Manage bank transfer requests from users"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status-filter" className="font-['Poppins',sans-serif]">
                  Status
                </Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => {
                    setFilters({ ...filters, status: value });
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="status-filter" className="font-['Poppins',sans-serif]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="page-size" className="font-['Poppins',sans-serif]">
                  Show
                </Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="page-size" className="font-['Poppins',sans-serif]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="search" className="font-['Poppins',sans-serif]">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by user name, email, or reference..."
                    className="font-['Poppins',sans-serif] pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                  Bank Transfer Requests
                </CardTitle>
                <CardDescription className="font-['Poppins',sans-serif]">
                  Total: {total} requests
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  No bank transfer requests found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        Id
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        User
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f] cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("amount")}
                      >
                        <div className="flex items-center">
                          Amount
                          {getSortIcon("amount")}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        Commission
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        User Amount
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        City
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        Bank account name
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f] cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("dateOfDeposit")}
                      >
                        <div className="flex items-center">
                          Date of deposit
                          {getSortIcon("dateOfDeposit")}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        Reference Number
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f] cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center">
                          Status
                          {getSortIcon("status")}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {request.id.slice(-3)}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {request.user?.name || "-"}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          £{request.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {request.commission.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {request.userAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {request.city || "-"}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {request.bankAccountName || "-"}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {formatDate(request.dateOfDeposit)}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {request.referenceNumber || "-"}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(request._id)}
                                  disabled={isProcessing}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-['Poppins',sans-serif] text-[11px]"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setIsRejectDialogOpen(true);
                                  }}
                                  disabled={isProcessing}
                                  className="font-['Poppins',sans-serif] text-[11px]"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.status === "rejected" && request.adminNotes && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsRejectDialogOpen(true);
                                }}
                                className="font-['Poppins',sans-serif] text-[11px]"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Reason
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="font-['Poppins',sans-serif]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="font-['Poppins',sans-serif]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif]">
              {selectedRequest?.status === "rejected" ? "Rejection Reason" : "Reject Bank Transfer Request"}
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif]">
              {selectedRequest?.status === "rejected"
                ? "The reason for rejecting this request:"
                : "Please provide a reason for rejecting this request."}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest?.status === "rejected" ? (
            <div className="py-4">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                {selectedRequest.adminNotes || "No reason provided"}
              </p>
            </div>
          ) : (
            <div className="py-4">
              <Label htmlFor="reject-reason" className="font-['Poppins',sans-serif]">
                Reason
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="mt-2 font-['Poppins',sans-serif] min-h-[100px]"
              />
            </div>
          )}
          <DialogFooter>
            {selectedRequest?.status !== "rejected" && (
              <Button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isProcessing}
                variant="destructive"
                className="font-['Poppins',sans-serif]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </Button>
            )}
            <Button
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason("");
                setSelectedRequest(null);
              }}
              variant="outline"
              className="font-['Poppins',sans-serif]"
            >
              {selectedRequest?.status === "rejected" ? "Close" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
