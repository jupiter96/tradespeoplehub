import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Save, X, ArrowUp, ArrowDown, Loader2, MoreVertical, Search, ChevronLeft, ChevronRight, ArrowUpDown, FolderTree, Ban, CheckCircle2, GripVertical } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { toast } from "sonner";
import type { Sector, Category, SubCategory } from "../../hooks/useSectorsAndCategories";

// Sortable Row Component
function SortableRow({ category, onEdit, onDelete, onToggleActive }: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleActive: (category: Category) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category._id || '' });

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
      <TableCell className="text-black dark:text-white font-medium w-12">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#FE8A0F] transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <span>{category.order}</span>
        </div>
      </TableCell>
      <TableCell className="text-black dark:text-white">
        <div className="font-medium truncate" title={category.name}>
          {category.name && category.name.length > 25 ? category.name.substring(0, 25) + "..." : category.name}
        </div>
      </TableCell>
      <TableCell className="text-black dark:text-white">
        <div className="flex flex-col gap-1">
          {category.subCategories && category.subCategories.length > 0 ? (
            category.subCategories.slice(0, 3).map((sub: SubCategory, idx: number) => (
              <span key={idx} className="text-xs text-gray-600 dark:text-gray-400 truncate" title={sub.name}>
                {sub.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No subcategories</span>
          )}
          {category.subCategories && category.subCategories.length > 3 && (
            <span className="text-xs text-[#FE8A0F]">
              +{category.subCategories.length - 3} more
            </span>
          )}
        </div>
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
              onClick={() => onEdit(category)}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
            >
              <FolderTree className="h-4 w-4 mr-2" />
              View Category
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(category)}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleActive(category)}
              className={category.isActive ? "text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer" : "text-green-600 dark:text-green-400 hover:bg-green-500/10 cursor-pointer"}
            >
              {category.isActive ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(category)}
              className="text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function AdminCategoriesPage() {
  useAdminRouteGuard();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
    type: "delete" | "deactivate" | "activate" | "deleteSubCategory";
    title: string;
    message: string;
    onConfirm: () => void;
    itemName?: string;
    subCategoryIndex?: number;
  }>({
    isOpen: false,
    type: "delete",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [formData, setFormData] = useState<{
    sector: string;
    name: string;
    order: number;
    isActive: boolean;
    subCategories: { name: string; order: number }[];
  }>({
    sector: "",
    name: "",
    order: 0,
    isActive: true,
    subCategories: [],
  });

  const fetchSectors = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/sectors?activeOnly=false"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSectors(data.sectors || []);
        // Auto-select first sector if available
        if (data.sectors && data.sectors.length > 0 && !selectedSectorId) {
          setSelectedSectorId(data.sectors[0]._id);
        }
      }
    } catch (error) {
      // console.error("Error fetching sectors:", error);
      toast.error("Failed to fetch sectors");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = useCallback(async (sectorId: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sectorId: sectorId,
        activeOnly: "false",
        includeSubCategories: "true",
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(
        resolveApiUrl(`/api/categories?${params}`),
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      // console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    fetchSectors();
  }, []);

  // Handle tab change from AdminPageLayout
  const handleTabChange = (tab: string) => {
    if (tab && tab !== selectedSectorId) {
      setSelectedSectorId(tab);
    }
  };

  // Combined effect to handle both regular updates and search debouncing
  // This prevents duplicate API calls on initial load
  useEffect(() => {
    if (!selectedSectorId) {
      setCategories([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchCategories(selectedSectorId);
    }, searchTerm ? 500 : 0); // No debounce for initial load, 500ms for search

    return () => clearTimeout(debounceTimer);
  }, [selectedSectorId, page, limit, sortBy, sortOrder, searchTerm, fetchCategories]);

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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      return { ...prev, [field]: value };
    });
  };


  const getNextAvailableOrder = useCallback(() => {
    if (categories.length === 0) return 1; // Minimum order is 1, not 0
    const existingOrders = categories.map(c => c.order || 0).filter(o => o > 0);
    if (existingOrders.length === 0) return 1;
    const maxOrder = Math.max(...existingOrders);
    return maxOrder + 1; // Always use max + 1 for new items
  }, [categories]);

  const handleCreateNew = () => {
    setFormData({
      sector: selectedSectorId,
      name: "",
      order: getNextAvailableOrder(),
      isActive: true,
      subCategories: [],
    });
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    const subCategories = (category.subCategories || []).map((sub: SubCategory) => ({
      name: sub.name,
      order: sub.order,
    }));
    
    setFormData({
      sector: typeof category.sector === "string" ? category.sector : category.sector._id,
      name: category.name,
      order: category.order,
      isActive: category.isActive,
      subCategories: subCategories.length > 0 ? subCategories : [],
    });
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (category: Category) => {
    if (!category._id) {
      toast.error("Category ID is missing");
      return;
    }
    
    const newStatus = !category.isActive;
    const action = newStatus ? "activate" : "deactivate";
    
    setConfirmModal({
      isOpen: true,
      type: newStatus ? "activate" : "deactivate",
      title: newStatus ? "Activate Category" : "Deactivate Category",
      message: `Are you sure you want to ${action} "${category.name}"?`,
      onConfirm: async () => {
        try {
          const response = await fetch(resolveApiUrl(`/api/categories/${category._id}`), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ isActive: newStatus }),
          });

          if (response.ok) {
            toast.success(`Category ${action}d successfully`);
            // Always refresh categories list, regardless of selectedSectorId
            if (selectedSectorId) {
              await fetchCategories(selectedSectorId);
            } else {
              // If no sector selected, try to get sector from category
              const categorySectorId = typeof category.sector === "string" 
                ? category.sector 
                : category.sector?._id;
              if (categorySectorId) {
                await fetchCategories(categorySectorId);
              } else {
                // Fallback: refresh the current list
                setCategories(prev => prev.map(c => 
                  c._id === category._id ? { ...c, isActive: newStatus } : c
                ));
              }
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            toast.error(errorData.error || `Failed to ${action} category`);
          }
        } catch (error) {
          // console.error(`Error ${action}ing category:`, error);
          toast.error(`Failed to ${action} category: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
      itemName: category.name,
    });
  };

  const handleDelete = async (category: Category) => {
    if (!category._id) return;
    
    setConfirmModal({
      isOpen: true,
      type: "delete",
      title: "Delete Category",
      message: `Are you sure you want to delete "${category.name}"? This will also delete all associated subcategories. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await fetch(resolveApiUrl(`/api/categories/${category._id}?hardDelete=true`), {
            method: "DELETE",
            credentials: "include",
          });

          if (response.ok) {
            toast.success("Category deleted successfully");
            if (selectedSectorId) {
              fetchCategories(selectedSectorId);
            }
          } else {
            const error = await response.json();
            toast.error(error.error || "Failed to delete category");
          }
        } catch (error) {
          // console.error("Error deleting category:", error);
          toast.error("Failed to delete category");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      itemName: category.name,
    });
  };

  const handleSave = async () => {
    if (!formData.sector) {
      toast.error("Please select a sector");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSaving(true);
      
      // First, create or update the category
      const categoryUrl = editingCategory
        ? resolveApiUrl(`/api/categories/${editingCategory._id}`)
        : resolveApiUrl("/api/categories");
      
      const categoryMethod = editingCategory ? "PUT" : "POST";

      const categoryPayload = {
        sector: formData.sector,
        name: formData.name.trim(),
        order: formData.order,
        isActive: formData.isActive,
      };

      const categoryResponse = await fetch(categoryUrl, {
        method: categoryMethod,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(categoryPayload),
      });

      if (!categoryResponse.ok) {
        const error = await categoryResponse.json();
        throw new Error(error.error || "Failed to save category");
      }

      const categoryData = await categoryResponse.json();
      const savedCategory = categoryData.category;

      // Then, handle subcategories
      if (editingCategory) {
        // Delete existing subcategories that are not in the new list
        const existingSubCategories = (editingCategory.subCategories || []) as SubCategory[];
        const newSubCategoryNames = formData.subCategories.map((sub) => sub.name.trim()).filter(Boolean);
        
        for (const existingSub of existingSubCategories) {
          if (!newSubCategoryNames.includes(existingSub.name)) {
            await fetch(resolveApiUrl(`/api/subcategories/${existingSub._id}?hardDelete=true`), {
              method: "DELETE",
              credentials: "include",
            });
          }
        }
      }

      // Create or update subcategories
      for (let i = 0; i < formData.subCategories.length; i++) {
        const subCategory = formData.subCategories[i];
        if (!subCategory.name.trim()) continue;

        // Check if subcategory already exists
        const existingSubResponse = await fetch(
          resolveApiUrl(`/api/subcategories?categoryId=${savedCategory._id}&activeOnly=false`),
          { credentials: "include" }
        );
        
        let existingSub = null;
        if (existingSubResponse.ok) {
          const existingData = await existingSubResponse.json();
          existingSub = existingData.subCategories?.find(
            (sub: SubCategory) => sub.name === subCategory.name.trim()
          );
        }

        const subCategoryPayload = {
          category: savedCategory._id,
          name: subCategory.name.trim(),
          order: subCategory.order || i + 1,
          isActive: true,
        };

        if (existingSub) {
          // Update existing subcategory
          await fetch(resolveApiUrl(`/api/subcategories/${existingSub._id}`), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(subCategoryPayload),
          });
        } else {
          // Create new subcategory
          await fetch(resolveApiUrl("/api/subcategories"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(subCategoryPayload),
          });
        }
      }

      toast.success(editingCategory ? "Category updated successfully" : "Category created successfully");
      setIsModalOpen(false);
      // Reset to first page and ensure order desc sorting for new items to appear at top
      if (!editingCategory) {
        setPage(1);
        setSortBy("order");
        setSortOrder("desc");
      }
      if (selectedSectorId) {
        // Small delay to ensure state updates before fetch
        setTimeout(() => {
          fetchCategories(selectedSectorId);
        }, 100);
      }
    } catch (error: any) {
      // console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubCategory = () => {
    setFormData((prev) => ({
      ...prev,
      subCategories: [
        ...prev.subCategories,
        { name: "", order: prev.subCategories.length + 1 },
      ],
    }));
  };

  const handleRemoveSubCategory = (index: number) => {
    const subCategory = formData.subCategories[index];
    const subCategoryName = subCategory?.name || `Subcategory #${index + 1}`;
    
    setConfirmModal({
      isOpen: true,
      type: "deleteSubCategory",
      title: "Delete Subcategory",
      message: `Are you sure you want to delete "${subCategoryName}"? This action cannot be undone.`,
      onConfirm: () => {
        setFormData((prev) => ({
          ...prev,
          subCategories: prev.subCategories.filter((_, i) => i !== index),
        }));
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      itemName: subCategoryName,
      subCategoryIndex: index,
    });
  };

  const handleSubCategoryChange = (index: number, field: "name" | "order", value: any) => {
    setFormData((prev) => {
      const updated = [...prev.subCategories];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subCategories: updated };
    });
  };

  const handleMoveSubCategory = (index: number, direction: "up" | "down") => {
    setFormData((prev) => {
      const updated = [...prev.subCategories];
      if (direction === "up" && index > 0) {
        [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
        updated[index].order = index + 1;
        updated[index - 1].order = index;
      } else if (direction === "down" && index < updated.length - 1) {
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        updated[index].order = index + 1;
        updated[index + 1].order = index + 2;
      }
      return { ...prev, subCategories: updated };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex((category) => category._id === active.id);
    const newIndex = categories.findIndex((category) => category._id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for better UX
    const newCategories = arrayMove(categories, oldIndex, newIndex);
    
    // Calculate new order values based on new positions
    const movedCategory = categories[oldIndex];
    const targetCategory = categories[newIndex];
    
    const categoriesToUpdate: { id: string; order: number }[] = [];
    
    if (oldIndex < newIndex) {
      // Moving down: shift orders up for categories between old and new positions
      for (let i = oldIndex + 1; i <= newIndex; i++) {
        categoriesToUpdate.push({
          id: categories[i]._id!,
          order: categories[i - 1].order,
        });
      }
      categoriesToUpdate.push({
        id: movedCategory._id!,
        order: targetCategory.order,
      });
    } else {
      // Moving up: shift orders down for categories between new and old positions
      for (let i = newIndex; i < oldIndex; i++) {
        categoriesToUpdate.push({
          id: categories[i]._id!,
          order: categories[i + 1].order,
        });
      }
      categoriesToUpdate.push({
        id: movedCategory._id!,
        order: targetCategory.order,
      });
    }
    
    // Update local state
    setCategories(newCategories);

    // Save to backend
    try {
      setIsUpdatingOrder(true);
      const response = await fetch(resolveApiUrl('/api/categories/bulk/order'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ categories: categoriesToUpdate }),
      });

      if (response.ok) {
        toast.success('Category order updated successfully');
        if (sortBy !== 'order' || sortOrder !== 'desc') {
          setSortBy('order');
          setSortOrder('desc');
        }
        setTimeout(() => {
          if (selectedSectorId) {
            fetchCategories(selectedSectorId);
          }
        }, 100);
      } else {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { error: errorText || 'Failed to update category order' };
        }
        
        setCategories(categories);
        toast.error(error.error || error.details || 'Failed to update category order');
      }
    } catch (error) {
      setCategories(categories);
      toast.error('Failed to update category order');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Create tabs from sectors
  const sectorTabs = sectors.map((sector) => ({
    key: sector._id,
    label: sector.name,
  }));

  // This will be recalculated inside the render function based on activeTab
  const getCurrentCategories = (sectorId: string) => {
    return categories.filter((cat) => {
      const catSectorId = typeof cat.sector === "string" ? cat.sector : cat.sector._id;
      return catSectorId === sectorId;
    });
  };

  if (loading && sectors.length === 0) {
    return (
      <AdminPageLayout title="Categories" description="Manage categories and subcategories">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <>
      <AdminPageLayout
        title="Categories"
        description="Manage categories and subcategories by sector"
        tabs={sectorTabs}
        defaultTab={selectedSectorId}
        enableTabSlider={true}
        onTabChange={handleTabChange}
      >
        {(tab) => {
          const currentCategories = getCurrentCategories(tab);

          return (
            <div className="space-y-6">
              {/* Search and Controls - All in one row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-black dark:text-white whitespace-nowrap">
                    Total: <span className="text-[#FE8A0F] font-semibold">{total}</span> categories
                  </p>
                </div>
                <div className="relative flex-shrink-0" style={{ width: '200px' }}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 dark:text-white/50" />
                  <Input
                    type="text"
                    placeholder="Search categories..."
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
                {currentCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-black dark:text-white">No categories found</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={currentCategories.map(cat => cat._id || '')}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-0 hover:bg-transparent shadow-sm">
                              <SortableHeader column="order" label="Order" />
                              <SortableHeader column="name" label="Category Name" />
                              <TableHead className="text-[#FE8A0F] font-semibold">Subcategories</TableHead>
                              <TableHead className="text-[#FE8A0F] font-semibold text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentCategories.map((category) => (
                              <SortableRow
                                key={category._id}
                                category={category}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleActive={handleToggleActive}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </SortableContext>
                  </DndContext>
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
          );
        }}
      </AdminPageLayout>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-0 shadow-2xl shadow-gray-400 dark:shadow-gray-950">
          <DialogHeader>
            <DialogTitle className="text-[#FE8A0F] text-2xl">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sector" className="text-black dark:text-white">
                  Sector <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sector}
                  onValueChange={(value) => handleInputChange("sector", value)}
                >
                  <SelectTrigger className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow">
                    <SelectValue placeholder="Select a sector" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black border-0 shadow-xl shadow-gray-300 dark:shadow-gray-900">
                    {sectors.map((sector) => (
                      <SelectItem key={sector._id} value={sector._id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name" className="text-black dark:text-white">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Plumbing"
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

            {/* Subcategories */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-black dark:text-white">Subcategories</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubCategory}
                  className="flex items-center gap-2 border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Subcategory
                </Button>
              </div>
              <div className="space-y-3 border-0 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 shadow-md shadow-gray-200 dark:shadow-gray-800">
                {formData.subCategories.length === 0 ? (
                  <p className="text-sm text-black/50 dark:text-white/50 text-center py-4">
                    No subcategories. Click "Add Subcategory" to add one.
                  </p>
                ) : (
                  formData.subCategories.map((subCategory, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-black rounded-lg shadow-sm">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <Input
                            value={subCategory.name}
                            onChange={(e) =>
                              handleSubCategoryChange(index, "name", e.target.value)
                            }
                            placeholder="Subcategory name"
                            className="text-sm bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            value={subCategory.order}
                            onChange={(e) =>
                              handleSubCategoryChange(
                                index,
                                "order",
                                parseInt(e.target.value) || index + 1
                              )
                            }
                            placeholder="Order"
                            className="text-sm bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveSubCategory(index, "up")}
                          disabled={index === 0}
                          className="h-8 w-8 p-0 text-[#FE8A0F] hover:bg-[#FE8A0F]/10 disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveSubCategory(index, "down")}
                          disabled={index === formData.subCategories.length - 1}
                          className="h-8 w-8 p-0 text-[#FE8A0F] hover:bg-[#FE8A0F]/10 disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSubCategory(index)}
                          className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
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
                  {editingCategory ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={confirmModal.isOpen} onOpenChange={(open) => setConfirmModal({ ...confirmModal, isOpen: open })}>
        <DialogContent className="bg-white dark:bg-black border-0 shadow-xl shadow-gray-300 dark:shadow-gray-900">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">
              {confirmModal.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {confirmModal.message}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                confirmModal.onConfirm();
              }}
              className={`${
                confirmModal.type === "delete" || confirmModal.type === "deleteSubCategory"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
              } border-0 shadow-lg transition-all`}
            >
              {confirmModal.type === "delete" || confirmModal.type === "deleteSubCategory"
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

