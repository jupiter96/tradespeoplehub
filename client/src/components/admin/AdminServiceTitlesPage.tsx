import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight, Plus, Trash2, Loader2, ArrowLeft, Save } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { toast } from "sonner";

interface ServiceCategory {
  _id: string;
  name: string;
  level?: number;
  categoryLevelMapping?: Array<{
    level: number;
    attributeType: string;
  }>;
}

interface ServiceSubCategory {
  _id: string;
  name: string;
  serviceTitleSuggestions?: string[];
  parentSubCategory?: string | { _id: string };
}

export default function AdminServiceTitlesPage() {
  useAdminRouteGuard();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | null>(null);
  const [selectedCategoryLevel, setSelectedCategoryLevel] = useState<string>("");
  const [subCategoriesByLevel, setSubCategoriesByLevel] = useState<Record<number, ServiceSubCategory[]>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [subCategoryTitles, setSubCategoryTitles] = useState<Record<string, string[]>>({});
  const [loadingSubCategories, setLoadingSubCategories] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch service category details
  useEffect(() => {
    const fetchServiceCategory = async () => {
      if (!categoryId) return;

      try {
        const response = await fetch(
          resolveApiUrl(`/api/service-categories/${categoryId}`),
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          setServiceCategory(data.serviceCategory);

          // Set default level to 2 and fetch subcategories
          setSelectedCategoryLevel("2");
          await fetchSubCategoriesForLevel(data.serviceCategory._id, 2);
        } else {
          toast.error("Failed to load service category");
          navigate("/admin/service-category");
        }
      } catch (error) {
        console.error("Error fetching service category:", error);
        toast.error("Failed to load service category");
        navigate("/admin/service-category");
      }
    };

    fetchServiceCategory();
  }, [categoryId, navigate]);

  // Fetch subcategories for a specific level and load their titles
  const fetchSubCategoriesForLevel = useCallback(async (serviceCategoryId: string, level: number, parentSubCategoryId?: string) => {
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
        if (serviceCategory?.categoryLevelMapping) {
          const mapping = serviceCategory.categoryLevelMapping.find(m => m.level === level);
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
      console.error('Error fetching subcategories:', error);
      toast.error('Failed to fetch subcategories');
    } finally {
      setLoadingSubCategories(prev => ({ ...prev, [level]: false }));
    }
  }, [serviceCategory]);

  // Toggle subcategory expansion and load children
  const toggleSubCategoryExpansion = useCallback(async (subCategoryId: string, level: number) => {
    const newExpanded = new Set(expandedSubCategories);

    if (newExpanded.has(subCategoryId)) {
      // Collapse
      newExpanded.delete(subCategoryId);
    } else {
      // Expand and fetch children
      newExpanded.add(subCategoryId);

      if (serviceCategory) {
        const nextLevel = level + 1;
        const maxLevel = serviceCategory.level || 7;
        if (nextLevel <= maxLevel) {
          await fetchSubCategoriesForLevel(serviceCategory._id, nextLevel, subCategoryId);
        }
      }
    }

    setExpandedSubCategories(newExpanded);
  }, [expandedSubCategories, serviceCategory, fetchSubCategoriesForLevel]);

  // Handle level selection
  const handleLevelChange = async (value: string) => {
    setSelectedCategoryLevel(value);
    setSubCategoriesByLevel({});
    setExpandedSubCategories(new Set());
    setSubCategoryTitles({});
    if (serviceCategory) {
      await fetchSubCategoriesForLevel(serviceCategory._id, parseInt(value));
    }
  };

  // Save all title suggestions
  const handleSaveAll = async () => {
    if (!serviceCategory || !selectedCategoryLevel) {
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
    } catch (error) {
      console.error("Error saving service title suggestions:", error);
      toast.error("Failed to save service title suggestions");
    } finally {
      setIsSaving(false);
    }
  };

  // Add title to subcategory
  const addTitle = (subCategoryId: string) => {
    const current = subCategoryTitles[subCategoryId] || [];
    setSubCategoryTitles({
      ...subCategoryTitles,
      [subCategoryId]: [...current, '']
    });
  };

  // Update title
  const updateTitle = (subCategoryId: string, index: number, value: string) => {
    const updated = [...(subCategoryTitles[subCategoryId] || [])];
    updated[index] = value;
    setSubCategoryTitles({
      ...subCategoryTitles,
      [subCategoryId]: updated
    });
  };

  // Remove title
  const removeTitle = (subCategoryId: string, index: number) => {
    const updated = (subCategoryTitles[subCategoryId] || []).filter((_, i) => i !== index);
    setSubCategoryTitles({
      ...subCategoryTitles,
      [subCategoryId]: updated
    });
  };

  if (!categoryId) {
    return (
      <AdminPageLayout
        title="Service Title Management"
        description="No category selected"
      >
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Please select a category from the Service Categories page</p>
          <Button onClick={() => navigate("/admin/service-category")}>
            Go to Service Categories
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  if (!serviceCategory) {
    return (
      <AdminPageLayout
        title="Service Title Management"
        description="Loading..."
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={`Service Title Management - ${serviceCategory.name}`}
      description="Manage service title suggestions for each subcategory"
    >
      <div className="space-y-6">
        {/* Header with Back and Save buttons */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate("/admin/service-category")}
            variant="outline"
            className="border-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>
          <Button
            onClick={handleSaveAll}
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
                Save All Changes
              </>
            )}
          </Button>
        </div>

        {/* Level Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-[#FE8A0F] p-6">
          <Label className="text-sm font-semibold text-[#FE8A0F] mb-2 block">
            Select Starting Level
          </Label>
          <Select value={selectedCategoryLevel} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select category level to start" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const maxLevel = serviceCategory.level || 7;
                const levels = [];
                for (let i = 2; i <= maxLevel; i++) {
                  const mapping = serviceCategory.categoryLevelMapping?.find(m => m.level === i);
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

        {/* Subcategories Tree */}
        {selectedCategoryLevel && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <Label className="text-sm font-semibold text-[#FE8A0F] mb-4 block">
              Subcategories & Title Suggestions
            </Label>

            {loadingSubCategories[parseInt(selectedCategoryLevel)] ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
              </div>
            ) : (subCategoriesByLevel[parseInt(selectedCategoryLevel)] || []).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No subcategories found for this level
              </p>
            ) : (
              <div className="space-y-3">
                {(subCategoriesByLevel[parseInt(selectedCategoryLevel)] || []).map((subCategory) => (
                  <SubCategoryItem
                    key={subCategory._id}
                    subCategory={subCategory}
                    level={parseInt(selectedCategoryLevel)}
                    isExpanded={expandedSubCategories.has(subCategory._id)}
                    titles={subCategoryTitles[subCategory._id] || []}
                    childSubCategories={(subCategoriesByLevel[parseInt(selectedCategoryLevel) + 1] || [])
                      .filter((child: ServiceSubCategory) => {
                        const parentId = typeof child.parentSubCategory === 'string'
                          ? child.parentSubCategory
                          : child.parentSubCategory?._id;
                        return parentId === subCategory._id;
                      })}
                    onToggleExpand={() => toggleSubCategoryExpansion(subCategory._id, parseInt(selectedCategoryLevel))}
                    onAddTitle={() => addTitle(subCategory._id)}
                    onUpdateTitle={(index, value) => updateTitle(subCategory._id, index, value)}
                    onRemoveTitle={(index) => removeTitle(subCategory._id, index)}
                    expandedSubCategories={expandedSubCategories}
                    subCategoryTitles={subCategoryTitles}
                    onToggleChildExpand={toggleSubCategoryExpansion}
                    onAddChildTitle={addTitle}
                    onUpdateChildTitle={updateTitle}
                    onRemoveChildTitle={removeTitle}
                    isLoading={loadingSubCategories[parseInt(selectedCategoryLevel) + 1]}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}

// SubCategory Item Component
interface SubCategoryItemProps {
  subCategory: ServiceSubCategory;
  level: number;
  isExpanded: boolean;
  titles: string[];
  childSubCategories: ServiceSubCategory[];
  onToggleExpand: () => void;
  onAddTitle: () => void;
  onUpdateTitle: (index: number, value: string) => void;
  onRemoveTitle: (index: number) => void;
  expandedSubCategories: Set<string>;
  subCategoryTitles: Record<string, string[]>;
  onToggleChildExpand: (id: string, level: number) => void;
  onAddChildTitle: (id: string) => void;
  onUpdateChildTitle: (id: string, index: number, value: string) => void;
  onRemoveChildTitle: (id: string, index: number) => void;
  isLoading?: boolean;
}

function SubCategoryItem({
  subCategory,
  level,
  isExpanded,
  titles,
  childSubCategories,
  onToggleExpand,
  onAddTitle,
  onUpdateTitle,
  onRemoveTitle,
  expandedSubCategories,
  subCategoryTitles,
  onToggleChildExpand,
  onAddChildTitle,
  onUpdateChildTitle,
  onRemoveChildTitle,
  isLoading,
}: SubCategoryItemProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
      {/* Subcategory Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
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
          onClick={onAddTitle}
          size="sm"
          variant="outline"
          className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Title
        </Button>
      </div>

      {/* Title Suggestions */}
      <div className="ml-8 space-y-2">
        {titles.length > 0 ? (
          titles.map((title, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => onUpdateTitle(index, e.target.value)}
                placeholder="e.g., Residential Electrical Installation"
                className="flex-1 text-sm"
              />
              <Button
                onClick={() => onRemoveTitle(index)}
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

      {/* Child Subcategories */}
      {isExpanded && (
        <div className="ml-8 mt-3 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-[#FE8A0F]" />
            </div>
          ) : childSubCategories.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No child subcategories
            </p>
          ) : (
            childSubCategories.map((childSubCategory) => (
              <div key={childSubCategory._id} className="border rounded p-3 space-y-2 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black dark:text-white">
                    {childSubCategory.name}
                  </span>
                  <Button
                    onClick={() => onAddChildTitle(childSubCategory._id)}
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
                          onChange={(e) => onUpdateChildTitle(childSubCategory._id, index, e.target.value)}
                          placeholder="e.g., Service title"
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={() => onRemoveChildTitle(childSubCategory._id, index)}
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
  );
}

