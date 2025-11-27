import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { Search, Edit, Trash2, Plus, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
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

const API_BASE_URL = "https://tradespeoplehub.vercel.app";
// const API_BASE_URL = "http://localhost:5000";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  postcode?: string;
  townCity?: string;
  createdAt: string;
  [key: string]: any;
}

interface AdminUsersTableProps {
  role?: "client" | "professional" | "admin";
  title: string;
  onCreateNew?: () => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
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
}, ref) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(role && { role }),
        ...(searchTerm && { search: searchTerm }),
      });

      const endpoint = role === "admin" ? "/api/admin/admins" : "/api/admin/users";
      const response = await fetch(`${API_BASE_URL}${endpoint}?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      const usersData = role === "admin" ? data.admins : data.users;
      setUsers(usersData || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchUsers();
    },
  }));

  useEffect(() => {
    fetchUsers();
  }, [page, role]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (page === 1) {
        fetchUsers();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      const endpoint = role === "admin" ? `/api/admin/admins/${user.id}` : `/api/admin/users/${user.id}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      fetchUsers();
      onDelete?.(user);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#FE8A0F]">{title}</h2>
          <p className="text-sm text-black dark:text-white mt-1">
            Total: <span className="text-[#FE8A0F] font-semibold">{total}</span> {title.toLowerCase()}
          </p>
        </div>
        {onCreateNew && (
          <Button
            onClick={onCreateNew}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 dark:text-white/50" />
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
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
                <TableRow className="border-[#FE8A0F]/30 hover:bg-transparent">
                  <TableHead className="text-[#FE8A0F] font-semibold">Name</TableHead>
                  <TableHead className="text-[#FE8A0F] font-semibold">Email</TableHead>
                  <TableHead className="text-[#FE8A0F] font-semibold">Phone</TableHead>
                  <TableHead className="text-[#FE8A0F] font-semibold">Role</TableHead>
                  <TableHead className="text-[#FE8A0F] font-semibold">Location</TableHead>
                  <TableHead className="text-[#FE8A0F] font-semibold">Joined</TableHead>
                  <TableHead className="text-[#FE8A0F] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-[#FE8A0F]/30 hover:bg-[#FE8A0F]/5"
                  >
                    <TableCell className="text-black dark:text-white font-medium">
                      {user.name || `${user.firstName} ${user.lastName}`.trim()}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {user.phone}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#FE8A0F] text-white border-[#FE8A0F]">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {user.postcode || user.townCity || "-"}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {formatDate(user.createdAt)}
                    </TableCell>
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
                        <DropdownMenuContent align="end" className="bg-white dark:bg-black border-[#FE8A0F]">
                          {onEdit && (
                            <DropdownMenuItem
                              onClick={() => onEdit(user)}
                              className="text-black dark:text-white hover:bg-[#FE8A0F]/10 cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(user)}
                              className="text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#FE8A0F]/30">
            <p className="text-sm text-black dark:text-white">
              Page <span className="text-[#FE8A0F] font-semibold">{page}</span> of <span className="text-[#FE8A0F] font-semibold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10 disabled:opacity-50"
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

