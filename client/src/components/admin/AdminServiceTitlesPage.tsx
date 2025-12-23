import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Loader2, ArrowLeft, Save } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
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

  // Cascading selection state - stores selected subcategory ID for each level
  const [selectedSubCategoryByLevel, setSelectedSubCategoryByLevel] = useState<Record<number, string>>({});

  // Stores available subcategories for each level
  const [subCategoriesByLevel, setSubCategoriesByLevel] = useState<Record<number, ServiceSubCategory[]>>({});

  // Stores title suggestions for each subcategory
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

          // Automatically load Level 2 subcategories
          await fetchSubCategoriesForLevel(data.serviceCategory._id, 2);
        } else {
          toast.error("Failed to load service category");
          navigate("/admin/service-category");
        }
      } catch (error) {
        // console.error("Error fetching service category:", error);
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
      // console.error('Error fetching subcategories:', error);
      toast.error('Failed to fetch subcategories');
    } finally {
      setLoadingSubCategories(prev => ({ ...prev, [level]: false }));
    }
  }, [serviceCategory]);

  // Handle subcategory selection at a specific level
  const handleSubCategorySelect = useCallback(async (level: number, subCategoryId: string) => {
    if (!serviceCategory) return;

    // Update selected subcategory for this level
    setSelectedSubCategoryByLevel(prev => {
      const updated = { ...prev };
      // Clear selections for all levels after this one
      const maxLevel = serviceCategory.level || 7;
      for (let i = level + 1; i <= maxLevel; i++) {
        delete updated[i];
      }
      // Set selection for current level
      updated[level] = subCategoryId;
      return updated;
    });

    // Clear subcategories for all levels after this one
    setSubCategoriesByLevel(prev => {
      const updated = { ...prev };
      const maxLevel = serviceCategory.level || 7;
      for (let i = level + 1; i <= maxLevel; i++) {
        delete updated[i];
      }
      return updated;
    });

    // Fetch subcategories for the next level
    const nextLevel = level + 1;
    const maxLevel = serviceCategory.level || 7;
    if (nextLevel <= maxLevel) {
      await fetchSubCategoriesForLevel(serviceCategory._id, nextLevel, subCategoryId);
    }
  }, [serviceCategory, fetchSubCategoriesForLevel]);

  // Save all title suggestions
  const handleSaveAll = async () => {
    if (!serviceCategory) {
      toast.error("Please select a category");
      return;
    }

    // Find the deepest selected level to get the subcategory ID
    const maxLevel = serviceCategory.level || 7;
    let deepestLevel = 0;
    let selectedSubCategoryId = "";

    for (let level = maxLevel; level >= 2; level--) {
      if (selectedSubCategoryByLevel[level]) {
        deepestLevel = level;
        selectedSubCategoryId = selectedSubCategoryByLevel[level];
        break;
      }
    }

    if (!selectedSubCategoryId) {
      toast.error("Please select a subcategory");
      return;
    }

    // Get titles for the selected subcategory
    const titles = subCategoryTitles[selectedSubCategoryId] || [];
    const validTitles = titles
      .map(title => title.trim())
      .filter(t => t.length > 0);

    if (validTitles.length === 0) {
      toast.error("Please add at least one title suggestion");
      return;
    }

    try {
      setIsSaving(true);
      let successCount = 0;
      let errorCount = 0;

      // Save titles for the selected subcategory
      const filteredTitles: Record<string, string[]> = {};
      
      try {
        // Ensure validTitles is a proper array of strings
        const titlesToSave = Array.isArray(validTitles) 
          ? validTitles.filter(title => typeof title === 'string' && title.trim().length > 0)
          : [];
        
        const response = await fetch(
          resolveApiUrl(`/api/service-subcategories/${selectedSubCategoryId}`),
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              serviceTitleSuggestions: titlesToSave
            }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          // Update state with saved data (remove empty titles)
          if (data.serviceSubCategory?.serviceTitleSuggestions) {
            filteredTitles[selectedSubCategoryId] = data.serviceSubCategory.serviceTitleSuggestions;
          } else {
            filteredTitles[selectedSubCategoryId] = titlesToSave;
          }
          successCount++;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Failed to save titles for ${selectedSubCategoryId}:`, errorData);
          console.error(`Response status: ${response.status}`);
          errorCount++;
        }
      } catch (err) {
        console.error(`Error saving titles for ${selectedSubCategoryId}:`, err);
        errorCount++;
      }
      
      // Update state with saved data (remove empty titles)
      if (Object.keys(filteredTitles).length > 0) {
        setSubCategoryTitles(prev => ({
          ...prev,
          ...filteredTitles
        }));
      }

      // Reload subcategories to get the saved data
      if (successCount > 0 && serviceCategory) {
        if (deepestLevel > 0) {
          // Reload subcategories for the deepest level to get updated titles
          await fetchSubCategoriesForLevel(
            serviceCategory._id,
            deepestLevel,
            deepestLevel > 2 ? selectedSubCategoryByLevel[deepestLevel - 1] : undefined
          );
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully saved title suggestions`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to save title suggestions`);
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
                Save All Changes
              </>
            )}
          </Button>
        </div>

        {/* Cascading Level Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-[#FE8A0F] p-6">
          <Label className="text-sm font-semibold text-[#FE8A0F] mb-4 block">
            Select Subcategory Path
          </Label>

          <div className="space-y-4">
            {/* Render cascading selects for each level */}
            {(() => {
              const maxLevel = serviceCategory.level || 7;
              const levels = [];

              for (let level = 2; level <= maxLevel; level++) {
                const mapping = serviceCategory.categoryLevelMapping?.find(m => m.level === level);
                const levelName = mapping ? mapping.attributeType : 'Sub Category';
                const subCategories = subCategoriesByLevel[level] || [];
                const selectedId = selectedSubCategoryByLevel[level];

                // Only show this level if:
                // 1. It's level 2 (always visible)
                // 2. Previous level has a selection
                const shouldShow = level === 2 || selectedSubCategoryByLevel[level - 1];

                if (!shouldShow) break;

                // All levels use radio buttons
                levels.push(
                  <div key={level} className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Level {level} - {levelName}
                    </Label>
                    {loadingSubCategories[level] ? (
                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin text-[#FE8A0F]" />
                        <span className="text-sm text-gray-500">Loading...</span>
                      </div>
                    ) : subCategories.length === 0 ? (
                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                        <span className="text-sm text-gray-500">No subcategories available</span>
                      </div>
                    ) : (
                      <RadioGroup
                        value={selectedId || ""}
                        onValueChange={(value) => handleSubCategorySelect(level, value)}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                      >
                        {subCategories.map((subCat) => (
                          <div
                            key={subCat._id}
                            className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all ${
                              selectedId === subCat._id
                                ? 'border-[#FE8A0F] bg-[#FFF5EB] dark:bg-[#FE8A0F]/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-[#FE8A0F]/50'
                            }`}
                            onClick={() => handleSubCategorySelect(level, subCat._id)}
                          >
                            <RadioGroupItem value={subCat._id} id={`${level}-${subCat._id}`} />
                            <Label
                              htmlFor={`${level}-${subCat._id}`}
                              className="flex-1 cursor-pointer text-sm font-medium text-black dark:text-white"
                            >
                              {subCat.name}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                );
              }

              return levels;
            })()}
          </div>
        </div>

        {/* Title Management for Selected Subcategory - Only Deepest Level */}
        {(() => {
          // Find the deepest selected level (last/most nested level)
          const maxLevel = serviceCategory.level || 7;
          let deepestLevel = 0;
          let selectedSubCategoryId = "";

          // Find the deepest level that has a selection
          for (let level = maxLevel; level >= 2; level--) {
            if (selectedSubCategoryByLevel[level]) {
              deepestLevel = level;
              selectedSubCategoryId = selectedSubCategoryByLevel[level];
              break;
            }
          }

          // Check if this is the actual last level
          // A level is the last level if:
          // 1. It's the maximum level defined for the category, OR
          // 2. The next level doesn't exist or has no subcategories
          const nextLevel = deepestLevel + 1;
          const hasNextLevel = nextLevel <= maxLevel;
          
          // Don't show section if next level is still loading (prevents flickering)
          if (hasNextLevel && loadingSubCategories[nextLevel]) {
            return null;
          }
          
          const nextLevelSubCategories = hasNextLevel ? (subCategoriesByLevel[nextLevel] || []) : [];
          const isLastLevel = !hasNextLevel || nextLevelSubCategories.length === 0;
          
          // Only show title management if we have a selection and it's the last level
          if (!deepestLevel || !selectedSubCategoryId || !isLastLevel) {
            // Don't show anything if not at the last level
            return null;
          }

          const selectedSubCategory = (subCategoriesByLevel[deepestLevel] || [])
            .find(sc => sc._id === selectedSubCategoryId);

          if (!selectedSubCategory) return null;

          const mapping = serviceCategory.categoryLevelMapping?.find(m => m.level === deepestLevel);
          const levelName = deepestLevel === 2 ? 'Sub Category' : (mapping ? mapping.attributeType : `Level ${deepestLevel}`);
          const titles = subCategoryTitles[selectedSubCategoryId] || [];

          // Build breadcrumb path for context
          const breadcrumb: string[] = [];
          for (let l = 2; l <= deepestLevel; l++) {
            const id = selectedSubCategoryByLevel[l];
            if (id) {
              const sc = (subCategoriesByLevel[l] || []).find(s => s._id === id);
              if (sc) breadcrumb.push(sc.name);
            }
          }

          return (
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-[#FE8A0F] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-semibold text-[#FE8A0F]">
                      Title Suggestions - Level {deepestLevel} ({levelName})
                    </Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({titles.length} title{titles.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Managing titles for: <span className="font-medium text-black dark:text-white">{selectedSubCategory.name}</span>
                    {breadcrumb.length > 1 && (
                      <span className="ml-2 text-gray-500">
                        (Path: {breadcrumb.join(' > ')})
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => addTitle(selectedSubCategoryId)}
                  size="sm"
                  className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Title
                </Button>
              </div>

              <div className="space-y-3">
                {titles.length > 0 ? (
                  titles.map((title, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={title}
                        onChange={(e) => updateTitle(selectedSubCategoryId, index, e.target.value)}
                        placeholder="e.g., Residential Electrical Installation"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeTitle(selectedSubCategoryId, index)}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No title suggestions yet. Click "Add Title" to create one.
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </AdminPageLayout>
  );
}
