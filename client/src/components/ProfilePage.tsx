import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  User,
  ShieldCheck,
  Home,
  Calendar,
  Award,
  Briefcase,
  FileText,
  Loader2
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import InviteToQuoteModal from "./InviteToQuoteModal";
import { useMessenger } from "./MessengerContext";
import { useAccount } from "./AccountContext";
import API_BASE_URL from "../config/api";
import { useSectors, useCategories, useServiceCategories } from "../hooks/useSectorsAndCategories";
import type { Sector, Category, SubCategory, ServiceCategory, ServiceSubCategory } from "../hooks/useSectorsAndCategories";

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  tradingName?: string;
  avatar?: string;
  sector?: string;
  services?: string[];
  aboutService?: string;
  hasTradeQualification?: string;
  hasPublicLiability?: string;
  townCity?: string;
  county?: string;
  postcode?: string;
  address?: string;
  travelDistance?: string;
  professionalIndemnityAmount?: number;
  insuranceExpiryDate?: string | Date;
  publicProfile?: {
    bio?: string;
    portfolio?: Array<{
      id?: string;
      image: string;
      title: string;
      description: string;
    }>;
    publicProfileUrl?: string;
    isPublic?: boolean;
    qualifications?: string;
  };
  verification?: {
    email?: { status: string; verifiedAt?: Date };
    phone?: { status: string; verifiedAt?: Date };
    address?: { status: string; verifiedAt?: Date };
    idCard?: { status: string; verifiedAt?: Date };
    paymentMethod?: { status: string; verifiedAt?: Date };
    publicLiabilityInsurance?: { status: string; verifiedAt?: Date };
  };
  createdAt?: string;
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startConversation } = useMessenger();
  const { userInfo: currentUserInfo } = useAccount();
  const [activeTab, setActiveTab] = useState("about");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sectors and categories - must be called before any conditional returns
  const { sectors: sectorsData } = useSectors();
  
  // Get selected sector and categories based on profile (if available)
  const selectedSectorObj = profile?.sector 
    ? sectorsData.find((s: Sector) => s.name === profile.sector)
    : null;
  const selectedSectorId = selectedSectorObj?._id;
  const { categories: availableCategories } = useCategories(
    selectedSectorId,
    undefined,
    true // include subcategories to convert IDs to names
  );
  
  // Also fetch service categories and subcategories for the sector
  const { serviceCategories: availableServiceCategories } = useServiceCategories(
    selectedSectorId,
    undefined,
    true // includeSubCategories
  );

  // Convert service IDs to category/subcategory names - must be defined before conditional returns
  // Use useCallback to memoize the function
  const convertServiceIdsToNames = useCallback((serviceIds: string[]): string[] => {
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
  }, [availableCategories]);

  // Convert service IDs to subcategory names only (for Available Services card)
  // Includes both legacy categories/subcategories and service categories/subcategories
  const convertServiceIdsToSubcategoryNames = useCallback((serviceIds: string[]): string[] => {
    if (!serviceIds || serviceIds.length === 0) {
      return [];
    }

    const categoryMap = new Map<string, string>();
    const subcategoryMap = new Map<string, string>();
    const serviceCategoryMap = new Map<string, string>();
    const serviceSubcategoryMap = new Map<string, string>();

    // Build maps for legacy categories and subcategories
    if (availableCategories.length > 0) {
      availableCategories.forEach((cat: Category) => {
        categoryMap.set(cat._id, cat.name);
        if (cat.subCategories) {
          cat.subCategories.forEach((subcat: SubCategory) => {
            subcategoryMap.set(subcat._id, subcat.name);
          });
        }
      });
    }

    // Build maps for service categories and subcategories
    if (availableServiceCategories.length > 0) {
      availableServiceCategories.forEach((serviceCat: ServiceCategory) => {
        serviceCategoryMap.set(serviceCat._id, serviceCat.name);
        if (serviceCat.subCategories) {
          serviceCat.subCategories.forEach((serviceSubcat: ServiceSubCategory) => {
            serviceSubcategoryMap.set(serviceSubcat._id, serviceSubcat.name);
          });
        }
      });
    }

    // Filter to only subcategories (not categories) and convert IDs to names
    // Include both legacy subcategories and service subcategories
    return serviceIds
      .filter((id: string) => {
        // Only include if it's a subcategory (not a category)
        const isLegacySubcategory = subcategoryMap.has(id) && !categoryMap.has(id);
        const isServiceSubcategory = serviceSubcategoryMap.has(id) && !serviceCategoryMap.has(id);
        return isLegacySubcategory || isServiceSubcategory;
      })
      .map((id: string) => {
        // Try legacy subcategory first, then service subcategory
        return subcategoryMap.get(id) || serviceSubcategoryMap.get(id) || id; // Fallback to ID if not found
      })
      .filter(Boolean);
  }, [availableCategories, availableServiceCategories]);

  // Get skills from services - convert IDs to names
  // Must be called before any conditional returns (React Hooks rules)
  const skills = useMemo(() => {
    if (!profile?.services || profile.services.length === 0) {
      return [];
    }

    if (availableCategories.length === 0) {
      return []; // Return empty until categories are loaded
    }

    return convertServiceIdsToNames(profile.services).slice(0, 10);
  }, [profile?.services, availableCategories, convertServiceIdsToNames]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        setError("Profile ID is required");
        setLoading(false);
        return;
      }

      // Reset state when ID changes
      setProfile(null);
      setError(null);
      setActiveTab("about");

      try {
        setLoading(true);
        console.log('[ProfilePage] Fetching profile for ID:', id);
        const response = await fetch(`${API_BASE_URL}/api/auth/profile/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Profile not found");
          } else {
            setError("Failed to load profile");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('[ProfilePage] Fetched profile data for ID:', id, data.profile);
        
        if (!data.profile || !data.profile.id) {
          console.error('[ProfilePage] Invalid profile data received:', data);
          setError("Invalid profile data");
          setLoading(false);
          return;
        }

        // Verify the profile ID matches the requested ID
        if (data.profile.id !== id) {
          console.warn('[ProfilePage] Profile ID mismatch. Requested:', id, 'Received:', data.profile.id);
        }

        setProfile(data.profile);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleMessage = async () => {
    if (!profile) return;
    
    try {
      await startConversation(profile.id);
      // Navigate to messenger or show success
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F] mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 mt-[50px] md:mt-0">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Profile Not Found</h1>
            <p className="text-gray-600 mb-4">{error || "The profile you're looking for doesn't exist."}</p>
            <Button onClick={() => navigate("/")} className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white">
              Go Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Format profile data for display
  // For professionals, prioritize tradingName over firstName/lastName
  const displayName = profile?.tradingName || 
    (profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : null) || 
    profile?.name || 
    "Professional";
  
  // Get first category from services array by matching with actual category names
  const getFirstCategory = () => {
    if (profile?.services && profile.services.length > 0 && availableCategories.length > 0) {
      const serviceNames = convertServiceIdsToNames(profile.services);
      // Find the first service item that is a category (not subcategory)
      const categoryIds = availableCategories.map((cat: Category) => cat._id);
      const firstCategoryId = profile.services.find((id: string) => categoryIds.includes(id));
      
      if (firstCategoryId) {
        const category = availableCategories.find((cat: Category) => cat._id === firstCategoryId);
        return category?.name || null;
      }
      
      // Fallback: return first service name
      if (serviceNames.length > 0) {
        return serviceNames[0];
      }
    }
    // Fallback: return first service item if categories not loaded yet
    if (profile?.services && profile.services.length > 0) {
      return profile.services[0];
    }
    return null;
  };
  
  const displayTitle = getFirstCategory() || profile?.sector || "Professional Service Provider";
  
  // Build location string with townCity and county (postcode removed)
  const locationParts: string[] = [];
  if (profile?.townCity) locationParts.push(profile.townCity);
  if (profile?.county) locationParts.push(profile.county);
  const displayLocation = locationParts.length > 0 
    ? locationParts.join(", ") 
    : profile?.address || "Location not specified";
  
  const displayBio = profile?.publicProfile?.bio || profile?.aboutService || "No bio available.";
  const portfolio = profile?.publicProfile?.portfolio || [];
  const memberSince = profile?.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : "Unknown";

  // Verification status
  const verifications = {
    phone: profile.verification?.phone?.status === 'verified',
    identity: profile.verification?.idCard?.status === 'verified',
    address: profile.verification?.address?.status === 'verified',
    insurance: profile.verification?.publicLiabilityInsurance?.status === 'verified',
  };

  // Check if profile is blocked
  const isBlocked = false; // Blocked profiles shouldn't be accessible via API

  // Reviews data - empty for now (to be fetched from database in future)
  const reviews: Array<{
    id: string;
    author: string;
    authorImage: string;
    rating: number;
    date: string;
    comment: string;
  }> = [];

  const reviewCount = reviews.length;
  const rating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
  const reviewText = reviewCount === 0 
    ? "(0 review)" 
    : reviewCount === 1 
    ? "(1 review)" 
    : `(${reviewCount} reviews)`;

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 mt-[50px] md:mt-0">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8 mb-6">
          {/* Mobile Layout - 3 Columns */}
          <div className="flex md:hidden gap-3 items-start">
            {/* First Column: Avatar - 30% */}
            <div className="w-[30%] flex-shrink-0 relative">
              <Avatar className="w-full aspect-square rounded-xl h-full">
                <AvatarImage 
                  src={profile.avatar} 
                  alt={displayName}
                  className="object-cover w-full h-full"
                />
                <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[24px] rounded-xl">
                  {(() => {
                    const name = displayName || "";
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
              {/* Online Status */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white transform translate-x-[calc(50%-4px)] translate-y-[calc(50%-4px)]"></div>
            </div>

            {/* Second Column: Info - 40% */}
            <div className="w-[40%] flex-shrink-0 min-w-0">
              <h1 className="text-[#003D82] text-[14px] font-['Poppins',sans-serif] mb-1.5 truncate">
                {displayName}
              </h1>
              
              <div className="flex items-center gap-1 text-gray-600 text-[11px] mb-1.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{displayLocation}</span>
              </div>

              <div className="flex items-center gap-1 text-gray-600 text-[11px] mb-1.5">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>Joined {memberSince}</span>
              </div>

              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-[#FE8A0F] text-[#FE8A0F]" />
                <span className="font-semibold text-[10px]">{rating}</span>
                <span className="text-gray-600 text-[10px]">
                  {reviewText}
                </span>
              </div>
            </div>

            {/* Third Column: Action Icon Buttons - 20% */}
            <div className="w-[20%] flex-shrink-0 flex flex-col gap-2 items-end">
              {!isBlocked && (
                <>
                  <Button 
                    className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white w-10 h-10 p-0 flex items-center justify-center rounded-lg"
                    onClick={() => setIsQuoteModalOpen(true)}
                  >
                    <FileText className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-[#003D82] text-[#003D82] hover:bg-[#003D82]/5 w-10 h-10 p-0 flex items-center justify-center rounded-lg"
                    onClick={handleMessage}
                  >
                    <Mail className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0 relative">
              <Avatar className="w-40 h-40 rounded-2xl border-4 border-gray-100">
                <AvatarImage 
                  src={profile.avatar} 
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[48px] rounded-2xl">
                  {(() => {
                    const name = displayName || "";
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
              {/* Online Status */}
              <div className="absolute bottom-3 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white transform translate-x-[calc(50%-4px)] translate-y-[calc(50%-4px)]"></div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-[#003D82] text-[32px] font-['Poppins',sans-serif] mb-2">
                    {displayName}
                  </h1>
                  <p className="text-gray-600 text-[16px] mb-3">
                    {displayTitle}
                  </p>
                  
                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-500 text-[14px] mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{displayLocation}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-[#FE8A0F] text-[#FE8A0F]" />
                      <span className="font-semibold text-[16px]">{rating}</span>
                      <span className="text-gray-500 text-[14px]">
                        {reviewText}
                      </span>
                    </div>
                    <div className="text-[14px] text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Member since {memberSince}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isBlocked && (
                  <div className="flex flex-col gap-2">
                    <Button className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white px-6" onClick={() => setIsQuoteModalOpen(true)}>
                      Get Quote
                    </Button>
                    <Button variant="outline" className="border-[#003D82] text-[#003D82] hover:bg-[#003D82]/5" onClick={handleMessage}>
                      Message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tabs Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full bg-white rounded-xl p-1 shadow-sm mb-6">
                <TabsTrigger 
                  value="about" 
                  className="flex-1 data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                >
                  About Me
                </TabsTrigger>
                <TabsTrigger 
                  value="services" 
                  className="flex-1 data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                >
                  My Services
                </TabsTrigger>
                <TabsTrigger 
                  value="portfolio" 
                  className="flex-1 data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                >
                  Portfolio
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="flex-1 data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              {/* About Me Tab */}
              <TabsContent value="about">
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-[#003D82] text-[20px] font-semibold mb-4">
                        About Me
                      </h3>
                      <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap break-words text-justify">
                        {displayBio}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Qualifications Card */}
                  {(profile?.publicProfile?.qualifications || profile?.hasTradeQualification === "yes") && (
                    <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.2)] transition-shadow">
                      <CardContent className="p-6">
                        <h3 className="text-[#003D82] text-[18px] font-semibold mb-4">
                          Qualifications
                        </h3>
                        <div className="space-y-2">
                          {profile?.publicProfile?.qualifications ? (
                            profile.publicProfile.qualifications
                              .split('\n')
                              .filter((q: string) => q.trim())
                              .map((qualification: string, index: number) => (
                                <p key={index} className="text-gray-700 text-[14px] leading-relaxed">
                                  {qualification.trim()}
                                </p>
                              ))
                          ) : (
                            <p className="text-gray-500 text-[14px]">No qualifications listed</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Public Insurance Card */}
                  {profile?.hasPublicLiability === "yes" && (
                    <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.2)] transition-shadow">
                      <CardContent className="p-6">
                        <h3 className="text-[#003D82] text-[18px] font-semibold mb-4">
                          Public Insurance
                        </h3>
                        <div className="space-y-2">
                          {profile?.professionalIndemnityAmount && (
                            <p className="text-gray-700 text-[14px] leading-relaxed">
                              Limit of indemnity: £{profile.professionalIndemnityAmount.toLocaleString()}
                            </p>
                          )}
                          {profile?.insuranceExpiryDate && (
                            <p className="text-gray-700 text-[14px] leading-relaxed">
                              Valid until: {new Date(profile.insuranceExpiryDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                          {!profile?.professionalIndemnityAmount && !profile?.insuranceExpiryDate && (
                            <p className="text-gray-500 text-[14px]">Insurance details not available</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* My Services Tab */}
              <TabsContent value="services">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[#003D82] text-[20px] font-semibold mb-4">
                      My Services
                    </h3>
                    <div className="space-y-4">
                      {profile.services && profile.services.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {convertServiceIdsToNames(profile.services).map((serviceName, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-blue-50 text-[#003D82] hover:bg-blue-100 px-3 py-1 text-[14px]"
                            >
                              {serviceName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          No services available yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[#003D82] text-[20px] font-semibold mb-4">
                      Portfolio
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {portfolio.length > 0 ? portfolio.map((item, index) => (
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
                            <h4 className="text-[#003D82] font-semibold mb-2">
                              {item.title}
                            </h4>
                            <p className="text-gray-600 text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-gray-500 text-center py-8 col-span-2">No portfolio items available yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[#003D82] text-[20px] font-semibold mb-4">
                      Reviews ({reviewCount})
                    </h3>
                    <div className="space-y-6">
                      {reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div key={review.id} className="pb-6 border-b border-gray-200 last:border-0">
                            <div className="flex items-start gap-4">
                              <ImageWithFallback
                                src={review.authorImage}
                                alt={review.author}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-[#003D82]">
                                    {review.author}
                                  </h4>
                                  <span className="text-gray-500 text-[14px]">
                                    {review.date}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                  {review.comment}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No reviews yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Verifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-[#003D82] text-[18px] font-semibold mb-4">
                  Verifications
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-blue-500" />
                      <span className="text-[14px]">Phone Verified</span>
                    </div>
                    {verifications.phone ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-500" />
                      <span className="text-[14px]">Identity Verified</span>
                    </div>
                    {verifications.identity ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Home className="w-5 h-5 text-blue-500" />
                      <span className="text-[14px]">Address Verified</span>
                    </div>
                    {verifications.address ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-500" />
                      <span className="text-[14px]">Insurance Verified</span>
                    </div>
                    {verifications.insurance ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            {profile.services && profile.services.length > 0 && (() => {
              const subcategoryNames = convertServiceIdsToSubcategoryNames(profile.services);
              return subcategoryNames.length > 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[#003D82] text-[18px] font-semibold mb-4">
                      Available Services
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {subcategoryNames.map((serviceName, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-blue-50 text-[#003D82] hover:bg-blue-100 px-3 py-1 text-[14px]"
                        >
                          {serviceName}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Service Area */}
            <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.2)] transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-[#003D82] text-[18px] font-semibold mb-4">
                  Service area
                </h3>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#FE8A0F] flex-shrink-0" />
                  <p className="text-gray-700 text-[14px] leading-relaxed">
                    {(() => {
                      const travelDistance = profile?.travelDistance;
                      const postcode = profile?.postcode || "";
                      const city = profile?.townCity || "";
                      
                      // Format travelDistance: add space between number and "miles" (e.g., "5miles" -> "5 miles")
                      let formattedTravelDistance = travelDistance;
                      if (travelDistance && travelDistance !== "Nationwide") {
                        // Match pattern like "5miles", "10miles", etc. and add space before "miles"
                        formattedTravelDistance = travelDistance.replace(/(\d+)(miles)/i, "$1 $2");
                      }
                      
                      // Format postcode: show only the part before the middle space (e.g., "SW1A 1AA" -> "SW1A")
                      const formattedPostcode = postcode ? postcode.split(" ")[0] : "";
                      
                      // Build location string (formatted postcode, city)
                      const locationParts = [formattedPostcode, city].filter(Boolean);
                      const location = locationParts.length > 0 ? locationParts.join(", ") : "Not specified";
                      
                      // Format: "$formattedTravelDistance within $location"
                      if (formattedTravelDistance) {
                        return `${formattedTravelDistance} within ${location}`;
                      } else {
                        return location !== "Not specified" ? `Service area: ${location}` : "Not specified";
                      }
                    })()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      {!isBlocked && (
        <InviteToQuoteModal 
          isOpen={isQuoteModalOpen} 
          onClose={() => setIsQuoteModalOpen(false)} 
          professionalName={displayName}
          professionalId={profile.id}
          category={displayTitle}
        />
      )}
    </div>
  );
}
