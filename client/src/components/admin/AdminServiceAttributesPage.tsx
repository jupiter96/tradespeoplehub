import React, { useState, useEffect, useCallback, useMemo } from "react";
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

interface CategoryLevelMapping {
  level: number;
  attributeType: string;
  title?: string;
}

interface ServiceCategory {
  _id: string;
  name: string;
  slug: string;
  categoryLevelMapping?: CategoryLevelMapping[];
}

interface ServiceSubCategory {
  _id: string;
  name: string;
  level: number;
  serviceAttributes?: string[];
}

export default function AdminServiceAttributesPage() {
  useAdminRouteGuard();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | null>(null);
  const [selectedSubCategoryByLevel, setSelectedSubCategoryByLevel] = useState<Record<number, string>>({});
  const [subCategoriesByLevel, setSubCategoriesByLevel] = useState<Record<number, ServiceSubCategory[]>>({});
  const [subCategoryAttributes, setSubCategoryAttributes] = useState<Record<string, string[]>>({});
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
        console.error("Error fetching service category:", error);
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
      let url = `/api/service-subcategories?serviceCategoryId=${serviceCategoryId}&level=${level}`;
      if (parentSubCategoryId) {
        url += `&parentSubCategoryId=${parentSubCategoryId}`;
      }

      const response = await fetch(resolveApiUrl(url), { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSubCategoriesByLevel(prev => ({
          ...prev,
          [level]: data.serviceSubCategories || []
        }));

        // Load attributes for each subcategory
        const attributesMap: Record<string, string[]> = {};
        (data.serviceSubCategories || []).forEach((subCat: ServiceSubCategory) => {
          attributesMap[subCat._id] = subCat.serviceAttributes || [];
        });
        setSubCategoryAttributes(prev => ({ ...prev, ...attributesMap }));
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
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

  // Add attribute to subcategory
  const addAttribute = useCallback((subCategoryId: string) => {
    setSubCategoryAttributes((prev: Record<string, string[]>) => ({
      ...prev,
      [subCategoryId]: [...(prev[subCategoryId] || []), '']
    }));
  }, []);

  // Update attribute
  const updateAttribute = useCallback((subCategoryId: string, index: number, value: string) => {
    setSubCategoryAttributes((prev: Record<string, string[]>) => {
      const updated = [...(prev[subCategoryId] || [])];
      updated[index] = value;
      return {
        ...prev,
        [subCategoryId]: updated
      };
    });
  }, []);

  // Remove attribute
  const removeAttribute = useCallback((subCategoryId: string, index: number) => {
    setSubCategoryAttributes((prev: Record<string, string[]>) => ({
      ...prev,
      [subCategoryId]: (prev[subCategoryId] || []).filter((_: string, i: number) => i !== index)
    }));
  }, []);

  // Save all changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(subCategoryAttributes).map(([subCategoryId, attributes]) => ({
        subCategoryId,
        serviceAttributes: (attributes as string[]).filter((attr: string) => attr.trim() !== '')
      }));

      const response = await fetch(
        resolveApiUrl('/api/service-subcategories/bulk-update-attributes'),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ updates })
        }
      );

      if (response.ok) {
        toast.success('Attributes saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save attributes');
      }
    } catch (error) {
      console.error('Error saving attributes:', error);
      toast.error('Failed to save attributes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!categoryId) {
    return (
      <AdminPageLayout
        title="Service Attributes Management"
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
        title="Service Attributes Management"
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
      title={`Service Attributes - ${serviceCategory.name}`}
      description="Manage service attributes (What's Included) for each subcategory"
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
            <strong>Note:</strong> These attributes will be displayed in the "What's Included" section when users create services.
            Select subcategories from each level to manage their specific attributes.
          </p>
        </div>

        {/* Level Navigation - Only show levels that should be visible */}
        <div className="space-y-6">
          {/* Always show Level 2 first */}
          {(() => {
            const level = 2;
            const subCategories = subCategoriesByLevel[level] || [];
            const selectedId = selectedSubCategoryByLevel[level];
            const isLoading = loadingSubCategories[level];
            const mapping = serviceCategory.categoryLevelMapping?.find(m => m.level === 2);
            const levelTitle = mapping?.title || mapping?.attributeType || "Sub Category";

            return (
              <div key={level} className="space-y-3">
                <Label className="text-lg font-semibold text-[#FE8A0F]">
                  Level {level} - {levelTitle}
                </Label>

                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
                  </div>
                ) : subCategories.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No subcategories found for this level
                  </div>
                ) : (
                  <>
                    <RadioGroup
                      value={selectedId || ""}
                      onValueChange={(value) => handleSubCategorySelect(level, value)}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                    >
                      {subCategories.map((subCat) => (
                        <label
                          key={subCat._id}
                          htmlFor={`level-${level}-${subCat._id}`}
                          className={`
                            flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${selectedId === subCat._id
                              ? 'border-[#FE8A0F] bg-[#FFF5EB]'
                              : 'border-gray-200 hover:border-[#FE8A0F]/50'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <RadioGroupItem
                              value={subCat._id}
                              id={`level-${level}-${subCat._id}`}
                            />
                            <span className="font-medium">{subCat.name}</span>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>

                    {/* Attributes for selected subcategory */}
                    {selectedId && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-md font-semibold">
                            Attributes for {subCategories.find(s => s._id === selectedId)?.name}
                          </Label>
                          <Button
                            onClick={() => addAttribute(selectedId)}
                            size="sm"
                            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Attribute
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {(subCategoryAttributes[selectedId] || []).map((attr: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={attr}
                                onChange={(e) => updateAttribute(selectedId, index, e.target.value)}
                                placeholder="Enter attribute (e.g., Licensed and Insured)"
                                className="flex-1"
                              />
                              <Button
                                onClick={() => removeAttribute(selectedId, index)}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {(subCategoryAttributes[selectedId] || []).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-2">
                              No attributes added yet. Click "Add Attribute" to start.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          {/* Show Level 3+ only if previous level is selected */}
          {serviceCategory.categoryLevelMapping
            ?.filter(m => {
              // Show Level 3+ only if previous level is selected
              if (m.level >= 3 && m.level <= 7) {
                return selectedSubCategoryByLevel[m.level - 1] !== undefined;
              }
              return false;
            })
            .sort((a: CategoryLevelMapping, b: CategoryLevelMapping) => a.level - b.level)
            .map((mapping: CategoryLevelMapping) => {
              const level = mapping.level;
              const subCategories = subCategoriesByLevel[level] || [];
              const selectedId = selectedSubCategoryByLevel[level];
              const isLoading = loadingSubCategories[level];

              return (
                <div key={level} className="space-y-3">
                  <Label className="text-lg font-semibold text-[#FE8A0F]">
                    Level {level} - {mapping.title || mapping.attributeType}
                  </Label>

                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
                    </div>
                  ) : subCategories.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No subcategories found for this level
                    </div>
                  ) : (
                    <>
                      <RadioGroup
                        value={selectedId || ""}
                        onValueChange={(value) => handleSubCategorySelect(level, value)}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                      >
                        {subCategories.map((subCat) => (
                          <label
                            key={subCat._id}
                            htmlFor={`level-${level}-${subCat._id}`}
                            className={`
                              flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                              ${selectedId === subCat._id
                                ? 'border-[#FE8A0F] bg-[#FFF5EB]'
                                : 'border-gray-200 hover:border-[#FE8A0F]/50'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <RadioGroupItem
                                value={subCat._id}
                                id={`level-${level}-${subCat._id}`}
                              />
                              <span className="font-medium">{subCat.name}</span>
                            </div>
                          </label>
                        ))}
                      </RadioGroup>

                      {/* Attributes for selected subcategory */}
                      {selectedId && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-md font-semibold">
                              Attributes for {subCategories.find(s => s._id === selectedId)?.name}
                            </Label>
                            <Button
                              onClick={() => addAttribute(selectedId)}
                              size="sm"
                              className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Attribute
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {(subCategoryAttributes[selectedId] || []).map((attr: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input
                                  value={attr}
                                  onChange={(e) => updateAttribute(selectedId, index, e.target.value)}
                                  placeholder="Enter attribute (e.g., Licensed and Insured)"
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() => removeAttribute(selectedId, index)}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            {(subCategoryAttributes[selectedId] || []).length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-2">
                                No attributes added yet. Click "Add Attribute" to start.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </AdminPageLayout>
  );
}

