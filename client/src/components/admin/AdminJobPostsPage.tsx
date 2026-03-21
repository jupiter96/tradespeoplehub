import React, { useState, useEffect } from "react";
import { Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { toast } from "sonner";

interface AdminJob {
  id: string;
  slug?: string;
  title: string;
  description: string;
  clientName: string;
  postcode: string;
  status: string;
  budgetAmount: number;
  budgetMin?: number | null;
  budgetMax?: number | null;
  categoryLabels: string[];
  categorySlugs: string[];
  postedAt: string | null;
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

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "awaiting-accept", label: "Awaiting Accept" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "closed", label: "Closed" },
];

const SORT_FIELDS: { value: string; label: string }[] = [
  { value: "postedAt", label: "Create date" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "budgetAmount", label: "Price" },
  { value: "postcode", label: "Postcode" },
];

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    open: "bg-green-100 text-green-700 border-green-200",
    "awaiting-accept": "bg-amber-100 text-amber-700 border-amber-200",
    "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    closed: "bg-gray-100 text-gray-700 border-gray-300",
  };
  return map[status] || "bg-gray-100 text-gray-700 border-gray-200";
}

export default function AdminJobPostsPage() {
  useAdminRouteGuard();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("postedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<AdminJob | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    postcode: "",
    address: "",
    location: "",
    status: "",
    budgetAmount: "",
    budgetMin: "",
    budgetMax: "",
  });
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<AdminJob | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(resolveApiUrl(`/api/admin/jobs?${params.toString()}`), {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotalPages(data.totalPages ?? 1);
        setTotalCount(data.totalCount ?? 0);
      } else {
        toast.error("Failed to fetch jobs");
        setJobs([]);
      }
    } catch {
      toast.error("Error fetching jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, sortBy, sortOrder, statusFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

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

  const openEdit = (job: AdminJob) => {
    setEditingJob(job);
    setEditForm({
      title: job.title,
      description: job.description,
      postcode: job.postcode || "",
      address: "",
      location: "",
      status: job.status,
      budgetAmount: String(job.budgetAmount ?? ""),
      budgetMin: job.budgetMin != null ? String(job.budgetMin) : "",
      budgetMax: job.budgetMax != null ? String(job.budgetMax) : "",
    });
    setEditModalOpen(true);
  };

  const fetchJobForEdit = async (id: string) => {
    try {
      const res = await fetch(resolveApiUrl(`/api/admin/jobs/${id}`), { credentials: "include" });
      if (res.ok) {
        const j = await res.json();
        setEditForm({
          title: j.title || "",
          description: j.description || "",
          postcode: j.postcode || "",
          address: j.address || "",
          location: j.location || "",
          status: j.status || "open",
          budgetAmount: j.budgetAmount != null ? String(j.budgetAmount) : "",
          budgetMin: j.budgetMin != null ? String(j.budgetMin) : "",
          budgetMax: j.budgetMax != null ? String(j.budgetMax) : "",
        });
      }
    } catch {
      toast.error("Failed to load job details");
    }
  };

  useEffect(() => {
    if (editModalOpen && editingJob) {
      fetchJobForEdit(editingJob.id);
    }
  }, [editModalOpen, editingJob?.id]);

  const handleSaveEdit = async () => {
    if (!editingJob) return;
    setSaving(true);
    try {
      const res = await fetch(resolveApiUrl(`/api/admin/jobs/${editingJob.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          postcode: editForm.postcode.trim(),
          address: editForm.address.trim(),
          location: editForm.location.trim(),
          status: editForm.status || "open",
          budgetAmount: editForm.budgetAmount ? Number(editForm.budgetAmount) : undefined,
          budgetMin: editForm.budgetMin ? Number(editForm.budgetMin) : undefined,
          budgetMax: editForm.budgetMax ? Number(editForm.budgetMax) : undefined,
        }),
      });
      if (res.ok) {
        toast.success("Job updated");
        setEditModalOpen(false);
        setEditingJob(null);
        fetchJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update job");
      }
    } catch {
      toast.error("Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (job: AdminJob) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(resolveApiUrl(`/api/admin/jobs/${jobToDelete.id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Job deleted");
        setDeleteDialogOpen(false);
        setJobToDelete(null);
        fetchJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete job");
      }
    } catch {
      toast.error("Failed to delete job");
    } finally {
      setDeleting(false);
    }
  };

  const truncate = (str: string, maxLen: number) => {
    if (!str) return "—";
    const s = String(str).trim();
    return s.length <= maxLen ? s : s.slice(0, maxLen) + "...";
  };

  return (
    <AdminPageLayout
      title="Job Status"
      description="View and manage all job status. Search, filter, sort, edit or delete jobs."
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title, description, postcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-md min-w-[160px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
              <span>Loading jobs...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No jobs found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      column="id"
                      label="Job ID"
                      currentSort={sortBy}
                      sortDirection={sortOrder}
                      onSort={handleSort}
                    />
                    <TableHead className="text-[#FE8A0F] font-semibold">Client name</TableHead>
                    <TableHead className="text-[#FE8A0F] font-semibold">Job title</TableHead>
                    <TableHead className="text-[#FE8A0F] font-semibold">Description</TableHead>
                    <SortableHeader
                      column="budgetAmount"
                      label="Price"
                      currentSort={sortBy}
                      sortDirection={sortOrder}
                      onSort={handleSort}
                    />
                    <TableHead className="text-[#FE8A0F] font-semibold">Postcode</TableHead>
                    <SortableHeader
                      column="postedAt"
                      label="Create date"
                      currentSort={sortBy}
                      sortDirection={sortOrder}
                      onSort={handleSort}
                    />
                    <TableHead className="text-[#FE8A0F] font-semibold">Status</TableHead>
                    <TableHead className="text-[#FE8A0F] font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">{job.id.slice(-8)}</TableCell>
                      <TableCell>{job.clientName || "—"}</TableCell>
                      <TableCell title={job.title}>
                        {truncate(job.title, 25)}
                      </TableCell>
                      <TableCell title={job.description}>
                        {truncate(job.description || "", 25)}
                      </TableCell>
                      <TableCell>£{Number(job.budgetAmount ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{job.postcode || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(job.postedAt || job.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClass(job.status)}`}
                        >
                          {job.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(job)}
                            className="text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDelete(job)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
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

      {/* Edit modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>Update job details. Only editable fields are shown.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Job title"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <textarea
                className="min-h-[120px] w-full px-3 py-2 border rounded-md text-sm"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Job description"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Postcode</Label>
                <Input
                  value={editForm.postcode}
                  onChange={(e) => setEditForm((f) => ({ ...f, postcode: e.target.value }))}
                  placeholder="Postcode"
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Address"
              />
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Location"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Budget amount (£)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.budgetAmount}
                  onChange={(e) => setEditForm((f) => ({ ...f, budgetAmount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label>Budget min (£)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.budgetMin}
                  onChange={(e) => setEditForm((f) => ({ ...f, budgetMin: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label>Budget max (£)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.budgetMax}
                  onChange={(e) => setEditForm((f) => ({ ...f, budgetMax: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-[#FE8A0F] hover:bg-[#e57d0e]">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job &quot;{jobToDelete?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
}
