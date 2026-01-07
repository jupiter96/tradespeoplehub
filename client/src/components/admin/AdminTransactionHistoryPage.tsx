import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2, Search, Filter, Download, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
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

export default function AdminTransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    userId: "",
    search: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, [page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      
      if (filters.status) params.append("status", filters.status);
      if (filters.type) params.append("type", filters.type);
      if (filters.userId) params.append("userId", filters.userId);

      const response = await fetch(`${API_BASE_URL}/api/admin/wallet/transactions?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.pages || 1);
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
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger id="status-filter" className="font-['Poppins',sans-serif]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
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
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger id="type-filter" className="font-['Poppins',sans-serif]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user-search" className="font-['Poppins',sans-serif]">
                  User Email
                </Label>
                <Input
                  id="user-search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by email..."
                  className="font-['Poppins',sans-serif]"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setFilters({ status: "", type: "", userId: "", search: "" });
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
            <CardTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
              Transactions
            </CardTitle>
            <CardDescription className="font-['Poppins',sans-serif]">
              All wallet transactions across the platform
            </CardDescription>
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        User
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        Balance
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        Method
                      </th>
                      <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
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
                          <span className="capitalize">{transaction.type}</span>
                        </td>
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px]">
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
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
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
                        <td className="py-3 px-4 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] max-w-xs truncate">
                          {transaction.description || "N/A"}
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
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    className="font-['Poppins',sans-serif]"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
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

