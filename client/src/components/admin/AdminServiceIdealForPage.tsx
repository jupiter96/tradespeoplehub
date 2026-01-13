import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Loader2, ArrowLeft, Save, Target } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { toast } from "sonner";

interface CategoryLevelMapping {
  level: number;
  attributeType: string;
  title?: string;
}

interface ServiceCategory {
  _id: string;
  name: string;
  slug: string;
  level?: number;
  categoryLevelMapping?: CategoryLevelMapping[];
}

interface ServiceSubCategory {
  _id: string;
  name: string;
  level: number;
  serviceIdealFor?: string[];
}

export default function AdminServiceIdealForPage() {
  useAdminRouteGuard();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | null>(null);
  const [selectedSubCategoryByLevel, setSelectedSubCategoryByLevel] = useState<Record<number, string>>({});
  const [subCategoriesByLevel, setSubCategoriesByLevel] = useState<Record<number, ServiceSubCategory[]>>({});
  const [subCategoryIdealFor, setSubCategoryIdealFor] = useState<Record<string, string[]>>({});
  const [loadingSubCategories, setLoadingSubCategories] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch service category
  useEffect(() => {
    if (!categoryId) return;

    const fetchServiceCategory = async () => {
      try {
        const response = await fetch(
          resolveApiUrl(`/api/service-categories/${categoryId}`),
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          setServiceCategory(data.serviceCategory);
        } else {
          toast.error("Failed to fetch service category");
        }
      } catch (error) {
        toast.error("Failed to fetch service category");
      }
    };

    fetchServiceCategory();
  }, [categoryId]);

  // Fetch subcategories for a specific level
  const fetchSubCategoriesForLevel = useCallback(async (
    serviceCategoryId: string,
    level: number,
    parentSubCategoryId?: string
  ) => {
    setLoadingSubCategories(prev => ({ ...prev, [level]: true }));
    try {
      let url = `/api/service-subcategories?serviceCategoryId=${serviceCategoryId}&level=${level}&activeOnly=false`;
      if (parentSubCategoryId) {
        url += `&parentSubCategoryId=${parentSubCategoryId}`;
      }
      url += `&_t=${Date.now()}`;

      const response = await fetch(resolveApiUrl(url), { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSubCategoriesByLevel(prev => ({
          ...prev,
          [level]: data.serviceSubCategories || []
        }));

        // Load ideal for options for each subcategory
        const idealForMap: Record<string, string[]> = {};
        (data.serviceSubCategories || []).forEach((subCat: ServiceSubCategory) => {
          idealForMap[subCat._id] = subCat.serviceIdealFor || [];
        });
        setSubCategoryIdealFor(prev => ({ ...prev, ...idealForMap }));
      }
    } catch (error) {
      // console.error("Error fetching subcategories:", error);
    } finally {
      setLoadingSubCategories(prev => ({ ...prev, [level]: false }));
    }
  }, []);

  // Fetch Level 2 subcategories on mount
  useEffect(() => {
    if (serviceCategory) {
      fetchSubCategoriesForLevel(serviceCategory._id, 2);
    }
  }, [serviceCategory, fetchSubCategoriesForLevel]);

  // Handle subcategory selection
  const handleSubCategorySelect = useCallback(async (level: number, subCategoryId: string) => {
    setSelectedSubCategoryByLevel(prev => {
      const newSelection = { ...prev, [level]: subCategoryId };
      // Clear selections for higher levels
      for (let i = level + 1; i <= 7; i++) {
        delete newSelection[i];
      }
      return newSelection;
    });

    // Clear subcategories for higher levels
    setSubCategoriesByLevel(prev => {
      const newSubCategories = { ...prev };
      for (let i = level + 1; i <= 7; i++) {
        delete newSubCategories[i];
      }
      return newSubCategories;
    });

    // Fetch next level if not at max level
    if (level < 7 && serviceCategory) {
      await fetchSubCategoriesForLevel(serviceCategory._id, level + 1, subCategoryId);
    }
  }, [serviceCategory, fetchSubCategoriesForLevel]);

  // Add ideal for option to subcategory
  const addIdealFor = useCallback((subCategoryId: string) => {
    setSubCategoryIdealFor((prev: Record<string, string[]>) => ({
      ...prev,
      [subCategoryId]: [...(prev[subCategoryId] || []), '']
    }));
  }, []);

  // Update ideal for option
  const updateIdealFor = useCallback((subCategoryId: string, index: number, value: string) => {
    setSubCategoryIdealFor((prev: Record<string, string[]>) => {
      const updated = [...(prev[subCategoryId] || [])];
      updated[index] = value;
      return {
        ...prev,
        [subCategoryId]: updated
      };
    });
  }, []);

  // Remove ideal for option
  const removeIdealFor = useCallback((subCategoryId: string, index: number) => {
    setSubCategoryIdealFor((prev: Record<string, string[]>) => ({
      ...prev,
      [subCategoryId]: (prev[subCategoryId] || []).filter((_: string, i: number) => i !== index)
    }));
  }, []);

  // Save all changes
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

    // Get ideal for options for the selected subcategory
    const idealForOptions = subCategoryIdealFor[selectedSubCategoryId] || [];
    const validOptions = idealForOptions
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    if (validOptions.length === 0) {
      toast.error('Please add at least one "Ideal For" option to save');
      return;
    }

    setIsSaving(true);
    try {
      const updates = [{
        subCategoryId: selectedSubCategoryId,
        serviceIdealFor: validOptions
      }];

      const response = await fetch(
        resolveApiUrl('/api/service-subcategories/bulk-update-ideal-for'),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ updates })
        }
      );

      if (response.ok) {
        // Reload the subcategories to get the saved data
        if (deepestLevel > 0 && serviceCategory) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setSubCategoriesByLevel(prev => {
            const updated = { ...prev };
            delete updated[deepestLevel];
            return updated;
          });
          await fetchSubCategoriesForLevel(
            serviceCategory._id,
            deepestLevel,
            deepestLevel > 2 ? selectedSubCategoryByLevel[deepestLevel - 1] : undefined
          );
        }
        
        // Update state with saved data (remove empty options)
        const savedOptions: Record<string, string[]> = {};
        savedOptions[selectedSubCategoryId] = validOptions;
        setSubCategoryIdealFor(prev => ({
          ...prev,
          ...savedOptions
        }));
        
        toast.success('Service Ideal For options saved successfully');
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to save options' }));
        toast.error(error.error || 'Failed to save options');
      }
    } catch (error) {
      console.error('Error saving ideal for options:', error);
      toast.error('Failed to save options');
    } finally {
      setIsSaving(false);
    }
  };

  if (!categoryId) {
    return (
      <AdminPageLayout
        title="Service Ideal For Management"
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
        title="Service Ideal For Management"
        description="Loading..."
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={`Service Ideal For - ${serviceCategory.name}`}
      description='Manage "What is the service ideal for" options for each subcategory'
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate("/admin/service-category")}
            variant="outline"
            className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
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

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> These options will be displayed in the "What is the service ideal for" section when professionals create services.
            Select subcategories from each level to manage their specific "Ideal For" options.
            For package services, all selected ideals from the belonging category will be displayed.
          </p>
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
                const levelName = mapping ? (mapping.title || mapping.attributeType) : 'Sub Category';
                const subCategories = subCategoriesByLevel[level] || [];
                const selectedId = selectedSubCategoryByLevel[level];

                const shouldShow = level === 2 || selectedSubCategoryByLevel[level - 1];

                if (!shouldShow) break;

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

        {/* Ideal For Management for Selected Subcategory - Only Last Level */}
        {(() => {
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

          const nextLevel = deepestLevel + 1;
          const hasNextLevel = nextLevel <= maxLevel;
          
          if (hasNextLevel && loadingSubCategories[nextLevel]) {
            return null;
          }
          
          const nextLevelSubCategories = hasNextLevel ? (subCategoriesByLevel[nextLevel] || []) : [];
          const isLastLevel = !hasNextLevel || nextLevelSubCategories.length === 0;
          
          if (!deepestLevel || !selectedSubCategoryId || !isLastLevel) {
            return null;
          }

          const selectedSubCategory = (subCategoriesByLevel[deepestLevel] || [])
            .find(sc => sc._id === selectedSubCategoryId);

          if (!selectedSubCategory) return null;

          const mapping = serviceCategory.categoryLevelMapping?.find(m => m.level === deepestLevel);
          const levelName = deepestLevel === 2 ? 'Sub Category' : (mapping ? (mapping.title || mapping.attributeType) : `Level ${deepestLevel}`);
          const idealForOptions = subCategoryIdealFor[selectedSubCategoryId] || [];

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
                    <Target className="w-5 h-5 text-[#FE8A0F]" />
                    <Label className="text-sm font-semibold text-[#FE8A0F]">
                      Service Ideal For - Level {deepestLevel} ({levelName})
                    </Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({idealForOptions.length} option{idealForOptions.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Managing "Ideal For" options for: <span className="font-medium text-black dark:text-white">{selectedSubCategory.name}</span>
                    {breadcrumb.length > 1 && (
                      <span className="ml-2 text-gray-500">
                        (Path: {breadcrumb.join(' > ')})
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => addIdealFor(selectedSubCategoryId)}
                  size="sm"
                  className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {idealForOptions.length > 0 ? (
                  idealForOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateIdealFor(selectedSubCategoryId, index, e.target.value)}
                        placeholder="e.g., Homeowners, Business owners, Property managers"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeIdealFor(selectedSubCategoryId, index)}
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
                    No "Ideal For" options yet. Click "Add Option" to create one.
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
