import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, XCircle, Clock } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import API_BASE_URL from "../../config/api";

interface Transaction {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  type: string;
  amount: number;
  balance: number;
  status: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
  processedBy?: {
    firstName: string;
    lastName: string;
  };
  adminNotes?: string;
}

type SortField = "createdAt" | "amount" | "type" | "status";
type SortOrder = "asc" | "desc";

export default function AdminTransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    search: "",
  });
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [page, filters, sortField, sortOrder]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        sortBy: sortField,
        sortOrder: sortOrder,
      });
      
      if (filters.status && filters.status !== "all") params.append("status", filters.status);
      if (filters.type && filters.type !== "all") params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`${API_BASE_URL}/api/admin/wallet/transactions?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        toast.error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
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
    setPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-[#FE8A0F]" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-[#FE8A0F]" />
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminPageLayout
      title="Transaction History"
      description="View and manage all wallet transactions"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
              Filters & Search
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type-filter" className="font-['Poppins',sans-serif]">
                  Type
                </Label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) => {
                    setFilters({ ...filters, type: value });
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="type-filter" className="font-['Poppins',sans-serif]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user-search" className="font-['Poppins',sans-serif]">
                  Search by Email
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="user-search"
                    type="text"
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by email..."
                    className="font-['Poppins',sans-serif] pl-10"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setFilters({ status: "all", type: "all", search: "" });
                    setPage(1);
                  }}
                  variant="outline"
                  className="w-full font-['Poppins',sans-serif]"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                  Transactions
                </CardTitle>
                <CardDescription className="font-['Poppins',sans-serif]">
                  Total: {total} transactions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  No transactions found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th 
                        className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f] cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center">
                          Date & Time
                          {getSortIcon("createdAt")}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        User
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f] cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("type")}
                      >
                        <div className="flex items-center">
                          Type
                          {getSortIcon("type")}
                        </div>
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
                        Balance
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
                        Method
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f] whitespace-nowrap">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {transaction.userId ? (
                            <div>
                              <p className="font-medium">
                                {transaction.userId.firstName} {transaction.userId.lastName}
                              </p>
                              <p className="text-[12px] text-[#6b6b6b]">{transaction.userId.email}</p>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          <span className="capitalize font-medium">{transaction.type}</span>
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              transaction.type === "deposit" || transaction.type === "refund"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "deposit" || transaction.type === "refund" ? "+" : "-"}
                            £{transaction.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f] whitespace-nowrap">
                          £{transaction.balance?.toFixed(2) || "0.00"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-['Poppins',sans-serif] ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {getStatusIcon(transaction.status)}
                            <span className="capitalize">{transaction.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          <span className="capitalize">
                            {transaction.paymentMethod?.replace("_", " ") || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] max-w-xs">
                          <div className="truncate" title={transaction.description || "N/A"}>
                            {transaction.description || "N/A"}
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
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                  Showing page {page} of {totalPages} ({total} total transactions)
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    variant="outline"
                    className="font-['Poppins',sans-serif]"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    variant="outline"
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
    </AdminPageLayout>
  );
}
