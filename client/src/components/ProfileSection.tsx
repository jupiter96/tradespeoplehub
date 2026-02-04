import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import API_BASE_URL, { resolveApiUrl } from "../config/api";
import { allServices } from "./servicesData";
import ServiceCard from "./ServiceCard";

interface PortfolioItem {
  id: string;
  type?: 'image' | 'video';
  url?: string;
  image?: string; // Legacy support
  thumbnail?: string;
  duration?: number;
  size?: number;
  title: string;
  description: string;
}

// Helper function to resolve media URLs (handles both local paths and external URLs)
const resolveMediaUrl = (url: string | undefined): string => {
  if (!url) return "";
  // If already a full URL, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // If it's a local path (starts with /), resolve it with API base URL
  if (url.startsWith("/")) {
    return resolveApiUrl(url);
  }
  return url;
};

export default function ProfileSection() {
  const navigate = useNavigate();
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
  const [certifications, setCertifications] = useState<string[]>([""]);
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
    type: 'image' as 'image' | 'video',
    url: "",
    image: "", // Legacy support
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
  
  // For professionals, use tradingName only (never real name)
  const displayName = userInfo?.tradingName || 
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
  
  // Build skills options:
  // - show ALL subcategories that belong to the user's registered MAIN categories
  // - robustly infer selected MAIN categories from:
  //   - main category IDs
  //   - main category names (legacy)
  //   - selected subcategory IDs/names (infer parent main category)
  // - if we still can't infer anything, fall back to only previously selected subcategories
  useEffect(() => {
    const buildSkillsOptionsFromRegisteredMainCategories = () => {
      try {
        setIsLoadingCategories(true);
        const selectedServices = (userInfo?.services || []).filter(Boolean);
        if (!selectedSectorId || availableCategories.length === 0 || selectedServices.length === 0) {
          setAllJobCategories([]);
          return;
        }

        const categoryIdSet = new Set<string>();
        const categoryNameToId = new Map<string, string>();
        const subIdToParentCategoryId = new Map<string, string>();
        const subNameToParentCategoryId = new Map<string, string>();
        const subIdToName = new Map<string, string>();
        const subNameToId = new Map<string, string>();

        availableCategories.forEach((cat: Category & { subCategories?: SubCategory[] }) => {
          if (cat?._id) {
            categoryIdSet.add(cat._id);
            if (cat?.name) categoryNameToId.set(String(cat.name).toLowerCase(), cat._id);
          }
          if (cat.subCategories && cat.subCategories.length > 0) {
            cat.subCategories.forEach((subcat: SubCategory) => {
              if (!subcat?._id || !subcat?.name) return;
              subIdToName.set(subcat._id, subcat.name);
              subNameToId.set(subcat.name, subcat._id);
              // For reverse lookup: subcategory -> parent main category
              subIdToParentCategoryId.set(subcat._id, cat._id);
              subNameToParentCategoryId.set(String(subcat.name).toLowerCase(), cat._id);
            });
          }
        });

        // Determine which MAIN categories the user registered with (IDs/names OR via subcategory->parent inference).
        const selectedMainCategoryIds = new Set<string>();
        for (const raw of selectedServices) {
          const val = String(raw).trim();
          if (!val) continue;
          if (categoryIdSet.has(val)) {
            selectedMainCategoryIds.add(val);
            continue;
          }
          const mapped = categoryNameToId.get(val.toLowerCase());
          if (mapped) selectedMainCategoryIds.add(mapped);

          // If value looks like a subcategory id, infer its parent category.
          const parentBySubId = subIdToParentCategoryId.get(val);
          if (parentBySubId) selectedMainCategoryIds.add(parentBySubId);

          // Legacy: if value is a subcategory name, infer its parent category.
          const parentBySubName = subNameToParentCategoryId.get(val.toLowerCase());
          if (parentBySubName) selectedMainCategoryIds.add(parentBySubName);
        }

        const allowed: Array<{ id: string; name: string; sector?: string }> = [];

        if (selectedMainCategoryIds.size > 0) {
          // Main categories found: suggest ALL subcategories under those main categories.
          for (const cat of availableCategories as Array<Category & { subCategories?: SubCategory[] }>) {
            if (!selectedMainCategoryIds.has(cat._id)) continue;
            (cat.subCategories || []).forEach((subcat: SubCategory) => {
              if (!subcat?._id || !subcat?.name) return;
              allowed.push({ id: subcat._id, name: subcat.name, sector: selectedSectorObj?.name });
            });
          }
        } else {
          // Fallback: only show user's previously selected SUBCATEGORIES (ignore main category IDs)
          for (const raw of selectedServices) {
            const id = String(raw).trim();
            if (!id) continue;
            if (categoryIdSet.has(id)) continue;

            const nameById = subIdToName.get(id);
            if (nameById) {
              allowed.push({ id, name: nameById, sector: selectedSectorObj?.name });
              continue;
            }

            // Legacy support: if services contain names instead of IDs
            const mappedId = subNameToId.get(id);
            if (mappedId) {
              allowed.push({ id: mappedId, name: id, sector: selectedSectorObj?.name });
            }
          }
        }

        // Remove duplicates (prefer stable by id, fall back to name)
        const uniqueAllowed = Array.from(
          new Map(allowed.map((i) => [i.id ? `id:${i.id}` : `name:${i.name.toLowerCase()}`, i])).values()
        );

        setAllJobCategories(uniqueAllowed.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        // console.error('Error building registered subcategories:', error);
        setAllJobCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    buildSkillsOptionsFromRegisteredMainCategories();
  }, [availableCategories, selectedSectorId, selectedSectorObj, userInfo?.services]);
  
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

  // Extract only the user's REGISTERED subcategory names (skills list should be constrained to these)
  const getRegisteredSubcategoryNames = (serviceIdsOrNames: string[]): string[] => {
    if (!serviceIdsOrNames || serviceIdsOrNames.length === 0 || availableCategories.length === 0) return [];

    const categoryIdSet = new Set<string>();
    const subIdToName = new Map<string, string>();
    const subNameSet = new Set<string>();

    availableCategories.forEach((cat: Category & { subCategories?: SubCategory[] }) => {
      if (cat?._id) categoryIdSet.add(cat._id);
      if (cat.subCategories) {
        cat.subCategories.forEach((sc: SubCategory) => {
          if (!sc?._id || !sc?.name) return;
          subIdToName.set(sc._id, sc.name);
          subNameSet.add(sc.name);
        });
      }
    });

    const names: string[] = [];
    for (const raw of serviceIdsOrNames) {
      const val = String(raw).trim();
      if (!val) continue;
      if (categoryIdSet.has(val)) continue; // skip main categories
      const name = subIdToName.get(val) || (subNameSet.has(val) ? val : "");
      if (name) names.push(name);
    }

    // unique, keep order
    const seen = new Set<string>();
    return names.filter((n) => {
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
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

  // Profile stats for preview (reviews + rating from service and job reviews)
  type ProfileStats = {
    ratingAverage: number;
    ratingCount: number;
    reviews: Array<{ id: string; name: string; stars: number; text: string; createdAt?: string | Date; response?: { text: string; respondedAt?: string } | null }>;
  };
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [profileStatsLoading, setProfileStatsLoading] = useState(false);

  useEffect(() => {
    const userId = (userInfo as any)?.id ?? (userInfo as any)?._id;
    if (!userId) {
      setProfileStats(null);
      return;
    }
    let cancelled = false;
    setProfileStatsLoading(true);
    fetch(resolveApiUrl(`/api/auth/profile/${userId}`), { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const profile = data?.profile;
        if (profile) {
          setProfileStats({
            ratingAverage: typeof profile.ratingAverage === "number" ? profile.ratingAverage : 0,
            ratingCount: typeof profile.ratingCount === "number" ? profile.ratingCount : 0,
            reviews: Array.isArray(profile.reviews) ? profile.reviews : [],
          });
        } else {
          setProfileStats({ ratingAverage: 0, ratingCount: 0, reviews: [] });
        }
      })
      .catch(() => {
        if (!cancelled) setProfileStats({ ratingAverage: 0, ratingCount: 0, reviews: [] });
      })
      .finally(() => {
        if (!cancelled) setProfileStatsLoading(false);
      });
    return () => { cancelled = true; };
  }, [userInfo?.id ?? (userInfo as any)?._id]);

  const [expandedReviewResponses, setExpandedReviewResponses] = useState<Set<string>>(new Set());
  const toggleReviewResponse = (reviewId: string) => {
    setExpandedReviewResponses(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };
  const reviewCount = profileStats?.ratingCount ?? 0;
  const rating = profileStats?.ratingAverage ?? 0;
  const reviewText = profileStatsLoading
    ? "..."
    : reviewCount === 0
    ? "(0 reviews)"
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
      // Skills: only show registered SUBCATEGORIES, and only allow re-selecting from them.
      const registeredSkillNames = availableCategories.length > 0
        ? getRegisteredSubcategoryNames(userInfo.services || [])
        : [];
      setSkills(registeredSkillNames);
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

      // Load Certifications
      const certs = (userInfo.publicProfile as any)?.certifications;
      if (certs) {
        const certsArray = typeof certs === 'string'
          ? certs.split('\n').filter((c: string) => c.trim())
          : Array.isArray(certs)
          ? certs
          : [];
        setCertifications(certsArray.length > 0 ? certsArray : [""]);
      } else {
        setCertifications([""]);
      }

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
      
      // Preserve existing MAIN category IDs, but only allow SUBCATEGORY selection via the Skills picker.
      const categoryIdSet = new Set<string>(availableCategories.map((c: Category) => c._id));
      const existingCategoryIds = (userInfo?.services || []).filter((s: string) => categoryIdSet.has(s));

      // Convert selected skill names back to IDs for saving (subcategory ids)
      const selectedSubCategoryIds = convertServiceNamesToIds(skills);
      const serviceIds = Array.from(new Set([...existingCategoryIds, ...selectedSubCategoryIds]));
      
      
      // Include only profile edit fields
      // Note: firstName, lastName, email, phone are excluded as they are managed in "My Details" section
      // and require OTP verification for changes
      const profileData: any = {
        services: serviceIds, // Save as IDs
        professionalIndemnityAmount: professionalIndemnityAmount == null ? 0 : professionalIndemnityAmount,
        insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate).toISOString() : undefined,
        publicProfile: {
          bio,
          portfolio,
          isPublic,
          qualifications: qualifications.filter(q => q.trim()).join('\n'),
          certifications: certifications.filter(c => c.trim()).join('\n'),
          companyDetails,
          coverImage: coverImage || (userInfo?.publicProfile as any)?.coverImage || undefined,
        },
      };
      await updateProfile(profileData);
      
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('[ProfileSection] Error updating profile:', error);
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
      // console.error("Error uploading avatar:", error);
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
      // console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
      return null;
    } finally {
      setIsUploadingPortfolioImage(false);
    }
  };

  const handlePortfolioVideoUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload MP4, MPEG, MOV, AVI, or WEBM video.");
      return null;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video size must be less than 50MB");
      return null;
    }

    setIsUploadingPortfolioImage(true);
    try {
      const formData = new FormData();
      formData.append("portfolioVideo", file);

      const response = await fetch(`${API_BASE_URL}/api/auth/profile/portfolio/upload-video`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload video");
      }

      const data = await response.json();
      return {
        videoUrl: data.videoUrl,
        thumbnail: data.thumbnail,
        duration: data.duration,
        size: data.size,
      };
    } catch (error) {
      // console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload video");
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

    let mediaUrl = newPortfolioItem.url || newPortfolioItem.image;
    let mediaData: any = {};

    // If file is selected, upload it first
    if (portfolioInputType === "file" && portfolioImageFile) {
      if (newPortfolioItem.type === 'video') {
        const uploadedData = await handlePortfolioVideoUpload(portfolioImageFile);
        if (!uploadedData) {
          return; // Error already shown
        }
        mediaUrl = uploadedData.videoUrl;
        mediaData = {
          thumbnail: uploadedData.thumbnail,
          duration: uploadedData.duration,
          size: uploadedData.size,
        };
      } else {
        const uploadedUrl = await handlePortfolioImageUpload(portfolioImageFile);
        if (!uploadedUrl) {
          return; // Error already shown
        }
        mediaUrl = uploadedUrl;
      }
    } else if (portfolioInputType === "link" && !mediaUrl) {
      toast.error("Please provide a media URL or upload a file");
      return;
    }

    if (!mediaUrl) {
      toast.error("Please provide a media URL or upload a file");
      return;
    }

    const newItem: PortfolioItem = {
      id: `portfolio-${Date.now()}`,
      type: newPortfolioItem.type,
      url: mediaUrl,
      image: newPortfolioItem.type === 'image' ? mediaUrl : undefined, // Legacy support
      ...mediaData,
      title: newPortfolioItem.title,
      description: newPortfolioItem.description,
    };

    setPortfolio([...portfolio, newItem]);
    setNewPortfolioItem({ type: 'image', url: "", image: "", title: "", description: "" });
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
    const rawMediaUrl = item.url || item.image || "";
    const mediaUrl = resolveMediaUrl(rawMediaUrl);
    setNewPortfolioItem({
      type: item.type || 'image',
      url: rawMediaUrl, // Keep original URL for saving
      image: rawMediaUrl,
      title: item.title,
      description: item.description,
    });
    setPortfolioImageFile(null);
    setPortfolioImagePreview(item.type === 'video' ? resolveMediaUrl(item.thumbnail || rawMediaUrl) : mediaUrl);
    setPortfolioInputType(rawMediaUrl.startsWith("http") ? "link" : "file");
    setIsAddingPortfolio(true);
  };

  const handleUpdatePortfolioItem = async () => {
    if (!editingPortfolioId) return;

    let mediaUrl = newPortfolioItem.url || newPortfolioItem.image;
    let mediaData: any = {};

    // If file is selected, upload it first
    if (portfolioInputType === "file" && portfolioImageFile) {
      if (newPortfolioItem.type === 'video') {
        const uploadedData = await handlePortfolioVideoUpload(portfolioImageFile);
        if (!uploadedData) {
          return; // Error already shown
        }
        mediaUrl = uploadedData.videoUrl;
        mediaData = {
          thumbnail: uploadedData.thumbnail,
          duration: uploadedData.duration,
          size: uploadedData.size,
        };
      } else {
        const uploadedUrl = await handlePortfolioImageUpload(portfolioImageFile);
        if (!uploadedUrl) {
          return; // Error already shown
        }
        mediaUrl = uploadedUrl;
      }
    } else if (portfolioInputType === "link" && !mediaUrl) {
      toast.error("Please provide a media URL or upload a file");
      return;
    }

    if (!mediaUrl) {
      toast.error("Please provide a media URL or upload a file");
      return;
    }

    setPortfolio(portfolio.map(item =>
      item.id === editingPortfolioId
        ? { 
            ...item, 
            type: newPortfolioItem.type,
            url: mediaUrl,
            image: newPortfolioItem.type === 'image' ? mediaUrl : undefined,
            ...mediaData,
            title: newPortfolioItem.title, 
            description: newPortfolioItem.description 
          }
        : item
    ));

    setEditingPortfolioId(null);
    setNewPortfolioItem({ type: 'image', url: "", image: "", title: "", description: "" });
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
          <p className="text-sm text-black mt-1">
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

                  // Load Certifications
                  const certs = (userInfo?.publicProfile as any)?.certifications;
                  if (certs) {
                    const certsArray = typeof certs === 'string'
                      ? certs.split('\n').filter((c: string) => c.trim())
                      : Array.isArray(certs)
                      ? certs
                      : [];
                    setCertifications(certsArray.length > 0 ? certsArray : [""]);
                  } else {
                    setCertifications([""]);
                  }

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
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <Label className="text-[#FE8A0F] font-semibold mb-2 block">Public Profile Link</Label>
            <div className="flex items-center gap-2 bg-gray-50  rounded-lg p-3 border border-gray-200  min-w-0">
              <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-700  flex-1 truncate min-w-0 overflow-hidden">
                {fullProfileUrl}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10 text-[12px] sm:text-[14px] py-2 px-3 sm:px-4 w-full sm:w-auto"
            >
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="whitespace-nowrap">Copy Link</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10 text-[12px] sm:text-[14px] py-2 px-3 sm:px-4 w-full sm:w-auto"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="whitespace-nowrap">Share</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(fullProfileUrl, "_blank")}
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10 text-[12px] sm:text-[14px] py-2 px-3 sm:px-4 w-full sm:w-auto"
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="whitespace-nowrap">Open</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Image Section */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <Label className="text-[#FE8A0F] font-semibold mb-4 block">Profile Cover Image</Label>
        <p className="text-sm text-gray-600  mb-4">
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
              <p className="font-['Poppins',sans-serif] text-sm md:text-base">
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
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <Label className="text-[#FE8A0F] font-semibold mb-4 block">Profile Picture</Label>
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24 border-4 border-[#FE8A0F]/20 flex-shrink-0 shadow-lg">
            <AvatarImage 
              src={avatarPreview || userInfo?.avatar || undefined} 
              alt={userInfo?.name || 'User avatar'}
              className="object-cover"
            />
            <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[32px]">
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
      <div className="bg-white rounded-2xl p-6 shadow-md">
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
                  className="w-full justify-start text-left font-normal border-[#FE8A0F] text-black bg-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add skill...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search your registered skills..." className="h-9" />
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
            <p className="text-xs text-gray-500">You can only choose from the subcategories you selected during registration.</p>
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
      <div className="bg-white rounded-2xl p-6 shadow-md">
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
                  className="flex-1 bg-white border-[#FE8A0F] text-black placeholder:text-black/50 "
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
          <div className="mt-2 p-4 bg-gray-50  rounded-lg border border-gray-200 ">
            {qualifications.length > 0 && qualifications.some(q => q.trim()) ? (
              <div className="space-y-2">
                {qualifications.filter(q => q.trim()).map((qual, index) => (
                  <p key={index} className="text-black">
                    {qual.trim()}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-black">
                No qualifications added yet. Click 'Edit Profile' to add qualifications.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Insurance Section */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Public Liability Insurance</Label>
        {isEditing ? (
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-black mb-1 block">Professional Indemnity Insurance Amount (£)</Label>
              <Input
                type="number"
                value={professionalIndemnityAmount || ""}
                onChange={(e) => setProfessionalIndemnityAmount(e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g., 1200000"
                className="bg-white border-[#FE8A0F] text-black"
              />
            </div>
            <div>
              <Label className="text-black mb-1 block">Insurance Expiry Date</Label>
              <Input
                type="date"
                value={insuranceExpiryDate}
                onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                className="bg-white border-[#FE8A0F] text-black"
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 p-4 bg-gray-50  rounded-lg border border-gray-200 ">
            <div className="space-y-2">
              {professionalIndemnityAmount && (
                <p className="text-black">
                  <span className="font-semibold">Limit of indemnity:</span> £{professionalIndemnityAmount.toLocaleString()}
                </p>
              )}
              {insuranceExpiryDate && (
                <p className="text-black">
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
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Certifications</Label>
        {isEditing ? (
          <div className="space-y-3 mt-2">
            {certifications.map((cert, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input
                  value={cert}
                  onChange={(e) => {
                    const newCertifications = [...certifications];
                    newCertifications[index] = e.target.value;
                    setCertifications(newCertifications);
                  }}
                  placeholder="e.g., Gas Safe Registered (ID: 123456)"
                  className="flex-1 bg-white border-[#FE8A0F] text-black placeholder:text-black/50 "
                />
                {certifications.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newCertifications = certifications.filter((_, i) => i !== index);
                      setCertifications(newCertifications.length > 0 ? newCertifications : [""]);
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
                setCertifications([...certifications, ""]);
              }}
              className="w-full border-2 border-dashed border-[#FE8A0F] hover:border-[#FE8A0F] text-[#FE8A0F] hover:text-[#FE8A0F] bg-white hover:bg-orange-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Certification
            </Button>
          </div>
        ) : (
          <div className="mt-2 p-4 bg-gray-50  rounded-lg border border-gray-200 ">
            {certifications.filter(c => c.trim()).length > 0 ? (
              <ul className="space-y-2">
                {certifications.filter(c => c.trim()).map((cert, index) => (
                  <li key={index} className="text-black flex items-start">
                    <span className="text-[#FE8A0F] mr-2">•</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No certifications added yet. Click 'Edit Profile' to add certifications.</p>
            )}
          </div>
        )}
      </div>

      {/* Company Details Section */}
      <div className="bg-white rounded-2xlp-6 shadow-md">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Company Details</Label>
        {isEditing ? (
          <Textarea
            value={companyDetails}
            onChange={(e) => setCompanyDetails(e.target.value)}
            placeholder="Enter your company details..."
            className="mt-2 bg-white border-[#FE8A0F] text-black placeholder:text-black/50  min-h-[100px]"
          />
        ) : (
          <div className="mt-2 p-4 bg-gray-50  rounded-lg border border-gray-200 ">
            <p className="text-black whitespace-pre-wrap">
              {companyDetails || "No company details added yet. Click 'Edit Profile' to add company details."}
            </p>
          </div>
        )}
      </div>

      {/* Bio Section */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <Label className="text-[#FE8A0F] font-semibold mb-2 block">Bio / About Me</Label>
        {isEditing ? (
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about yourself, your experience, and what makes you unique..."
            className="mt-2 bg-white border-[#FE8A0F] text-black placeholder:text-black/50  min-h-[150px]"
            maxLength={1000}
          />
        ) : (
          <div className="mt-2 p-4 bg-gray-50  rounded-lg border border-gray-200 ">
            <p className="text-black whitespace-pre-wrap">
              {bio || "No bio added yet. Click 'Edit Profile' to add your bio."}
            </p>
          </div>
        )}
        {isEditing && (
          <p className="text-xs text-gray-500 mt-2">{bio.length}/1000 characters</p>
        )}
      </div>

      {/* Portfolio Section */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-[#FE8A0F] font-semibold">Portfolio</Label>
          {isEditing && (
              <Button
              onClick={() => {
                setIsAddingPortfolio(true);
                setEditingPortfolioId(null);
                setNewPortfolioItem({ type: 'image', url: "", image: "", title: "", description: "" });
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
          <div className="mb-4 p-4 bg-gray-50  rounded-lg border border-gray-200 ">
            <div className="space-y-4">
              {/* Media Type Selection */}
              <div>
                <Label className="text-black mb-2 block">Media Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newPortfolioItem.type === 'image'}
                      onChange={() => {
                        setNewPortfolioItem({ ...newPortfolioItem, type: 'image' });
                        setPortfolioImageFile(null);
                        setPortfolioImagePreview(null);
                      }}
                      className="w-4 h-4 text-[#FE8A0F]"
                    />
                    <ImageIcon className="w-4 h-4 text-[#FE8A0F]" />
                    <span className="text-black">Image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newPortfolioItem.type === 'video'}
                      onChange={() => {
                        setNewPortfolioItem({ ...newPortfolioItem, type: 'video' });
                        setPortfolioImageFile(null);
                        setPortfolioImagePreview(null);
                      }}
                      className="w-4 h-4 text-[#FE8A0F]"
                    />
                    <Upload className="w-4 h-4 text-[#FE8A0F]" />
                    <span className="text-black">Video</span>
                  </label>
                </div>
              </div>

              {/* Media Source Tabs */}
              <div>
                <Label className="text-black mb-2 block">
                  {newPortfolioItem.type === 'video' ? 'Video' : 'Image'} Source
                </Label>
                <Tabs value={portfolioInputType} onValueChange={(value) => {
                  setPortfolioInputType(value as "file" | "link");
                  setNewPortfolioItem({ ...newPortfolioItem, url: "", image: "" });
                  setPortfolioImageFile(null);
                  setPortfolioImagePreview(null);
                }}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 ">
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
                      {newPortfolioItem.type === 'video' ? 'Video' : 'Image'} URL
                    </TabsTrigger>
                  </TabsList>

                  {/* File Upload Tab */}
                  <TabsContent value="file" className="mt-4">
                    <div>
                      <Label className="text-black">
                        Upload {newPortfolioItem.type === 'video' ? 'Video' : 'Image'}
                      </Label>
                      <div className="mt-1">
                        <input
                          type="file"
                          accept={newPortfolioItem.type === 'video' 
                            ? 'video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm'
                            : 'image/png,image/jpeg,image/jpg,image/gif,image/webp'
                          }
                          className="hidden"
                          id="portfolio-media-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPortfolioImageFile(file);
                              if (newPortfolioItem.type === 'image') {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setPortfolioImagePreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                // For video, show a placeholder
                                const videoUrl = URL.createObjectURL(file);
                                setPortfolioImagePreview(videoUrl);
                              }
                            }
                          }}
                        />
                        <label
                          htmlFor="portfolio-media-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#FE8A0F] rounded-lg cursor-pointer hover:bg-[#FE8A0F]/5 transition-colors"
                        >
                          {portfolioImagePreview ? (
                            <div className="relative w-full h-full">
                              {newPortfolioItem.type === 'video' ? (
                                <video
                                  src={portfolioImagePreview}
                                  className="w-full h-32 object-cover rounded-lg"
                                  controls
                                />
                              ) : (
                                <img
                                  src={portfolioImagePreview}
                                  alt="Preview"
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
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
                              <span className="text-sm text-black">
                                Click to upload {newPortfolioItem.type === 'video' ? 'video' : 'image'}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">
                                {newPortfolioItem.type === 'video' 
                                  ? 'MP4, MPEG, MOV, AVI, WEBM (max 50MB)'
                                  : 'PNG, JPG, GIF, WEBP (max 5MB)'
                                }
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Media URL Tab */}
                  <TabsContent value="link" className="mt-4">
                    <div>
                      <Label className="text-black">
                        {newPortfolioItem.type === 'video' ? 'Video' : 'Image'} URL
                      </Label>
                      <Input
                        value={newPortfolioItem.url || newPortfolioItem.image}
                        onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, url: e.target.value, image: e.target.value })}
                        placeholder={newPortfolioItem.type === 'video' ? 'https://example.com/video.mp4' : 'https://example.com/image.jpg'}
                        className="mt-1 bg-white border-[#FE8A0F] text-black"
                      />
                      {(newPortfolioItem.url || newPortfolioItem.image) && (
                        <div className="mt-2">
                          {newPortfolioItem.type === 'video' ? (
                            <video
                              src={newPortfolioItem.url || newPortfolioItem.image}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              controls
                              onError={(e) => {
                                (e.target as HTMLVideoElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <img
                              src={newPortfolioItem.url || newPortfolioItem.image}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <Label className="text-black">Title *</Label>
                <Input
                  value={newPortfolioItem.title}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
                  placeholder="Project title"
                  className="mt-1 bg-white border-[#FE8A0F] text-black"
                />
              </div>
              <div>
                <Label className="text-black">Description</Label>
                <Textarea
                  value={newPortfolioItem.description}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
                  placeholder="Describe this project..."
                  className="mt-1 bg-white border-[#FE8A0F] text-black"
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
                    setNewPortfolioItem({ type: 'image', url: "", image: "", title: "", description: "" });
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
            portfolio.map((item, index) => {
              const mediaUrl = resolveMediaUrl(item.url || item.image);
              const isVideo = item.type === 'video';
              
              return (
              <div
                key={item.id || `portfolio-item-${index}`}
                className="bg-gray-50  rounded-lg border border-gray-200  overflow-hidden"
              >
                {isVideo ? (
                  <div className="relative w-full h-48 bg-black">
                    <video
                      src={mediaUrl}
                      className="w-full h-48 object-cover"
                      controls
                      preload="metadata"
                    />
                    <div className="absolute top-2 left-2 bg-purple-500/90 text-white px-2 py-1 rounded-md text-xs font-medium">
                      Video
                    </div>
                  </div>
                ) : (
                  <ImageWithFallback
                    src={mediaUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h4 className="font-semibold text-black mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600  line-clamp-2">
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
            );})
          )}
        </div>
      </div>

      {/* Public/Private Toggle */}
      {isEditing && (
        <div className="bg-white rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[#FE8A0F] font-semibold">Profile Visibility</Label>
              <p className="text-sm text-gray-600  mt-1">
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
        <DialogContent className="w-[80vw] max-w-[80vw] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#f0f0f0] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-[#FE8A0F] text-2xl">Profile Preview</DialogTitle>
            <DialogDescription>
              This is how your profile appears to clients. Click "Open in New Tab" to see the full page.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden">
            {/* Profile Header - Matching ProfilePage style */}
            <div className="bg-white rounded-2xl shadow-sm p-3 md:p-6 mb-4 w-full max-w-full overflow-x-hidden">
              <div className="flex gap-4 md:gap-6 w-full max-w-full overflow-x-hidden">
                <div className="flex-shrink-0 relative">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-gray-100 relative">
                    <AvatarImage 
                      src={avatarPreview || userInfo?.avatar} 
                      alt={displayName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[32px] md:text-[40px] rounded-2xl relative">
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
                      className="text-[#003D82] font-['Poppins',sans-serif] mb-0.5 md:mb-1 whitespace-nowrap overflow-hidden"
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
                  <TabsList className="w-full max-w-full bg-white rounded-xl p-1 shadow-sm mb-4 overflow-x-hidden">
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
                        <p className="text-gray-700  leading-relaxed text-[13px] md:text-[14px] mb-4 md:mb-6 whitespace-pre-wrap break-words text-justify">
                          {displayBio}
                        </p>

                        {qualifications.length > 0 && qualifications.some(q => q.trim()) && (
                            <div className="mt-3 md:mt-4">
                              <h5 className="text-[#003D82] text-[13px] md:text-[16px] font-semibold mb-2">Qualifications</h5>
                              <div className="space-y-2">
                                {qualifications.filter(q => q.trim()).map((qual, index) => (
                                  <p key={index} className="text-gray-700  break-words text-justify text-[12px] md:text-[14px] leading-relaxed">
                                    {qual.trim()}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {certifications.length > 0 && certifications.some(c => c.trim()) && (
                            <div className="mt-3 md:mt-4">
                              <h5 className="text-[#003D82] text-[13px] md:text-[16px] font-semibold mb-2">Certifications</h5>
                              <div className="space-y-2">
                                {certifications.filter(c => c.trim()).map((cert, index) => (
                                  <p key={index} className="text-gray-700  break-words text-justify text-[12px] md:text-[14px] leading-relaxed">
                                    {cert.trim()}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {companyDetails && (
                            <div className="mt-3 md:mt-4">
                              <h5 className="text-[#003D82] text-[13px] md:text-[16px] font-semibold mb-2">Company Details</h5>
                              <p className="text-gray-700  whitespace-pre-wrap break-words text-justify text-[12px] md:text-[14px] leading-relaxed">
                                {companyDetails}
                              </p>
                            </div>
                          )}
                          {(professionalIndemnityAmount || insuranceExpiryDate) && (
                            <div className="mt-3 md:mt-4">
                              <h5 className="text-[#003D82] text-[13px] md:text-[16px] font-semibold mb-2">Public Insurance</h5>
                              <div className="space-y-1 md:space-y-2">
                                {professionalIndemnityAmount && (
                                  <p className="text-gray-700  text-[12px] md:text-[14px]">
                                    <span className="font-semibold">Limit of indemnity:</span> £{professionalIndemnityAmount.toLocaleString()}
                                  </p>
                                )}
                                {insuranceExpiryDate && (
                                  <p className="text-gray-700  text-[12px] md:text-[14px]">
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
                        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 justify-items-center">
                          {professionalServices.length > 0 ? (
                            professionalServices.map((service) => (
                              <ServiceCard
                                key={service.id}
                                service={service}
                                onClick={() => navigate(`/service/${service.slug || service._id || service.id}`)}
                                showHeart={false}
                              />
                            ))
                          ) : (
                            <p className="col-span-2 text-gray-500 text-center py-6 md:py-8 text-[13px] md:text-[14px]">
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
                          {portfolio.length > 0 ? portfolio.map((item, index) => {
                            const mediaUrl = resolveMediaUrl(item.url || item.image);
                            const isVideo = item.type === 'video';
                            
                            return (
                            <div
                              key={item.id || index}
                              className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                            >
                              {isVideo ? (
                                <div className="relative w-full h-32 md:h-48 bg-black">
                                  <video
                                    src={mediaUrl}
                                    className="w-full h-32 md:h-48 object-cover"
                                    controls
                                    preload="metadata"
                                  />
                                  <div className="absolute top-2 left-2 bg-purple-500/90 text-white px-2 py-1 rounded-md text-xs font-medium">
                                    Video
                                  </div>
                                </div>
                              ) : (
                                <ImageWithFallback
                                  src={mediaUrl}
                                  alt={item.title}
                                  className="w-full h-32 md:h-48 object-cover"
                                />
                              )}
                              <div className="p-3 md:p-4">
                                <h4 className="text-[#003D82] font-semibold mb-1 md:mb-2 text-[13px] md:text-[15px]">
                                  {item.title}
                                </h4>
                                <p className="text-gray-600 text-[11px] md:text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          )}) : (
                            <p className="text-gray-500 text-center py-6 md:py-8 col-span-2 text-[13px] md:text-[14px]">No portfolio items available yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Reviews Tab - dynamic data (service + job reviews) */}
                  <TabsContent value="reviews">
                    <Card className="w-full max-w-full overflow-x-hidden">
                      <CardContent className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                        <h3 className="text-[#003D82] text-[16px] md:text-[20px] font-semibold mb-3 md:mb-4">
                          Reviews ({reviewCount})
                        </h3>
                        <div className="space-y-4 md:space-y-6">
                          {profileStatsLoading ? (
                            <p className="text-gray-500 text-center py-6 md:py-8 text-[13px] md:text-[14px]">Loading reviews...</p>
                          ) : !profileStats?.reviews?.length ? (
                            <p className="text-gray-500 text-center py-6 md:py-8 text-[13px] md:text-[14px]">No reviews yet.</p>
                          ) : (
                            profileStats.reviews.map((r) => {
                              const createdAt = r.createdAt ? new Date(r.createdAt) : null;
                              const time = createdAt && !Number.isNaN(createdAt.getTime())
                                ? createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                : "";
                              const stars = typeof r.stars === "number" ? Math.max(0, Math.min(5, Math.round(r.stars))) : 0;
                              const hasResponse = r.response?.text;
                              const isExpanded = expandedReviewResponses.has(r.id);
                              return (
                                <div key={r.id} className="flex gap-3 p-3 md:p-4 border border-gray-200 rounded-xl">
                                  <div className="w-10 h-10 rounded-full bg-[#E6F0FF] flex items-center justify-center flex-shrink-0 font-['Poppins',sans-serif] text-[14px] font-semibold text-[#003D82]">
                                    {(r.name || "A").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">{r.name || "Anonymous"}</span>
                                      {time && <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{time}</span>}
                                    </div>
                                    <div className="flex gap-0.5 mb-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-4 h-4 ${star <= stars ? "fill-[#FE8A0F] text-[#FE8A0F]" : "fill-[#E5E5E5] text-[#E5E5E5]"}`}
                                        />
                                      ))}
                                    </div>
                                    {r.text && <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] whitespace-pre-wrap">{r.text}</p>}
                                    {hasResponse && (
                                      <div className="mt-3 border-t border-gray-200 pt-3">
                                        <button
                                          type="button"
                                          onClick={() => toggleReviewResponse(r.id)}
                                          className="w-full flex items-center justify-between gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                                        >
                                          <span className="font-['Poppins',sans-serif] text-[12px] font-medium text-[#003D82]">
                                            {userInfo?.tradingName || "Professional"}&apos;s Response
                                          </span>
                                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6b6b6b] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#6b6b6b] flex-shrink-0" />}
                                        </button>
                                        {isExpanded && (
                                          <div className="mt-2 ml-2 pl-3 border-l-2 border-blue-200">
                                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] whitespace-pre-wrap">{r.response!.text}</p>
                                            {r.response?.respondedAt && (
                                              <p className="font-['Poppins',sans-serif] text-[11px] text-[#9ca3af] mt-2">
                                                {new Date(r.response.respondedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
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
                      <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50  rounded-lg">
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
                      <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50  rounded-lg">
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
                      <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50  rounded-lg">
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
                      <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50  rounded-lg">
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
                              src={resolveMediaUrl(service.image)}
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

