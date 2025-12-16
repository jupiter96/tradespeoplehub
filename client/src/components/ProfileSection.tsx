import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "./AccountContext";
import { useSectors, useCategories } from "../hooks/useSectorsAndCategories";
import type { Sector, Category, SubCategory } from "../hooks/useSectorsAndCategories";
import defaultCoverImage from "../assets/6bbce490789ed9401b274940c0210ca96c857be3.png";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Eye,
  Share2,
  Copy,
  Link as LinkIcon,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  MapPin,
  Star,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Upload,
  Image as ImageIcon,
  Shield,
  Award,
  Building2,
  FileText,
  XCircle,
  Phone,
  User,
  ShieldCheck,
  Home,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import API_BASE_URL from "../config/api";
import { allServices } from "./servicesData";

interface PortfolioItem {
  id: string;
  image: string;
  title: string;
  description: string;
}

export default function ProfileSection() {
  const { userInfo, updateProfile, uploadAvatar } = useAccount();
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewActiveTab, setPreviewActiveTab] = useState("about");
  // Additional fields
  const [skills, setSkills] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string>("");
  const [companyDetails, setCompanyDetails] = useState<string>("");
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<string>("");
  const [professionalIndemnityAmount, setProfessionalIndemnityAmount] = useState<number | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);
  const displayNameRef = React.useRef<HTMLHeadingElement>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    image: "",
    title: "",
    description: "",
  });
  
  // Preview modal data
  const professionalServices = userInfo?.services && userInfo.services.length > 0 && userInfo.tradingName
    ? allServices.filter(
        (service) => service.tradingName === userInfo.tradingName
      ).slice(0, 10)
    : [];
  
  const verifications = {
    phone: userInfo?.verification?.phone?.status === 'verified' || userInfo?.verification?.phone?.status === 'completed',
    identity: userInfo?.verification?.idCard?.status === 'verified' || userInfo?.verification?.idCard?.status === 'completed',
    address: userInfo?.verification?.address?.status === 'verified' || userInfo?.verification?.address?.status === 'completed',
    insurance: userInfo?.verification?.publicLiabilityInsurance?.status === 'verified' || userInfo?.verification?.publicLiabilityInsurance?.status === 'completed',
  };
  
  // For professionals, prioritize tradingName over firstName/lastName
  const displayName = userInfo?.tradingName || 
    (userInfo?.firstName && userInfo?.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : null) || 
    userInfo?.name || 
    "Professional";
  
  // Load sectors and categories to match with user's services
  const { sectors: sectorsData } = useSectors();
  const selectedSectorObj = sectorsData.find((s: Sector) => s.name === userInfo?.sector);
  const selectedSectorId = selectedSectorObj?._id;
  const { categories: availableCategories } = useCategories(
    selectedSectorId,
    undefined,
    true // include subcategories to convert IDs to names
  );
  
  // Fetch job categories for skills dropdown (filtered to user's sector subcategories)
  const [allJobCategories, setAllJobCategories] = useState<Array<{ id: string; name: string; sector?: string }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [skillsPopoverOpen, setSkillsPopoverOpen] = useState(false);
  
  // Build skills options: only subcategories for the user's selected sector
  useEffect(() => {
    const buildSectorSubCategories = () => {
      try {
        setIsLoadingCategories(true);
        if (!selectedSectorId || availableCategories.length === 0) {
          setAllJobCategories([]);
          return;
        }

        const subCategoryList: Array<{ id: string; name: string; sector?: string }> = [];

        availableCategories.forEach((cat: Category & { subCategories?: SubCategory[] }) => {
          if (cat.subCategories && cat.subCategories.length > 0) {
            cat.subCategories.forEach((subcat: SubCategory) => {
              subCategoryList.push({
                id: subcat._id,
                name: subcat.name,
                sector: typeof cat.sector === 'object' ? (cat.sector as Sector).name : selectedSectorObj?.name,
              });
            });
          }
        });

        // Remove duplicates by name (keep first occurrence)
        const uniqueSubCategories = Array.from(
          new Map(subCategoryList.map(item => [item.name.toLowerCase(), item])).values()
        );

        setAllJobCategories(uniqueSubCategories.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Error building sector subcategories:', error);
        setAllJobCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    buildSectorSubCategories();
  }, [availableCategories, selectedSectorId, selectedSectorObj]);
  
  // Convert service IDs to category/subcategory names
  const convertServiceIdsToNames = (serviceIds: string[]): string[] => {
    if (!serviceIds || serviceIds.length === 0 || availableCategories.length === 0) {
      return [];
    }

    const categoryMap = new Map<string, string>();
    const subcategoryMap = new Map<string, string>();

    // Build maps of ID -> name for categories and subcategories
    availableCategories.forEach((cat: Category) => {
      categoryMap.set(cat._id, cat.name);
      if (cat.subCategories) {
        cat.subCategories.forEach((subcat: SubCategory) => {
          subcategoryMap.set(subcat._id, subcat.name);
        });
      }
    });

    // Convert IDs to names
    return serviceIds.map((id: string) => {
      // Try category first, then subcategory
      return categoryMap.get(id) || subcategoryMap.get(id) || id; // Fallback to ID if not found
    }).filter(Boolean);
  };

  // Convert service names back to IDs (for saving)
  const convertServiceNamesToIds = (serviceNames: string[]): string[] => {
    if (!serviceNames || serviceNames.length === 0 || availableCategories.length === 0) {
      return [];
    }

    const nameToIdMap = new Map<string, string>();

    // Build maps of name -> ID for categories and subcategories
    availableCategories.forEach((cat: Category) => {
      nameToIdMap.set(cat.name, cat._id);
      if (cat.subCategories) {
        cat.subCategories.forEach((subcat: SubCategory) => {
          nameToIdMap.set(subcat.name, subcat._id);
        });
      }
    });

    // Convert names to IDs, fallback to original value if not found (might already be an ID)
    return serviceNames.map((nameOrId: string) => {
      return nameToIdMap.get(nameOrId) || nameOrId;
    }).filter(Boolean);
  };

  // Get first category from services array by matching with actual category names
  const getFirstCategory = () => {
    if (userInfo?.services && userInfo.services.length > 0 && availableCategories.length > 0) {
      const categoryIds = availableCategories.map((cat: Category) => cat._id);
      const firstCategoryId = userInfo.services.find((id: string) => categoryIds.includes(id));
      
      if (firstCategoryId) {
        const category = availableCategories.find((cat: Category) => cat._id === firstCategoryId);
        return category?.name || null;
      }
      
      // Fallback: return first service name
      const serviceNames = convertServiceIdsToNames(userInfo.services);
      if (serviceNames.length > 0) {
        return serviceNames[0];
      }
    }
    // Fallback: return first service item if categories not loaded yet
    if (userInfo?.services && userInfo.services.length > 0) {
      return userInfo.services[0];
    }
    return null;
  };
  
  const displayTitle = getFirstCategory() || userInfo?.sector || "Professional Service Provider";
  // Extract city and county from address field
  // Address format: "address line, city, county, postcode"
  const getCityAndCounty = () => {
    if (userInfo?.address) {
      const addressParts = userInfo.address.split(',').map(part => part.trim());
      // Address format: [address line, city, county, postcode]
      // We only use city and county, not postcode
      const city = userInfo.townCity || addressParts[1] || '';
      const county = addressParts[2] || '';
      
      if (city && county) {
        return `${city}, ${county}`;
      } else if (city) {
        return city;
      } else if (county) {
        return county;
      }
    }
    
    // Fallback to townCity
    if (userInfo?.townCity) {
      return userInfo.townCity;
    }
    
    return "Location not specified";
  };
  
  const displayLocation = getCityAndCounty();
  const displayBio = bio || "No bio available.";
  const memberSince = userInfo?.createdAt 
    ? (() => {
        const date = new Date(userInfo.createdAt);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]}, ${date.getFullYear()}`;
      })()
    : "Jan, 2024";
  const reviewCount = 0;
  const rating = 0.0;
  const reviewText = reviewCount === 0 
    ? "(0 review)" 
    : reviewCount === 1 
    ? "(1 review)" 
    : `(${reviewCount} reviews)`;
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [portfolioImageFile, setPortfolioImageFile] = useState<File | null>(null);
  const [portfolioImagePreview, setPortfolioImagePreview] = useState<string | null>(null);
  const [portfolioInputType, setPortfolioInputType] = useState<"file" | "link">("file");
  const [isUploadingPortfolioImage, setIsUploadingPortfolioImage] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setBio(userInfo.publicProfile?.bio || userInfo.aboutService || "");
      setPortfolio(userInfo.publicProfile?.portfolio || []);
      setIsPublic(userInfo.publicProfile?.isPublic !== false);
      setCoverImage((userInfo.publicProfile as any)?.coverImage || null);
      // Convert service IDs to names for display
      // Re-convert whenever availableCategories changes
      const serviceNames = userInfo.services && availableCategories.length > 0
        ? convertServiceIdsToNames(userInfo.services)
        : (userInfo.services || []);
      setSkills(serviceNames);
      // Convert qualifications string to array
      const quals = (userInfo.publicProfile as any)?.qualifications;
      if (quals) {
        const qualsArray = typeof quals === 'string' 
          ? quals.split('\n').filter((q: string) => q.trim())
          : Array.isArray(quals)
          ? quals
          : [];
        setQualifications(qualsArray.length > 0 ? qualsArray : [""]);
      } else {
        setQualifications([""]);
      }
      setCertifications((userInfo.publicProfile as any)?.certifications || "");
      setCompanyDetails((userInfo.publicProfile as any)?.companyDetails || "");
      if (userInfo.insuranceExpiryDate) {
        const date = new Date(userInfo.insuranceExpiryDate);
        setInsuranceExpiryDate(date.toISOString().split('T')[0]);
      } else {
        setInsuranceExpiryDate("");
      }
      setProfessionalIndemnityAmount(userInfo.professionalIndemnityAmount || null);
      setAvatarPreview(userInfo.avatar || null);
    }
  }, [userInfo, availableCategories]);

  // Adjust font size dynamically for display name in preview modal
  useEffect(() => {
    if (isPreviewOpen && displayNameRef.current) {
      const adjustFontSize = () => {
        const element = displayNameRef.current;
        if (!element) return;

        const container = element.parentElement;
        if (!container) return;

        const containerWidth = container.offsetWidth;
        let fontSize = 20; // Start with smaller max size
        element.style.fontSize = `${fontSize}px`;

        // Check if text overflows
        while (element.scrollWidth > containerWidth && fontSize > 12) {
          fontSize -= 0.5;
          element.style.fontSize = `${fontSize}px`;
        }
      };

      // Adjust on mount and window resize
      adjustFontSize();
      window.addEventListener('resize', adjustFontSize);
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        adjustFontSize();
      });

      return () => {
        window.removeEventListener('resize', adjustFontSize);
      };
    }
  }, [isPreviewOpen, displayName]);


  const handleSave = async () => {
    try {
      // Convert skill names back to IDs for saving
      const serviceIds = convertServiceNamesToIds(skills);
      
      // Include required fields from userInfo
      const profileData: any = {
        firstName: userInfo?.firstName || "",
        lastName: userInfo?.lastName || "",
        email: userInfo?.email || "",
        phone: userInfo?.phone || "",
        postcode: userInfo?.postcode || "",
        services: serviceIds, // Save as IDs
        professionalIndemnityAmount: professionalIndemnityAmount == null ? 0 : professionalIndemnityAmount,
        insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate).toISOString() : undefined,
        publicProfile: {
          bio,
          portfolio,
          isPublic,
          qualifications: qualifications.filter(q => q.trim()).join('\n'),
          certifications,
          companyDetails,
          coverImage: coverImage || (userInfo?.publicProfile as any)?.coverImage || undefined,
        },
      };

      await updateProfile(profileData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload JPG, PNG, GIF, or WEBP image.");
      event.target.value = "";
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      event.target.value = "";
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
      setAvatarPreview(userInfo?.avatar || null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePortfolioImageUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload JPG, PNG, GIF, or WEBP image.");
      return null;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return null;
    }

    setIsUploadingPortfolioImage(true);
    try {
      const formData = new FormData();
      formData.append("portfolioImage", file);

      const response = await fetch(`${API_BASE_URL}/api/auth/profile/portfolio/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
      return null;
    } finally {
      setIsUploadingPortfolioImage(false);
    }
  };

  const handleAddPortfolioItem = async () => {
    if (!newPortfolioItem.title) {
      toast.error("Please fill in the title");
      return;
    }

    let imageUrl = newPortfolioItem.image;

    // If file is selected, upload it first
    if (portfolioInputType === "file" && portfolioImageFile) {
      const uploadedUrl = await handlePortfolioImageUpload(portfolioImageFile);
      if (!uploadedUrl) {
        return; // Error already shown in handlePortfolioImageUpload
      }
      imageUrl = uploadedUrl;
    } else if (portfolioInputType === "link" && !newPortfolioItem.image) {
      toast.error("Please provide an image URL or upload a file");
      return;
    }

    if (!imageUrl) {
      toast.error("Please provide an image URL or upload a file");
      return;
    }

    const newItem: PortfolioItem = {
      id: `portfolio-${Date.now()}`,
      image: imageUrl,
      title: newPortfolioItem.title,
      description: newPortfolioItem.description,
    };

    setPortfolio([...portfolio, newItem]);
    setNewPortfolioItem({ image: "", title: "", description: "" });
    setPortfolioImageFile(null);
    setPortfolioImagePreview(null);
    setIsAddingPortfolio(false);
    toast.success("Portfolio item added");
  };

  const handleDeletePortfolioItem = (id: string) => {
    setPortfolio(portfolio.filter(item => item.id !== id));
    toast.success("Portfolio item deleted");
  };

  const handleEditPortfolioItem = (item: PortfolioItem) => {
    setEditingPortfolioId(item.id);
    setNewPortfolioItem({
      image: item.image,
      title: item.title,
      description: item.description,
    });
    setPortfolioImageFile(null);
    setPortfolioImagePreview(null);
    setPortfolioInputType(item.image.startsWith("http") ? "link" : "file");
    setIsAddingPortfolio(true);
  };

  const handleUpdatePortfolioItem = async () => {
    if (!editingPortfolioId) return;

    let imageUrl = newPortfolioItem.image;

    // If file is selected, upload it first
    if (portfolioInputType === "file" && portfolioImageFile) {
      const uploadedUrl = await handlePortfolioImageUpload(portfolioImageFile);
      if (!uploadedUrl) {
        return; // Error already shown in handlePortfolioImageUpload
      }
      imageUrl = uploadedUrl;
    } else if (portfolioInputType === "link" && !newPortfolioItem.image) {
      toast.error("Please provide an image URL or upload a file");
      return;
    }

    if (!imageUrl) {
      toast.error("Please provide an image URL or upload a file");
      return;
    }

    setPortfolio(portfolio.map(item =>
      item.id === editingPortfolioId
        ? { ...item, image: imageUrl, title: newPortfolioItem.title, description: newPortfolioItem.description }
        : item
    ));

    setEditingPortfolioId(null);
    setNewPortfolioItem({ image: "", title: "", description: "" });
    setPortfolioImageFile(null);
    setPortfolioImagePreview(null);
    setIsAddingPortfolio(false);
    toast.success("Portfolio item updated");
  };

  const handleCopyLink = () => {
    if (!userInfo?.id) {
      toast.error("User ID not available");
      return;
    }
    const fullUrl = `${window.location.origin}/profile/${userInfo.id}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Profile link copied to clipboard!");
  };

  const handleShare = async () => {
    if (!userInfo?.id) {
      toast.error("User ID not available");
      return;
    }
    const fullUrl = `${window.location.origin}/profile/${userInfo.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userInfo?.name || "Professional"}'s Profile`,
          text: `Check out ${userInfo?.name || "this professional"}'s profile`,
          url: fullUrl,
        });
        toast.success("Profile shared!");
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const fullProfileUrl = userInfo?.id ? `${window.location.origin}/profile/${userInfo.id}` : "";
  const currentCoverImage = coverImage || (userInfo?.publicProfile as any)?.coverImage || defaultCoverImage;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#FE8A0F]">Public Profile</h2>
          <p className="text-sm text-black dark:text-white mt-1">
            Manage your public profile that clients can view
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // Reset to original values
                  setBio(userInfo?.publicProfile?.bio || userInfo?.aboutService || "");
                  setPortfolio(userInfo?.publicProfile?.portfolio || []);
                  // Convert service IDs to names for display
                  const serviceNames = userInfo?.services && availableCategories.length > 0
                    ? convertServiceIdsToNames(userInfo.services)
                    : (userInfo?.services || []);
                  setSkills(serviceNames);
                  // Convert qualifications string to array
                  const quals = (userInfo?.publicProfile as any)?.qualifications;
                  if (quals) {
                    const qualsArray = typeof quals === 'string' 
                      ? quals.split('\n').filter((q: string) => q.trim())
                      : Array.isArray(quals)
                      ? quals
                      : [];
                    setQualifications(qualsArray.length > 0 ? qualsArray : [""]);
                  } else {
                    setQualifications([""]);
                  }
                  setCertifications((userInfo?.publicProfile as any)?.certifications || "");
                  setCompanyDetails((userInfo?.publicProfile as any)?.companyDetails || "");
                  setCoverImage((userInfo?.publicProfile as any)?.coverImage || null);
                  if (userInfo?.insuranceExpiryDate) {
                    const date = new Date(userInfo.insuranceExpiryDate);
                    setInsuranceExpiryDate(date.toISOString().split('T')[0]);
                  } else {
                    setInsuranceExpiryDate("");
                  }
                  setProfessionalIndemnityAmount(userInfo?.professionalIndemnityAmount || null);
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Link Section */}
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-4 md:p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <Label className="text-[#FE8A0F] font-semibold mb-2 block">Public Profile Link</Label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 min-w-0">
              <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate min-w-0 overflow-hidden">
                {fullProfileUrl}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(fullProfileUrl, "_blank")}
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Image Section */}
      <div className="bg-white dark:bg-black rounded-XL border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,0,0,0.1)]">
        <Label className="text-[#FE8A0F] font-semibold mb-4 block">Profile Cover Image</Label>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          This image appears as a large banner at the top of your public profile. Recommended size: 1600×400px.
        </p>
        <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-[#FFE5C4] via-[#FFF5EB] to-[#E0F7FA] flex items-center justify-center">
          {currentCoverImage ? (
            <img
              src={currentCoverImage}
              alt="Profile cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-gray-500">
              <p className="font-['Roboto',sans-serif] text-sm md:text-base">
                No cover image selected
              </p>
              <p className="text-xs md:text-sm">Upload an image to make your profile stand out</p>
            </div>
          )}
        </div>
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4 items-start sm:items-center">
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                // Basic validation
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                  toast.error("Please upload an image file (JPG, PNG, GIF, WEBP).");
                  event.target.value = "";
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("Image size should be less than 5MB.");
                  event.target.value = "";
                  return;
                }
                setIsUploadingCoverImage(true);
                try {
                  const uploadedUrl = await handlePortfolioImageUpload(file);
                  if (uploadedUrl) {
                    setCoverImage(uploadedUrl);
                    toast.success("Cover image updated");
                  }
                } finally {
                  setIsUploadingCoverImage(false);
                  if (coverFileInputRef.current) {
                    coverFileInputRef.current.value = "";
                  }
                }
              }}
            />
            <Button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              disabled={isUploadingCoverImage}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white disabled:opacity-70"
            >
              {isUploadingCoverImage ? "Uploading..." : currentCoverImage ? "Change Cover Image" : "Upload Cover Image"}
            </Button>
            <p className="text-xs text-gray-500">
              Use a wide, high-quality image for the best appearance.
            </p>
          </div>
        )}
      </div>

      {/* Avatar Section */}
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <Label className="text-[#FE8A0F] font-semibold mb-4 block">Profile Picture</Label>
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24 border-4 border-[#FE8A0F]/20 flex-shrink-0 shadow-lg">
            <AvatarImage 
              src={avatarPreview || userInfo?.avatar || undefined} 
              alt={userInfo?.name || 'User avatar'}
              className="object-cover"
            />
            <AvatarFallback className="bg-[#FE8A0F] text-white font-['Roboto',sans-serif] text-[32px]">
              {userInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white disabled:opacity-70"
              >
                {isUploadingAvatar ? "Uploading..." : "Change Avatar"}
              </Button>
              <p className="text-xs text-gray-500">This will sync with My Details section</p>
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Skills</Label>
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-50 text-[#003D82] hover:bg-blue-100 px-3 py-1"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Popover open={skillsPopoverOpen} onOpenChange={setSkillsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal border-[#FE8A0F] text-black dark:text-white bg-white dark:bg-black"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add job category...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search job categories..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>
                      {isLoadingCategories ? "Loading categories..." : "No categories found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {allJobCategories
                        .filter(cat => !skills.includes(cat.name))
                        .map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.name}
                            onSelect={() => {
                              if (!skills.includes(category.name)) {
                                setSkills([...skills, category.name]);
                                setSkillsPopoverOpen(false);
                              }
                            }}
                            className="cursor-pointer"
                          >
                            {category.name}
                            {category.sector && (
                              <span className="ml-2 text-xs text-gray-500">({category.sector})</span>
                            )}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500">Click "Add job category" to select from available categories</p>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.length > 0 ? (
              skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-50 text-[#003D82] hover:bg-blue-100 px-3 py-1"
                >
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No skills added yet. Click 'Edit Profile' to add skills.</p>
            )}
          </div>
        )}
      </div>

      {/* Qualifications Section */}
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Qualifications</Label>
        {isEditing ? (
          <div className="space-y-3 mt-2">
            {qualifications.map((qual, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input
                  value={qual}
                  onChange={(e) => {
                    const newQualifications = [...qualifications];
                    newQualifications[index] = e.target.value;
                    setQualifications(newQualifications);
                  }}
                  placeholder="e.g., NVQ Level 3 in Plumbing (Registration: PL123456)"
                  className="flex-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
                />
                {qualifications.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newQualifications = qualifications.filter((_, i) => i !== index);
                      setQualifications(newQualifications.length > 0 ? newQualifications : [""]);
                    }}
                    className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQualifications([...qualifications, ""]);
              }}
              className="w-full border-2 border-dashed border-gray-300 hover:border-[#FE8A0F] text-gray-600 hover:text-[#FE8A0F]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Qualification
            </Button>
          </div>
        ) : (
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            {qualifications.length > 0 && qualifications.some(q => q.trim()) ? (
              <div className="space-y-2">
                {qualifications.filter(q => q.trim()).map((qual, index) => (
                  <p key={index} className="text-black dark:text-white">
                    {qual.trim()}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-black dark:text-white">
                No qualifications added yet. Click 'Edit Profile' to add qualifications.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Insurance Section */}
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Public Liability Insurance</Label>
        {isEditing ? (
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-black dark:text-white mb-1 block">Professional Indemnity Insurance Amount (£)</Label>
              <Input
                type="number"
                value={professionalIndemnityAmount || ""}
                onChange={(e) => setProfessionalIndemnityAmount(e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g., 1200000"
                className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
              />
            </div>
            <div>
              <Label className="text-black dark:text-white mb-1 block">Insurance Expiry Date</Label>
              <Input
                type="date"
                value={insuranceExpiryDate}
                onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {professionalIndemnityAmount && (
                <p className="text-black dark:text-white">
                  <span className="font-semibold">Limit of indemnity:</span> £{professionalIndemnityAmount.toLocaleString()}
                </p>
              )}
              {insuranceExpiryDate && (
                <p className="text-black dark:text-white">
                  <span className="font-semibold">Valid until:</span> {new Date(insuranceExpiryDate).toLocaleDateString()}
                </p>
              )}
              {!professionalIndemnityAmount && !insuranceExpiryDate && (
                <p className="text-gray-500 text-sm">No insurance details added yet. Click 'Edit Profile' to add insurance information.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Certifications Section */}
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Certifications</Label>
        {isEditing ? (
          <Textarea
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="List your certifications (one per line)..."
            className="mt-2 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 min-h-[100px]"
          />
        ) : (
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-black dark:text-white whitespace-pre-wrap">
              {certifications || "No certifications added yet. Click 'Edit Profile' to add certifications."}
            </p>
          </div>
        )}
      </div>

      {/* Company Details Section */}
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Company Details</Label>
        {isEditing ? (
          <Textarea
            value={companyDetails}
            onChange={(e) => setCompanyDetails(e.target.value)}
            placeholder="Enter your company details..."
            className="mt-2 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 min-h-[100px]"
          />
        ) : (
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-black dark:text-white whitespace-pre-wrap">
              {companyDetails || "No company details added yet. Click 'Edit Profile' to add company details."}
            </p>
          </div>
        )}
      </div>

      {/* Bio Section */}
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Bio / About Me</Label>
        {isEditing ? (
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about yourself, your experience, and what makes you unique..."
            className="mt-2 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 min-h-[150px]"
            maxLength={1000}
          />
        ) : (
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-black dark:text-white whitespace-pre-wrap">
              {bio || "No bio added yet. Click 'Edit Profile' to add your bio."}
            </p>
          </div>
        )}
        {isEditing && (
          <p className="text-xs text-gray-500 mt-2">{bio.length}/1000 characters</p>
        )}
      </div>

      {/* Portfolio Section */}
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-[#FE8A0F] font-semibold">Portfolio</Label>
          {isEditing && (
            <Button
              onClick={() => {
                setIsAddingPortfolio(true);
                setEditingPortfolioId(null);
                setNewPortfolioItem({ image: "", title: "", description: "" });
              }}
              variant="outline"
              size="sm"
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>

        {isAddingPortfolio && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Image Source Tabs */}
              <div>
                <Label className="text-black dark:text-white mb-2 block">Image Source</Label>
                <Tabs value={portfolioInputType} onValueChange={(value) => {
                  setPortfolioInputType(value as "file" | "link");
                  setNewPortfolioItem({ ...newPortfolioItem, image: "" });
                  setPortfolioImageFile(null);
                  setPortfolioImagePreview(null);
                }}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger 
                      value="file" 
                      className="data-[state=active]:bg-[#FE8A0F] data-[state=active]:text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger 
                      value="link" 
                      className="data-[state=active]:bg-[#FE8A0F] data-[state=active]:text-white"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Image URL
                    </TabsTrigger>
                  </TabsList>

                  {/* File Upload Tab */}
                  <TabsContent value="file" className="mt-4">
                    <div>
                      <Label className="text-black dark:text-white">Upload Image</Label>
                      <div className="mt-1">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                          className="hidden"
                          id="portfolio-image-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPortfolioImageFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setPortfolioImagePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label
                          htmlFor="portfolio-image-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#FE8A0F] rounded-lg cursor-pointer hover:bg-[#FE8A0F]/5 transition-colors"
                        >
                          {portfolioImagePreview ? (
                            <div className="relative w-full h-full">
                              <img
                                src={portfolioImagePreview}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPortfolioImageFile(null);
                                  setPortfolioImagePreview(null);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-[#FE8A0F] mb-2" />
                              <span className="text-sm text-black dark:text-white">
                                Click to upload image
                              </span>
                              <span className="text-xs text-gray-500 mt-1">
                                PNG, JPG, GIF, WEBP (max 5MB)
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Image URL Tab */}
                  <TabsContent value="link" className="mt-4">
                    <div>
                      <Label className="text-black dark:text-white">Image URL</Label>
                      <Input
                        value={newPortfolioItem.image}
                        onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, image: e.target.value })}
                        placeholder="https://gmail.com/image.jpg"
                        className="mt-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
                      />
                      {newPortfolioItem.image && (
                        <div className="mt-2">
                          <img
                            src={newPortfolioItem.image}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <Label className="text-black dark:text-white">Title *</Label>
                <Input
                  value={newPortfolioItem.title}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
                  placeholder="Project title"
                  className="mt-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
                />
              </div>
              <div>
                <Label className="text-black dark:text-white">Description</Label>
                <Textarea
                  value={newPortfolioItem.description}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
                  placeholder="Describe this project..."
                  className="mt-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingPortfolioId ? handleUpdatePortfolioItem : handleAddPortfolioItem}
                  disabled={isUploadingPortfolioImage}
                  className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white disabled:opacity-50"
                >
                  {isUploadingPortfolioImage ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Uploading...
                    </span>
                  ) : (
                    `${editingPortfolioId ? "Update" : "Add"} Item`
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingPortfolio(false);
                    setEditingPortfolioId(null);
                    setNewPortfolioItem({ image: "", title: "", description: "" });
                    setPortfolioImageFile(null);
                    setPortfolioImagePreview(null);
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No portfolio items yet. {isEditing && "Click 'Add Item' to add your work."}
            </div>
          ) : (
            portfolio.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="font-semibold text-black dark:text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                  {isEditing && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPortfolioItem(item)}
                        className="flex-1 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePortfolioItem(item.id)}
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Public/Private Toggle */}
      {isEditing && (
        <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[#FE8A0F] font-semibold">Profile Visibility</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isPublic ? "Your profile is visible to everyone" : "Your profile is private"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsPublic(!isPublic)}
              className={isPublic ? "border-green-500 text-green-600" : "border-gray-300 text-gray-600"}
            >
              {isPublic ? "Public" : "Private"}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Modal - Full Profile Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-[80vw] max-w-[80vw] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#f0f0f0] dark:bg-black p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-[#FE8A0F] text-2xl">Profile Preview</DialogTitle>
            <DialogDescription>
              This is how your profile appears to clients. Click "Open in New Tab" to see the full page.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden">
            {/* Profile Header - Matching ProfilePage style */}
            <div className="bg-white dark:bg-black rounded-2xl shadow-sm p-3 md:p-6 mb-4 w-full max-w-full overflow-x-hidden">
              <div className="flex gap-4 md:gap-6 w-full max-w-full overflow-x-hidden">
                <div className="flex-shrink-0 relative">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-gray-100 relative">
                    <AvatarImage 
                      src={avatarPreview || userInfo?.avatar} 
                      alt={displayName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Roboto',sans-serif] text-[32px] md:text-[40px] rounded-2xl relative">
                      {(() => {
                        if (displayName) {
                          const parts = displayName.trim().split(/\s+/);
                          if (parts.length >= 2) {
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                          }
                          return parts[0][0]?.toUpperCase() || "U";
                        }
                        return "U";
                      })()}
                      {/* Online status badge on fallback (when no image) */}
                      {!(avatarPreview || userInfo?.avatar) && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </AvatarFallback>
                    {/* Online status badge on image (when image exists) */}
                    {(avatarPreview || userInfo?.avatar) && (
                      <div className="absolute top-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 border-white transform translate-x-1/2 -translate-y-1/2"></div>
                    )}
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0 h-24 md:h-32 flex flex-col justify-between">
                  <div className="flex-1 flex flex-col justify-start min-h-0">
                    <h1 
                      ref={displayNameRef}
                      className="text-[#003D82] font-['Roboto',sans-serif] mb-0.5 md:mb-1 whitespace-nowrap overflow-hidden"
                      style={{
                        fontSize: '20px',
                        lineHeight: '1.2',
                        transition: 'font-size 0.1s ease'
                      }}
                    >
                      {displayName}
                    </h1>
                    <p className="text-gray-600 text-[21px] md:text-[23px] mb-0.5 md:mb-1 line-clamp-1">
                      {displayTitle}
                    </p>
                    <div className="flex items-center gap-1.5 text-gray-500 text-[12px] md:text-[14px] mb-0.5 md:mb-1 mt-1 md:mt-1.5">
                      <MapPin className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span className="truncate">{displayLocation}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-auto">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 md:w-4 md:h-4 fill-[#FE8A0F] text-[#FE8A0F]" />
                      <span className="font-semibold text-[11px] md:text-[13px]">{rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-[9px] md:text-[11px]">{reviewText}</span>
                    </div>
                    <div className="text-[9px] md:text-[11px] text-gray-600">
                      <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-0.5" />
                      Member since {memberSince}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Tabs like ProfilePage */}
            <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden">
              {/* Tabs Content - Full Width */}
              <div className="w-full max-w-full overflow-x-hidden">
                <Tabs value={previewActiveTab} onValueChange={setPreviewActiveTab} className="w-full">
                  <TabsList className="w-full max-w-full bg-white dark:bg-black rounded-xl p-1 shadow-sm mb-4 overflow-x-hidden">
                    <TabsTrigger 
                      value="about" 
                      className="flex-1 text-[11px] md:text-[13px] data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                    >
                      About Me
                    </TabsTrigger>
                    <TabsTrigger 
                      value="services" 
                      className="flex-1 text-[11px] md:text-[13px] data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                    >
                      My Services
                    </TabsTrigger>
                    <TabsTrigger 
                      value="portfolio" 
                      className="flex-1 text-[11px] md:text-[13px] data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                    >
                      Portfolio
                    </TabsTrigger>
                    <TabsTrigger 
                      value="reviews" 
                      className="flex-1 text-[11px] md:text-[13px] data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                    >
                      Reviews
                    </TabsTrigger>
                  </TabsList>

                  {/* About Me Tab */}
                  <TabsContent value="about">
                    <Card className="w-full max-w-full overflow-x-hidden">
                      <CardContent className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                        <h3 className="text-[#003D82] text-[16px] md:text-[20px] font-semibold mb-3 md:mb-4">
                          About Me
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[13px] md:text-[14px] mb-4 md:mb-6 whitespace-pre-wrap break-words text-justify">
                          {displayBio}
                        </p>

                        {qualifications.length > 0 && qualifications.some(q => q.trim()) && (
                            <div className="mt-3 md:mt-4">
                              <h5 className="text-[#003D82] text-[13px] md:text-[16px] font-semibold mb-2">Qualifications</h5>
                              <div className="space-y-2">
                                {qualifications.filter(q => q.trim()).map((qual, index) => (
                                  <p key={index} className="text-gray-700 dark:text-gray-300 break-words text-justify text-[12px] md:text-[14px] leading-relaxed">
                                    {qual.trim()}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {certifications && (
                            <div className="mt-3 md:mt-4">
                              <h5 className="text-[#003D82] text-[13px] md:text-[16px] font-semibold mb-2">Certifications</h5>
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words text-justify text-[12px] md:text-[14px] leading-relaxed">
                                {certifications}
                              </p>
                            </div>
                          )}
                          {companyDetails && (
                            <div className="mt-3 md:mt-4">
                              <h5 className="text-[#003D82] text-[13px] md:text-[16px] font-semibold mb-2">Company Details</h5>
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words text-justify text-[12px] md:text-[14px] leading-relaxed">
                                {companyDetails}
                              </p>
                            </div>
                          )}
                          {(professionalIndemnityAmount || insuranceExpiryDate) && (
                            <div className="mt-3 md:mt-4">
                              <h5 className="text-[#003D82] text-[13px] md:text-[16px] font-semibold mb-2">Public Insurance</h5>
                              <div className="space-y-1 md:space-y-2">
                                {professionalIndemnityAmount && (
                                  <p className="text-gray-700 dark:text-gray-300 text-[12px] md:text-[14px]">
                                    <span className="font-semibold">Limit of indemnity:</span> £{professionalIndemnityAmount.toLocaleString()}
                                  </p>
                                )}
                                {insuranceExpiryDate && (
                                  <p className="text-gray-700 dark:text-gray-300 text-[12px] md:text-[14px]">
                                    <span className="font-semibold">Valid until:</span> {new Date(insuranceExpiryDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* My Services Tab */}
                  <TabsContent value="services">
                    <Card className="w-full max-w-full overflow-x-hidden">
                      <CardContent className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                        <h3 className="text-[#003D82] text-[16px] md:text-[20px] font-semibold mb-3 md:mb-4">
                          My Services
                        </h3>
                        <div className="space-y-3 md:space-y-4">
                          {professionalServices.length > 0 ? (
                            professionalServices.map((service) => (
                              <div
                                key={service.id}
                                className="flex gap-3 md:gap-4 p-3 md:p-4 border border-gray-200 rounded-xl hover:border-[#FE8A0F] hover:shadow-md transition-all cursor-pointer"
                              >
                                <ImageWithFallback
                                  src={service.image}
                                  alt={service.description}
                                  className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[#003D82] font-semibold mb-1 text-[13px] md:text-[15px] line-clamp-2 break-words">
                                    {service.description}
                                  </h4>
                                  <p className="text-gray-600 text-[11px] md:text-[14px] mb-2 leading-relaxed break-words">
                                    {service.category}
                                  </p>
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <span className="text-[#FE8A0F] font-semibold text-[14px] md:text-[18px]">
                                      £{service.price}
                                    </span>
                                    {service.badges && service.badges.length > 0 && (
                                      <Badge className="bg-green-500 text-white text-[10px] md:text-[11px]">
                                        {service.badges[0]}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-6 md:py-8 text-[13px] md:text-[14px]">
                              No services available yet
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Portfolio Tab */}
                  <TabsContent value="portfolio">
                    <Card className="w-full max-w-full overflow-x-hidden">
                      <CardContent className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                        <h3 className="text-[#003D82] text-[16px] md:text-[20px] font-semibold mb-3 md:mb-4">
                          Portfolio
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {portfolio.length > 0 ? portfolio.map((item, index) => (
                            <div
                              key={item.id || index}
                              className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                            >
                              <ImageWithFallback
                                src={item.image}
                                alt={item.title}
                                className="w-full h-32 md:h-48 object-cover"
                              />
                              <div className="p-3 md:p-4">
                                <h4 className="text-[#003D82] font-semibold mb-1 md:mb-2 text-[13px] md:text-[15px]">
                                  {item.title}
                                </h4>
                                <p className="text-gray-600 text-[11px] md:text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-gray-500 text-center py-6 md:py-8 col-span-2 text-[13px] md:text-[14px]">No portfolio items available yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Reviews Tab */}
                  <TabsContent value="reviews">
                    <Card className="w-full max-w-full overflow-x-hidden">
                      <CardContent className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                        <h3 className="text-[#003D82] text-[16px] md:text-[20px] font-semibold mb-3 md:mb-4">
                          Reviews ({reviewCount})
                        </h3>
                        <div className="space-y-4 md:space-y-6">
                          <p className="text-gray-500 text-center py-6 md:py-8 text-[13px] md:text-[14px]">No reviews yet.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Verifications Card - Full Width Row */}
              <div className="w-full max-w-full overflow-x-hidden">
                <Card className="w-full max-w-full overflow-x-hidden">
                  <CardContent className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                    <h3 className="text-[#003D82] text-[14px] md:text-[18px] font-semibold mb-3 md:mb-4">
                      Verifications
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-2 md:gap-3">
                          <Phone className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                          <span className="text-[12px] md:text-[14px]">Phone</span>
                        </div>
                        {verifications.phone ? (
                          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-2 md:gap-3">
                          <User className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                          <span className="text-[12px] md:text-[14px]">Identity</span>
                        </div>
                        {verifications.identity ? (
                          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-2 md:gap-3">
                          <Home className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                          <span className="text-[12px] md:text-[14px]">Address</span>
                        </div>
                        {verifications.address ? (
                          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-2 md:gap-3">
                          <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                          <span className="text-[12px] md:text-[14px]">Insurance</span>
                        </div>
                        {verifications.insurance ? (
                          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Available Services - Full Width Row */}
              {professionalServices.length > 0 && (
                <div className="w-full max-w-full overflow-x-hidden">
                  <Card className="w-full max-w-full overflow-x-hidden">
                    <CardContent className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                      <h3 className="text-[#003D82] text-[14px] md:text-[18px] font-semibold mb-3 md:mb-4">
                        Available Services
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full max-w-full overflow-x-hidden">
                        {professionalServices.slice(0, 5).map((service) => (
                          <div
                            key={service.id}
                            className="flex flex-col sm:flex-row gap-2 md:gap-3 p-2 md:p-3 border border-gray-200 rounded-lg hover:border-[#FE8A0F] transition-all cursor-pointer"
                          >
                            <ImageWithFallback
                              src={service.image}
                              alt={service.description}
                              className="w-full sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-md object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[#003D82] text-[11px] md:text-[14px] font-semibold line-clamp-2 mb-1">
                                {service.description}
                              </h4>
                              <span className="text-[#FE8A0F] font-semibold text-[12px] md:text-[16px]">
                                £{service.price}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 md:gap-4 justify-end pt-4 w-full max-w-full overflow-x-hidden">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-[12px] md:text-[14px]"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  window.open(fullProfileUrl, "_blank");
                }}
                className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white text-[12px] md:text-[14px]"
              >
                <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

