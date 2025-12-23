import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Upload, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { resolveApiUrl } from "@/config/api";

// Types
interface Sector {
  _id: string;
  name: string;
}

interface CategoryLevelMapping {
  level: number;
  attributeType: "serviceType" | "size" | "frequency" | "make" | "model";
  title: string;
}

interface ServiceIdealFor {
  name: string;
  order: number;
}

interface ExtraService {
  name: string;
  price: number;
  days: number;
  order: number;
}

interface PricePerUnit {
  enabled: boolean;
  units: { name: string; order: number }[];
}

interface FormData {
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
  categoryLevelMapping: CategoryLevelMapping[];
  serviceIdealFor: ServiceIdealFor[];
  extraServices: ExtraService[];
  pricePerUnit: PricePerUnit;
}

const ATTRIBUTE_TYPES = [
  { value: 'serviceType', label: 'Service Type' },
  { value: 'size', label: 'Size' },
  { value: 'frequency', label: 'Frequency' },
  { value: 'make', label: 'Make' },
  { value: 'model', label: 'Model' },
] as const;

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default function AdminServiceCategoryFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("id");
  const sectorId = searchParams.get("sectorId");
  const isEditMode = !!categoryId;

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState<{ loading: boolean; type: "icon" | "banner" | null }>({
    loading: false,
    type: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    sector: sectorId || "",
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
    pricePerUnit: { enabled: false, units: [] },
  });

  // Fetch sectors
  useEffect(() => {
    fetchSectors();
  }, []);

  // Fetch category data if editing
  useEffect(() => {
    if (categoryId) {
      fetchCategoryData();
    }
  }, [categoryId]);

  // Set sector from query parameter when creating new category
  useEffect(() => {
    if (!categoryId && sectorId) {
      setFormData((prev) => ({
        ...prev,
        sector: sectorId,
      }));
    }
  }, [categoryId, sectorId]);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(prev.name),
      }));
    }
  }, [formData.name]);

  const fetchSectors = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/sectors?activeOnly=false"), {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sectors");
      const data = await response.json();
      setSectors(data.sectors || []);
    } catch (error) {
      console.error("Error fetching sectors:", error);
      toast.error("Failed to load sectors");
    }
  };

  const fetchCategoryData = async () => {
    try {
      const response = await fetch(resolveApiUrl(`/api/service-categories/${categoryId}?includeSector=true&activeOnly=false`), {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch category");
      const data = await response.json();

      // API 응답은 { serviceCategory: ... } 형태
      const category = data.serviceCategory || data;
      
      // sector 처리: populate되어 있으면 객체, 아니면 문자열(ID)
      let sectorId = "";
      if (category.sector) {
        if (typeof category.sector === "string") {
          sectorId = category.sector;
        } else if (category.sector._id) {
          sectorId = category.sector._id;
        }
      }

      setFormData({
        sector: sectorId,
        name: category.name || "",
        slug: category.slug || generateSlug(category.name || ""),
        order: category.order || 0,
        description: category.description || "",
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
        icon: category.icon || "",
        bannerImage: category.bannerImage || "",
        isActive: category.isActive !== undefined ? category.isActive : true,
        level: category.level || 3,
        categoryLevelMapping: category.categoryLevelMapping || [],
        serviceIdealFor: category.serviceIdealFor || [],
        extraServices: category.extraServices || [],
        pricePerUnit: category.pricePerUnit || { enabled: false, units: [] },
      });

      setIconPreview(category.icon || null);
      setBannerPreview(category.bannerImage || null);
    } catch (error) {
      console.error("Error fetching category:", error);
      toast.error("Failed to load category data");
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (file: File, type: "icon" | "banner") => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadingImage({ loading: true, type });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("image", file);

      const response = await fetch(resolveApiUrl("/api/upload"), {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const imageUrl = data.url;

      if (type === "icon") {
        setIconPreview(imageUrl);
        setPendingIconFile(file);
        handleInputChange("icon", imageUrl);
      } else {
        setBannerPreview(imageUrl);
        setPendingBannerFile(file);
        handleInputChange("bannerImage", imageUrl);
      }

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage({ loading: false, type: null });
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.sector) {
      toast.error("Please select a sector");
      return;
    }
    if (!formData.name) {
      toast.error("Please enter a service category name");
      return;
    }

    setIsSaving(true);

    try {
      const url = isEditMode
        ? `/api/service-categories/${categoryId}`
        : "/api/service-categories";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(resolveApiUrl(url), {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save category");
      }

      toast.success(
        isEditMode
          ? "Service category updated successfully"
          : "Service category created successfully"
      );

      // Navigate back to list
      navigate("/admin/service-category");
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-md shadow-gray-200 dark:shadow-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/service-category")}
                className="text-black dark:text-white hover:bg-[#FE8A0F]/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-[#FE8A0F]">
                {isEditMode ? "Edit Service Category" : "Create New Service Category"}
              </h1>
            </div>
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
                  {isEditMode ? "Update" : "Create"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-black rounded-lg shadow-2xl shadow-gray-400 dark:shadow-gray-950 border-0 p-6">
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sector" className="text-black dark:text-white">
                  Sector <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sector}
                  onValueChange={(value) => handleInputChange("sector", value)}
                  disabled={true}
                >
                  <SelectTrigger
                    className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow opacity-60 cursor-not-allowed"
                    disabled={true}
                  >
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
                              { name: "", order: (prev.pricePerUnit?.units || []).length + 1 },
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
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
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
                            title="Remove unit"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

