import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner@2.0.3";
import { resolveApiUrl } from "../config/api";

interface PromoCode {
  _id?: string;
  id?: number;
  code: string;
  type?: "pro" | "admin";
  discount: number;
  discountType: "percentage" | "fixed";
  status: "active" | "inactive";
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  usedCount?: number;
  perUserLimit?: number;
  description?: string;
}

export default function ProPromoCodeSection() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("25");
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discountType: "",
    discount: "",
    status: "active",
    minOrderAmount: "",
    maxDiscountAmount: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
    perUserLimit: "1",
    description: "",
  });

  // Fetch promo codes from API
  useEffect(() => {
    const fetchPromoCodes = async () => {
      try {
        const response = await fetch(resolveApiUrl("/api/promo-codes/pro"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setPromoCodes(data.promoCodes || []);
        }
      } catch (error) {
        console.error("Error fetching promo codes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromoCodes();
  }, []);

  const handleCreatePromoCode = async () => {
    if (!formData.code || !formData.discountType || !formData.discount || !formData.status) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(resolveApiUrl("/api/promo-codes"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: formData.code,
          discount: parseFloat(formData.discount),
          discountType: formData.discountType,
          minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
          maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
          validFrom: formData.validFrom || new Date().toISOString(),
          validUntil: formData.validUntil || null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          perUserLimit: parseInt(formData.perUserLimit) || 1,
          description: formData.description || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create promo code");
      }

      const data = await response.json();
      setPromoCodes([data.promoCode, ...promoCodes]);
      setIsCreateDialogOpen(false);
      setFormData({
        code: "",
        discountType: "",
        discount: "",
        status: "active",
        minOrderAmount: "",
        maxDiscountAmount: "",
        validFrom: "",
        validUntil: "",
        usageLimit: "",
        perUserLimit: "1",
        description: "",
      });
      toast.success("Promo code created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create promo code");
    }
  };

  const handleEditPromoCode = (promo: PromoCode) => {
    setEditingPromoCode(promo);
    setFormData({
      code: promo.code,
      discountType: promo.discountType,
      discount: promo.discount.toString(),
      status: promo.status,
      minOrderAmount: promo.minOrderAmount?.toString() || "",
      maxDiscountAmount: promo.maxDiscountAmount?.toString() || "",
      validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString().slice(0, 16) : "",
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().slice(0, 16) : "",
      usageLimit: promo.usageLimit?.toString() || "",
      perUserLimit: promo.perUserLimit?.toString() || "1",
      description: promo.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePromoCode = async () => {
    if (!editingPromoCode || !editingPromoCode._id) {
      toast.error("No promo code selected for editing");
      return;
    }

    if (!formData.code || !formData.discountType || !formData.discount || !formData.status) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(resolveApiUrl(`/api/promo-codes/${editingPromoCode._id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          discount: parseFloat(formData.discount),
          discountType: formData.discountType,
          minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
          maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
          validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : new Date().toISOString(),
          validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          perUserLimit: parseInt(formData.perUserLimit) || 1,
          description: formData.description || "",
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update promo code");
      }

      const data = await response.json();
      setPromoCodes(promoCodes.map(p => p._id === editingPromoCode._id ? data.promoCode : p));
      setIsEditDialogOpen(false);
      setEditingPromoCode(null);
      setFormData({
        code: "",
        discountType: "",
        discount: "",
        status: "active",
        minOrderAmount: "",
        maxDiscountAmount: "",
        validFrom: "",
        validUntil: "",
        usageLimit: "",
        perUserLimit: "1",
        description: "",
      });
      toast.success("Promo code updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update promo code");
    }
  };

  const handleDeletePromoCode = async (promoId: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) {
      return;
    }

    try {
      const response = await fetch(resolveApiUrl(`/api/promo-codes/${promoId}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete promo code");
      }

      setPromoCodes(promoCodes.filter(p => p._id !== promoId));
      toast.success("Promo code deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete promo code");
    }
  };

  // Filter promo codes based on search
  const filteredPromoCodes = promoCodes.filter(promo =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase())
  ).map(promo => ({
    ...promo,
    id: promo._id ? parseInt(promo._id.slice(-6), 16) : (promo.id || 0),
  }));

  // Pagination
  const totalEntries = filteredPromoCodes.length;
  const entriesPerPageNum = parseInt(entriesPerPage);
  const totalPages = Math.ceil(totalEntries / entriesPerPageNum);
  const startIndex = (currentPage - 1) * entriesPerPageNum;
  const endIndex = Math.min(startIndex + entriesPerPageNum, totalEntries);
  const currentPromoCodes = filteredPromoCodes.slice(startIndex, endIndex);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#3D78CB]">
          My Promo Codes
        </h2>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif] text-[13px] w-full sm:w-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Promo Code
        </Button>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            Show
          </span>
          <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
            <SelectTrigger className="w-20 font-['Poppins',sans-serif] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            Search:
          </span>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 font-['Poppins',sans-serif] text-[13px]"
            placeholder="Search by code..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Code
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Discount
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Discount Type
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Used / Limit
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Status
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px] text-center">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    Loading...
                  </p>
                </TableCell>
              </TableRow>
            ) : currentPromoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    No promo codes found. Create your first promo code to offer discounts to clients!
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              currentPromoCodes.map((promo) => (
                <TableRow key={promo._id || promo.id} className="hover:bg-gray-50">
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                    {promo.code}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.discountType === "percentage" ? `${promo.discount}%` : `£${promo.discount.toFixed(2)}`}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] capitalize">
                    {promo.discountType}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.usedCount || 0} / {promo.usageLimit || "∞"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        promo.status === "active"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-400 hover:bg-gray-500"
                      } text-white font-['Poppins',sans-serif] text-[11px]`}
                    >
                      {promo.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="font-['Poppins',sans-serif] text-[13px] cursor-pointer"
                          onClick={() => handleEditPromoCode(promo)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="font-['Poppins',sans-serif] text-[13px] text-red-600 cursor-pointer"
                          onClick={() => promo._id && handleDeletePromoCode(promo._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
          Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="font-['Poppins',sans-serif] text-[13px]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 p-0 font-['Poppins',sans-serif] text-[13px] ${
                  currentPage === page
                    ? "bg-[#3D78CB] hover:bg-[#2d5ca3] text-white"
                    : ""
                }`}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="font-['Poppins',sans-serif] text-[13px]"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Create Promo Code Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Create Promo Code
            </DialogTitle>
            <DialogDescription className="sr-only">
              Create a new promo code for your services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Code */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Code <span className="text-red-500">*</span>:
              </Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Enter Code (e.g., SAVE10)"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
              <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-1">
                Note: When clients use this code, the discount will be deducted from your payout.
              </p>
            </div>

            {/* Discount Type */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Discount Type <span className="text-red-500">*</span>:
              </Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) => setFormData({ ...formData, discountType: value })}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Discount <span className="text-red-500">*</span>:
              </Label>
              <Input
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder={formData.discountType === "percentage" ? "e.g., 10 for 10%" : "e.g., 5 for £5"}
                type="number"
                step="0.01"
                min="0"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Max Discount Amount (for percentage) */}
            {formData.discountType === "percentage" && (
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Max Discount Amount (Optional):
                </Label>
                <Input
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  placeholder="e.g., 50 for £50 max"
                  type="number"
                  step="0.01"
                  min="0"
                  className="font-['Poppins',sans-serif] text-[14px]"
                />
              </div>
            )}

            {/* Min Order Amount */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Minimum Order Amount (Optional):
              </Label>
              <Input
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                placeholder="e.g., 20 for £20 minimum"
                type="number"
                step="0.01"
                min="0"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Usage Limit */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Usage Limit (Optional - leave empty for unlimited):
              </Label>
              <Input
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="e.g., 100"
                type="number"
                min="1"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Per User Limit */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Per User Limit:
              </Label>
              <Input
                value={formData.perUserLimit}
                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                placeholder="1"
                type="number"
                min="1"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Status */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Select Status:
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valid From */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Valid From (Optional):
              </Label>
              <Input
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Valid Until */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Valid Until (Optional):
              </Label>
              <Input
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Description (Optional):
              </Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setFormData({
                  code: "",
                  discountType: "",
                  discount: "",
                  status: "active",
                  minOrderAmount: "",
                  maxDiscountAmount: "",
                  validFrom: "",
                  validUntil: "",
                  usageLimit: "",
                  perUserLimit: "1",
                  description: "",
                });
              }}
              className="font-['Poppins',sans-serif] text-[13px]"
            >
              Close
            </Button>
            <Button
              onClick={handleCreatePromoCode}
              className="bg-[#5BC2E7] hover:bg-[#4ab3d6] text-white font-['Poppins',sans-serif] text-[13px]"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Promo Code Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Edit Promo Code
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit existing promo code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Code - Read Only */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Code:
              </Label>
              <Input
                value={formData.code}
                disabled
                className="font-['Poppins',sans-serif] text-[14px] bg-gray-100"
              />
              <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-1">
                Code cannot be changed after creation.
              </p>
            </div>

            {/* Discount Type */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Discount Type <span className="text-red-500">*</span>:
              </Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) => setFormData({ ...formData, discountType: value })}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Discount <span className="text-red-500">*</span>:
              </Label>
              <Input
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder={formData.discountType === "percentage" ? "e.g., 10 for 10%" : "e.g., 5 for £5"}
                type="number"
                step="0.01"
                min="0"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Max Discount Amount (for percentage) */}
            {formData.discountType === "percentage" && (
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Max Discount Amount (Optional):
                </Label>
                <Input
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  placeholder="e.g., 50 for £50 max"
                  type="number"
                  step="0.01"
                  min="0"
                  className="font-['Poppins',sans-serif] text-[14px]"
                />
              </div>
            )}

            {/* Min Order Amount */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Minimum Order Amount (Optional):
              </Label>
              <Input
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                placeholder="e.g., 20 for £20 minimum"
                type="number"
                step="0.01"
                min="0"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Usage Limit */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Usage Limit (Optional - leave empty for unlimited):
              </Label>
              <Input
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="e.g., 100"
                type="number"
                min="1"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Per User Limit */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Per User Limit:
              </Label>
              <Input
                value={formData.perUserLimit}
                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                placeholder="1"
                type="number"
                min="1"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Status */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Select Status:
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valid From */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Valid From (Optional):
              </Label>
              <Input
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Valid Until */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Valid Until (Optional):
              </Label>
              <Input
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Description (Optional):
              </Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingPromoCode(null);
                setFormData({
                  code: "",
                  discountType: "",
                  discount: "",
                  status: "active",
                  minOrderAmount: "",
                  maxDiscountAmount: "",
                  validFrom: "",
                  validUntil: "",
                  usageLimit: "",
                  perUserLimit: "1",
                  description: "",
                });
              }}
              className="font-['Poppins',sans-serif] text-[13px]"
            >
              Close
            </Button>
            <Button
              onClick={handleUpdatePromoCode}
              className="bg-[#5BC2E7] hover:bg-[#4ab3d6] text-white font-['Poppins',sans-serif] text-[13px]"
            >
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
