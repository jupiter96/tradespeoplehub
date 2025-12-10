import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { Search, Edit, Trash2, Plus, ChevronLeft, ChevronRight, MoreVertical, Shield, CheckCircle2, XCircle, Clock, AlertCircle, MessageCircle, Ban, StarOff, FileText, Circle, Sparkles, User, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import AdminVerificationModal from "./AdminVerificationModal";
import { useMessenger } from "../MessengerContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import API_BASE_URL from "../../config/api";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  postcode?: string;
  townCity?: string;
  address?: string;
  tradingName?: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isBlocked?: boolean;
  blockReviewInvitation?: boolean;
  adminNotes?: string;
  viewedByAdmin?: boolean;
  googleId?: string | null;
  facebookId?: string | null;
  [key: string]: any;
}

interface AdminUsersTableProps {
  role?: "client" | "professional" | "admin" | "subadmin";
  title: string;
  onCreateNew?: () => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  showVerification?: boolean;
}

export interface AdminUsersTableRef {
  refresh: () => void;
}

const AdminUsersTable = forwardRef<AdminUsersTableRef, AdminUsersTableProps>(({
  role,
  title,
  onCreateNew,
  onEdit,
  onDelete,
  showVerification = false,
}, ref) => {
  const navigate = useNavigate();
  const { startConversation } = useMessenger();
  const [selectedUserForVerification, setSelectedUserForVerification] = useState<User | null>(null);
  const [selectedUserForNote, setSelectedUserForNote] = useState<User | null>(null);
  const [noteText, setNoteText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [verificationStatuses, setVerificationStatuses] = useState<Record<string, any>>({});
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
        ...(role && { role }),
        ...(searchTerm && { search: searchTerm }),
      });

      // Check if this is the deleted accounts page
      if (isDeletedAccountsPage) {
        params.append("deleted", "true");
      }

      const endpoint = role === "subadmin" ? "/api/admin/admins" : "/api/admin/users";
      const response = await fetch(`${API_BASE_URL}${endpoint}?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      let usersData = role === "subadmin" ? data.admins : data.users;
      
      // Normalize subadmin data: map fullname to name for consistency
      if (role === "subadmin" && usersData) {
        usersData = usersData.map((admin: any) => ({
          ...admin,
          name: admin.fullname || admin.name || "",
          // Ensure all fields are properly mapped
          email: admin.email || "",
          role: admin.role || "subadmin",
          permissions: admin.permissions || [],
          avatar: admin.avatar || null,
        }));
      }
      
      setUsers(usersData || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);

      // Fetch verification statuses for professionals
      if (showVerification && role === "professional" && usersData.length > 0) {
        const verificationPromises = usersData.map(async (user: User) => {
          try {
            const verResponse = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}/verification`, {
              credentials: "include",
            });
            if (verResponse.ok) {
              const verData = await verResponse.json();
              return { userId: user.id, verification: verData.verification };
            }
          } catch (error) {
            console.error(`Error fetching verification for user ${user.id}:`, error);
          }
          return { userId: user.id, verification: null };
        });

        const verificationResults = await Promise.all(verificationPromises);
        const statusMap: Record<string, any> = {};
        verificationResults.forEach((result) => {
          statusMap[result.userId] = result.verification;
        });
        setVerificationStatuses(statusMap);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, role, limit, sortBy, sortOrder, searchTerm, showVerification]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchUsers();
    },
  }));

  // Combined effect to handle both regular updates and search debouncing
  // This prevents duplicate API calls on initial load
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, searchTerm ? 500 : 0); // No debounce for initial load, 500ms for search

    return () => clearTimeout(debounceTimer);
  }, [fetchUsers, searchTerm]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const SortableHeader = ({ column, label }: { column: string; label: string }) => {
    const isActive = sortBy === column;
    return (
      <TableHead 
        className="text-[#FE8A0F] font-semibold cursor-pointer hover:bg-[#FE8A0F]/5 select-none"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {isActive ? (
            sortOrder === "asc" ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-50" />
          )}
        </div>
      </TableHead>
    );
  };

  const handleRestore = async (user: User) => {
    if (!confirm(`Are you sure you want to restore ${user.name}?`)) {
      return;
    }

    try {
      const endpoint = `/api/admin/users/${user.id}/restore`;
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(fullUrl, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Ignore parse error
        }
        throw new Error(`Failed to restore user: ${response.status} - ${errorData?.error || errorText}`);
      }

      const responseData = await response.json();
      toast.success("User restored successfully");
      fetchUsers();
      onDelete?.(user);
    } catch (error) {
      console.error("[handleRestore] ERROR:", error);
      toast.error(error instanceof Error ? error.message : "Failed to restore user");
    }
  };

  const handleDelete = async (user: User) => {
    // If this is the deleted accounts page, use permanent delete
    if (isDeletedAccountsPage) {
      if (!confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone and the user will be able to register again.`)) {
        return;
      }

      try {
        const endpoint = `/api/admin/users/${user.id}/permanent`;
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        
        const response = await fetch(fullUrl, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            // Ignore parse error
          }
          throw new Error(`Failed to permanently delete user: ${response.status} - ${errorData?.error || errorText}`);
        }

        toast.success("User permanently deleted successfully");
        fetchUsers();
        onDelete?.(user);
      } catch (error) {
        console.error("[handleDelete] ERROR:", error);
        toast.error(error instanceof Error ? error.message : "Failed to permanently delete user");
      }
      return;
    }

    // Regular soft delete for non-deleted accounts page
    console.log("[handleDelete] TRIGGERED - User:", user);
    console.log("[handleDelete] User ID:", user.id);
    console.log("[handleDelete] User Role:", user.role);
    console.log("[handleDelete] Component Role:", role);
    
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      console.log("[handleDelete] User cancelled deletion");
      return;
    }

    console.log("[handleDelete] User confirmed deletion, proceeding...");

    try {
      const endpoint = role === "subadmin" ? `/api/admin/admins/${user.id}` : `/api/admin/users/${user.id}`;
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      console.log("[handleDelete] DELETE Request URL:", fullUrl);
      console.log("[handleDelete] API_BASE_URL:", API_BASE_URL);
      console.log("[handleDelete] Endpoint:", endpoint);
      
      const response = await fetch(fullUrl, {
        method: "DELETE",
        credentials: "include",
      });

      console.log("[handleDelete] Response Status:", response.status);
      console.log("[handleDelete] Response OK:", response.ok);
      console.log("[handleDelete] Response Headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[handleDelete] Response not OK - Status:", response.status);
        console.error("[handleDelete] Response Error Text:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error("[handleDelete] Response Error Data:", errorData);
        } catch (e) {
          console.error("[handleDelete] Could not parse error response as JSON");
        }
        
        throw new Error(`Failed to delete user: ${response.status} - ${errorData?.error || errorText}`);
      }

      const responseData = await response.json();
      console.log("[handleDelete] SUCCESS - Response Data:", responseData);

      toast.success("User deleted successfully");
      console.log("[handleDelete] Calling fetchUsers() to refresh list");
      fetchUsers();
      console.log("[handleDelete] Calling onDelete callback");
      onDelete?.(user);
    } catch (error) {
      console.error("[handleDelete] ERROR CAUGHT:", error);
      console.error("[handleDelete] Error Type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("[handleDelete] Error Message:", error instanceof Error ? error.message : String(error));
      console.error("[handleDelete] Error Stack:", error instanceof Error ? error.stack : "No stack trace");
      toast.error("Failed to delete user");
    }
  };

  const handleSendMessage = (user: User) => {
    try {
      startConversation({
        id: user.id,
        name: user.name || `${user.firstName} ${user.lastName}`.trim(),
        avatar: user.avatar,
        role: user.role,
      });
      toast.success(`Opening conversation with ${user.name || `${user.firstName} ${user.lastName}`.trim()}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to open conversation");
    }
  };

  const handleBlock = async (user: User) => {
    const isCurrentlyBlocked = user.isBlocked || false;
    if (!confirm(`Are you sure you want to ${isCurrentlyBlocked ? 'unblock' : 'block'} ${user.name}?`)) {
      return;
    }

    try {
      const endpoint = `/api/admin/users/${user.id}/block`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isBlocked: !isCurrentlyBlocked,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update block status");
      }

      toast.success(`User ${isCurrentlyBlocked ? 'unblocked' : 'blocked'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update block status");
    }
  };

  const handleBlockReviewInvitation = async (user: User) => {
    const isCurrentlyBlocked = user.blockReviewInvitation || false;
    if (!confirm(`Are you sure you want to ${isCurrentlyBlocked ? 'allow' : 'block'} review invitations for ${user.name}?`)) {
      return;
    }

    try {
      const endpoint = `/api/admin/users/${user.id}/block-review-invitation`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blockReviewInvitation: !isCurrentlyBlocked,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update review invitation block status");
      }

      toast.success(`Review invitation ${isCurrentlyBlocked ? 'allowed' : 'blocked'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error blocking review invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update review invitation block status");
    }
  };

  const handleViewNote = async (user: User) => {
    try {
      // Fetch user data to get current note
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      setNoteText(data.user.adminNotes || "");
      setSelectedUserForNote(user);
    } catch (error) {
      console.error("Error fetching user note:", error);
      toast.error("Failed to fetch user note");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedUserForNote) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUserForNote.id}/note`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminNotes: noteText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save note");
      }

      toast.success("Note saved successfully");
      setSelectedUserForNote(null);
      setNoteText("");
      fetchUsers();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save note");
    }
  };

  const handleMarkAsViewed = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/viewed`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark user as viewed");
      }

      // Update the user in the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, viewedByAdmin: true } : user
        )
      );
    } catch (error: any) {
      console.error("Error marking user as viewed:", error);
      toast.error(error.message || "Failed to mark user as viewed");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const truncateText = (text: string | undefined | null, maxLength: number = 25): string => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
      case "professional":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      case "client":
        return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20";
    }
  };

  const getPendingVerificationCount = (userId: string) => {
    const verification = verificationStatuses[userId];
    if (!verification) return 0;

    let count = 0;
    const documentTypes = ['address', 'idCard', 'publicLiabilityInsurance'];
    documentTypes.forEach(type => {
      const doc = verification[type];
      // Only count documents that have documentUrl and are pending
      // documentUrl must exist to show count badge
      if (doc?.status === 'pending' && doc?.documentUrl) {
        count++;
      }
    });
    return count;
  };

  const getVerificationStatus = (userId: string) => {
    const verification = verificationStatuses[userId];
    if (!verification) return null;

    // Calculate overall verification status
    const verificationTypes = ['email', 'phone', 'address', 'idCard', 'paymentMethod', 'publicLiabilityInsurance'];
    const statuses = verificationTypes.map(type => verification[type]?.status || 'not-started');
    
    // Priority: verified > pending > rejected > not-started
    if (statuses.some(s => s === 'verified' || s === 'completed')) {
      return 'verified';
    } else if (statuses.some(s => s === 'pending')) {
      return 'pending';
    } else if (statuses.some(s => s === 'rejected')) {
      return 'rejected';
    }
    return 'not-started';
  };

  const getVerificationIcon = (status: string | null) => {
    if (!status) {
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
    
    switch (status) {
      case 'verified':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getVerificationTooltip = (status: string | null) => {
    if (!status) return "Verification status not available";
    
    switch (status) {
      case 'verified':
      case 'completed':
        return "Verified";
      case 'pending':
        return "Pending Review";
      case 'rejected':
        return "Rejected";
      default:
        return "Not Started";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Controls - All in one row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-black dark:text-white whitespace-nowrap">
            Total: <span className="text-[#FE8A0F] font-semibold">{total}</span> {title.toLowerCase()}
          </p>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 dark:text-white/50" />
          <Input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="rows-per-page" className="text-sm text-black dark:text-white whitespace-nowrap">
            Rows per page:
          </Label>
          <Select value={limit.toString()} onValueChange={(value) => {
            setLimit(parseInt(value));
            setPage(1);
          }}>
            <SelectTrigger id="rows-per-page" className="w-20 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black border-0 shadow-xl shadow-gray-300 dark:shadow-gray-900">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {onCreateNew && (
          <div className="ml-auto">
            <Button
              onClick={onCreateNew}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white border-0 shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-3xl border-0 bg-white dark:bg-black p-6 shadow-xl shadow-[#FE8A0F]/20">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-black dark:text-white">Loading...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black dark:text-white">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent shadow-sm">
                  <SortableHeader column="name" label="Name" />
                  <SortableHeader column="email" label="Email" />
                  {role === "professional" && (
                    <SortableHeader column="tradingName" label="Trading Name" />
                  )}
                  {role !== "subadmin" && (
                    <SortableHeader column="phone" label="Phone" />
                  )}
                  <TableHead className="text-[#FE8A0F] font-semibold">Status</TableHead>
                  {role !== "subadmin" && (
                    <TableHead className="text-[#FE8A0F] font-semibold">Location</TableHead>
                  )}
                  {role === "subadmin" && (
                    <TableHead className="text-[#FE8A0F] font-semibold">Permissions</TableHead>
                  )}
                  <SortableHeader column="createdAt" label="Joined" />
                  <TableHead className="text-[#FE8A0F] font-semibold text-center">Login Method</TableHead>
                  {showVerification && role === "professional" && (
                    <TableHead className="text-[#FE8A0F] font-semibold text-center">Verification</TableHead>
                  )}
                  <TableHead className="text-[#FE8A0F] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-0 hover:bg-[#FE8A0F]/5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <TableCell className="text-black dark:text-white font-medium">
                      <div className="flex items-center gap-2">
                        <span className="truncate" title={user.name || `${user.firstName} ${user.lastName}`.trim()}>
                          {truncateText(user.name || `${user.firstName} ${user.lastName}`.trim())}
                        </span>
                        {(() => {
                          // Check if user has verification documents
                          const hasVerificationDocuments = (() => {
                            if (role !== "professional" || !showVerification) return false;
                            const verification = verificationStatuses[user.id];
                            if (!verification) return false;
                            
                            // Check if any verification document exists (pending status with documentUrl)
                            const documentTypes = ['address', 'idCard', 'publicLiabilityInsurance'];
                            return documentTypes.some(type => {
                              const doc = verification[type];
                              // Document must have documentUrl and be pending to show verify badge
                              return doc && doc.documentUrl && doc.status === 'pending';
                            });
                          })();
                          
                          // Show verify badge if verification documents exist (pending with documentUrl)
                          // viewedByAdmin only affects count badges, not the verify badge itself
                          if (hasVerificationDocuments) {
                            return (
                              <Badge
                                className="bg-red-500 hover:bg-red-600 text-white border-0 flex items-center gap-1 px-2 py-0.5 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsViewed(user.id);
                                  setSelectedUserForVerification(user);
                                }}
                                title="Click to view verification documents"
                              >
                                <Shield className="w-3 h-3" />
                                Verify
                              </Badge>
                            );
                          } else if (!hasVerificationDocuments && !user.viewedByAdmin) {
                            return (
                              <Badge
                                className="bg-blue-500 hover:bg-blue-600 text-white border-0 flex items-center gap-1 px-2 py-0.5 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsViewed(user.id);
                                }}
                                title="Click to mark as viewed"
                              >
                                <Sparkles className="w-3 h-3" />
                                New
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      <span className="truncate block" title={user.email}>
                        {truncateText(user.email)}
                      </span>
                    </TableCell>
                    {role === "professional" && (
                      <TableCell className="text-black dark:text-white">
                        <span className="truncate block" title={user.tradingName || "-"}>
                          {truncateText(user.tradingName)}
                        </span>
                      </TableCell>
                    )}
                    {role !== "subadmin" && (
                      <TableCell className="text-black dark:text-white">
                        <span className="truncate block" title={user.phone}>
                          {truncateText(user.phone)}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      {(() => {
                        const isBlocked = user.isBlocked || false;
                        if (isBlocked) {
                          return (
                            <Badge 
                              variant="destructive" 
                              className="bg-red-500 hover:bg-red-600 text-white border-0 flex items-center gap-1.5 px-2.5 py-1 w-fit"
                            >
                              <Ban className="w-3 h-3" />
                              Blocked
                            </Badge>
                          );
                        }
                        return (
                          <Badge 
                            className="bg-green-500 hover:bg-green-600 text-white border-0 flex items-center gap-1.5 px-2.5 py-1 w-fit"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    {role !== "subadmin" && (
                      <TableCell className="text-black dark:text-white max-w-[200px]">
                        {(() => {
                          const addressParts = [];
                          if (user.address) addressParts.push(user.address);
                          if (user.townCity) addressParts.push(user.townCity);
                          if (user.postcode) addressParts.push(user.postcode);
                          if (addressParts.length > 0) {
                            const fullAddress = addressParts.join(", ");
                            return (
                              <span className="text-xs leading-tight truncate block" title={fullAddress}>
                                {truncateText(fullAddress, 25)}
                              </span>
                            );
                          }
                          return "-";
                        })()}
                      </TableCell>
                    )}
                    {role === "subadmin" && (
                      <TableCell className="text-black dark:text-white max-w-[300px]">
                        {user.permissions && user.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.slice(0, 3).map((permission: string, idx: number) => (
                              <Badge
                                key={idx}
                                className="bg-[#FE8A0F]/10 text-[#FE8A0F] border border-[#FE8A0F]/20 text-xs px-2 py-0.5"
                              >
                                {permission.replace(/-/g, " ")}
                              </Badge>
                            ))}
                            {user.permissions.length > 3 && (
                              <Badge className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20 text-xs px-2 py-0.5">
                                +{user.permissions.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-black dark:text-white">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {user.googleId && (
                          <div className="flex items-center gap-1" title="Google Login">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-xs text-[#4285F4] font-medium">Google</span>
                          </div>
                        )}
                        {user.facebookId && (
                          <div className="flex items-center gap-1" title="Facebook Login">
                            <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className="text-xs text-[#1877F2] font-medium">Facebook</span>
                          </div>
                        )}
                        {!user.googleId && !user.facebookId && (
                          <span className="text-xs text-gray-400">Email</span>
                        )}
                      </div>
                    </TableCell>
                    {showVerification && role === "professional" && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleMarkAsViewed(user.id);
                              setSelectedUserForVerification(user);
                            }}
                            className="h-8 w-8 hover:bg-[#FE8A0F]/10 relative"
                            title={getVerificationTooltip(getVerificationStatus(user.id))}
                          >
                            {getVerificationIcon(getVerificationStatus(user.id))}
                            {getPendingVerificationCount(user.id) > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                {getPendingVerificationCount(user.id)}
                              </span>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-black dark:text-white hover:bg-[#FE8A0F]/10"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-black border-0 shadow-xl shadow-gray-300 dark:shadow-gray-900">
                          {onEdit && (
                            <DropdownMenuItem
                              onClick={() => {
                                handleMarkAsViewed(user.id);
                                onEdit(user);
                              }}
                              className="text-black dark:text-white hover:bg-[#FE8A0F]/10 cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {showVerification && role === "professional" && (
                            <DropdownMenuItem
                              onClick={() => {
                                handleMarkAsViewed(user.id);
                                setSelectedUserForVerification(user);
                              }}
                              className="text-[#FE8A0F] dark:text-[#FE8A0F] hover:bg-[#FE8A0F]/10 cursor-pointer"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              <span className="flex-1">View Verification</span>
                              {getPendingVerificationCount(user.id) > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-5 flex items-center justify-center px-1.5">
                                  {getPendingVerificationCount(user.id)}
                                </span>
                              )}
                            </DropdownMenuItem>
                          )}
                          {role === "client" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleSendMessage(user)}
                                className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleBlock(user)}
                                className={(user.isBlocked || false)
                                  ? "text-green-600 dark:text-green-400 hover:bg-green-500/10 cursor-pointer"
                                  : "text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 cursor-pointer"
                                }
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                {(user.isBlocked || false) ? "Unblock" : "Block"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleViewNote(user)}
                                className="text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Note
                              </DropdownMenuItem>
                            </>
                          )}
                          {role === "professional" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  // Use user ID for profile URL
                                  const profileUrl = `${window.location.origin}/profile/${user.id}`;
                                  window.open(profileUrl, '_blank');
                                }}
                                className="text-[#FE8A0F] dark:text-[#FE8A0F] hover:bg-[#FE8A0F]/10 cursor-pointer"
                              >
                                <User className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSendMessage(user)}
                                className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleBlock(user)}
                                className={(user.isBlocked || false)
                                  ? "text-green-600 dark:text-green-400 hover:bg-green-500/10 cursor-pointer"
                                  : "text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 cursor-pointer"
                                }
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                {(user.isBlocked || false) ? "Unblock" : "Block"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleBlockReviewInvitation(user)}
                                className={(user.blockReviewInvitation || false)
                                  ? "text-green-600 dark:text-green-400 hover:bg-green-500/10 cursor-pointer"
                                  : "text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 cursor-pointer"
                                }
                              >
                                <StarOff className="h-4 w-4 mr-2" />
                                {(user.blockReviewInvitation || false) ? "Allow Review Invitation" : "Block Review Invitation"}
                              </DropdownMenuItem>
                            </>
                          )}
                          {isDeletedAccountsPage && (
                            <DropdownMenuItem
                              onClick={() => handleRestore(user)}
                              className="text-green-600 dark:text-green-400 hover:bg-green-500/10 cursor-pointer"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(user)}
                              className="text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isDeletedAccountsPage ? "Permanently Delete" : "Delete"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Verification Modal */}
        {selectedUserForVerification && (
          <AdminVerificationModal
            open={!!selectedUserForVerification}
            onClose={() => {
              setSelectedUserForVerification(null);
              // Refresh verification statuses after modal closes
              if (showVerification && role === "professional") {
                fetchUsers();
              }
            }}
            userId={selectedUserForVerification.id}
            userName={selectedUserForVerification.name || `${selectedUserForVerification.firstName} ${selectedUserForVerification.lastName}`.trim()}
            onOpen={() => {
              // Mark as viewed when modal opens
              if (selectedUserForVerification) {
                handleMarkAsViewed(selectedUserForVerification.id);
              }
            }}
          />
        )}

        {/* Note Modal */}
        <Dialog open={!!selectedUserForNote} onOpenChange={(open) => {
          if (!open) {
            setSelectedUserForNote(null);
            setNoteText("");
          }
        }}>
          <DialogContent className="bg-white dark:bg-black border-0 shadow-2xl shadow-gray-400 dark:shadow-gray-950">
            <DialogHeader>
              <DialogTitle className="text-[#FE8A0F]">
                {selectedUserForNote ? `Note for ${selectedUserForNote.name || `${selectedUserForNote.firstName} ${selectedUserForNote.lastName}`.trim()}` : "User Note"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="note" className="text-black dark:text-white">
                  Admin Notes
                </Label>
                <Textarea
                  id="note"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add notes about this user..."
                  className="mt-2 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 min-h-[200px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedUserForNote(null);
                  setNoteText("");
                }}
                className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNote}
                className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white border-0 shadow-lg shadow-[#FE8A0F]/40 hover:shadow-xl hover:shadow-[#FE8A0F]/50 transition-all"
              >
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-0 shadow-sm">
            <p className="text-sm text-black dark:text-white">
              Page <span className="text-[#FE8A0F] font-semibold">{page}</span> of <span className="text-[#FE8A0F] font-semibold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-[#FE8A0F] hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-[#FE8A0F] hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

AdminUsersTable.displayName = "AdminUsersTable";

export default AdminUsersTable;

