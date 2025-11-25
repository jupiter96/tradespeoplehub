import { useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
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

interface PromoCode {
  id: number;
  code: string;
  isLimited: boolean;
  limitedUser: number;
  exceededLimit: number;
  discount: number;
  discountType: "percentage" | "fixed";
  status: "active" | "inactive";
  validity?: string;
}

export default function PromoCodeSection() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([
    {
      id: 3,
      code: "YTR45",
      isLimited: true,
      limitedUser: 1,
      exceededLimit: 1,
      discount: 10,
      discountType: "percentage",
      status: "active",
    },
    {
      id: 4,
      code: "Yes",
      isLimited: true,
      limitedUser: 2,
      exceededLimit: 2,
      discount: 5,
      discountType: "percentage",
      status: "inactive",
    },
    {
      id: 5,
      code: "CAP12",
      isLimited: true,
      limitedUser: 6,
      exceededLimit: 6,
      discount: 10,
      discountType: "percentage",
      status: "inactive",
    },
    {
      id: 6,
      code: "ME12",
      isLimited: false,
      limitedUser: 4,
      exceededLimit: 2,
      discount: 10,
      discountType: "percentage",
      status: "active",
    },
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("25");
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    isLimited: "",
    discountType: "",
    discount: "",
    status: "",
    validity: "",
  });

  const handleCreatePromoCode = () => {
    if (!formData.code || !formData.isLimited || !formData.discountType || !formData.discount || !formData.status) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newPromoCode: PromoCode = {
      id: promoCodes.length > 0 ? Math.max(...promoCodes.map(p => p.id)) + 1 : 1,
      code: formData.code,
      isLimited: formData.isLimited === "yes",
      limitedUser: formData.isLimited === "yes" ? 0 : 0,
      exceededLimit: 0,
      discount: parseFloat(formData.discount),
      discountType: formData.discountType as "percentage" | "fixed",
      status: formData.status as "active" | "inactive",
      validity: formData.validity || undefined,
    };

    setPromoCodes([...promoCodes, newPromoCode]);
    setIsCreateDialogOpen(false);
    setFormData({
      code: "",
      isLimited: "",
      discountType: "",
      discount: "",
      status: "",
      validity: "",
    });
    toast.success("Promo code created successfully");
  };

  const handleDeletePromoCode = (id: number) => {
    setPromoCodes(promoCodes.filter(p => p.id !== id));
    toast.success("Promo code deleted successfully");
  };

  // Filter promo codes based on search
  const filteredPromoCodes = promoCodes.filter(promo =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                id #
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Code
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Is Limited
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Limited User
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Exceeded Limit
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Discount
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-[13px]">
                Discount Type
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
            {currentPromoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    No promo codes found
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              currentPromoCodes.map((promo) => (
                <TableRow key={promo.id} className="hover:bg-gray-50">
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.id}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.code}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        promo.isLimited
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-red-500 hover:bg-red-600"
                      } text-white font-['Poppins',sans-serif] text-[11px]`}
                    >
                      {promo.isLimited ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.limitedUser}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.exceededLimit}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.discount}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {promo.discountType}
                  </TableCell>
                  <TableCell>
                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] capitalize">
                      {promo.status}
                    </span>
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
                        <DropdownMenuItem className="font-['Poppins',sans-serif] text-[13px]">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="font-['Poppins',sans-serif] text-[13px]">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="font-['Poppins',sans-serif] text-[13px] text-red-600"
                          onClick={() => handleDeletePromoCode(promo.id)}
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Add coupons
            </DialogTitle>
            <DialogDescription className="sr-only">
              Create a new promo code
            </DialogDescription>
          </DialogHeader>

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

            {/* Is Limited */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Select Is Limited:
              </Label>
              <Select
                value={formData.isLimited}
                onValueChange={(value) => setFormData({ ...formData, isLimited: value })}
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

            {/* Discount Type */}
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
                placeholder="Enter Discount"
                type="number"
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

            {/* Validity */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Validity:
              </Label>
              <Input
                type="date"
                value={formData.validity}
                onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
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
                  isLimited: "",
                  discountType: "",
                  discount: "",
                  status: "",
                  validity: "",
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
