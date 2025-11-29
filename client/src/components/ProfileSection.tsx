import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import API_BASE_URL from "../config/api";

interface PortfolioItem {
  id: string;
  image: string;
  title: string;
  description: string;
}

export default function ProfileSection() {
  const { userInfo, updateProfile } = useAccount();
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [publicProfileUrl, setPublicProfileUrl] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    image: "",
    title: "",
    description: "",
  });
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
      setPublicProfileUrl(userInfo.publicProfile?.publicProfileUrl || generateProfileUrl());
    }
  }, [userInfo]);

  const generateProfileUrl = () => {
    if (userInfo?.id) {
      const slug = userInfo.tradingName 
        ? userInfo.tradingName.toLowerCase().replace(/\s+/g, "-")
        : `${userInfo.firstName}-${userInfo.lastName}`.toLowerCase().replace(/\s+/g, "-");
      return `${slug}-${userInfo.id.slice(-6)}`;
    }
    return "";
  };

  const handleSave = async () => {
    try {
      const profileData = {
        publicProfile: {
          bio,
          portfolio,
          publicProfileUrl: publicProfileUrl || generateProfileUrl(),
          isPublic,
        },
      };

      await updateProfile(profileData as any);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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
    const fullUrl = `${window.location.origin}/profile/${publicProfileUrl || userInfo?.id}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Profile link copied to clipboard!");
  };

  const handleShare = async () => {
    const fullUrl = `${window.location.origin}/profile/${publicProfileUrl || userInfo?.id}`;
    
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

  const fullProfileUrl = `${window.location.origin}/profile/${publicProfileUrl || userInfo?.id}`;

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
      <div className="bg-white dark:bg-black rounded-2xl border-2 border-[#FE8A0F] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <Label className="text-[#FE8A0F] font-semibold mb-2 block">Public Profile Link</Label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                {fullProfileUrl}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
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
                        placeholder="https://example.com/image.jpg"
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-[#f0f0f0] dark:bg-black p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-[#FE8A0F] text-2xl">Profile Preview</DialogTitle>
            <DialogDescription>
              This is how your profile appears to clients. Click "Open in New Tab" to see the full page.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Profile Header - Matching ProfilePage style */}
            <div className="bg-white dark:bg-black rounded-2xl shadow-sm p-4 md:p-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 relative">
                  <Avatar className="w-40 h-40 rounded-2xl border-4 border-gray-100">
                    <AvatarImage 
                      src={userInfo?.avatar} 
                      alt={userInfo?.tradingName || userInfo?.name || "Professional"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[48px] rounded-2xl">
                      {(() => {
                        const name = userInfo?.tradingName || userInfo?.name || "";
                        if (name) {
                          const parts = name.trim().split(/\s+/);
                          if (parts.length >= 2) {
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                          }
                          return parts[0][0]?.toUpperCase() || "U";
                        }
                        return "U";
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white transform translate-x-1/2 translate-y-1/2"></div>
                </div>
                <div className="flex-1">
                  <h1 className="text-[#003D82] text-[32px] font-['Poppins',sans-serif] mb-2">
                    {userInfo?.tradingName || userInfo?.name || "Professional"}
                  </h1>
                  <p className="text-gray-600 text-[16px] mb-3">
                    {userInfo?.sector || "Professional Service Provider"}
                  </p>
                  <div className="flex items-center gap-2 text-gray-500 text-[14px] mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{userInfo?.townCity || userInfo?.postcode || userInfo?.address || "Location"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-[#FE8A0F] text-[#FE8A0F]" />
                      <span className="font-semibold text-[16px]">5.0</span>
                      <span className="text-gray-500 text-[14px]">(0 reviews)</span>
                    </div>
                    <div className="text-[14px] text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Member since {userInfo?.createdAt ? new Date(userInfo.createdAt).getFullYear() : "2024"}
                    </div>
                  </div>
                  {userInfo?.services && userInfo.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {userInfo.services.slice(0, 5).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-blue-50 text-[#003D82] hover:bg-blue-100"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* About Me Section */}
            <div className="bg-white dark:bg-black rounded-2xl shadow-sm p-6">
              <h3 className="text-[#003D82] text-[20px] font-semibold mb-4">About Me</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {bio || "No bio added yet."}
              </p>
              {userInfo?.services && userInfo.services.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <h4 className="text-[#003D82] text-[18px] font-semibold mb-4">Skills & Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {userInfo.services.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-50 text-[#003D82] hover:bg-blue-100 px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Portfolio Section */}
            {portfolio.length > 0 && (
              <div className="bg-white dark:bg-black rounded-2xl shadow-sm p-6">
                <h3 className="text-[#003D82] text-[20px] font-semibold mb-4">Portfolio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolio.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h4 className="text-[#003D82] font-semibold mb-2">{item.title}</h4>
                        <p className="text-gray-600 text-[14px]">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  window.open(fullProfileUrl, "_blank");
                }}
                className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

