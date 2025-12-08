import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "./AccountContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
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
  const [qualifications, setQualifications] = useState<string>("");
  const [certifications, setCertifications] = useState<string>("");
  const [companyDetails, setCompanyDetails] = useState<string>("");
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<string>("");
  const [professionalIndemnityAmount, setProfessionalIndemnityAmount] = useState<number | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const displayNameRef = React.useRef<HTMLHeadingElement>(null);
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
  const displayTitle = userInfo?.sector || "Professional Service Provider";
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
  const rating = 5.0;
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
      setSkills(userInfo.services || []);
      setQualifications((userInfo.publicProfile as any)?.qualifications || "");
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
  }, [userInfo]);

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
      const profileData: any = {
        services: skills,
        professionalIndemnityAmount: professionalIndemnityAmount || undefined,
        insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate).toISOString() : undefined,
        publicProfile: {
          bio,
          portfolio,
          isPublic,
          qualifications,
          certifications,
          companyDetails,
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
                  setSkills(userInfo?.services || []);
                  setQualifications((userInfo?.publicProfile as any)?.qualifications || "");
                  setCertifications((userInfo?.publicProfile as any)?.certifications || "");
                  setCompanyDetails((userInfo?.publicProfile as any)?.companyDetails || "");
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
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill and press Enter"
                className="flex-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !skills.includes(value)) {
                      setSkills([...skills, value]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-500">Press Enter to add a skill</p>
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
          <Textarea
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            placeholder="List your qualifications, certifications, trade memberships (one per line)..."
            className="mt-2 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 min-h-[150px]"
          />
        ) : (
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-black dark:text-white whitespace-pre-wrap">
              {qualifications || "No qualifications added yet. Click 'Edit Profile' to add qualifications."}
            </p>
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
                    <p className="text-gray-600 text-[11px] md:text-[13px] mb-0.5 md:mb-1 line-clamp-1">
                      {displayTitle}
                    </p>
                    <div className="flex items-center gap-1.5 text-gray-500 text-[10px] md:text-[12px] mb-0.5 md:mb-1">
                      <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                      <span className="truncate">{displayLocation}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-auto">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 md:w-4 md:h-4 ${
                            star <= Math.round(rating)
                              ? "fill-[#FE8A0F] text-[#FE8A0F]"
                              : "fill-gray-300 text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="font-semibold text-[11px] md:text-[13px] ml-0.5">{rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-[9px] md:text-[11px]">({reviewCount})</span>
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

                        <Separator className="my-4 md:my-6" />

                        <h4 className="text-[#003D82] text-[14px] md:text-[18px] font-semibold mb-3 md:mb-4">
                          Professional Details
                        </h4>
                        <div className="space-y-2 md:space-y-3">
                          {userInfo?.hasTradeQualification === 'yes' && (
                            <div className="flex items-center gap-2 md:gap-3">
                              <Award className="w-4 h-4 md:w-5 md:h-5 text-[#FE8A0F] flex-shrink-0" />
                              <span className="text-gray-700 text-[12px] md:text-[14px]">Trade Qualified</span>
                            </div>
                          )}
                          {userInfo?.hasPublicLiability === 'yes' && (
                            <div className="flex items-center gap-2 md:gap-3">
                              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-[#FE8A0F] flex-shrink-0" />
                              <span className="text-gray-700 text-[12px] md:text-[14px]">Public Liability Insurance</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 md:gap-3">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#FE8A0F] flex-shrink-0" />
                            <span className="text-gray-700 text-[12px] md:text-[14px]">
                              Service area: {displayLocation}
                            </span>
                          </div>
                          {userInfo?.travelDistance && (
                            <div className="flex items-center gap-2 md:gap-3">
                              <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-[#FE8A0F] flex-shrink-0" />
                              <span className="text-gray-700 text-[12px] md:text-[14px]">Travel distance: {userInfo.travelDistance}</span>
                            </div>
                          )}
                          {qualifications && (
                            <div className="mt-3 md:mt-4">
                              <h5 className="text-[#003D82] text-[13px] md:text-[16px] font-semibold mb-2">Qualifications</h5>
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words text-justify text-[12px] md:text-[14px] leading-relaxed">
                                {qualifications}
                              </p>
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
                        </div>
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

