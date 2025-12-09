import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Edit2, Trash2, Save, X, Upload, Loader2, MoreVertical, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { toast } from "sonner";

interface Sector {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  icon?: string;
  bannerImage?: string;
  displayName?: string;
  subtitle?: string;
  order: number;
  isActive: boolean;
}

export default function AdminSectorsPage() {
  useAdminRouteGuard();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>("order");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Sector>({
    name: "",
    slug: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    icon: "",
    bannerImage: "",
    displayName: "",
    subtitle: "",
    order: 0,
    isActive: true,
  });

  const fetchSectors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
        activeOnly: "false",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(resolveApiUrl(`/api/sectors?${params}`), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSectors(data.sectors || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        toast.error("Failed to fetch sectors");
      }
    } catch (error) {
      console.error("Error fetching sectors:", error);
      toast.error("Failed to fetch sectors");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, searchTerm]);

  // Combined effect to handle both regular updates and search debouncing
  // This prevents duplicate API calls on initial load
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSectors();
    }, searchTerm ? 500 : 0); // No debounce for initial load, 500ms for search

    return () => clearTimeout(debounceTimer);
  }, [fetchSectors, searchTerm]);

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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleInputChange = (field: keyof Sector, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name if slug is empty
      if (field === "name" && !updated.slug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleCreateNew = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      icon: "",
      bannerImage: "",
      displayName: "",
      subtitle: "",
      order: sectors.length,
      isActive: true,
    });
    setEditingSector(null);
    setIconPreview(null);
    setBannerPreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sector: Sector) => {
    setFormData({ ...sector });
    setEditingSector(sector);
    setIconPreview(sector.icon || null);
    setBannerPreview(sector.bannerImage || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (sector: Sector) => {
    if (!sector._id) return;
    
    if (!confirm(`Are you sure you want to delete "${sector.name}"? This will also delete all associated categories.`)) {
      return;
    }

    try {
      const response = await fetch(resolveApiUrl(`/api/sectors/${sector._id}?hardDelete=true`), {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Sector deleted successfully");
        fetchSectors();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete sector");
      }
    } catch (error) {
      console.error("Error deleting sector:", error);
      toast.error("Failed to delete sector");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Sector name is required");
      return;
    }

    if (!formData.slug.trim()) {
      formData.slug = generateSlug(formData.name);
    }

    try {
      setIsSaving(true);
      const url = editingSector
        ? resolveApiUrl(`/api/sectors/${editingSector._id}`)
        : resolveApiUrl("/api/sectors");
      
      const method = editingSector ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingSector ? "Sector updated successfully" : "Sector created successfully");
        setIsModalOpen(false);
        fetchSectors();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save sector");
      }
    } catch (error) {
      console.error("Error saving sector:", error);
      toast.error("Failed to save sector");
    } finally {
      setIsSaving(false);
    }
  };

  const [uploadingImage, setUploadingImage] = useState<{ type: "icon" | "banner" | null; loading: boolean }>({ type: null, loading: false });
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const handleImageUpload = async (file: File, type: "icon" | "banner") => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload JPG, PNG, GIF, or WEBP image.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "icon") {
        setIconPreview(reader.result as string);
      } else {
        setBannerPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);

    setUploadingImage({ type, loading: true });
    try {
      // Get entity ID (editingSector or new sector)
      const entityId = editingSector?._id;
      if (!entityId) {
        toast.error("Please save the sector first before uploading images");
        setUploadingImage({ type: null, loading: false });
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        resolveApiUrl(`/api/admin/upload-image/${type}/sector/${entityId}`),
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const data = await response.json();
      handleInputChange(type, data.imageUrl);
      toast.success(`${type === "icon" ? "Icon" : "Banner"} uploaded successfully`);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
      // Revert preview on error
      if (type === "icon") {
        setIconPreview(formData.icon || null);
      } else {
        setBannerPreview(formData.bannerImage || null);
      }
    } finally {
      setUploadingImage({ type: null, loading: false });
    }
  };

  if (loading) {
    return (
      <AdminPageLayout title="Sectors" description="Manage sectors and their configurations">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <>
      <AdminPageLayout
        title="Sectors"
        description="Manage sectors, their metadata, and display settings"
      >
        <div className="space-y-6">
          {/* Search and Controls - All in one row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-black dark:text-white whitespace-nowrap">
                Total: <span className="text-[#FE8A0F] font-semibold">{total}</span> sectors
              </p>
            </div>
            <div className="relative flex-shrink-0" style={{ width: '200px' }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 dark:text-white/50" />
              <Input
                type="text"
                placeholder="Search by name, slug, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
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
            <div className="ml-auto">
              <Button
                onClick={handleCreateNew}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white border-0 shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-3xl border-0 bg-white dark:bg-black p-6 shadow-xl shadow-[#FE8A0F]/20">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-black dark:text-white">Loading...</p>
              </div>
            ) : sectors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-black dark:text-white">No sectors found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-0 hover:bg-transparent shadow-sm">
                      <SortableHeader column="order" label="Order" />
                      <SortableHeader column="name" label="Sector Name" />
                      <TableHead className="text-[#FE8A0F] font-semibold">Icon</TableHead>
                      <TableHead className="text-[#FE8A0F] font-semibold">Banner Image</TableHead>
                      <TableHead className="text-[#FE8A0F] font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((sector) => (
                      <TableRow
                        key={sector._id}
                        className="border-0 hover:bg-[#FE8A0F]/5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <TableCell className="text-black dark:text-white font-medium">
                          {sector.order}
                        </TableCell>
                        <TableCell className="text-black dark:text-white">
                          <div className="font-medium truncate" title={sector.name}>
                            {sector.name && sector.name.length > 25 ? sector.name.substring(0, 25) + "..." : sector.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-black dark:text-white">
                          {sector.icon ? (
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                              {sector.icon.startsWith('http') || sector.icon.startsWith('/') ? (
                                <img
                                  src={sector.icon}
                                  alt={sector.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xs text-gray-400">No icon</span>';
                                  }}
                                />
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate px-2" title={sector.icon}>
                                  {sector.icon.length > 10 ? sector.icon.substring(0, 10) + "..." : sector.icon}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No icon</span>
                          )}
                        </TableCell>
                        <TableCell className="text-black dark:text-white">
                          {sector.bannerImage ? (
                            <div className="flex items-center justify-center w-20 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                              <img
                                src={sector.bannerImage}
                                alt={`${sector.name} banner`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xs text-gray-400">No image</span>';
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No image</span>
                          )}
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
                            <DropdownMenuContent align="end" className="bg-white dark:bg-black border-0 shadow-xl shadow-gray-300 dark:shadow-gray-900">
                              <DropdownMenuItem
                                onClick={() => handleEdit(sector)}
                                className="text-black dark:text-white hover:bg-[#FE8A0F]/10 cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(sector)}
                                className="text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
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
      </AdminPageLayout>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-0 shadow-2xl shadow-gray-400 dark:shadow-gray-950">
          <DialogHeader>
            <DialogTitle className="text-[#FE8A0F] text-2xl">
              {editingSector ? "Edit Sector" : "Create New Sector"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-black dark:text-white">
                  Sector Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Home & Garden"
                  className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
              <div>
                <Label htmlFor="slug" className="text-black dark:text-white">
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="home-garden"
                  className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
              <div>
                <Label htmlFor="displayName" className="text-black dark:text-white">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={formData.displayName || ""}
                  onChange={(e) => handleInputChange("displayName", e.target.value)}
                  placeholder="Home &"
                  className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
              <div>
                <Label htmlFor="subtitle" className="text-black dark:text-white">
                  Subtitle
                </Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle || ""}
                  onChange={(e) => handleInputChange("subtitle", e.target.value)}
                  placeholder="Garden"
                  className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
              <div>
                <Label htmlFor="order" className="text-black dark:text-white">
                  Display Order
                </Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleInputChange("order", parseInt(e.target.value) || 0)}
                  className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="isActive" className="text-black dark:text-white">
                  Status
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange("isActive", e.target.checked)}
                    className="w-4 h-4 text-[#FE8A0F] border-gray-300 rounded focus:ring-[#FE8A0F]"
                  />
                  <span className="text-sm text-black dark:text-white">
                    {formData.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-black dark:text-white">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe this sector..."
                className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
              />
            </div>

            {/* SEO Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metaTitle" className="text-black dark:text-white">
                  Meta Title
                </Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle || ""}
                  onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                  placeholder="SEO meta title"
                  className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
              <div>
                <Label htmlFor="metaDescription" className="text-black dark:text-white">
                  Meta Description
                </Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription || ""}
                  onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                  placeholder="SEO meta description"
                  className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 min-h-[80px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon" className="text-black dark:text-white">
                  Icon
                </Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="icon"
                    value={formData.icon || ""}
                    onChange={(e) => {
                      handleInputChange("icon", e.target.value);
                      setIconPreview(e.target.value || null);
                    }}
                    placeholder="Icon URL or upload image"
                    className="flex-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "icon");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage.loading || !editingSector?._id}
                    className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all disabled:opacity-50"
                    title={!editingSector?._id ? "Please save the sector first" : "Upload icon"}
                  >
                    {uploadingImage.type === "icon" && uploadingImage.loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {(iconPreview || formData.icon) && (
                  <div className="mt-2">
                    <img
                      src={iconPreview || formData.icon}
                      alt="Icon preview"
                      className="h-20 w-20 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="bannerImage" className="text-black dark:text-white">
                  Banner Image
                </Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="bannerImage"
                    value={formData.bannerImage || ""}
                    onChange={(e) => {
                      handleInputChange("bannerImage", e.target.value);
                      setBannerPreview(e.target.value || null);
                    }}
                    placeholder="Banner image URL or upload image"
                    className="flex-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                  />
                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "banner");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingImage.loading || !editingSector?._id}
                    className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all disabled:opacity-50"
                    title={!editingSector?._id ? "Please save the sector first" : "Upload banner"}
                  >
                    {uploadingImage.type === "banner" && uploadingImage.loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {(bannerPreview || formData.bannerImage) && (
                  <div className="mt-2">
                    <img
                      src={bannerPreview || formData.bannerImage}
                      alt="Banner preview"
                      className="h-20 w-full object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white border-0 shadow-lg shadow-[#FE8A0F]/40 hover:shadow-xl hover:shadow-[#FE8A0F]/50 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingSector ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
