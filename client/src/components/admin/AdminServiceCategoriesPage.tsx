import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Save, X, ArrowUp, ArrowDown, Loader2, MoreVertical, Search, ChevronLeft, ChevronRight, ChevronDown, ArrowUpDown, Upload, Eye, FolderTree, Ban, CheckCircle2, GripVertical, Type, List } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

// Service Category type (similar to Category)
interface ServiceCategory {
  _id: string;
  sector: Sector | string;
  name: string;
  slug?: string;
  order: number;
  description?: string;
  icon?: string;
  bannerImage?: string;
  isActive: boolean;
  level?: number; // 3-7
  categoryLevelMapping?: Array<{
    level: number;
    attributeType: 'serviceType' | 'size' | 'frequency' | 'make' | 'model' | 'brand';
    title?: string;
    thumbnail?: string;
    icon?: string;
    metadata?: Record<string, any>;
  }>;
  metaTitle?: string;
  metaDescription?: string;
  serviceIdealFor?: Array<{
    name: string;
    order: number;
  }>;
  extraServices?: Array<{
    name: string;
    price: number;
    days: number;
    order: number;
  }>;
  pricePerUnit?: {
    enabled: boolean;
    units: Array<{
      name: string;
      price: number;
      order: number;
    }>;
  };
  subCategories?: ServiceSubCategory[];
}

interface ServiceSubCategory {
  _id: string;
  name: string;
  order: number;
  serviceCategory?: string | ServiceCategory;
  parentSubCategory?: string | ServiceSubCategory;
  attributeType?: 'serviceType' | 'size' | 'frequency' | 'make' | 'model' | 'brand';
  titles?: Array<{
    level: number;
    title: string;
  }>;
  attributes?: Array<{
    level: number;
    attributeType: 'serviceType' | 'size' | 'frequency' | 'make' | 'model' | 'brand';
    values: Array<{
      label: string;
      value: string;
      order: number;
    }>;
  }>;
}

const ATTRIBUTE_TYPES = [
  { value: 'serviceType', label: 'Service Type' },
  { value: 'size', label: 'Size' },
  { value: 'frequency', label: 'Frequency' },
  { value: 'make', label: 'Make' },
  { value: 'model', label: 'Model' },
  { value: 'brand', label: 'Brand' },
] as const;

