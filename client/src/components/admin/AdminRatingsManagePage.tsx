import React, { useState, useEffect, useCallback } from "react";
import { Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Star, Pencil, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { toast } from "sonner";

export interface AdminRatingRow {
  id: string;
  type: "client_to_pro" | "pro_to_client";
  orderId: string;
  orderNumber: string;
  ratedById: string | undefined;
  ratedByName: string;
  ratedToId: string | undefined;
  ratedToName: string;
  rating: number;
  comment: string;
  serviceTitle: string;
  createdAt: string;
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

function RatingStars({ value }: { value: number }) {
  const n = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 shrink-0 ${i <= n ? "fill-[#FE8A0F] text-[#FE8A0F]" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </span>
  );
}

const RATED_BY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "client", label: "Rated by Client" },
  { value: "professional", label: "Rated by Professional" },
];

export default function AdminRatingsManagePage() {
  useAdminRouteGuard();
  const [ratings, setRatings] = useState<AdminRatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratedByFilter, setRatedByFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminRatingRow | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<AdminRatingRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 20;

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      params.append("sortBy", sortField);
      params.append("sortOrder", sortDirection);
      if (ratedByFilter) params.append("ratedBy", ratedByFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const response = await fetch(resolveApiUrl(`/api/admin/ratings?${params.toString()}`), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
        setTotalPages(data.totalPages ?? 1);
        setTotalCount(data.totalCount ?? 0);
      } else {
        toast.error("Failed to fetch ratings");
        setRatings([]);
      }
    } catch {
      toast.error("Error fetching ratings");
      setRatings([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortField, sortDirection, ratedByFilter, searchQuery]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, ratedByFilter]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

  const openEdit = (row: AdminRatingRow) => {
    setEditingRow(row);
    setEditRating(row.rating);
    setEditComment(row.comment || "");
    setEditModalOpen(true);
  };

  const closeEdit = () => {
    setEditModalOpen(false);
    setEditingRow(null);
    setEditRating(0);
    setEditComment("");
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    const rating = Math.max(0, Math.min(5, Math.round(editRating)));
    setSaving(true);
    try {
      const response = await fetch(resolveApiUrl(`/api/admin/ratings/${encodeURIComponent(editingRow.id)}`), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: editComment.trim() }),
      });
      if (response.ok) {
        toast.success("Rating updated");
        closeEdit();
        fetchRatings();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to update rating");
      }
    } catch {
      toast.error("Failed to update rating");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (row: AdminRatingRow) => {
    setRowToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(resolveApiUrl(`/api/admin/ratings/${encodeURIComponent(rowToDelete.id)}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("Rating deleted");
        closeDeleteConfirm();
        fetchRatings();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to delete rating");
      }
    } catch {
      toast.error("Failed to delete rating");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminPageLayout
      title="Ratings Manage"
      description="Edit or delete ratings and reviews from completed orders. Sort, search, and filter by who gave the rating."
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, comment, service title, or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              className="pl-10 border-gray-300 focus:border-[#FE8A0F] focus:ring-[#FE8A0F]"
            />
          </div>
          <select
            value={ratedByFilter}
            onChange={(e) => {
              setRatedByFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:border-[#FE8A0F] focus:ring-[#FE8A0F]"
          >
            {RATED_BY_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#FE8A0F] font-semibold w-12">No</TableHead>
                    <SortableHeader
                      column="ratedByName"
                      label="Rated By"
                      currentSort={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      column="ratedToName"
                      label="Rated To"
                      currentSort={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      column="rating"
                      label="Ratings"
                      currentSort={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      column="serviceTitle"
                      label="Service Title"
                      currentSort={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead className="text-[#FE8A0F] font-semibold">Comment</TableHead>
                    <TableHead className="text-[#FE8A0F] font-semibold w-28">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No ratings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ratings.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-gray-700">
                          {(page - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell>{row.ratedByName || "—"}</TableCell>
                        <TableCell>{row.ratedToName || "—"}</TableCell>
                        <TableCell>
                          <RatingStars value={row.rating} />
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={row.serviceTitle}>
                          {row.serviceTitle || "—"}
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <span className="line-clamp-2" title={row.comment || ""}>
                            {row.comment || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(row)}
                              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteConfirm(row)}
                              className="border-red-500 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif]">Edit Rating</DialogTitle>
          </DialogHeader>
          {editingRow && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Order: {editingRow.orderNumber} · {editingRow.ratedByName} → {editingRow.ratedToName}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1–5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditRating(n)}
                      className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#FE8A0F]"
                    >
                      <Star
                        className={`w-8 h-8 ${n <= editRating ? "fill-[#FE8A0F] text-[#FE8A0F]" : "fill-gray-200 text-gray-200"}`}
                      />
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={editRating}
                  onChange={(e) => setEditRating(parseFloat(e.target.value) || 0)}
                  className="mt-2 w-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#FE8A0F] focus:ring-[#FE8A0F] font-['Poppins',sans-serif] text-sm"
                  placeholder="Review text..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-[#FE8A0F] hover:bg-[#FFB347]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => !open && closeDeleteConfirm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif]">Delete Rating</DialogTitle>
          </DialogHeader>
          {rowToDelete && (
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this rating from {rowToDelete.ratedByName} to {rowToDelete.ratedToName}? This cannot be undone.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteConfirm} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
