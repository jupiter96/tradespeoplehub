import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Edit2, Trash2, Save, X, Upload, Loader2, MoreVertical, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Eye, Ban, CheckCircle2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  order: number;
  isActive: boolean;
}

// Sortable Row Component
function SortableRow({ sector, onEdit, onDelete, onToggleActive }: {
  sector: Sector;
  onEdit: (sector: Sector) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sector._id || '' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="border-0 hover:bg-[#FE8A0F]/5 shadow-sm hover:shadow-md transition-shadow"
    >
      <TableCell className="text-black font-medium w-12">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#FE8A0F] transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <span>{sector.order}</span>
        </div>
      </TableCell>
      <TableCell className="text-black">
        <div className="font-medium truncate" title={sector.name}>
          {sector.name && sector.name.length > 25 ? sector.name.substring(0, 25) + "..." : sector.name}
        </div>
      </TableCell>
      <TableCell className="text-black">
        {sector.icon ? (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden bg-gray-100 ">
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
              <span className="text-xs text-gray-500  truncate px-2" title={sector.icon}>
                {sector.icon.length > 10 ? sector.icon.substring(0, 10) + "..." : sector.icon}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">No icon</span>
        )}
      </TableCell>
      <TableCell className="text-black">
        {sector.bannerImage ? (
          <div className="flex items-center justify-center w-20 h-12 rounded-lg overflow-hidden bg-gray-100 ">
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
              className="h-8 w-8 text-black hover:bg-[#FE8A0F]/10"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border-0 shadow-xl shadow-gray-300 ">
            <DropdownMenuItem
              onClick={() => {
                if (sector.slug) {
                  window.open(`/sector/${sector.slug}`, '_blank');
                } else {
                  toast.error("Sector slug not available");
                }
              }}
              className="text-blue-600  cursor-pointer"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Sector
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(sector)}
              className="text-blue-600  cursor-pointer"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleActive(sector._id!, sector.isActive)}
              className={sector.isActive ? "text-red-600  cursor-pointer" : "text-green-600  cursor-pointer"}
            >
              {sector.isActive ? (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${sector.name}"?`)) {
                  onDelete(sector._id!);
                }
              }}
              className="text-red-600  cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "deactivate" | "activate";
    title: string;
    message: string;
    onConfirm: () => void;
    itemName?: string;
  }>({
    isOpen: false,
    type: "delete",
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [formData, setFormData] = useState<Sector>({
    name: "",
    slug: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
      icon: "",
      bannerImage: "",
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
        let sectorsData = data.sectors || [];
        
        // Always sort by order desc for admin display (highest order = newest = first)
        // This ensures consistent display based on database order values
        if (sortBy === 'order' && sortOrder === 'desc') {
          sectorsData = [...sectorsData].sort((a, b) => {
            // Primary sort: order desc (highest first)
            if (b.order !== a.order) {
              return b.order - a.order;
            }
            // Secondary sort: name asc for same order values
            return (a.name || '').localeCompare(b.name || '');
          });
        }
        
        // console.log('=== Fetched Sectors from Database ===');
        // console.log(`Sort: ${sortBy} ${sortOrder}`);
        // console.log(`Total sectors fetched: ${sectorsData.length}`);
        sectorsData.forEach(s => {
          // console.log(`Sector ${s.name} (${s._id}): order = ${s.order} (from database)`);
        });
        
        // Ensure we're using the actual database order values
        // Filter out any temporary values (negative or very large positive)
        const validSectors = sectorsData.filter(s => {
          // Order should be a reasonable positive number (not temporary values)
          // Temporary values are typically negative or very large (> 10000)
          const isValid = s.order > 0 && s.order < 10000;
          if (!isValid) {
            // console.warn(`Sector ${s.name} has suspicious order value: ${s.order}`);
          }
          return isValid;
        });
        
        if (validSectors.length !== sectorsData.length) {
          // console.warn(`Filtered out ${sectorsData.length - validSectors.length} sectors with invalid order values`);
        }
        
        // Use valid sectors or all sectors if filtering removed too many
        const sectorsToDisplay = validSectors.length > 0 ? validSectors : sectorsData;
        
        setSectors(sectorsToDisplay);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        toast.error("Failed to fetch sectors");
      }
    } catch (error) {
      // console.error("Error fetching sectors:", error);
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
      // Auto-generate slug from name when name changes
      // For new sectors (no editingSector), always auto-generate
      // For existing sectors, only auto-generate if slug is empty or matches the original slug
      if (field === "name") {
        if (!editingSector) {
          // New sector: always auto-generate slug
          updated.slug = generateSlug(value);
        } else {
          // Existing sector: only auto-generate if slug is empty or matches original
          const originalSlug = generateSlug(editingSector.name);
          if (!updated.slug || updated.slug === originalSlug) {
            updated.slug = generateSlug(value);
          }
        }
      }
      return updated;
    });
  };

  const getNextAvailableOrder = () => {
    if (sectors.length === 0) return 1; // Minimum order is 1, not 0
    const existingOrders = sectors.map(s => s.order || 0).filter(o => o > 0);
    if (existingOrders.length === 0) return 1;
    const maxOrder = Math.max(...existingOrders);
    return maxOrder + 1; // Always use max + 1 for new items
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
      order: getNextAvailableOrder(),
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

  const handleDragEnd = async (event: DragEndEvent) => {
    // console.log('=== Drag End Event ===');
    // console.log('Active:', event.active);
    // console.log('Over:', event.over);
    
    const { active, over } = event;

    if (!over || active.id === over.id) {
      // console.log('Drag cancelled: no over target or same position');
      return;
    }

    const oldIndex = sectors.findIndex((sector) => sector._id === active.id);
    const newIndex = sectors.findIndex((sector) => sector._id === over.id);

    // console.log(`Moving sector from index ${oldIndex} to ${newIndex}`);

    if (oldIndex === -1 || newIndex === -1) {
      // console.error('Invalid indices:', { oldIndex, newIndex });
      return;
    }

    // Update local state immediately for better UX
    const newSectors = arrayMove(sectors, oldIndex, newIndex);
    
    // Calculate new order values based on new positions
    // We need to shift order values to reflect the new positions
    // Use the actual database order values and shift them appropriately
    const movedSector = sectors[oldIndex];
    const targetSector = sectors[newIndex];
    
    // console.log('=== Order Update Calculation ===');
    // console.log(`Moving sector "${movedSector.name}" (order ${movedSector.order}) from index ${oldIndex} to index ${newIndex}`);
    // console.log(`Target sector "${targetSector.name}" (order ${targetSector.order})`);
    
    // Calculate new order values by shifting
    // If moving down (oldIndex < newIndex), shift intermediate sectors up
    // If moving up (oldIndex > newIndex), shift intermediate sectors down
    const sectorsToUpdate: { id: string; order: number }[] = [];
    
    if (oldIndex < newIndex) {
      // Moving down: shift orders up for sectors between old and new positions
      for (let i = oldIndex + 1; i <= newIndex; i++) {
        sectorsToUpdate.push({
          id: sectors[i]._id!,
          order: sectors[i - 1].order, // Take order from previous sector
        });
      }
      // Set moved sector's order to target position's order
      sectorsToUpdate.push({
        id: movedSector._id!,
        order: targetSector.order,
      });
    } else {
      // Moving up: shift orders down for sectors between new and old positions
      for (let i = newIndex; i < oldIndex; i++) {
        sectorsToUpdate.push({
          id: sectors[i]._id!,
          order: sectors[i + 1].order, // Take order from next sector
        });
      }
      // Set moved sector's order to target position's order
      sectorsToUpdate.push({
        id: movedSector._id!,
        order: targetSector.order,
      });
    }
    
    // console.log('=== Updated Order Values ===');
    sectorsToUpdate.forEach(({ id, order }) => {
      const sectorName = sectors.find(s => s._id === id)?.name || 'Unknown';
      // console.log(`Sector ${sectorName} (${id}): order = ${order}`);
    });
    
    // Update local state - but don't modify order values here
    // Just reorder the array, order values will come from database after update
    setSectors(newSectors);

    // console.log('=== Sectors to Update ===');
    // console.log('Sectors array:', JSON.stringify(sectorsToUpdate, null, 2));

    // Save to backend
    try {
      setIsUpdatingOrder(true);
      const apiUrl = resolveApiUrl('/api/sectors/bulk/order');
      const requestBody = { sectors: sectorsToUpdate };
      
      // console.log('=== Sending Bulk Order Update Request ===');
      // console.log('API URL:', apiUrl);
      // console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      // console.log('Response status:', response.status);
      // console.log('Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        // console.log('=== Bulk Order Update Success ===');
        // console.log('Response data:', responseData);
        toast.success('Sector order updated successfully');
        // Refresh to get updated data from database
        // Ensure we're sorting by order desc to match admin display
        if (sortBy !== 'order' || sortOrder !== 'desc') {
          setSortBy('order');
          setSortOrder('desc');
        }
        // Fetch from database to get the actual stored order values
        setTimeout(() => {
          fetchSectors();
        }, 100);
      } else {
        // Revert on error
        // console.error('=== Bulk Order Update Failed ===');
        // console.error('Response status:', response.status);
        const errorText = await response.text();
        // console.error('Response text:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
          // console.error('Parsed error:', error);
        } catch (e) {
          // console.error('Could not parse error response as JSON');
          error = { error: errorText || 'Failed to update sector order' };
        }
        
        setSectors(sectors);
        toast.error(error.error || error.details || 'Failed to update sector order');
      }
    } catch (error) {
      // Revert on error
      // console.error('=== Exception in Bulk Order Update ===');
      // console.error('Error:', error);
      // console.error('Error type:', typeof error);
      // console.error('Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error) {
        // console.error('Error stack:', error.stack);
      }
      
      setSectors(sectors);
      toast.error('Failed to update sector order');
    } finally {
      setIsUpdatingOrder(false);
      // console.log('=== Drag End Complete ===');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const sector = sectors.find(s => s._id === id);
    if (!sector) return;
    
    const newStatus = !currentStatus;
    const action = newStatus ? "activate" : "deactivate";
    
    setConfirmModal({
      isOpen: true,
      type: newStatus ? "activate" : "deactivate",
      title: newStatus ? "Activate Sector" : "Deactivate Sector",
      message: `Are you sure you want to ${action} "${sector.name}"?`,
      onConfirm: async () => {
        try {
          const response = await fetch(resolveApiUrl(`/api/sectors/${id}`), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ isActive: newStatus }),
          });

          if (response.ok) {
            toast.success(`Sector ${action}d successfully`);
            // Immediately update local state for instant feedback
            setSectors(prev => prev.map(s => 
              s._id === id ? { ...s, isActive: newStatus } : s
            ));
            // Then refresh from server to ensure consistency
            await fetchSectors();
          } else {
            const error = await response.json();
            toast.error(error.error || `Failed to ${action} sector`);
          }
        } catch (error) {
          // console.error(`Error ${action}ing sector:`, error);
          toast.error(`Failed to ${action} sector`);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      itemName: sector.name,
    });
  };

  const handleDelete = async (id: string) => {
    const sector = sectors.find(s => s._id === id);
    if (!sector) return;
    
    setConfirmModal({
      isOpen: true,
      type: "delete",
      title: "Delete Sector",
      message: `Are you sure you want to delete "${sector.name}"? This will also delete all associated categories. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await fetch(resolveApiUrl(`/api/sectors/${id}?hardDelete=true`), {
            method: "DELETE",
            credentials: "include",
          });

          if (response.ok) {
            toast.success("Sector deleted successfully");
            // Immediately remove from local state for instant feedback
            setSectors(prev => prev.filter(s => s._id !== id));
            setTotal(prev => Math.max(0, prev - 1));
            // Then refresh from server to ensure consistency
            await fetchSectors();
          } else {
            const error = await response.json();
            toast.error(error.error || "Failed to delete sector");
          }
        } catch (error) {
          // console.error("Error deleting sector:", error);
          toast.error("Failed to delete sector");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      itemName: sector.name,
    });
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

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description || "",
        metaTitle: formData.metaTitle || "",
        metaDescription: formData.metaDescription || "",
        icon: formData.icon || "",
        bannerImage: formData.bannerImage || "",
        order: formData.order,
        isActive: formData.isActive,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedSector = await response.json();
        toast.success(editingSector ? "Sector updated successfully" : "Sector created successfully");
        setIsModalOpen(false);
        // Reset to first page and ensure order desc sorting for new items to appear at top
        if (!editingSector) {
          setPage(1);
          setSortBy("order");
          setSortOrder("desc");
        }
        // Immediately update local state if editing
        if (editingSector && savedSector.sector) {
          setSectors(prev => prev.map(s => 
            s._id === editingSector._id ? { ...s, ...savedSector.sector } : s
          ));
        }
        // Refresh from server to ensure consistency
        await fetchSectors();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save sector");
      }
    } catch (error) {
      // console.error("Error saving sector:", error);
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
      // For new sectors (no entityId), upload directly to Cloudinary and save URL to formData
      // For existing sectors, use the entity-specific upload endpoint
      const entityId = editingSector?._id;
      
      if (!entityId) {
        // New sector: Upload directly to Cloudinary
        const uploadFormData = new FormData();
        uploadFormData.append("image", file);

        const response = await fetch(
          resolveApiUrl(`/api/admin/upload-image/${type}/sector/temp`),
          {
            method: "POST",
            credentials: "include",
            body: uploadFormData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload image");
        }

        const data = await response.json();
        const fieldName = type === "icon" ? "icon" : "bannerImage";
        handleInputChange(fieldName as keyof Sector, data.imageUrl);
        toast.success(`${type === "icon" ? "Icon" : "Banner"} uploaded successfully`);
      } else {
        // Existing sector: Use entity-specific upload endpoint
        const uploadFormData = new FormData();
        uploadFormData.append("image", file);

        const response = await fetch(
          resolveApiUrl(`/api/admin/upload-image/${type}/sector/${entityId}`),
          {
            method: "POST",
            credentials: "include",
            body: uploadFormData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload image");
        }

        const data = await response.json();
        const fieldName = type === "icon" ? "icon" : "bannerImage";
        handleInputChange(fieldName as keyof Sector, data.imageUrl);
        toast.success(`${type === "icon" ? "Icon" : "Banner"} uploaded successfully`);
      }
    } catch (error) {
      // console.error("Error uploading image:", error);
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
              <p className="text-sm text-black whitespace-nowrap">
                Total: <span className="text-[#FE8A0F] font-semibold">{total}</span> sectors
              </p>
            </div>
            <div className="relative flex-shrink-0" style={{ width: '200px' }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
              <Input
                type="text"
                placeholder="Search sectors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-0 shadow-md shadow-gray-200  text-black placeholder:text-black/50  focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="rows-per-page" className="text-sm text-black whitespace-nowrap">
                Rows per page:
              </Label>
              <Select value={limit.toString()} onValueChange={(value) => {
                setLimit(parseInt(value));
                setPage(1);
              }}>
                <SelectTrigger id="rows-per-page" className="w-20 bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-0 shadow-xl shadow-gray-300 ">
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
          <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20 relative">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-black">Loading...</p>
              </div>
            ) : sectors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-black">No sectors found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="border-0 hover:bg-transparent shadow-sm">
                        <TableHead className="text-[#FE8A0F] font-semibold w-24">Order</TableHead>
                        <SortableHeader column="name" label="Sector Name" />
                        <TableHead className="text-[#FE8A0F] font-semibold">Icon</TableHead>
                        <TableHead className="text-[#FE8A0F] font-semibold">Banner Image</TableHead>
                        <TableHead className="text-[#FE8A0F] font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <SortableContext
                        items={sectors.map(s => s._id || '')}
                        strategy={verticalListSortingStrategy}
                      >
                        {sectors.map((sector) => (
                          <SortableRow
                            key={sector._id}
                            sector={sector}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleActive={handleToggleActive}
                          />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </DndContext>
                {isUpdatingOrder && (
                  <div className="absolute inset-0 bg-black/10  flex items-center justify-center rounded-3xl z-10">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-[#FE8A0F]" />
                      <span className="text-black">Updating order...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-0 shadow-sm">
                <p className="text-sm text-black">
                  Page <span className="text-[#FE8A0F] font-semibold">{page}</span> of <span className="text-[#FE8A0F] font-semibold">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-0 shadow-md shadow-gray-200  text-[#FE8A0F] hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-0 shadow-md shadow-gray-200  text-[#FE8A0F] hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 disabled:opacity-50 disabled:shadow-none transition-all"
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
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl shadow-gray-400 ">
          <DialogHeader>
            <DialogTitle className="text-[#FE8A0F] text-2xl">
              {editingSector ? "Edit Sector" : "Create New Sector"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-black">
                  Sector Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Home & Garden"
                  className="mt-1 bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
              <div>
                <Label htmlFor="slug" className="text-black">
                  Slug <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500  ml-2">(Auto-generated from name)</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  disabled
                  placeholder="home-garden"
                  className="mt-1 bg-gray-100  border-0 text-gray-500  cursor-not-allowed"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="isActive" className="text-black">
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
                  <span className="text-sm text-black">
                    {formData.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-black">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe this sector..."
                className="mt-1 bg-white border-0 shadow-md shadow-gray-200  text-black placeholder:text-black/50  min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
              />
            </div>

            {/* SEO Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metaTitle" className="text-black">
                  Meta Title
                </Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle || ""}
                  onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                  placeholder="SEO meta title"
                  className="mt-1 bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
              <div>
                <Label htmlFor="metaDescription" className="text-black">
                  Meta Description
                </Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription || ""}
                  onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                  placeholder="SEO meta description"
                  className="mt-1 bg-white border-0 shadow-md shadow-gray-200  text-black placeholder:text-black/50  min-h-[80px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
              </div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon" className="text-black">
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
                    className="flex-1 bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
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
                    disabled={uploadingImage.loading}
                    className="border-0 shadow-md shadow-gray-200  text-black hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all disabled:opacity-50"
                    title="Upload icon"
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
                <Label htmlFor="bannerImage" className="text-black">
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
                    className="flex-1 bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
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
                    disabled={uploadingImage.loading}
                    className="border-0 shadow-md shadow-gray-200  text-black hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all disabled:opacity-50"
                    title="Upload banner"
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
              className="border-0 shadow-md shadow-gray-200  text-black hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
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

      {/* Confirmation Modal */}
      <Dialog open={confirmModal.isOpen} onOpenChange={(open) => setConfirmModal({ ...confirmModal, isOpen: open })}>
        <DialogContent className="bg-white border-0 shadow-xl shadow-gray-300 ">
          <DialogHeader>
            <DialogTitle className="text-black">
              {confirmModal.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700  text-sm">
              {confirmModal.message}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="border-0 shadow-md shadow-gray-200  text-black hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                confirmModal.onConfirm();
              }}
              className={`${
                confirmModal.type === "delete"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
              } border-0 shadow-lg transition-all`}
            >
              {confirmModal.type === "delete"
                ? "Delete"
                : confirmModal.type === "activate"
                ? "Activate"
                : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
