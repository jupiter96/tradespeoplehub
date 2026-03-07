import React, { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, DollarSign } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { toast } from "sonner";

interface JobBudgetRangeRow {
  id: string;
  min: number;
  max: number;
  order: number;
  createdAt: string | null;
}

function formatLabel(min: number, max: number): string {
  if (max >= 500000) return `Over £${(min / 1000).toFixed(0)}k`;
  if (min === 0) return `Under £${max.toLocaleString()}`;
  return `£${min.toLocaleString()} - £${max.toLocaleString()}`;
}

export default function AdminJobAmountPage() {
  useAdminRouteGuard();
  const [ranges, setRanges] = useState<JobBudgetRangeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const fetchRanges = async () => {
    setLoading(true);
    try {
      const res = await fetch(resolveApiUrl("/api/admin/job-budget-ranges"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRanges(data.ranges || []);
    } catch {
      toast.error("Failed to load price blocks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanges();
  }, []);

  const openAddModal = () => {
    setMin("");
    setMax("");
    setModalOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);
    if (isNaN(minNum) || isNaN(maxNum)) {
      toast.error("Please enter valid numbers for min and max");
      return;
    }
    if (minNum < 0 || maxNum < 0) {
      toast.error("Min and max must be ≥ 0");
      return;
    }
    if (minNum > maxNum) {
      toast.error("Min must be less than or equal to max");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(resolveApiUrl("/api/admin/job-budget-ranges"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ min: minNum, max: maxNum }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add");
      }
      toast.success("Price range added");
      setModalOpen(false);
      fetchRanges();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(resolveApiUrl(`/api/admin/job-budget-ranges/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Price range removed");
      setRanges((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminPageLayout
      title="Job Amount"
      description="Manage price blocks shown on the job posting budget step. These blocks and a Custom option are displayed when clients set their budget."
    >
      <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#2c353f]">Price blocks</h2>
          <Button
            onClick={openAddModal}
            className="bg-[#FE8A0F] hover:bg-[#e57b0e] text-white font-['Poppins',sans-serif]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add price range
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-0">
                <TableHead className="text-[#2c353f] font-medium">Display</TableHead>
                <TableHead className="text-[#2c353f] font-medium">Min (£)</TableHead>
                <TableHead className="text-[#2c353f] font-medium">Max (£)</TableHead>
                <TableHead className="text-right text-[#2c353f] font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-[#6b6b6b] py-8">
                    No price ranges yet. Add one to show on the post-job budget step.
                  </TableCell>
                </TableRow>
              ) : (
                ranges.map((r) => (
                  <TableRow key={r.id} className="border-0 hover:bg-[#FE8A0F]/5">
                    <TableCell className="font-['Poppins',sans-serif] text-[#2c353f]">
                      {formatLabel(r.min, r.max)}
                    </TableCell>
                    <TableCell className="text-[#2c353f]">£{r.min.toLocaleString()}</TableCell>
                    <TableCell className="text-[#2c353f]">£{r.max.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle>Add price range</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <p className="text-[13px] text-[#6b6b6b]">
              Enter minimum and maximum values (£). This range will appear as a selectable block when posting a job.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-amount-min" className="text-[#2c353f]">
                  Minimum (£)
                </Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                  <Input
                    id="job-amount-min"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g. 500"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="job-amount-max" className="text-[#2c353f]">
                  Maximum (£)
                </Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                  <Input
                    id="job-amount-max"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g. 1000"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#FE8A0F] hover:bg-[#e57b0e]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