// Sortable Row Component
function SortableServiceCategoryRow({ serviceCategory, onEdit, onDelete, onToggleActive, onViewSubCategories, onManageTitles, onManageAttributes, sectors }: {
  serviceCategory: ServiceCategory;
  onEdit: (serviceCategory: ServiceCategory) => void;
  onDelete: (serviceCategory: ServiceCategory) => void;
  onToggleActive: (serviceCategory: ServiceCategory) => void;
  onViewSubCategories: (serviceCategory: ServiceCategory) => void;
  onManageTitles: (serviceCategory: ServiceCategory) => void;
  onManageAttributes: (serviceCategory: ServiceCategory) => void;
  sectors: Sector[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: serviceCategory._id || '' });

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
          <span>{serviceCategory.order}</span>
        </div>
      </TableCell>
      <TableCell className="text-black dark:text-white">
        <div className="font-medium truncate" title={serviceCategory.name}>
          {serviceCategory.name && serviceCategory.name.length > 25 ? serviceCategory.name.substring(0, 25) + "..." : serviceCategory.name}
        </div>
      </TableCell>
      <TableCell className="text-black dark:text-white">
        <span className="font-medium">
          {serviceCategory.subCategories?.length || 0}
        </span>
      </TableCell>
      <TableCell className="text-black dark:text-white">
        {serviceCategory.slug ? (
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate" title={serviceCategory.slug}>
            {serviceCategory.slug.length > 20 ? serviceCategory.slug.substring(0, 20) + "..." : serviceCategory.slug}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell className="text-black dark:text-white">
        {serviceCategory.icon ? (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {serviceCategory.icon.startsWith('http') || serviceCategory.icon.startsWith('/') ? (
              <img
                src={serviceCategory.icon}
                alt={serviceCategory.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xs text-gray-400">No icon</span>';
                }}
              />
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate px-2" title={serviceCategory.icon}>
                {serviceCategory.icon.length > 10 ? serviceCategory.icon.substring(0, 10) + "..." : serviceCategory.icon}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">No icon</span>
        )}
      </TableCell>
      <TableCell className="text-black dark:text-white">
        {serviceCategory.bannerImage ? (
          <div className="flex items-center justify-center w-20 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={serviceCategory.bannerImage}
              alt={`${serviceCategory.name} banner`}
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
              onClick={() => {
                let sectorSlug: string | undefined;
                
                // Handle both object and string (ID) cases for sector
                if (typeof serviceCategory.sector === 'object' && serviceCategory.sector !== null) {
                  sectorSlug = serviceCategory.sector.slug;
                } else if (typeof serviceCategory.sector === 'string') {
                  // Find sector by ID from sectors array
                  const sector = sectors.find(s => s._id === serviceCategory.sector);
                  sectorSlug = sector?.slug;
                }
                
                const serviceCategorySlug = serviceCategory.slug;
                
                if (sectorSlug && serviceCategorySlug) {
                  const url = `/sector/${sectorSlug}/${serviceCategorySlug}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                } else if (sectorSlug) {
                  const url = `/sector/${sectorSlug}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                } else {
                  toast.error("Sector or service category slug not available");
                }
              }}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Service Category
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onViewSubCategories(serviceCategory)}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
            >
              <FolderTree className="h-4 w-4 mr-2" />
              Child Category
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onManageTitles(serviceCategory)}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
            >
              <Type className="h-4 w-4 mr-2" />
              Titles
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onManageAttributes(serviceCategory)}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
            >
              <List className="h-4 w-4 mr-2" />
              Attributes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(serviceCategory)}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleActive(serviceCategory)}
              className={serviceCategory.isActive ? "text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer" : "text-green-600 dark:text-green-400 hover:bg-green-500/10 cursor-pointer"}
            >
              {serviceCategory.isActive ? (
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
              onClick={() => onDelete(serviceCategory)}
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

export default function AdminServiceCategoriesPage() {
  useAdminRouteGuard();
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceCategory, setEditingServiceCategory] = useState<ServiceCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingSubCategories, setViewingSubCategories] = useState<ServiceCategory | null>(null);
  const [isSubCategoriesModalOpen, setIsSubCategoriesModalOpen] = useState(false);
  const [isTitlesModalOpen, setIsTitlesModalOpen] = useState(false);
  const [isAttributesModalOpen, setIsAttributesModalOpen] = useState(false);
  const [managingServiceCategory, setManagingServiceCategory] = useState<ServiceCategory | null>(null);
  // Titles management state
  const [selectedCategoryLevel, setSelectedCategoryLevel] = useState<string>("");
  const [selectedSubCategoryPath, setSelectedSubCategoryPath] = useState<string[]>([]);
  const [titlesForSelectedPath, setTitlesForSelectedPath] = useState<string[]>([]);
  const [subCategoriesByLevel, setSubCategoriesByLevel] = useState<Record<number, ServiceSubCategory[]>>({});
  const [loadingSubCategories, setLoadingSubCategories] = useState<Record<number, boolean>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [subCategoryTitles, setSubCategoryTitles] = useState<Record<string, string[]>>({});
  const [viewMode, setViewMode] = useState<"categories" | "subcategories">("categories");
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<ServiceCategory | null>(null);
  const [selectedParentSubCategory, setSelectedParentSubCategory] = useState<ServiceSubCategory | null>(null);
  const [subCategoryBreadcrumb, setSubCategoryBreadcrumb] = useState<Array<{ id: string; name: string; type: 'category' | 'subcategory' }>>([]);
  const [serviceSubCategories, setServiceSubCategories] = useState<ServiceSubCategory[]>([]);
  const [editingServiceSubCategory, setEditingServiceSubCategory] = useState<ServiceSubCategory | null>(null);
  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
  const [subCategoryPage, setSubCategoryPage] = useState(1);
  const [subCategoryTotalPages, setSubCategoryTotalPages] = useState(1);
  const [subCategoryTotal, setSubCategoryTotal] = useState(0);
  const [subCategorySearchTerm, setSubCategorySearchTerm] = useState("");
  const [subCategorySortBy, setSubCategorySortBy] = useState<string>("order");
  const [subCategorySortOrder, setSubCategorySortOrder] = useState<"asc" | "desc">("desc");
  const [selectedAttributeType, setSelectedAttributeType] = useState<string | null>(null);
  const [level1SubCategories, setLevel1SubCategories] = useState<ServiceSubCategory[]>([]);
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
  const [subCategoryFormData, setSubCategoryFormData] = useState<{
    serviceCategory: string;
    parentSubCategory: string;
    name: string;
    slug: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    bannerImage: string;
    icon: string;
    order: number;
    level: number;
    isActive: boolean;
    attributeType?: 'serviceType' | 'size' | 'frequency' | 'make' | 'model' | 'brand';
    categoryLevel?: number;
    serviceTitleSuggestions?: string[];
  }>({
    serviceCategory: "",
    parentSubCategory: "",
    name: "",
    slug: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    bannerImage: "",
    icon: "",
    order: 0,
    level: 1,
    isActive: true,
    attributeType: undefined,
    categoryLevel: undefined,
    serviceTitleSuggestions: [],
  });
  const [subCategoryIconPreview, setSubCategoryIconPreview] = useState<string | null>(null);
  const [subCategoryBannerPreview, setSubCategoryBannerPreview] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [formData, setFormData] = useState<{
    sector: string;
    name: string;
    slug: string;
    order: number;
    description: string;
    metaTitle: string;
    metaDescription: string;
    icon: string;
    bannerImage: string;
    isActive: boolean;
    level: number;
    categoryLevelMapping: Array<{
      level: number;
      attributeType: 'serviceType' | 'size' | 'frequency' | 'make' | 'model' | 'brand';
      title?: string;
      thumbnail?: string;
      icon?: string;
      metadata?: Record<string, any>;
    }>;
    serviceIdealFor: Array<{ name: string; order: number }>;
    extraServices: Array<{ name: string; price: number; days: number; order: number }>;
    pricePerUnit: {
      enabled: boolean;
      units: Array<{ name: string; price: number; order: number }>;
    };
  }>({
    sector: "",
    name: "",
    slug: "",
    order: 0,
    description: "",
    metaTitle: "",
    metaDescription: "",
    icon: "",
    bannerImage: "",
    isActive: true,
    level: 3,
    categoryLevelMapping: [],
      serviceIdealFor: [],
      extraServices: [],
      pricePerUnit: {
        enabled: false,
        units: [],
      },
    });
  const [uploadingImage, setUploadingImage] = useState<{ type: "icon" | "banner" | null; loading: boolean }>({ type: null, loading: false });
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSectors();
  }, []);

  // Handle tab change from AdminPageLayout
  const handleTabChange = (tab: string) => {
    if (tab && tab !== selectedSectorId) {
      setSelectedSectorId(tab);
    }
  };

  // Helper function to check if current tab is the first tab (Level 2 - Sub Category tab)
  const isFirstTab = useCallback(() => {
    // Level 2 is the first tab (selectedAttributeType === null)
    return selectedAttributeType === null;
  }, [selectedAttributeType]);

  // Fetch parent subcategories for the current tab (previous level subcategories)
  const fetchParentSubCategories = useCallback(async () => {
    if (!selectedServiceCategory) return;

    try {
      // Determine which level and attributeType to fetch based on current tab
      let parentLevel: number | null = null;
      let parentAttributeType: string | null = null;
      
      if (selectedAttributeType === null) {
        // Level 2 tab (Sub Category) - no parent needed
        setLevel1SubCategories([]);
        return;
      } else {
        // Find the current tab's level from categoryLevelMapping
        const currentMapping = selectedServiceCategory.categoryLevelMapping?.find(
          m => m.attributeType === selectedAttributeType
        );
        if (currentMapping) {
          // Parent level is one less than current level
          parentLevel = currentMapping.level - 1;
          
          // Find the parent level's attributeType from categoryLevelMapping
          if (parentLevel === 2) {
            // Parent is Level 2 (Sub Category tab) - attributeType is null
            parentAttributeType = null;
          } else {
            // Parent is Level 3+ - find its attributeType
            const parentMapping = selectedServiceCategory.categoryLevelMapping?.find(
              m => m.level === parentLevel
            );
            if (parentMapping) {
              parentAttributeType = parentMapping.attributeType;
            }
          }
        }
      }

      if (!parentLevel || parentLevel < 2) {
        setLevel1SubCategories([]);
        return;
      }

      // Fetch subcategories from the parent level with the correct attributeType
      const params = new URLSearchParams({
        activeOnly: "false",
        includeServiceCategory: "true",
        serviceCategoryId: selectedServiceCategory._id,
        level: parentLevel.toString(),
        categoryLevel: parentLevel.toString(),
        limit: "1000", // Get all parent level subcategories
      });
      
      // Add attributeType filter
      if (parentAttributeType === null) {
        // Level 2: attributeType is null
        params.append('attributeType', '');
      } else if (parentAttributeType) {
        // Level 3+: filter by parent's attributeType
        params.append('attributeType', parentAttributeType);
      }

      const response = await fetch(resolveApiUrl(`/api/service-subcategories?${params}`), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setLevel1SubCategories(data.serviceSubCategories || []);
      }
    } catch (error) {
      console.error("Error fetching parent subcategories:", error);
    }
  }, [selectedServiceCategory, selectedAttributeType]);

  const fetchServiceSubCategories = useCallback(async (
    serviceCategoryId?: string, 
    parentSubCategoryId?: string,
    explicitLevel?: number,
    explicitAttributeType?: string | null
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        activeOnly: "false",
        includeServiceCategory: "true",
        page: subCategoryPage.toString(),
        limit: limit.toString(),
        sortBy: subCategorySortBy,
        sortOrder: subCategorySortOrder,
        ...(subCategorySearchTerm && { search: subCategorySearchTerm }),
        ...(serviceCategoryId && { serviceCategoryId }),
        ...(parentSubCategoryId && { parentSubCategoryId }),
      });
      
      // Apply tab-specific filters based on attributeType
      // Filter primarily by attributeType field
      if (parentSubCategoryId) {
        // When viewing nested subcategories, filter by parentSubCategory
        // Use explicit level and attributeType if provided, otherwise calculate from selectedParentSubCategory
        let expectedLevel: number;
        let expectedAttributeType: string | null = null;
        
        if (explicitLevel !== undefined) {
          expectedLevel = explicitLevel;
          if (explicitAttributeType !== undefined) {
            expectedAttributeType = explicitAttributeType;
          }
        } else if (selectedParentSubCategory) {
          expectedLevel = (selectedParentSubCategory.level || 1) + 1;
        } else {
          // Fallback: assume level 3 if we can't determine
          expectedLevel = 3;
        }
        
        params.append('level', expectedLevel.toString());
        params.append('categoryLevel', expectedLevel.toString());
        
        // If expected level > 2, find the attributeType for that level
        if (expectedAttributeType !== null) {
          params.append('attributeType', expectedAttributeType);
        } else if (expectedLevel > 2 && selectedServiceCategory) {
          const nextMapping = selectedServiceCategory.categoryLevelMapping?.find(
            m => m.level === expectedLevel
          );
          if (nextMapping) {
            params.append('attributeType', nextMapping.attributeType);
          }
        } else if (expectedLevel === 2) {
          params.append('attributeType', '');
        }
      } else if (serviceCategoryId) {
        if (selectedAttributeType === null) {
          // Level 2 tab (Sub Category): fetch Level 2 subcategories (attributeType is null)
          params.append('level', '2');
          params.append('categoryLevel', '2');
          // Explicitly set attributeType to null for Level 2
          params.append('attributeType', '');
        } else {
          // Other tabs: filter by attributeType as primary filter
          params.append('attributeType', selectedAttributeType);
          // Optionally include level for additional filtering, but attributeType is primary
          const currentMapping = selectedServiceCategory?.categoryLevelMapping?.find(
            m => m.attributeType === selectedAttributeType
          );
          if (currentMapping) {
            const tabLevel = currentMapping.level;
            params.append('level', tabLevel.toString());
            params.append('categoryLevel', tabLevel.toString());
          }
        }
      }

      const response = await fetch(resolveApiUrl(`/api/service-subcategories?${params}`), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setServiceSubCategories(data.serviceSubCategories || []);
        setSubCategoryTotal(data.total || 0);
        setSubCategoryTotalPages(data.totalPages || 1);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch service child categories");
      }
    } catch (error) {
      console.error("Error fetching service subcategories:", error);
      toast.error("Failed to fetch service child categories");
    } finally {
      setLoading(false);
    }
  }, [subCategoryPage, limit, subCategorySortBy, subCategorySortOrder, subCategorySearchTerm, selectedAttributeType, selectedParentSubCategory, selectedServiceCategory]);

  // Combined effect to handle both regular updates and search debouncing
  // This prevents duplicate API calls on initial load
  useEffect(() => {
    if (!selectedSectorId) {
      setServiceCategories([]);
      return;
    }

    if (viewMode === "categories") {
      const debounceTimer = setTimeout(() => {
        fetchServiceCategories(selectedSectorId);
      }, searchTerm ? 500 : 0); // No debounce for initial load, 500ms for search

      return () => clearTimeout(debounceTimer);
    }
  }, [selectedSectorId, page, limit, sortBy, sortOrder, searchTerm, viewMode]);

  // Effect for subcategories
  useEffect(() => {
    if (viewMode === "subcategories" && (selectedServiceCategory || selectedParentSubCategory)) {
      const debounceTimer = setTimeout(() => {
        if (selectedParentSubCategory) {
          // Calculate child level and attributeType
          const parentLevel = selectedParentSubCategory.level || 1;
          const childLevel = parentLevel + 1;
          let childAttributeType: string | null = null;
          if (childLevel > 2 && selectedServiceCategory) {
            const nextMapping = selectedServiceCategory.categoryLevelMapping?.find(
              m => m.level === childLevel
            );
            if (nextMapping) {
              childAttributeType = nextMapping.attributeType;
            }
          }
          fetchServiceSubCategories(undefined, selectedParentSubCategory._id, childLevel, childAttributeType);
        } else if (selectedServiceCategory) {
          fetchServiceSubCategories(selectedServiceCategory._id, undefined);
        }
      }, subCategorySearchTerm ? 500 : 0);

      return () => clearTimeout(debounceTimer);
    }
  }, [viewMode, selectedServiceCategory, selectedParentSubCategory, subCategoryPage, limit, subCategorySortBy, subCategorySortOrder, subCategorySearchTerm, selectedAttributeType, fetchServiceSubCategories]);

  // Fetch parent subcategories when tab changes (for parent selection dropdown)
  useEffect(() => {
    if (viewMode === "subcategories" && selectedServiceCategory && selectedAttributeType !== null) {
      fetchParentSubCategories();
    } else {
      setLevel1SubCategories([]);
    }
  }, [viewMode, selectedServiceCategory, selectedAttributeType, fetchParentSubCategories]);

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
      console.error("Error fetching sectors:", error);
      toast.error("Failed to fetch sectors");
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceCategories = useCallback(async (sectorId: string) => {
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
        resolveApiUrl(`/api/service-categories?${params}`),
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        // Debug: Log first category to check bannerImage field
        if (data.serviceCategories && data.serviceCategories.length > 0) {
          console.log("First service category bannerImage:", data.serviceCategories[0].bannerImage);
          console.log("First service category full data:", data.serviceCategories[0]);
        }
        setServiceCategories(data.serviceCategories || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        toast.error("Failed to fetch service categories");
      }
    } catch (error) {
      console.error("Error fetching service categories:", error);
      toast.error("Failed to fetch service categories");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, searchTerm]);

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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name when name changes
      // For new service categories (no editingServiceCategory), always auto-generate
      // For existing service categories, only auto-generate if slug is empty or matches the original slug
      if (field === "name") {
        if (!editingServiceCategory) {
          // New service category: always auto-generate slug
          updated.slug = generateSlug(value);
        } else {
          // Existing service category: only auto-generate if slug is empty or matches original
          const originalSlug = generateSlug(editingServiceCategory.name);
          if (!updated.slug || updated.slug === originalSlug) {
            updated.slug = generateSlug(value);
          }
        }
      }
      return updated;
    });
  };

  const handleSubCategoryImageUpload = async (file: File, type: "icon" | "banner") => {
    if (!selectedServiceCategory) return;
    
    setUploadingImage({ type, loading: true });
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const entityId = editingServiceSubCategory?._id || "temp";
      const response = await fetch(
        resolveApiUrl(`/api/admin/upload-image/${type}/service-subcategory/${entityId}`),
        {
          method: "POST",
          credentials: "include",
          body: uploadFormData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.imageUrl;
        
        if (type === "icon") {
          setSubCategoryFormData(prev => ({ ...prev, icon: imageUrl }));
          setSubCategoryIconPreview(imageUrl);
        } else {
          setSubCategoryFormData(prev => ({ ...prev, bannerImage: imageUrl }));
          setSubCategoryBannerPreview(imageUrl);
        }
        toast.success(`${type === "icon" ? "Icon" : "Banner"} uploaded successfully`);
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to upload ${type}`);
        if (type === "icon") {
          setSubCategoryIconPreview(subCategoryFormData.icon || null);
        } else {
          setSubCategoryBannerPreview(subCategoryFormData.bannerImage || null);
        }
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}`);
      if (type === "icon") {
        setSubCategoryIconPreview(subCategoryFormData.icon || null);
      } else {
        setSubCategoryBannerPreview(subCategoryFormData.bannerImage || null);
      }
    } finally {
      setUploadingImage({ type, loading: false });
    }
  };

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
        setPendingIconFile(file);
      } else {
        setBannerPreview(reader.result as string);
        setPendingBannerFile(file);
      }
    };
    reader.readAsDataURL(file);

    // If editing existing category, upload immediately
    const entityId = editingServiceCategory?._id;
    if (entityId) {
      setUploadingImage({ type, loading: true });
      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(
          resolveApiUrl(`/api/admin/upload-image/${type}/service-category/${entityId}`),
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
        // Clear pending file since it's uploaded
        if (type === "icon") {
          setPendingIconFile(null);
        } else {
          setPendingBannerFile(null);
        }
        toast.success(`${type === "icon" ? "Icon" : "Banner"} uploaded successfully`);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(error instanceof Error ? error.message : "Failed to upload image");
        // Revert preview on error
        if (type === "icon") {
          setIconPreview(formData.icon || null);
          setPendingIconFile(null);
        } else {
          setBannerPreview(formData.bannerImage || null);
          setPendingBannerFile(null);
        }
      } finally {
        setUploadingImage({ type: null, loading: false });
      }
    } else {
      // For new service category: Upload directly to Cloudinary and save URL to formData
      setUploadingImage({ type, loading: true });
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("image", file);

        const response = await fetch(
          resolveApiUrl(`/api/admin/upload-image/${type}/service-category/temp`),
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
        handleInputChange(fieldName, data.imageUrl);
        // Clear pending file since it's uploaded
        if (type === "icon") {
          setPendingIconFile(null);
        } else {
          setPendingBannerFile(null);
        }
        toast.success(`${type === "icon" ? "Icon" : "Banner"} uploaded successfully`);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(error instanceof Error ? error.message : "Failed to upload image");
        // Revert preview on error
        if (type === "icon") {
          setIconPreview(formData.icon || null);
          setPendingIconFile(null);
        } else {
          setBannerPreview(formData.bannerImage || null);
          setPendingBannerFile(null);
        }
      } finally {
        setUploadingImage({ type: null, loading: false });
      }
    }
  };

  const getNextAvailableOrder = useCallback(() => {
    if (serviceCategories.length === 0) return 1; // Minimum order is 1, not 0
    const existingOrders = serviceCategories.map(c => c.order || 0).filter(o => o > 0);
    if (existingOrders.length === 0) return 1;
    const maxOrder = Math.max(...existingOrders);
    return maxOrder + 1; // Always use max + 1 for new items
  }, [serviceCategories]);

  const handleCreateNew = () => {
    setFormData({
      sector: selectedSectorId,
      name: "",
      slug: "",
      order: getNextAvailableOrder(),
      description: "",
      icon: "",
      bannerImage: "",
      isActive: true,
      level: 3,
      categoryLevelMapping: [],
      subCategories: [],
    });
    setEditingServiceCategory(null);
    setIconPreview(null);
    setBannerPreview(null);
    setPendingIconFile(null);
    setPendingBannerFile(null);
    setIsModalOpen(true);
  };

  const handleViewSubCategories = (serviceCategory: ServiceCategory) => {
    setSelectedServiceCategory(serviceCategory);
    setSelectedParentSubCategory(null);
    setSubCategoryBreadcrumb([{ id: serviceCategory._id, name: serviceCategory.name, type: 'category' }]);
    setViewMode("subcategories");
    setSubCategoryPage(1);
    setSubCategorySearchTerm("");
    // Set Level 2 (Sub Category) as the first tab (selectedAttributeType = null)
      setSelectedAttributeType(null);
    fetchServiceSubCategories(serviceCategory._id, undefined);
  };

  const handleManageTitles = (serviceCategory: ServiceCategory) => {
    // Navigate to the service titles page with category ID as query parameter
    navigate(`/admin/service-titles?categoryId=${serviceCategory._id}`);
  };

  // Fetch subcategories for a specific level and load their titles
  const fetchSubCategoriesForTitles = async (serviceCategoryId: string, level: number, parentSubCategoryId?: string) => {
    try {
      setLoadingSubCategories(prev => ({ ...prev, [level]: true }));
      const params = new URLSearchParams();
      params.append('serviceCategoryId', serviceCategoryId);
      params.append('activeOnly', 'false');
      params.append('sortBy', 'order');
      params.append('sortOrder', 'asc');
      params.append('limit', '1000');

      if (level === 2) {
        params.append('level', '2');
        params.append('categoryLevel', '2');
        params.append('attributeType', '');
      } else {
        params.append('level', level.toString());
        params.append('categoryLevel', level.toString());
        if (parentSubCategoryId) {
          params.append('parentSubCategoryId', parentSubCategoryId);
        }
        // Get attributeType from categoryLevelMapping
        if (managingServiceCategory?.categoryLevelMapping) {
          const mapping = managingServiceCategory.categoryLevelMapping.find(m => m.level === level);
          if (mapping) {
            params.append('attributeType', mapping.attributeType);
          }
        }
      }

      const response = await fetch(
        resolveApiUrl(`/api/service-subcategories?${params.toString()}`),
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        const subCategories = data.serviceSubCategories || [];
        setSubCategoriesByLevel(prev => ({ ...prev, [level]: subCategories }));

        // Load titles for all subcategories at this level
        const titlesMap: Record<string, string[]> = {};
        for (const subCat of subCategories) {
          titlesMap[subCat._id] = subCat.serviceTitleSuggestions || [];
        }
        setSubCategoryTitles(prev => ({ ...prev, ...titlesMap }));
      }
    } catch (error) {
      console.error('Error fetching subcategories for titles:', error);
      toast.error('Failed to fetch subcategories');
    } finally {
      setLoadingSubCategories(prev => ({ ...prev, [level]: false }));
    }
  };

  // Load titles for a selected subcategory path
  const loadTitlesForPath = async (path: string[]) => {
    if (path.length === 0 || !selectedCategoryLevel) {
      setTitlesForSelectedPath([]);
      return;
    }

    try {
      const lastSubCategoryId = path[path.length - 1];
      const response = await fetch(
        resolveApiUrl(`/api/service-subcategories/${lastSubCategoryId}`),
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        const subCategory = data.serviceSubCategory;
        // Extract service title suggestions from the subcategory
        const suggestions = subCategory.serviceTitleSuggestions || [];
        setTitlesForSelectedPath(suggestions);
      }
    } catch (error) {
      console.error('Error loading service title suggestions for path:', error);
      setTitlesForSelectedPath([]);
    }
  };

  // Toggle subcategory expansion and load children
  const toggleSubCategoryExpansion = async (subCategoryId: string, level: number) => {
    const newExpanded = new Set(expandedSubCategories);

    if (newExpanded.has(subCategoryId)) {
      // Collapse - remove this and all descendants
      newExpanded.delete(subCategoryId);
      // Remove child levels from subCategoriesByLevel
      const nextLevel = level + 1;
      const maxLevel = managingServiceCategory?.level || 7;
      for (let i = nextLevel; i <= maxLevel; i++) {
        setSubCategoriesByLevel(prev => {
          const updated = { ...prev };
          delete updated[i];
          return updated;
        });
      }
    } else {
      // Expand - add to expanded set and fetch children
      newExpanded.add(subCategoryId);

      if (managingServiceCategory) {
        const nextLevel = level + 1;
        const maxLevel = managingServiceCategory.level || 7;
        if (nextLevel <= maxLevel) {
          await fetchSubCategoriesForTitles(managingServiceCategory._id, nextLevel, subCategoryId);
        }
      }
    }

    setExpandedSubCategories(newExpanded);
  };

  const handleManageAttributes = (serviceCategory: ServiceCategory) => {
    // Navigate to attributes management page (similar to titles)
    navigate(`/admin/service-attributes?categoryId=${serviceCategory._id}`);
  };

  const handleViewNestedSubCategories = (subCategory: ServiceSubCategory) => {
    if ((subCategory.level || 1) >= 7) {
      toast.error("Maximum nesting level (7) reached");
      return;
    }
    setSelectedParentSubCategory(subCategory);
    setSubCategoryBreadcrumb(prev => [...prev, { id: subCategory._id, name: subCategory.name, type: 'subcategory' }]);
    setSubCategoryPage(1);
    setSubCategorySearchTerm("");
    // Fetch nested subcategories with the parent subcategory's information
    // The child level will be parent's level + 1
    const parentLevel = subCategory.level || 1;
    const childLevel = parentLevel + 1;
    
    // Determine attributeType for the child level
    let childAttributeType: string | null = null;
    if (childLevel > 2 && selectedServiceCategory) {
      const nextMapping = selectedServiceCategory.categoryLevelMapping?.find(
        m => m.level === childLevel
      );
      if (nextMapping) {
        childAttributeType = nextMapping.attributeType;
      }
    }
    
    // Fetch with explicit level and attributeType to ensure correct filtering
    fetchServiceSubCategories(undefined, subCategory._id, childLevel, childAttributeType);
  };

  const handleBackToCategories = () => {
    setViewMode("categories");
    setSelectedServiceCategory(null);
    setSelectedParentSubCategory(null);
    setSubCategoryBreadcrumb([]);
    setServiceSubCategories([]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumb = subCategoryBreadcrumb.slice(0, index + 1);
    setSubCategoryBreadcrumb(newBreadcrumb);
    
    if (index === 0) {
      // Back to service category level
      const categoryItem = newBreadcrumb[0];
      if (categoryItem && categoryItem.type === 'category' && selectedServiceCategory) {
        setSelectedParentSubCategory(null);
        fetchServiceSubCategories(selectedServiceCategory._id, undefined);
      }
    } else {
      // Navigate to a nested subcategory
      const subCategoryItem = newBreadcrumb[index];
      if (subCategoryItem && subCategoryItem.type === 'subcategory') {
        const parentSubCategory = serviceSubCategories.find(sc => sc._id === subCategoryItem.id);
        if (parentSubCategory) {
          setSelectedParentSubCategory(parentSubCategory);
          // Calculate child level and attributeType
          const parentLevel = parentSubCategory.level || 1;
          const childLevel = parentLevel + 1;
          let childAttributeType: string | null = null;
          if (childLevel > 2 && selectedServiceCategory) {
            const nextMapping = selectedServiceCategory.categoryLevelMapping?.find(
              m => m.level === childLevel
            );
            if (nextMapping) {
              childAttributeType = nextMapping.attributeType;
            }
          }
          fetchServiceSubCategories(undefined, parentSubCategory._id, childLevel, childAttributeType);
        }
      }
    }
  };

  const handleCreateSubCategory = () => {
    if (!selectedServiceCategory) return;
    
    // If viewing nested subcategories (selectedParentSubCategory exists)
    // Create subcategory at parent's level + 1
    if (selectedParentSubCategory) {
      const parentLevel = selectedParentSubCategory.level || 1;
      const targetLevel = parentLevel + 1;
      
      if (targetLevel > 7) {
      toast.error("Maximum nesting level (7) reached");
      return;
    }
      
      // For nested subcategories, determine attributeType based on parent's level
      // Find the next level's attributeType from categoryLevelMapping
      let attributeType: string | undefined = undefined;
      let categoryLevel: number = targetLevel;
      
      // Level 3+ should have attributeType from categoryLevelMapping
      if (targetLevel > 2) {
        const nextMapping = selectedServiceCategory.categoryLevelMapping?.find(
          m => m.level === targetLevel
        );
        if (nextMapping) {
          attributeType = nextMapping.attributeType;
        } else {
          // If no mapping found, try to infer from parent's attributeType
          // This shouldn't happen in normal flow, but handle gracefully
          console.warn(`No categoryLevelMapping found for level ${targetLevel}`);
        }
      } else if (targetLevel === 2) {
        // Level 2: no attributeType
        attributeType = undefined;
      }
      
    setSubCategoryFormData({
      serviceCategory: selectedServiceCategory._id,
        parentSubCategory: selectedParentSubCategory._id, // Set parent automatically
      name: "",
      slug: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      bannerImage: "",
      icon: "",
      order: serviceSubCategories.length > 0 
        ? Math.max(...serviceSubCategories.map(sc => sc.order || 0)) + 1 
        : 1,
        level: targetLevel,
      isActive: true,
        attributeType: attributeType,
        categoryLevel: categoryLevel,
    });
    setEditingServiceSubCategory(null);
    setSubCategoryIconPreview(null);
    setSubCategoryBannerPreview(null);
      setIsSubCategoryModalOpen(true);
      return;
    }
    
    // For top-level subcategories (no selectedParentSubCategory)
    // Check if it's Level 2 tab (first tab - Sub Category)
    const isFirstTabNow = selectedAttributeType === null;
    
    // Determine target level and categoryLevel based on selected tab
    let targetLevel: number;
    let categoryLevel: number;
    let attributeType: string | undefined = undefined;
    
    if (isFirstTabNow) {
      // Level 2 tab (Sub Category): create Level 2 subcategory
      targetLevel = 2;
      categoryLevel = 2;
      attributeType = undefined; // Level 2 has no attributeType
    } else if (selectedAttributeType) {
      // Other tabs: find the level from categoryLevelMapping
      const mapping = selectedServiceCategory.categoryLevelMapping?.find(
        m => m.attributeType === selectedAttributeType
      );
      if (!mapping) {
        toast.error("Invalid tab configuration");
        return;
      }
      targetLevel = mapping.level; // Level matches categoryLevelMapping level
      categoryLevel = mapping.level;
      attributeType = selectedAttributeType;
    } else {
      toast.error("Invalid tab selection");
      return;
    }
    
    if (targetLevel > 7) {
      toast.error("Maximum nesting level (7) reached");
      return;
    }
    
    // For Level 3-7, parentSubCategory is required - set default from selectedParentSubCategory or first available parent
    let defaultParentSubCategory = "";
    if (!isFirstTabNow && targetLevel >= 3) {
      if (selectedParentSubCategory) {
        defaultParentSubCategory = selectedParentSubCategory._id;
      } else if (serviceSubCategories.length > 0) {
        // Use first available parent subcategory from current level
        defaultParentSubCategory = serviceSubCategories[0]._id;
      }
    }
    
    setSubCategoryFormData({
      serviceCategory: selectedServiceCategory._id,
      parentSubCategory: defaultParentSubCategory, // Set default parent for Level 3-7
      name: "",
      slug: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      bannerImage: "",
      icon: "",
      order: serviceSubCategories.length > 0 
        ? Math.max(...serviceSubCategories.map(sc => sc.order || 0)) + 1 
        : 1,
      level: targetLevel,
      isActive: true,
      attributeType: attributeType,
      categoryLevel: categoryLevel,
    });
    setEditingServiceSubCategory(null);
    setSubCategoryIconPreview(null);
    setSubCategoryBannerPreview(null);
    
    // Fetch parent level subcategories if not first tab (for parent selection)
    if (!isFirstTabNow) {
      fetchParentSubCategories();
    }
    
    setIsSubCategoryModalOpen(true);
  };

  const handleEditSubCategory = (subCategory: ServiceSubCategory) => {
    const parentSubCategoryId = typeof subCategory.parentSubCategory === "string"
      ? subCategory.parentSubCategory
      : (subCategory.parentSubCategory as ServiceSubCategory)?._id || "";
    setSubCategoryFormData({
      serviceCategory: typeof subCategory.serviceCategory === "string"
        ? subCategory.serviceCategory
        : (subCategory.serviceCategory as ServiceCategory)._id,
      parentSubCategory: parentSubCategoryId,
      name: subCategory.name,
      slug: subCategory.slug || generateSlug(subCategory.name),
      description: subCategory.description || "",
      metaTitle: subCategory.metaTitle || "",
      metaDescription: subCategory.metaDescription || "",
      bannerImage: subCategory.bannerImage || "",
      icon: subCategory.icon || "",
      order: subCategory.order || 0,
      level: subCategory.level || 1,
      isActive: subCategory.isActive,
      attributeType: subCategory.attributeType,
      categoryLevel: (subCategory as any).categoryLevel,
      serviceTitleSuggestions: (subCategory as any).serviceTitleSuggestions || [],
    });
    setEditingServiceSubCategory(subCategory);
    setSubCategoryIconPreview(subCategory.icon || null);
    setSubCategoryBannerPreview(subCategory.bannerImage || null);
    setIsSubCategoryModalOpen(true);
  };

  const handleSaveSubCategory = async () => {
    if (!subCategoryFormData.name.trim()) {
      toast.error("Child category name is required");
      return;
    }

    if (!subCategoryFormData.slug.trim()) {
      subCategoryFormData.slug = generateSlug(subCategoryFormData.name);
    }

    // Validate parentSubCategory for Level 3-7 (required)
    if (subCategoryFormData.level >= 3 && subCategoryFormData.level <= 7) {
      if (!subCategoryFormData.parentSubCategory || subCategoryFormData.parentSubCategory.trim() === "") {
        toast.error("Parent category is required for Level 3-7 subcategories");
        return;
      }
    }

    try {
      setIsSaving(true);
      
      const url = editingServiceSubCategory
        ? resolveApiUrl(`/api/service-subcategories/${editingServiceSubCategory._id}`)
        : resolveApiUrl("/api/service-subcategories");
      
      const method = editingServiceSubCategory ? "PUT" : "POST";

      // Build payload - ensure level, categoryLevel, and attributeType are correct
      const payload: any = {
        name: subCategoryFormData.name.trim(),
        slug: subCategoryFormData.slug.trim(),
        description: subCategoryFormData.description.trim(),
        metaTitle: subCategoryFormData.metaTitle.trim(),
        metaDescription: subCategoryFormData.metaDescription.trim(),
        bannerImage: subCategoryFormData.bannerImage.trim(),
        icon: subCategoryFormData.icon.trim(),
        order: subCategoryFormData.order,
        level: subCategoryFormData.level,
        isActive: subCategoryFormData.isActive,
        categoryLevel: subCategoryFormData.categoryLevel || subCategoryFormData.level,
        serviceTitleSuggestions: subCategoryFormData.serviceTitleSuggestions || [],
      };
      
      // Handle attributeType - include it even if null for Level 2
      if (subCategoryFormData.attributeType !== undefined) {
        payload.attributeType = subCategoryFormData.attributeType;
      } else if (subCategoryFormData.level === 2) {
        payload.attributeType = null;
      }

      // Handle parentSubCategory and serviceCategory
      // When parentSubCategory is set, serviceCategory should be null (backend will handle it)
      if (subCategoryFormData.parentSubCategory && subCategoryFormData.parentSubCategory.trim() !== "") {
        payload.parentSubCategory = subCategoryFormData.parentSubCategory;
        // When parentSubCategory is set, ensure level is parent's level + 1
        // This is already set in handleCreateSubCategory, but ensure it's correct
        if (selectedParentSubCategory) {
          const expectedLevel = (selectedParentSubCategory.level || 1) + 1;
          payload.level = expectedLevel;
          payload.categoryLevel = expectedLevel;
          
          // Determine attributeType for the target level
          if (expectedLevel > 2 && selectedServiceCategory) {
            const nextMapping = selectedServiceCategory.categoryLevelMapping?.find(
              m => m.level === expectedLevel
            );
            if (nextMapping) {
              payload.attributeType = nextMapping.attributeType;
      } else {
              // If no mapping found, keep the one from formData or set to null
              payload.attributeType = subCategoryFormData.attributeType || null;
            }
          } else if (expectedLevel === 2) {
            // Level 2: no attributeType
            payload.attributeType = null;
          } else {
            payload.attributeType = subCategoryFormData.attributeType || null;
          }
        }
        // When parentSubCategory is set, still include serviceCategory for reference
        // but backend will set it to null
        payload.serviceCategory = subCategoryFormData.serviceCategory || selectedServiceCategory?._id;
      } else {
        // No parentSubCategory - ensure it's explicitly null
        payload.parentSubCategory = null;
        // Always include serviceCategory when no parent
        payload.serviceCategory = subCategoryFormData.serviceCategory || selectedServiceCategory?._id;
        if (!payload.serviceCategory) {
          toast.error("Service category is required");
          setIsSaving(false);
          return;
        }
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingServiceSubCategory ? "Child category updated successfully" : "Child category created successfully");
        setIsSubCategoryModalOpen(false);
        
        // Reset to first page to see the newly created item
        setSubCategoryPage(1);
        
        // Force a refresh with the current tab's filter
        // Use a small delay to ensure state updates are processed
        setTimeout(() => {
        if (selectedParentSubCategory) {
            // For nested subcategories, fetch by parent with explicit level and attributeType
            const parentLevel = selectedParentSubCategory.level || 1;
            const childLevel = parentLevel + 1;
            let childAttributeType: string | null = null;
            if (childLevel > 2 && selectedServiceCategory) {
              const nextMapping = selectedServiceCategory.categoryLevelMapping?.find(
                m => m.level === childLevel
              );
              if (nextMapping) {
                childAttributeType = nextMapping.attributeType;
              }
            }
            fetchServiceSubCategories(undefined, selectedParentSubCategory._id, childLevel, childAttributeType);
        } else if (selectedServiceCategory) {
            // For top-level subcategories, fetch with current tab's filter
            // fetchServiceSubCategories will use the current selectedAttributeType from closure
          fetchServiceSubCategories(selectedServiceCategory._id, undefined);
        }
        }, 50);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save child category");
      }
    } catch (error) {
      console.error("Error saving sub category:", error);
      toast.error("Failed to save child category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (serviceCategory: ServiceCategory) => {
    setFormData({
      sector: typeof serviceCategory.sector === "string" ? serviceCategory.sector : serviceCategory.sector._id,
      name: serviceCategory.name,
      slug: serviceCategory.slug || generateSlug(serviceCategory.name),
      order: serviceCategory.order,
      description: serviceCategory.description || "",
      metaTitle: (serviceCategory as any).metaTitle || "",
      metaDescription: (serviceCategory as any).metaDescription || "",
      icon: serviceCategory.icon || "",
      bannerImage: serviceCategory.bannerImage || "",
      isActive: serviceCategory.isActive,
      level: serviceCategory.level || 3,
      categoryLevelMapping: serviceCategory.categoryLevelMapping || [],
      serviceIdealFor: (serviceCategory as any).serviceIdealFor || [],
      extraServices: (serviceCategory as any).extraServices || [],
      pricePerUnit: (serviceCategory as any).pricePerUnit || { enabled: false, units: [] },
    });
    setEditingServiceCategory(serviceCategory);
    setIconPreview(serviceCategory.icon || null);
    setBannerPreview(serviceCategory.bannerImage || null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (serviceCategory: ServiceCategory) => {
    if (!serviceCategory._id) return;
    
    const newStatus = !serviceCategory.isActive;
    const action = newStatus ? "activate" : "deactivate";
    
    setConfirmModal({
      isOpen: true,
      type: newStatus ? "activate" : "deactivate",
      title: newStatus ? "Activate Service Category" : "Deactivate Service Category",
      message: `Are you sure you want to ${action} "${serviceCategory.name}"?`,
      onConfirm: async () => {
        try {
          const response = await fetch(resolveApiUrl(`/api/service-categories/${serviceCategory._id}`), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ isActive: newStatus }),
          });

          if (response.ok) {
            toast.success(`Service category ${action}d successfully`);
            if (selectedSectorId) {
              fetchServiceCategories(selectedSectorId);
            }
          } else {
            const error = await response.json();
            toast.error(error.error || `Failed to ${action} service category`);
          }
        } catch (error) {
          console.error(`Error ${action}ing service category:`, error);
          toast.error(`Failed to ${action} service category`);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      itemName: serviceCategory.name,
    });
  };

  const handleDelete = async (serviceCategory: ServiceCategory) => {
    if (!serviceCategory._id) return;
    
    setConfirmModal({
      isOpen: true,
      type: "delete",
      title: "Delete Service Category",
      message: `Are you sure you want to delete "${serviceCategory.name}"? This will also delete all associated child categories. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await fetch(resolveApiUrl(`/api/service-categories/${serviceCategory._id}?hardDelete=true`), {
            method: "DELETE",
            credentials: "include",
          });

          if (response.ok) {
            toast.success("Service category deleted successfully");
            if (selectedSectorId) {
              fetchServiceCategories(selectedSectorId);
            }
          } else {
            const error = await response.json();
            toast.error(error.error || "Failed to delete service category");
          }
        } catch (error) {
          console.error("Error deleting service category:", error);
          toast.error("Failed to delete service category");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      itemName: serviceCategory.name,
    });
  };

  const handleSave = async () => {
    if (!formData.sector) {
      toast.error("Please select a sector");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Service category name is required");
      return;
    }

    if (!formData.slug.trim()) {
      formData.slug = generateSlug(formData.name);
    }

    try {
      setIsSaving(true);
      
      // First, create or update the service category
      const serviceCategoryUrl = editingServiceCategory
        ? resolveApiUrl(`/api/service-categories/${editingServiceCategory._id}`)
        : resolveApiUrl("/api/service-categories");
      
      const serviceCategoryMethod = editingServiceCategory ? "PUT" : "POST";

      const serviceCategoryPayload = {
        sector: formData.sector,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        order: formData.order,
        description: (formData.description || "").trim(),
        metaTitle: (formData.metaTitle || "").trim(),
        metaDescription: (formData.metaDescription || "").trim(),
        icon: (formData.icon || "").trim(),
        bannerImage: (formData.bannerImage || "").trim(),
        isActive: formData.isActive,
        level: formData.level,
        categoryLevelMapping: formData.categoryLevelMapping || [],
        serviceIdealFor: formData.serviceIdealFor || [],
        extraServices: formData.extraServices || [],
        pricePerUnit: formData.pricePerUnit || { enabled: false, units: [] },
      };

      console.log("Creating service category with payload:", serviceCategoryPayload);

      const serviceCategoryResponse = await fetch(serviceCategoryUrl, {
        method: serviceCategoryMethod,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(serviceCategoryPayload),
      });

      if (!serviceCategoryResponse.ok) {
        const errorText = await serviceCategoryResponse.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { error: errorText || "Failed to save service category" };
        }
        console.error("Service category creation error:", error);
        throw new Error(error.error || error.message || "Failed to save service category");
      }

      const serviceCategoryData = await serviceCategoryResponse.json();
      const savedServiceCategory = serviceCategoryData.serviceCategory;

      // Upload pending images if any (for new categories)
      if (pendingIconFile) {
        try {
          const imageFormData = new FormData();
          imageFormData.append("image", pendingIconFile);

          const imageResponse = await fetch(
            resolveApiUrl(`/api/admin/upload-image/icon/service-category/${savedServiceCategory._id}`),
            {
              method: "POST",
              credentials: "include",
              body: imageFormData,
            }
          );

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            // Update the saved category with the icon URL
            await fetch(resolveApiUrl(`/api/service-categories/${savedServiceCategory._id}`), {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ icon: imageData.imageUrl }),
            });
            setPendingIconFile(null);
          }
        } catch (error) {
          console.error("Error uploading icon:", error);
          // Don't fail the whole save operation if image upload fails
        }
      }

      if (pendingBannerFile) {
        try {
          const imageFormData = new FormData();
          imageFormData.append("image", pendingBannerFile);

          const imageResponse = await fetch(
            resolveApiUrl(`/api/admin/upload-image/banner/service-category/${savedServiceCategory._id}`),
            {
              method: "POST",
              credentials: "include",
              body: imageFormData,
            }
          );

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            console.log("Banner image upload response:", imageData);
            // The bannerImage is already saved by the upload endpoint, but we'll update it to be sure
            if (imageData.imageUrl) {
              const updateResponse = await fetch(resolveApiUrl(`/api/service-categories/${savedServiceCategory._id}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ bannerImage: imageData.imageUrl }),
              });
              if (updateResponse.ok) {
                const updatedData = await updateResponse.json();
                console.log("Updated service category with banner:", updatedData.serviceCategory);
                // Update the saved category reference
                savedServiceCategory.bannerImage = imageData.imageUrl;
              } else {
                console.error("Failed to update service category with banner URL");
              }
            }
            setPendingBannerFile(null);
          } else {
            const errorData = await imageResponse.json();
            console.error("Banner image upload failed:", errorData);
          }
        } catch (error) {
          console.error("Error uploading banner:", error);
          // Don't fail the whole save operation if image upload fails
        }
      }

      // Attributes, extraServices, and pricePerUnit are already included in serviceCategoryPayload

      toast.success(editingServiceCategory ? "Service category updated successfully" : "Service category created successfully");
      setIsModalOpen(false);
      // Clear pending files
      setPendingIconFile(null);
      setPendingBannerFile(null);
      
      if (!editingServiceCategory) {
        // New category created - redirect to subcategories view
        // First refresh the list to get the full category data
        if (selectedSectorId) {
          // Fetch updated categories to get the full category with all fields
          const refreshResponse = await fetch(
            resolveApiUrl(`/api/service-categories/${savedServiceCategory._id}?includeSector=true&includeSubCategories=true`),
            { credentials: "include" }
          );
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const fullServiceCategory = refreshData.serviceCategory;
            
            // Navigate to subcategories view
            setSelectedServiceCategory(fullServiceCategory);
            setSelectedParentSubCategory(null);
            setSubCategoryBreadcrumb([{ id: fullServiceCategory._id, name: fullServiceCategory.name, type: 'category' }]);
            setViewMode("subcategories");
            setSubCategoryPage(1);
            setSubCategorySearchTerm("");
            
            // Set Level 2 (Sub Category) as the first tab (selectedAttributeType = null)
            setSelectedAttributeType(null);
            
            // Fetch subcategories
            fetchServiceSubCategories(fullServiceCategory._id, undefined);
          } else {
            // If refresh fails, use the saved category data
            setSelectedServiceCategory(savedServiceCategory);
            setSelectedParentSubCategory(null);
            setSubCategoryBreadcrumb([{ id: savedServiceCategory._id, name: savedServiceCategory.name, type: 'category' }]);
            setViewMode("subcategories");
            setSubCategoryPage(1);
            setSubCategorySearchTerm("");
            
            // Set Level 2 (Sub Category) as the first tab (selectedAttributeType = null)
            setSelectedAttributeType(null);
            
            fetchServiceSubCategories(savedServiceCategory._id, undefined);
          }
        } else {
          // If no sector selected, just refresh the list
        setPage(1);
        setSortBy("order");
        setSortOrder("desc");
      }
      } else {
        // Editing existing category - just refresh the list
      if (selectedSectorId) {
        // Small delay to ensure state updates and database is updated
        setTimeout(() => {
          fetchServiceCategories(selectedSectorId);
        }, 100);
        }
      }
    } catch (error: any) {
      console.error("Error saving service category:", error);
      toast.error(error.message || "Failed to save service category");
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
    setFormData((prev) => ({
      ...prev,
      subCategories: prev.subCategories.filter((_, i) => i !== index),
    }));
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

    const oldIndex = serviceCategories.findIndex((serviceCategory) => serviceCategory._id === active.id);
    const newIndex = serviceCategories.findIndex((serviceCategory) => serviceCategory._id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for better UX
    const newServiceCategories = arrayMove(serviceCategories, oldIndex, newIndex);
    
    // Calculate new order values based on new positions
    const movedServiceCategory = serviceCategories[oldIndex];
    const targetServiceCategory = serviceCategories[newIndex];
    
    const serviceCategoriesToUpdate: { id: string; order: number }[] = [];
    
    if (oldIndex < newIndex) {
      // Moving down: shift orders up for service categories between old and new positions
      for (let i = oldIndex + 1; i <= newIndex; i++) {
        serviceCategoriesToUpdate.push({
          id: serviceCategories[i]._id!,
          order: serviceCategories[i - 1].order,
        });
      }
      serviceCategoriesToUpdate.push({
        id: movedServiceCategory._id!,
        order: targetServiceCategory.order,
      });
    } else {
      // Moving up: shift orders down for service categories between new and old positions
      for (let i = newIndex; i < oldIndex; i++) {
        serviceCategoriesToUpdate.push({
          id: serviceCategories[i]._id!,
          order: serviceCategories[i + 1].order,
        });
      }
      serviceCategoriesToUpdate.push({
        id: movedServiceCategory._id!,
        order: targetServiceCategory.order,
      });
    }
    
    // Update local state
    setServiceCategories(newServiceCategories);

    // Save to backend
    try {
      setIsUpdatingOrder(true);
      const response = await fetch(resolveApiUrl('/api/service-categories/bulk/order'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ serviceCategories: serviceCategoriesToUpdate }),
      });

      if (response.ok) {
        toast.success('Service category order updated successfully');
        if (sortBy !== 'order' || sortOrder !== 'desc') {
          setSortBy('order');
          setSortOrder('desc');
        }
        setTimeout(() => {
          if (selectedSectorId) {
            fetchServiceCategories(selectedSectorId);
          }
        }, 100);
      } else {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { error: errorText || 'Failed to update service category order' };
        }
        
        setServiceCategories(serviceCategories);
        toast.error(error.error || error.details || 'Failed to update service category order');
      }
    } catch (error) {
      setServiceCategories(serviceCategories);
      toast.error('Failed to update service category order');
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
  const getCurrentServiceCategories = (sectorId: string) => {
    return serviceCategories.filter((cat) => {
      const catSectorId = typeof cat.sector === "string" ? cat.sector : cat.sector._id;
      return catSectorId === sectorId;
    });
  };

  if (loading && sectors.length === 0) {
    return (
      <AdminPageLayout title="Service Categories" description="Manage service categories and child categories">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <>
      <AdminPageLayout
        title="Service Categories"
        description="Manage service categories and child categories by sector"
        tabs={sectorTabs}
        defaultTab={selectedSectorId}
        enableTabSlider={true}
        onTabChange={handleTabChange}
      >
        {(tab) => {
          // Show subcategories view if in subcategories mode
          if (viewMode === "subcategories" && selectedServiceCategory) {
            return (
              <div className="space-y-6">
                {/* Back Button and Breadcrumb */}
                <div className="flex items-center gap-4 flex-wrap">
                  <Button
                    onClick={handleBackToCategories}
                    variant="outline"
                    className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Service Categories
                  </Button>
                  {/* Breadcrumb */}
                  {subCategoryBreadcrumb.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {subCategoryBreadcrumb.map((item, index) => (
                        <React.Fragment key={item.id}>
                          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                          <Button
                            variant="ghost"
                            onClick={() => handleBreadcrumbClick(index)}
                            className="text-sm text-[#FE8A0F] hover:bg-[#FE8A0F]/10 p-1 h-auto"
                          >
                            {item.name}
                          </Button>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  <div className="ml-auto">
                    <h2 className="text-xl font-bold text-black dark:text-white">
                      {selectedParentSubCategory 
                        ? `Child Categories of ${selectedParentSubCategory.name}`
                        : `Child Categories - ${selectedServiceCategory.name}`
                      }
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedParentSubCategory 
                        ? `Manage nested child categories (Level ${(selectedParentSubCategory.level || 1) + 1})`
                        : "Manage child categories for this service category"
                      }
                    </p>
                  </div>
                </div>

                {/* Tabs for Child Categories (Level 2-6, only when no parent subcategory) */}
                {!selectedParentSubCategory && selectedServiceCategory && (
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2 overflow-x-auto">
                      {/* Level 2 Tab - Sub Category (First Tab) */}
                      {selectedServiceCategory.level && selectedServiceCategory.level >= 2 && (
                        <button
                          key="level-2-subcategory"
                          onClick={() => {
                            setSelectedAttributeType(null); // Level 2 has no attributeType
                            setSubCategoryPage(1);
                            setSubCategorySearchTerm("");
                            fetchServiceSubCategories(selectedServiceCategory._id, undefined);
                          }}
                          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            selectedAttributeType === null
                              ? 'border-[#FE8A0F] text-[#FE8A0F]'
                              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-[#FE8A0F] hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          Sub Category
                        </button>
                      )}

                      {/* Level 3-7 Tabs from categoryLevelMapping */}
                      {selectedServiceCategory.categoryLevelMapping
                        ?.filter(m => m.level >= 3 && m.level <= 7) // Show up to level 7
                        .sort((a, b) => a.level - b.level)
                        .map((mapping) => {
                          const attributeTypeLabels: Record<string, string> = {
                            serviceType: 'Service Type',
                            size: 'Size',
                            frequency: 'Frequency',
                            make: 'Make',
                            model: 'Model',
                            brand: 'Brand',
                          };
                          const label = mapping.title || attributeTypeLabels[mapping.attributeType] || mapping.attributeType;
                          return (
                            <button
                              key={`${mapping.level}-${mapping.attributeType}`}
                              onClick={() => {
                                setSelectedAttributeType(mapping.attributeType);
                                setSubCategoryPage(1);
                                setSubCategorySearchTerm("");
                                fetchServiceSubCategories(selectedServiceCategory._id, undefined);
                                // fetchParentSubCategories will be called via useEffect when selectedAttributeType changes
                              }}
                              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                selectedAttributeType === mapping.attributeType
                                  ? 'border-[#FE8A0F] text-[#FE8A0F]'
                                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-[#FE8A0F] hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Search and Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-black dark:text-white whitespace-nowrap">
                      Total: <span className="text-[#FE8A0F] font-semibold">{subCategoryTotal}</span> subcategories
                    </p>
                  </div>
                  <div className="relative flex-shrink-0" style={{ width: '200px' }}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 dark:text-white/50" />
                    <Input
                      type="text"
                      placeholder="Search"
                      value={subCategorySearchTerm}
                      onChange={(e) => setSubCategorySearchTerm(e.target.value)}
                      className="pl-10 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="subCategoryRowsPerPage" className="text-sm text-black dark:text-white whitespace-nowrap">
                      Rows per page:
                    </Label>
                    <Select value={limit.toString()} onValueChange={(value) => {
                      setLimit(parseInt(value));
                      setSubCategoryPage(1);
                    }}>
                      <SelectTrigger id="subCategoryRowsPerPage" className="w-20 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow">
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
                      onClick={handleCreateSubCategory}
                      className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white border-0 shadow-lg transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Child Category
                    </Button>
                  </div>
                </div>

                {/* Child Categories Table */}
                <div className="rounded-3xl border-0 bg-white dark:bg-black p-6 shadow-xl shadow-[#FE8A0F]/20">
                  {serviceSubCategories.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-black dark:text-white">No child categories found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-0 hover:bg-transparent shadow-sm">
                            <TableHead className="text-[#FE8A0F] font-semibold">Order</TableHead>
                            <TableHead className="text-[#FE8A0F] font-semibold">Name</TableHead>
                            <TableHead className="text-[#FE8A0F] font-semibold">Parent Category</TableHead>
                            <TableHead className="text-[#FE8A0F] font-semibold">Slug</TableHead>
                            <TableHead className="text-[#FE8A0F] font-semibold">Icon</TableHead>
                            <TableHead className="text-[#FE8A0F] font-semibold">Banner Image</TableHead>
                            <TableHead className="text-[#FE8A0F] font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceSubCategories.map((subCategory) => {
                            // Get parent category name
                            // If parentSubCategory exists, use it; otherwise use serviceCategory name
                            const parentName = (() => {
                              // If parentSubCategory is populated (object), use its name
                              if (subCategory.parentSubCategory && typeof subCategory.parentSubCategory === 'object' && 'name' in subCategory.parentSubCategory) {
                                return (subCategory.parentSubCategory as any).name;
                              }
                              // If parentSubCategory is just an ID, try to find it in the current list
                              if (subCategory.parentSubCategory && typeof subCategory.parentSubCategory === 'string') {
                                // Try to find the parent in the current subcategories list
                                const parent = serviceSubCategories.find(sc => sc._id === subCategory.parentSubCategory);
                                if (parent) {
                                  return parent.name;
                                }
                              }
                              // No parent subcategory - use serviceCategory name
                              if (subCategory.serviceCategory) {
                                if (typeof subCategory.serviceCategory === 'object' && 'name' in subCategory.serviceCategory) {
                                  return (subCategory.serviceCategory as any).name;
                                }
                                // If serviceCategory is just an ID, use selectedServiceCategory
                                if (selectedServiceCategory && typeof subCategory.serviceCategory === 'string' && subCategory.serviceCategory === selectedServiceCategory._id) {
                                  return selectedServiceCategory.name;
                                }
                              }
                              // Fallback to selectedServiceCategory if available
                              if (selectedServiceCategory) {
                                return selectedServiceCategory.name;
                              }
                              return "";
                            })();

                            return (
                            <TableRow key={subCategory._id} className="border-0 hover:bg-gray-50 dark:hover:bg-gray-900">
                              <TableCell className="text-black dark:text-white">{subCategory.order || 0}</TableCell>
                              <TableCell className="text-black dark:text-white font-medium">{subCategory.name}</TableCell>
                              <TableCell className="text-black dark:text-white">
                                {parentName ? (
                                  <span className="text-sm text-gray-600 dark:text-gray-400" title={parentName}>
                                    {parentName.length > 30 ? parentName.substring(0, 30) + "..." : parentName}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-black dark:text-white">
                                {subCategory.slug ? (
                                  <span className="truncate" title={subCategory.slug}>
                                    {subCategory.slug.length > 20 ? subCategory.slug.substring(0, 20) + "..." : subCategory.slug}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-black dark:text-white">
                                {subCategory.icon ? (
                                  <img src={subCategory.icon} alt="Icon" className="w-8 h-8 object-cover rounded" />
                                ) : (
                                  <span className="text-gray-400 text-sm">No icon</span>
                                )}
                              </TableCell>
                              <TableCell className="text-black dark:text-white">
                                {subCategory.bannerImage ? (
                                  <img src={subCategory.bannerImage} alt="Banner" className="w-16 h-8 object-cover rounded" />
                                ) : (
                                  <span className="text-gray-400 text-sm">No image</span>
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
                                    {/* View Category menu for all subcategory levels */}
                                    {selectedServiceCategory && subCategory.slug && (() => {
                                      // Get sector slug from selectedServiceCategory
                                      let sectorSlug: string | undefined;
                                      if (typeof selectedServiceCategory.sector === 'object' && selectedServiceCategory.sector !== null) {
                                        sectorSlug = selectedServiceCategory.sector.slug;
                                      } else if (typeof selectedServiceCategory.sector === 'string') {
                                        const sector = sectors.find(s => s._id === selectedServiceCategory.sector);
                                        sectorSlug = sector?.slug;
                                      }
                                      
                                      const serviceCategorySlug = selectedServiceCategory.slug;
                                      
                                      if (sectorSlug && serviceCategorySlug) {
                                        // Build URL path with parent subcategory slugs if available
                                        let urlPath = `/sector/${sectorSlug}/${serviceCategorySlug}`;
                                        
                                        // If we have a parent subcategory, add its slug to the path
                                        if (selectedParentSubCategory?.slug) {
                                          urlPath += `/${selectedParentSubCategory.slug}`;
                                        }
                                        
                                        // Add current subcategory slug
                                        urlPath += `/${subCategory.slug}`;
                                        
                                        return (
                                          <DropdownMenuItem
                                            onClick={() => window.open(urlPath, '_blank', 'noopener,noreferrer')}
                                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Category
                                          </DropdownMenuItem>
                                        );
                                      }
                                      return null;
                                    })()}
                                    {(subCategory.level || 1) < 7 && (
                                      <DropdownMenuItem
                                        onClick={() => handleViewNestedSubCategories(subCategory)}
                                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                                      >
                                        <FolderTree className="h-4 w-4 mr-2" />
                                        Child Categories
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => handleEditSubCategory(subCategory)}
                                      className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          type: subCategory.isActive ? "deactivate" : "activate",
                                          title: subCategory.isActive ? "Deactivate Child Category" : "Activate Child Category",
                                          message: `Are you sure you want to ${subCategory.isActive ? "deactivate" : "activate"} "${subCategory.name}"?`,
                                          onConfirm: async () => {
                                            try {
                                              const response = await fetch(resolveApiUrl(`/api/service-subcategories/${subCategory._id}`), {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                credentials: "include",
                                                body: JSON.stringify({ isActive: !subCategory.isActive }),
                                              });
                                              if (response.ok) {
                                                toast.success(`Child category ${subCategory.isActive ? "deactivated" : "activated"} successfully`);
                                                if (selectedParentSubCategory) {
                                                  // Calculate child level and attributeType
                                                  const parentLevel = selectedParentSubCategory.level || 1;
                                                  const childLevel = parentLevel + 1;
                                                  let childAttributeType: string | null = null;
                                                  if (childLevel > 2 && selectedServiceCategory) {
                                                    const nextMapping = selectedServiceCategory.categoryLevelMapping?.find(
                                                      m => m.level === childLevel
                                                    );
                                                    if (nextMapping) {
                                                      childAttributeType = nextMapping.attributeType;
                                                    }
                                                  }
                                                  fetchServiceSubCategories(undefined, selectedParentSubCategory._id, childLevel, childAttributeType);
                                                } else if (selectedServiceCategory) {
                                                  fetchServiceSubCategories(selectedServiceCategory._id, undefined);
                                                }
                                              } else {
                                                const error = await response.json();
                                                toast.error(error.error || "Failed to update child category");
                                              }
                                            } catch (error) {
                                              toast.error("Failed to update child category");
                                            } finally {
                                              setConfirmModal({ ...confirmModal, isOpen: false });
                                            }
                                          },
                                          itemName: subCategory.name,
                                        });
                                      }}
                                      className={subCategory.isActive ? "text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer" : "text-green-600 dark:text-green-400 hover:bg-green-500/10 cursor-pointer"}
                                    >
                                      {subCategory.isActive ? (
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
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          type: "delete",
                                          title: "Delete Child Category",
                                          message: `Are you sure you want to delete "${subCategory.name}"? This action cannot be undone.`,
                                          onConfirm: async () => {
                                            try {
                                              const response = await fetch(resolveApiUrl(`/api/service-subcategories/${subCategory._id}?hardDelete=true`), {
                                                method: "DELETE",
                                                credentials: "include",
                                              });
                                              if (response.ok) {
                                                toast.success("Child category deleted successfully");
                                                if (selectedParentSubCategory) {
                                                  // Calculate child level and attributeType
                                                  const parentLevel = selectedParentSubCategory.level || 1;
                                                  const childLevel = parentLevel + 1;
                                                  let childAttributeType: string | null = null;
                                                  if (childLevel > 2 && selectedServiceCategory) {
                                                    const nextMapping = selectedServiceCategory.categoryLevelMapping?.find(
                                                      m => m.level === childLevel
                                                    );
                                                    if (nextMapping) {
                                                      childAttributeType = nextMapping.attributeType;
                                                    }
                                                  }
                                                  fetchServiceSubCategories(undefined, selectedParentSubCategory._id, childLevel, childAttributeType);
                                                } else if (selectedServiceCategory) {
                                                  fetchServiceSubCategories(selectedServiceCategory._id, undefined);
                                                }
                                              } else {
                                                const error = await response.json();
                                                toast.error(error.error || "Failed to delete child category");
                                              }
                                            } catch (error) {
                                              toast.error("Failed to delete child category");
                                            } finally {
                                              setConfirmModal({ ...confirmModal, isOpen: false });
                                            }
                                          },
                                          itemName: subCategory.name,
                                        });
                                      }}
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
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Pagination */}
                  {subCategoryTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-black dark:text-white">
                        Page <span className="text-[#FE8A0F] font-semibold">{subCategoryPage}</span> of <span className="text-[#FE8A0F] font-semibold">{subCategoryTotalPages}</span>
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSubCategoryPage((p) => Math.max(1, p - 1))}
                          disabled={subCategoryPage === 1}
                          className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSubCategoryPage((p) => Math.min(subCategoryTotalPages, p + 1))}
                          disabled={subCategoryPage === subCategoryTotalPages}
                          className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
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
          }

          const currentServiceCategories = getCurrentServiceCategories(tab);

          return (
            <div className="space-y-6">
              {/* Search and Controls - All in one row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-black dark:text-white whitespace-nowrap">
                    Total: <span className="text-[#FE8A0F] font-semibold">{total}</span> service categories
                  </p>
                </div>
                <div className="relative flex-shrink-0" style={{ width: '200px' }}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 dark:text-white/50" />
                  <Input
                    type="text"
                    placeholder="Search"
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
                {currentServiceCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-black dark:text-white">No service categories found</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={currentServiceCategories.map(cat => cat._id || '')}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-0 hover:bg-transparent shadow-sm">
                              <SortableHeader column="order" label="Order" />
                              <SortableHeader column="name" label="Service Category Name" />
                              <TableHead className="text-[#FE8A0F] font-semibold">Subcategories</TableHead>
                              <TableHead className="text-[#FE8A0F] font-semibold">Slug</TableHead>
                              <TableHead className="text-[#FE8A0F] font-semibold">Icon</TableHead>
                              <TableHead className="text-[#FE8A0F] font-semibold">Banner Image</TableHead>
                              <TableHead className="text-[#FE8A0F] font-semibold text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentServiceCategories.map((serviceCategory) => (
                              <SortableServiceCategoryRow
                                key={serviceCategory._id}
                                serviceCategory={serviceCategory}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleActive={handleToggleActive}
                                onViewSubCategories={handleViewSubCategories}
                                onManageTitles={handleManageTitles}
                                onManageAttributes={handleManageAttributes}
                                sectors={sectors}
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
              {editingServiceCategory ? "Edit Service Category" : "Create New Service Category"}
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
                  Service Category Name <span className="text-red-500">*</span>
                </Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Plumbing"
                    className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                  />
              </div>
              <div>
                <Label htmlFor="slug" className="text-black dark:text-white">
                  Slug <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Auto-generated from name)</span>
                </Label>
                  <Input
                    id="slug"
                    value={formData.slug || ""}
                    disabled
                    placeholder="plumbing"
                    className="mt-1 bg-gray-100 dark:bg-gray-800 border-0 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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

            {/* Category Level Mapping */}
            <div>
              <Label className="text-black dark:text-white mb-2 block">
                Category Level Mapping <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2 border-0 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 shadow-md shadow-gray-200 dark:shadow-gray-800">
                {/* Level 1 - Fixed: Main Category */}
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-black rounded-lg border-2 border-gray-200 dark:border-gray-800">
                  <Label className="text-black dark:text-white font-semibold w-40 flex-shrink-0">
                    Category Level 1:
                  </Label>
                  <Input
                    value="Main Category"
                    disabled
                    className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 text-gray-500 dark:text-gray-400"
                  />
                </div>

                {/* Level 2 - Fixed: Sub Category */}
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-black rounded-lg border-2 border-gray-200 dark:border-gray-800">
                  <Label className="text-black dark:text-white font-semibold w-40 flex-shrink-0">
                    Category Level 2:
                  </Label>
                  <Input
                    value="Sub Category"
                    disabled
                    className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 text-gray-500 dark:text-gray-400"
                  />
                </div>

                {/* Level 3-7 - Selectable */}
                {[3, 4, 5, 6, 7].map((level) => {
                  const mapping = formData.categoryLevelMapping.find((m) => m.level === level);
                  const usedTypes = formData.categoryLevelMapping
                    .filter((m) => m.level !== level)
                    .map((m) => m.attributeType);
                  
                  // Check if this level should be shown (based on selected level count)
                  const shouldShow = level <= formData.level;

                  if (!shouldShow) return null;

                  return (
                    <div key={level} className="flex items-center gap-3 p-2 bg-white dark:bg-black rounded-lg border-2 border-gray-200 dark:border-gray-800">
                      <Label className="text-black dark:text-white font-semibold w-40 flex-shrink-0">
                        Category Level {level}:
                      </Label>
                      <Select
                        value={mapping?.attributeType || ""}
                        onValueChange={(value) => {
                          setFormData((prev) => {
                            const newMapping = [...prev.categoryLevelMapping];
                            const existingIndex = newMapping.findIndex((m) => m.level === level);
                            const selectedType = ATTRIBUTE_TYPES.find((t) => t.value === value);
                            if (existingIndex >= 0) {
                              newMapping[existingIndex].attributeType = value as any;
                              if (!newMapping[existingIndex].title && selectedType) {
                                newMapping[existingIndex].title = selectedType.label;
                              }
                            } else {
                              newMapping.push({
                                level,
                                attributeType: value as any,
                                title: selectedType?.label || "",
                              });
                            }
                            return {
                              ...prev,
                              categoryLevelMapping: newMapping.sort((a, b) => a.level - b.level),
                            };
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow">
                          <SelectValue placeholder="Select attribute type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black border-0 shadow-xl shadow-gray-300 dark:shadow-gray-900">
                          {ATTRIBUTE_TYPES.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                              disabled={usedTypes.includes(type.value as any)}
                            >
                              {type.label}
                              {usedTypes.includes(type.value as any) && " (Already used)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}

                {/* Level Selection */}
                <div className="flex items-center gap-3 p-2 pt-3">
                  <Label className="text-black dark:text-white font-semibold w-40 flex-shrink-0">
                    Number of Levels <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.level.toString()}
                    onValueChange={(value) => {
                      const newLevel = parseInt(value);
                      setFormData((prev) => {
                        const newMapping = [];
                        for (let i = 3; i <= newLevel; i++) {
                          const existing = prev.categoryLevelMapping.find((m) => m.level === i);
                          if (existing) {
                            newMapping.push(existing);
                          } else {
                            const usedTypes = newMapping.map((m) => m.attributeType);
                            const availableType = ATTRIBUTE_TYPES.find((t) => !usedTypes.includes(t.value as any));
                            if (availableType) {
                              newMapping.push({
                                level: i,
                                attributeType: availableType.value as any,
                                title: availableType.label,
                              });
                            }
                          }
                        }
                        return {
                          ...prev,
                          level: newLevel,
                          categoryLevelMapping: newMapping,
                        };
                      });
                    }}
                  >
                    <SelectTrigger className="flex-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow">
                      <SelectValue placeholder="Select number of levels" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black border-0 shadow-xl shadow-gray-300 dark:shadow-gray-900">
                      {[3, 4, 5, 6, 7].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level} Levels
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  placeholder="Describe this service category..."
                  className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                />
            </div>

            {/* Meta Title and Meta Description */}
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
                    disabled={uploadingImage.loading}
                    className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all disabled:opacity-50"
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
                    disabled={uploadingImage.loading}
                    className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all disabled:opacity-50"
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

            {/* Service Ideal For */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-black dark:text-white">Service Ideal For</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      serviceIdealFor: [
                        ...(prev.serviceIdealFor || []),
                        { name: "", order: (prev.serviceIdealFor || []).length + 1 },
                      ],
                    }));
                  }}
                  className="flex items-center gap-2 border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-3 border-0 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 shadow-md shadow-gray-200 dark:shadow-gray-800">
                {(!formData.serviceIdealFor || formData.serviceIdealFor.length === 0) ? (
                  <p className="text-sm text-black/50 dark:text-white/50 text-center py-4">
                    No options. Click "Add Option" to add one.
                  </p>
                ) : (
                  (formData.serviceIdealFor || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-black rounded-lg shadow-sm">
                      <Input
                        value={option.name || ""}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const updated = [...prev.serviceIdealFor];
                            updated[index] = { ...updated[index], name: e.target.value };
                            return { ...prev, serviceIdealFor: updated };
                          });
                        }}
                        placeholder="e.g., Homeowners, Small businesses, Landlords"
                        className="flex-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            serviceIdealFor: prev.serviceIdealFor.filter((_, i) => i !== index),
                          }));
                        }}
                        className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Extra Services */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-black dark:text-white">Extra Services</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      extraServices: [
                        ...(prev.extraServices || []),
                        { name: "", price: 0, days: 0, order: (prev.extraServices || []).length + 1 },
                      ],
                    }));
                  }}
                  className="flex items-center gap-2 border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Extra Service
                </Button>
              </div>
              <div className="space-y-3 border-0 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 shadow-md shadow-gray-200 dark:shadow-gray-800">
                {(!formData.extraServices || formData.extraServices.length === 0) ? (
                  <p className="text-sm text-black/50 dark:text-white/50 text-center py-4">
                    No extra services. Click "Add Extra Service" to add one.
                  </p>
                ) : (
                  (formData.extraServices || []).map((service, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-black rounded-lg shadow-sm space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-black dark:text-white text-sm">Name</Label>
                          <Input
                            value={service.name || ""}
                            onChange={(e) => {
                              setFormData((prev) => {
                                const updated = [...prev.extraServices];
                                updated[index] = { ...updated[index], name: e.target.value };
                                return { ...prev, extraServices: updated };
                              });
                            }}
                            placeholder="Service name"
                            className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                          />
                        </div>
                        <div>
                          <Label className="text-black dark:text-white text-sm">Price</Label>
                          <Input
                            type="number"
                            value={service.price || 0}
                            onChange={(e) => {
                              setFormData((prev) => {
                                const updated = [...prev.extraServices];
                                updated[index] = { ...updated[index], price: parseFloat(e.target.value) || 0 };
                                return { ...prev, extraServices: updated };
                              });
                            }}
                            placeholder="0.00"
                            className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                          />
                        </div>
                        <div>
                          <Label className="text-black dark:text-white text-sm">Days</Label>
                          <Input
                            type="number"
                            value={service.days || 0}
                            onChange={(e) => {
                              setFormData((prev) => {
                                const updated = [...prev.extraServices];
                                updated[index] = { ...updated[index], days: parseInt(e.target.value) || 0 };
                                return { ...prev, extraServices: updated };
                              });
                            }}
                            placeholder="0"
                            className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              extraServices: prev.extraServices.filter((_, i) => i !== index),
                            }));
                          }}
                          className="h-8 px-3 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Price Per Unit */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="pricePerUnit"
                  checked={formData.pricePerUnit?.enabled || false}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      pricePerUnit: {
                        ...(prev.pricePerUnit || { enabled: false, units: [] }),
                        enabled: e.target.checked,
                      },
                    }));
                  }}
                  className="w-4 h-4 text-[#FE8A0F] border-gray-300 rounded focus:ring-[#FE8A0F]"
                />
                <Label htmlFor="pricePerUnit" className="text-black dark:text-white">
                  Price Per Unit
                </Label>
              </div>
              {(formData.pricePerUnit?.enabled || false) && (
                <div className="space-y-3 border-0 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 shadow-md shadow-gray-200 dark:shadow-gray-800">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          pricePerUnit: {
                            ...prev.pricePerUnit,
                            units: [
                              ...(prev.pricePerUnit?.units || []),
                              { name: "", price: 0, order: (prev.pricePerUnit?.units || []).length + 1 },
                            ],
                          },
                        }));
                      }}
                      className="flex items-center gap-2 border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Price Unit
                    </Button>
                  </div>
                  {(!formData.pricePerUnit?.units || formData.pricePerUnit.units.length === 0) ? (
                    <p className="text-sm text-black/50 dark:text-white/50 text-center py-4">
                      No price units. Click "Add Price Unit" to add one.
                    </p>
                  ) : (
                    (formData.pricePerUnit?.units || []).map((unit, index) => (
                      <div key={index} className="p-3 bg-white dark:bg-black rounded-lg shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-black dark:text-white text-sm">Unit Name</Label>
                            <Input
                              value={unit.name || ""}
                              onChange={(e) => {
                                setFormData((prev) => {
                                  const updated = [...prev.pricePerUnit.units];
                                  updated[index] = { ...updated[index], name: e.target.value };
                                  return {
                                    ...prev,
                                    pricePerUnit: {
                                      ...prev.pricePerUnit,
                                      units: updated,
                                    },
                                  };
                                });
                              }}
                              placeholder="e.g., Per hour, Per square meter"
                              className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                            />
                          </div>
                          <div>
                            <Label className="text-black dark:text-white text-sm">Price</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={unit.price || 0}
                                onChange={(e) => {
                                  setFormData((prev) => {
                                    const updated = [...prev.pricePerUnit.units];
                                    updated[index] = { ...updated[index], price: parseFloat(e.target.value) || 0 };
                                    return {
                                      ...prev,
                                      pricePerUnit: {
                                        ...prev.pricePerUnit,
                                        units: updated,
                                      },
                                    };
                                  });
                                }}
                                placeholder="0.00"
                                className="flex-1 mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    pricePerUnit: {
                                      ...prev.pricePerUnit,
                                      units: prev.pricePerUnit.units.filter((_, i) => i !== index),
                                    },
                                  }));
                                }}
                                className="h-10 w-10 p-0 text-red-600 dark:text-red-400 hover:bg-red-500/10 mt-1"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
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
                  {editingServiceCategory ? "Update" : "Create"}
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

      {/* Sub Category Create/Edit Modal */}
      <Dialog open={isSubCategoryModalOpen} onOpenChange={setIsSubCategoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black dark:text-white">
              {editingServiceSubCategory 
                ? "Edit Child Category" 
                : (() => {
                    // Check if it's Level 2 tab (first tab - Sub Category)
                    const isFirstTab = selectedAttributeType === null;
                    
                    // Attribute type labels
                    const attributeTypeLabels: Record<string, string> = {
                      serviceType: 'Service Type',
                      size: 'Size',
                      frequency: 'Frequency',
                      make: 'Make',
                      model: 'Model',
                      brand: 'Brand',
                    };
                    
                    if (isFirstTab) {
                      // Level 2 tab: "Adding to Main Category - [부모 카테고리 이름]"
                      return `Adding to Main Category - ${selectedServiceCategory?.name || "Category"}`;
                    } else {
                      // Other tabs: "Adding to [현재 탭 이름]"
                      const sortedMappings = selectedServiceCategory?.categoryLevelMapping
                        ?.filter(m => m.level >= 3 && m.level <= 7)
                        .sort((a, b) => a.level - b.level) || [];
                      const currentTabLabel = selectedAttributeType 
                        ? (sortedMappings.find(m => m.attributeType === selectedAttributeType)?.title 
                            || attributeTypeLabels[selectedAttributeType] 
                            || selectedAttributeType)
                        : "Category";
                      return `Adding to ${currentTabLabel}`;
                    }
                  })()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Service Category (Read-only) */}
            <div>
              <Label className="text-black dark:text-white">
                Main Category <span className="text-red-500">*</span>
              </Label>
              <Input
                value={selectedServiceCategory?.name || ""}
                disabled
                className="mt-1 bg-gray-100 dark:bg-gray-800"
              />
            </div>

            {/* Parent Sub Category Selection (for non-first tabs) */}
            {(() => {
              // Check if it's Level 2 tab (first tab - Sub Category)
              const isFirstTabNow = selectedAttributeType === null;
              
              // Show parent subcategory selection for non-first tabs when creating new subcategory
              if (!editingServiceSubCategory && !isFirstTabNow && !selectedParentSubCategory) {
                // Get parent level tab name
                const currentMapping = selectedServiceCategory?.categoryLevelMapping?.find(
                  m => m.attributeType === selectedAttributeType
                );
                const parentLevel = currentMapping ? currentMapping.level - 1 : 2;
                
                let parentTabLabel = "Parent Category";
                if (parentLevel === 2) {
                  parentTabLabel = "Parent Category";
                } else {
                  const parentMapping = selectedServiceCategory?.categoryLevelMapping?.find(
                    m => m.level === parentLevel
                  );
                  if (parentMapping) {
                    const attributeTypeLabels: Record<string, string> = {
                      serviceType: 'Service Type',
                      size: 'Size',
                      frequency: 'Frequency',
                      make: 'Make',
                      model: 'Model',
                      brand: 'Brand',
                    };
                    parentTabLabel = parentMapping.title || attributeTypeLabels[parentMapping.attributeType] || parentMapping.attributeType;
                  }
                }
                
                return (
              <div>
                    <Label className="text-black dark:text-white">
                      Parent Category {subCategoryFormData.level >= 3 && subCategoryFormData.level <= 7 && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={subCategoryFormData.parentSubCategory}
                      onValueChange={(value) => {
                        setSubCategoryFormData({ ...subCategoryFormData, parentSubCategory: value });
                      }}
                      required={subCategoryFormData.level >= 3 && subCategoryFormData.level <= 7}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={`Select a ${parentTabLabel}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {level1SubCategories.map((subCat) => (
                          <SelectItem key={subCat._id} value={subCat._id}>
                            {subCat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              
              // Show read-only parent subcategory if editing or if navigating from nested view
              if (selectedParentSubCategory) {
                return (
                  <div>
                    <Label className="text-black dark:text-white">Parent Category</Label>
                <Input
                  value={selectedParentSubCategory.name}
                  disabled
                  className="mt-1 bg-gray-100 dark:bg-gray-800"
                />
              </div>
                );
              }
              
              return null;
            })()}

            {/* Level (Read-only) */}
            <div>
              <Label className="text-black dark:text-white">Level</Label>
              <Input
                value={`Level ${subCategoryFormData.level || 1}`}
                disabled
                className="mt-1 bg-gray-100 dark:bg-gray-800"
              />
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="subCategoryName" className="text-black dark:text-white">
                Sub Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subCategoryName"
                value={subCategoryFormData.name}
                onChange={(e) => {
                  setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value });
                  if (!editingServiceSubCategory) {
                    setSubCategoryFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                  }
                }}
                placeholder="Enter sub category name"
                className="mt-1"
              />
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="subCategorySlug" className="text-black dark:text-white">
                Slug <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Auto-generated from name)</span>
              </Label>
              <Input
                id="subCategorySlug"
                value={subCategoryFormData.slug}
                disabled
                placeholder="Enter slug"
                className="mt-1 bg-gray-100 dark:bg-gray-800 border-0 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="subCategoryDescription" className="text-black dark:text-white">
                Description
              </Label>
              <Textarea
                id="subCategoryDescription"
                value={subCategoryFormData.description}
                onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, description: e.target.value })}
                placeholder="Enter description"
                className="mt-1"
                rows={4}
              />
            </div>

            {/* Meta Title */}
            <div>
              <Label htmlFor="subCategoryMetaTitle" className="text-black dark:text-white">
                Meta Title
              </Label>
              <Input
                id="subCategoryMetaTitle"
                value={subCategoryFormData.metaTitle}
                onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, metaTitle: e.target.value })}
                placeholder="Enter meta title"
                className="mt-1"
              />
            </div>

            {/* Meta Description */}
            <div>
              <Label htmlFor="subCategoryMetaDescription" className="text-black dark:text-white">
                Meta Description
              </Label>
              <Textarea
                id="subCategoryMetaDescription"
                value={subCategoryFormData.metaDescription}
                onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, metaDescription: e.target.value })}
                placeholder="Enter meta description"
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Icon Upload */}
            <div>
              <Label className="text-black dark:text-white">Category Icon</Label>
              <div className="mt-2 space-y-2">
                <Input
                  type="url"
                  value={subCategoryFormData.icon}
                  onChange={(e) => {
                    setSubCategoryFormData({ ...subCategoryFormData, icon: e.target.value });
                    setSubCategoryIconPreview(e.target.value || null);
                  }}
                  placeholder="Enter icon URL or upload"
                  className="mb-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        await handleSubCategoryImageUpload(file, "icon");
                      }
                    };
                    input.click();
                  }}
                  className="w-full"
                  disabled={uploadingImage.loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage.loading ? "Uploading..." : "Upload Icon"}
                </Button>
                {(subCategoryIconPreview || subCategoryFormData.icon) && (
                  <div className="mt-2">
                    <img
                      src={subCategoryIconPreview || subCategoryFormData.icon}
                      alt="Icon preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Banner Image Upload */}
            <div>
              <Label className="text-black dark:text-white">Banner Image</Label>
              <div className="mt-2 space-y-2">
                <Input
                  type="url"
                  value={subCategoryFormData.bannerImage}
                  onChange={(e) => {
                    setSubCategoryFormData({ ...subCategoryFormData, bannerImage: e.target.value });
                    setSubCategoryBannerPreview(e.target.value || null);
                  }}
                  placeholder="Enter banner image URL or upload"
                  className="mb-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        await handleSubCategoryImageUpload(file, "banner");
                      }
                    };
                    input.click();
                  }}
                  className="w-full"
                  disabled={uploadingImage.loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage.loading ? "Uploading..." : "Upload Banner Image"}
                </Button>
                {(subCategoryBannerPreview || subCategoryFormData.bannerImage) && (
                  <div className="mt-2">
                    <img
                      src={subCategoryBannerPreview || subCategoryFormData.bannerImage}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Service Title Suggestions */}
            <div>
              <Label htmlFor="serviceTitleSuggestions" className="text-black dark:text-white">
                Service Title Suggestions
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Enter titles separated by commas)
                </span>
              </Label>
              <Textarea
                id="serviceTitleSuggestions"
                value={(subCategoryFormData as any).serviceTitleSuggestions?.join(', ') || ''}
                onChange={(e) => {
                  const suggestions = e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setSubCategoryFormData({
                    ...subCategoryFormData,
                    serviceTitleSuggestions: suggestions
                  } as any);
                }}
                placeholder="e.g., Residential Electrical Installation, Commercial Wiring, Electrical Repairs"
                className="mt-1"
                rows={3}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                These suggestions will appear when users create services in this subcategory
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsSubCategoryModalOpen(false)}
              variant="outline"
              disabled={isSaving}
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubCategory}
              disabled={isSaving}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingServiceSubCategory ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Sub Categories Modal */}
      <Dialog open={isSubCategoriesModalOpen} onOpenChange={setIsSubCategoriesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-black border-2 border-[#FE8A0F] shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-[#FE8A0F]" />
              Child Categories - {viewingSubCategories?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {viewingSubCategories?.subCategories && viewingSubCategories.subCategories.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 font-semibold text-[#FE8A0F] pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div>Order</div>
                  <div>Name</div>
                  <div>Titles</div>
                  <div>Attributes</div>
                </div>
                {viewingSubCategories.subCategories
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((subCategory) => (
                    <div
                      key={subCategory._id}
                      className="grid grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="text-black dark:text-white font-medium">
                        {subCategory.order || 0}
                      </div>
                      <div className="text-black dark:text-white font-medium">
                        {subCategory.name}
                      </div>
                      <div className="text-black dark:text-white">
                        {subCategory.titles && subCategory.titles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {subCategory.titles.map((title, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                L{title.level}: {title.title}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No titles</span>
                        )}
                      </div>
                      <div className="text-black dark:text-white">
                        {subCategory.attributes && subCategory.attributes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {subCategory.attributes.map((attr, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {attr.attributeType} ({attr.values?.length || 0})
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No attributes</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderTree className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No child categories found for this service category.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsSubCategoriesModalOpen(false)}
              variant="outline"
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Titles Modal */}
      <Dialog open={isTitlesModalOpen} onOpenChange={setIsTitlesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-2 border-[#FE8A0F] shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
              <Type className="w-6 h-6 text-[#FE8A0F]" />
              {managingServiceCategory?.name} - Service Title Suggestions
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Manage service title suggestions that will appear when users create services in each subcategory
            </p>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Category Level Dropdown */}
            <div>
              <Label className="text-sm font-semibold text-[#FE8A0F] mb-2 block">Select Starting Level</Label>
              <Select
                value={selectedCategoryLevel}
                onValueChange={async (value) => {
                  setSelectedCategoryLevel(value);
                  setSubCategoriesByLevel({});
                  setExpandedSubCategories(new Set());
                  setSubCategoryTitles({});
                  if (managingServiceCategory) {
                    await fetchSubCategoriesForTitles(managingServiceCategory._id, parseInt(value));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category level to start" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const maxLevel = managingServiceCategory?.level || 7;
                    const levels = [];
                    for (let i = 2; i <= maxLevel; i++) {
                      const mapping = managingServiceCategory?.categoryLevelMapping?.find(m => m.level === i);
                      levels.push(
                        <SelectItem key={i} value={i.toString()}>
                          Level {i}{mapping ? ` - ${mapping.attributeType}` : ' - Sub Category'}
                        </SelectItem>
                      );
                    }
                    return levels;
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategories Tree with Title Management */}
            {selectedCategoryLevel && managingServiceCategory && (
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-semibold text-[#FE8A0F]">
                  Subcategories & Title Suggestions
                </Label>

                {loadingSubCategories[parseInt(selectedCategoryLevel)] ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(subCategoriesByLevel[parseInt(selectedCategoryLevel)] || []).map((subCategory) => (
                      <div key={subCategory._id} className="border rounded-lg p-4 space-y-3">
                        {/* Subcategory Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSubCategoryExpansion(subCategory._id, parseInt(selectedCategoryLevel))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedSubCategories.has(subCategory._id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                            <span className="font-semibold text-black dark:text-white">
                              {subCategory.name}
                            </span>
                          </div>
                          <Button
                            onClick={() => {
                              const current = subCategoryTitles[subCategory._id] || [];
                              setSubCategoryTitles({
                                ...subCategoryTitles,
                                [subCategory._id]: [...current, '']
                              });
                            }}
                            size="sm"
                            variant="outline"
                            className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Title
                          </Button>
                        </div>

                        {/* Title Suggestions for this subcategory */}
                        <div className="ml-8 space-y-2">
                          {(subCategoryTitles[subCategory._id] || []).length > 0 ? (
                            (subCategoryTitles[subCategory._id] || []).map((title, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input
                                  value={title}
                                  onChange={(e) => {
                                    const updated = [...(subCategoryTitles[subCategory._id] || [])];
                                    updated[index] = e.target.value;
                                    setSubCategoryTitles({
                                      ...subCategoryTitles,
                                      [subCategory._id]: updated
                                    });
                                  }}
                                  placeholder="e.g., Residential Electrical Installation"
                                  className="flex-1 text-sm"
                                />
                                <Button
                                  onClick={() => {
                                    const updated = (subCategoryTitles[subCategory._id] || []).filter((_, i) => i !== index);
                                    setSubCategoryTitles({
                                      ...subCategoryTitles,
                                      [subCategory._id]: updated
                                    });
                                  }}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              No title suggestions yet
                            </p>
                          )}
                        </div>

                        {/* Child subcategories (if expanded) */}
                        {expandedSubCategories.has(subCategory._id) && (
                          <div className="ml-8 mt-3 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                            {loadingSubCategories[parseInt(selectedCategoryLevel) + 1] ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin text-[#FE8A0F]" />
                              </div>
                            ) : (
                              (subCategoriesByLevel[parseInt(selectedCategoryLevel) + 1] || [])
                                .filter((child: any) => {
                                  const parentId = typeof child.parentSubCategory === 'string'
                                    ? child.parentSubCategory
                                    : child.parentSubCategory?._id;
                                  return parentId === subCategory._id;
                                })
                                .map((childSubCategory: any) => (
                                  <div key={childSubCategory._id} className="border rounded p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-black dark:text-white">
                                        {childSubCategory.name}
                                      </span>
                                      <Button
                                        onClick={() => {
                                          const current = subCategoryTitles[childSubCategory._id] || [];
                                          setSubCategoryTitles({
                                            ...subCategoryTitles,
                                            [childSubCategory._id]: [...current, '']
                                          });
                                        }}
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Title
                                      </Button>
                                    </div>
                                    <div className="ml-4 space-y-2">
                                      {(subCategoryTitles[childSubCategory._id] || []).length > 0 ? (
                                        (subCategoryTitles[childSubCategory._id] || []).map((title, index) => (
                                          <div key={index} className="flex items-center gap-2">
                                            <Input
                                              value={title}
                                              onChange={(e) => {
                                                const updated = [...(subCategoryTitles[childSubCategory._id] || [])];
                                                updated[index] = e.target.value;
                                                setSubCategoryTitles({
                                                  ...subCategoryTitles,
                                                  [childSubCategory._id]: updated
                                                });
                                              }}
                                              placeholder="e.g., Service title"
                                              className="flex-1 text-sm"
                                            />
                                            <Button
                                              onClick={() => {
                                                const updated = (subCategoryTitles[childSubCategory._id] || []).filter((_, i) => i !== index);
                                                setSubCategoryTitles({
                                                  ...subCategoryTitles,
                                                  [childSubCategory._id]: updated
                                                });
                                              }}
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          No title suggestions yet
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsTitlesModalOpen(false)}
              variant="outline"
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!managingServiceCategory || !selectedCategoryLevel) {
                  toast.error("Please select a category level");
                  return;
                }

                // Check if there are any titles to save
                const hasAnyTitles = Object.values(subCategoryTitles).some(titles => titles.length > 0);
                if (!hasAnyTitles) {
                  toast.error("Please add at least one title suggestion");
                  return;
                }

                try {
                  setIsSaving(true);
                  let successCount = 0;
                  let errorCount = 0;

                  // Update all subcategories that have titles
                  for (const [subCategoryId, titles] of Object.entries(subCategoryTitles)) {
                    if (titles.length > 0) {
                      try {
                        const response = await fetch(
                          resolveApiUrl(`/api/service-subcategories/${subCategoryId}`),
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              serviceTitleSuggestions: titles
                                .map(title => title.trim())
                                .filter(t => t.length > 0)
                            }),
                          }
                        );
                        if (response.ok) {
                          successCount++;
                        } else {
                          errorCount++;
                        }
                      } catch (err) {
                        errorCount++;
                      }
                    }
                  }

                  if (successCount > 0) {
                    toast.success(`Successfully saved title suggestions for ${successCount} subcategor${successCount === 1 ? 'y' : 'ies'}`);
                  }
                  if (errorCount > 0) {
                    toast.error(`Failed to save ${errorCount} subcategor${errorCount === 1 ? 'y' : 'ies'}`);
                  }

                  if (errorCount === 0) {
                    setIsTitlesModalOpen(false);
                    // Reset state
                    setSelectedCategoryLevel("");
                    setSubCategoriesByLevel({});
                    setExpandedSubCategories(new Set());
                    setSubCategoryTitles({});
                  }
                } catch (error) {
                  console.error("Error saving service title suggestions:", error);
                  toast.error("Failed to save service title suggestions");
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving || !selectedCategoryLevel}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Suggestions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </>
  );
}

