import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveApiUrl } from "../../config/api";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Eye, Trash2 } from "lucide-react";
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

type FlaggedJob = {
  id: string;
  jobTitle: string;
  jobId: string;
  jobSlug?: string;
  reporterName: string;
  reporterRole: string;
  reason: string;
  message: string;
  createdAt: string;
};

export default function AdminFlaggedJobsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FlaggedJob[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<FlaggedJob | null>(null);
  const navigate = useNavigate();
  const totalReported = useMemo(() => items.length, [items.length]);

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    setDeletingId(reportToDelete.jobId);
    try {
      const res = await fetch(resolveApiUrl(`/api/admin/jobs/${reportToDelete.jobId}`), {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete job");
      setItems((prev) => prev.filter((x) => x.jobId !== reportToDelete.jobId));
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(resolveApiUrl("/api/admin/job-reports"), {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Failed to load flagged jobs");
        }
        const data = await res.json();
        if (cancelled) return;
        setItems(
          (data?.items || []).map((r: any) => ({
            id: r.id,
            jobTitle: r.jobTitle,
            jobId: r.jobId,
            jobSlug: r.jobSlug,
            reporterName: r.reporterName,
            reporterRole: r.reporterRole,
            reason: r.reason,
            message: r.message,
            createdAt: r.createdAt,
          }))
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load flagged jobs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold font-['Poppins',sans-serif] text-[#111827]">
            Flagged Jobs
          </h1>
          <p className="text-sm text-[#6b7280] font-['Poppins',sans-serif]">
            Jobs that have been reported by clients or professionals.
          </p>
        </div>
        <Badge className="bg-red-100 text-red-700 border border-red-200 rounded-full px-3 py-1 text-xs font-['Poppins',sans-serif]">
          {totalReported} reported
        </Badge>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Poppins',sans-serif]">
                  Job
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Poppins',sans-serif]">
                  Reporter
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Poppins',sans-serif]">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Poppins',sans-serif]">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Poppins',sans-serif]">
                  Reported At
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-sm">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500 font-['Poppins',sans-serif]">
                    Loading flagged jobs...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-red-600 font-['Poppins',sans-serif]">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500 font-['Poppins',sans-serif]">
                    No jobs have been reported yet.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 font-['Poppins',sans-serif]">
                          {item.jobTitle || "Untitled job"}
                        </span>
                        <span className="text-xs text-gray-500 font-['Poppins',sans-serif]">
                          ID: {item.jobId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-gray-900 font-['Poppins',sans-serif]">
                          {item.reporterName || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500 font-['Poppins',sans-serif] capitalize">
                          {item.reporterRole}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex max-w-xs text-xs rounded-full bg-red-50 text-red-700 border border-red-100 px-2 py-1 font-['Poppins',sans-serif]">
                        {item.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="block max-w-xs text-xs text-gray-700 font-['Poppins',sans-serif] whitespace-pre-line">
                        {item.message}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="text-xs text-gray-500 font-['Poppins',sans-serif]">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0"
                          onClick={() => {
                            if (item.jobSlug) {
                              navigate(`/job/${item.jobSlug}?tab=details`);
                            } else {
                              navigate(`/job/${item.jobId}?tab=details`);
                            }
                          }}
                          title="View job"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === item.jobId}
                          className="h-9 w-9 p-0 text-red-700 hover:bg-red-50 hover:text-red-800 disabled:opacity-60"
                          onClick={() => {
                            setReportToDelete(item);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete reported job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setReportToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Poppins',sans-serif]">Delete reported job?</AlertDialogTitle>
            <AlertDialogDescription className="font-['Poppins',sans-serif]">
              This will permanently delete the reported job. All reports for this job will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-['Poppins',sans-serif]" disabled={!!deletingId}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="font-['Poppins',sans-serif] bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
              disabled={!!deletingId}
            >
              {deletingId ? "Deleting…" : "Delete job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

