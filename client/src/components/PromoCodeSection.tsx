import { useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
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
import { useEffect } from "react";
import { resolveApiUrl } from "../config/api";
import { useAllServiceCategories } from "../hooks/useAllServiceCategories";
import { useSectors } from "../hooks/useSectorsAndCategories";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";

interface PromoCode {
  _id?: string;
  id?: number;
  code: string;
  type?: "pro" | "admin";
  discount: number;
  discountType: "percentage" | "fixed";
  status: "active" | "inactive";
  categories?: Array<{ _id: string; name: string; slug?: string }>;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  usedCount?: number;
  perUserLimit?: number;
  description?: string;
}

export default function PromoCodeSection() {
  const { sectors } = useSectors();
  const { serviceCategoriesBySector } = useAllServiceCategories(sectors, { includeSubCategories: false });
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get all service categories for selection
  const allCategories = Object.values(serviceCategoriesBySector).flat();
  
  // Fetch promo codes from API
  useEffect(() => {
    const fetchPromoCodes = async () => {
      try {
        const response = await fetch(resolveApiUrl("/api/promo-codes/admin"), {
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

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("25");
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    isLimited: "",
    discountType: "",
    discount: "0",
    sector: "",
    category: "",
    validity: "",
    status: "active",
    categories: [] as string[],
    minOrderAmount: "",
    maxDiscountAmount: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
    perUserLimit: "1",
    description: "",
  });

  // Get categories for selected sector
  const sectorServiceCategories = formData.sector 
    ? (serviceCategoriesBySector[formData.sector] || [])
    : [];

  const handleCreatePromoCode = async () => {
    if (!formData.code || !formData.discountType || !formData.discount || !formData.status) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Determine categories to send
    const categoriesToSend = formData.categories.length > 0 
      ? formData.categories 
      : (formData.category ? [formData.category] : []);

    const requestBody = {
      code: formData.code,
      discount: parseFloat(formData.discount || "0"),
      discountType: formData.discountType,
      categories: categoriesToSend,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
      validFrom: formData.validFrom || new Date().toISOString(),
      validUntil: formData.validity ? new Date(formData.validity).toISOString() : null,
      usageLimit: formData.isLimited === "yes" ? (formData.usageLimit ? parseInt(formData.usageLimit) : null) : null,
      perUserLimit: parseInt(formData.perUserLimit) || 1,
      description: formData.description || "",
    };

    try {
      const response = await fetch(resolveApiUrl("/api/promo-codes/admin"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
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
        isLimited: "",
        discountType: "",
        discount: "0",
        sector: "",
        category: "",
        validity: "",
        status: "active",
        categories: [],
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
    
    // Extract category IDs
    const categoryIds = promo.categories?.map((cat: any) => 
      typeof cat === 'string' ? cat : (cat._id || cat)
    ) || [];
    
    // Get sector from first category if available
    const firstCategory = categoryIds.length > 0 ? allCategories.find((c: any) => c._id === categoryIds[0]) : null;
    const sectorId = firstCategory && firstCategory.sector 
      ? (typeof firstCategory.sector === 'string' 
          ? firstCategory.sector 
          : (firstCategory.sector as any)?._id)
      : null;
    
    setEditingPromoCode(promo);
    setFormData({
      code: promo.code || "",
      isLimited: promo.usageLimit ? "yes" : "no",
      discountType: promo.discountType || "",
      discount: promo.discount?.toString() || "0",
      sector: sectorId || "",
      category: categoryIds.length === 1 ? categoryIds[0] : "",
      validity: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : "",
      status: promo.status || "active",
      categories: categoryIds,
      minOrderAmount: promo.minOrderAmount?.toString() || "",
      maxDiscountAmount: promo.maxDiscountAmount?.toString() || "",
      validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString().split('T')[0] : "",
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : "",
      usageLimit: promo.usageLimit?.toString() || "",
      perUserLimit: promo.perUserLimit?.toString() || "1",
      description: promo.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePromoCode = async () => {
    if (!editingPromoCode?._id) {
      toast.error("No promo code selected for editing");
      return;
    }

    if (!formData.code || !formData.discountType || !formData.discount || !formData.status) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Determine categories to send
    const categoriesToSend = formData.categories.length > 0 
      ? formData.categories 
      : (formData.category ? [formData.category] : []);

    const requestBody = {
      code: formData.code,
      discount: parseFloat(formData.discount || "0"),
      discountType: formData.discountType,
      categories: categoriesToSend,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
      validFrom: formData.validFrom || new Date().toISOString(),
      validUntil: formData.validity ? new Date(formData.validity).toISOString() : null,
      usageLimit: formData.isLimited === "yes" ? (formData.usageLimit ? parseInt(formData.usageLimit) : null) : null,
      perUserLimit: parseInt(formData.perUserLimit) || 1,
      description: formData.description || "",
      status: formData.status,
    };

    try {
      const response = await fetch(resolveApiUrl(`/api/promo-codes/admin/${editingPromoCode._id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update promo code");
      }

      const data = await response.json();
      
      // Update the promo code in the list
      setPromoCodes(promoCodes.map(p => 
        p._id === editingPromoCode._id ? data.promoCode : p
      ));
      
      setIsEditDialogOpen(false);
      setEditingPromoCode(null);
      setFormData({
        code: "",
        isLimited: "",
        discountType: "",
        discount: "0",
        sector: "",
        category: "",
        validity: "",
        status: "active",
        categories: [],
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
    try {
      const response = await fetch(resolveApiUrl(`/api/promo-codes/admin/${promoId}`), {
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
    id: promo._id ? parseInt(promo._id.slice(-6), 16) : (promo.id || 0), // Generate numeric ID for display
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
          Promo Code
        </h2>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif] text-[13px] w-full sm:w-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Promotion Code
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
            placeholder=""
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                ID
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Code
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Categories
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
                Min Order
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Valid From
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Valid Until
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
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    Loading...
                  </p>
                </TableCell>
              </TableRow>
            ) : currentPromoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    No promo codes found
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              currentPromoCodes.map((promo) => (
                <TableRow key={promo._id || promo.id} className="hover:bg-gray-50">
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo._id?.slice(-6) || promo.id}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                    {promo.code}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.categories && promo.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {promo.categories.slice(0, 2).map((cat: any) => (
                          <Badge key={cat._id || cat} variant="outline" className="text-[10px]">
                            {typeof cat === 'string' ? cat : (cat.name || cat)}
                          </Badge>
                        ))}
                        {promo.categories.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{promo.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#6b6b6b]">All Categories</span>
                    )}
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
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    £{promo.minOrderAmount?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.validFrom ? new Date(promo.validFrom).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    }) : "-"}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.validUntil ? new Date(promo.validUntil).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    }) : "No expiry"}
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
                          className="font-['Poppins',sans-serif] text-[13px]"
                          onClick={() => promo._id && handleEditPromoCode(promo)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="font-['Poppins',sans-serif] text-[13px] text-red-600"
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

      {/* Edit Promo Code Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Edit coupons
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit promo code
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
            {/* Code */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Code:
              </Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Enter Code"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Select Is Limited */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Select Is Limited:
              </Label>
              <Select
                value={formData.isLimited}
                onValueChange={(value) => {
                  setFormData({ ...formData, isLimited: value, usageLimit: value === "yes" ? formData.usageLimit : "" });
                }}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select Discount type */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Select Discount type:
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
                Discount:
              </Label>
              <Input
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="0"
                type="number"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Sector */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Sector:
              </Label>
              <Select
                value={formData.sector}
                onValueChange={(value) => {
                  setFormData({ ...formData, sector: value, category: "", categories: [] });
                }}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder="Select Sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector._id} value={sector._id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Category:
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value, categories: value ? [value] : [] });
                }}
                disabled={!formData.sector}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder={formData.sector ? "Select Category" : "Select Sector first"} />
                </SelectTrigger>
                <SelectContent>
                  {sectorServiceCategories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Validity */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Validity:
              </Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.validity}
                  onChange={(e) => setFormData({ ...formData, validity: e.target.value, validUntil: e.target.value })}
                  className="font-['Poppins',sans-serif] text-[14px] pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Select Status */}
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
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-3 px-6 pb-6 pt-4 shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingPromoCode(null);
                setFormData({
                  code: "",
                  isLimited: "",
                  discountType: "",
                  discount: "0",
                  sector: "",
                  category: "",
                  validity: "",
                  status: "active",
                  categories: [],
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

      {/* Create Promo Code Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Add coupons
            </DialogTitle>
            <DialogDescription className="sr-only">
              Create a new promo code
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
            {/* Code */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Code:
              </Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Enter Code"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Select Is Limited */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Select Is Limited:
              </Label>
              <Select
                value={formData.isLimited}
                onValueChange={(value) => {
                  setFormData({ ...formData, isLimited: value, usageLimit: value === "yes" ? formData.usageLimit : "" });
                }}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select Discount type */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Select Discount type:
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
                Discount:
              </Label>
              <Input
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="0"
                type="number"
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* Sector */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Sector:
              </Label>
              <Select
                value={formData.sector}
                onValueChange={(value) => {
                  setFormData({ ...formData, sector: value, category: "", categories: [] });
                }}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder="Select Sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector._id} value={sector._id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Category:
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  console.log('[PromoCodeSection] Category selected:', value);
                  console.log('[PromoCodeSection] Setting categories array to:', [value]);
                  setFormData({ ...formData, category: value, categories: value ? [value] : [] });
                }}
                disabled={!formData.sector}
              >
                <SelectTrigger className="font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue placeholder={formData.sector ? "Select Category" : "Select Sector first"} />
                </SelectTrigger>
                <SelectContent>
                  {sectorServiceCategories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Validity */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Validity:
              </Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.validity}
                  onChange={(e) => setFormData({ ...formData, validity: e.target.value, validUntil: e.target.value })}
                  className="font-['Poppins',sans-serif] text-[14px] pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Select Status */}
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
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-3 px-6 pb-6 pt-4 shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setFormData({
                  code: "",
                  isLimited: "",
                  discountType: "",
                  discount: "0",
                  sector: "",
                  category: "",
                  validity: "",
                  status: "active",
                  categories: [],
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
    </div>
  );
}
