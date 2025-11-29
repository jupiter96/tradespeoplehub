import React, { useState, useEffect } from "react";
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
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { allServices } from "./servicesData";
import InviteToQuoteModal from "./InviteToQuoteModal";
import { useMessenger } from "./MessengerContext";
import { useAccount } from "./AccountContext";
import API_BASE_URL from "../config/api";

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
  postcode?: string;
  address?: string;
  travelDistance?: string;
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
  const [professionalServices, setProfessionalServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        setError("Profile ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
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
        setProfile(data.profile);

        // Fetch professional's services if they have services
        if (data.profile.services && data.profile.services.length > 0) {
          // Filter services from allServices by trading name
          const services = allServices.filter(
            (service) => service.tradingName === data.profile.tradingName
          ).slice(0, 10);
          setProfessionalServices(services);
        }
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
  const displayName = profile.tradingName || profile.name;
  const displayTitle = profile.sector || "Professional Service Provider";
  const displayLocation = profile.townCity || profile.postcode || profile.address || "Location not specified";
  const displayBio = profile.publicProfile?.bio || profile.aboutService || "No bio available.";
  const portfolio = profile.publicProfile?.portfolio || [];
  const memberSince = profile.createdAt 
    ? new Date(profile.createdAt).getFullYear().toString()
    : "2022";

  // Get skills from services
  const skills = profile.services && profile.services.length > 0 
    ? profile.services.slice(0, 10)
    : [];

  // Verification status
  const verifications = {
    phone: profile.verification?.phone?.status === 'verified' || profile.verification?.phone?.status === 'completed',
    identity: profile.verification?.idCard?.status === 'verified' || profile.verification?.idCard?.status === 'completed',
    address: profile.verification?.address?.status === 'verified' || profile.verification?.address?.status === 'completed',
    insurance: profile.verification?.publicLiabilityInsurance?.status === 'verified' || profile.verification?.publicLiabilityInsurance?.status === 'completed',
  };

  // Check if profile is blocked
  const isBlocked = false; // Blocked profiles shouldn't be accessible via API

  // Mock reviews data (in real app, fetch from database)
  const reviews = [
    {
      id: "1",
      author: "John Doe",
      authorImage: "",
      rating: 5,
      date: "2 weeks ago",
      comment: "Excellent service! Very professional and completed the job on time."
    },
    {
      id: "2",
      author: "Jane Smith",
      authorImage: "",
      rating: 5,
      date: "1 month ago",
      comment: "Highly recommend! Great quality work and fair pricing."
    }
  ];

  const reviewCount = reviews.length;
  const rating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

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
              <ImageWithFallback
                src={profile.avatar}
                alt={displayName}
                className="w-full aspect-square rounded-xl object-cover"
              />
              {/* Online Status */}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
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

              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3 h-3 fill-[#FE8A0F] text-[#FE8A0F]" />
                ))}
                <span className="text-gray-600 text-[10px] ml-1">
                  ({reviewCount})
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
              <ImageWithFallback
                src={profile.avatar}
                alt={displayName}
                className="w-40 h-40 rounded-2xl object-cover border-4 border-gray-100"
              />
              {/* Online Status */}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
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
                        ({reviewCount} reviews)
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

              {/* Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
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

          {/* Skills - Mobile */}
          {skills.length > 0 && (
            <div className="flex md:hidden flex-wrap gap-2 mt-3">
              {skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-50 text-[#003D82] hover:bg-blue-100 text-[10px] px-2 py-0.5"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
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
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[#003D82] text-[20px] font-semibold mb-4">
                      About Me
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      {displayBio}
                    </p>

                    {skills.length > 0 && (
                      <>
                        <Separator className="my-6" />

                        {/* Skills Section */}
                        <h4 className="text-[#003D82] text-[18px] font-semibold mb-4">
                          Skills & Expertise
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {skills.map((skill, index) => (
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

                    <Separator className="my-6" />

                    <h4 className="text-[#003D82] text-[18px] font-semibold mb-4">
                      Professional Details
                    </h4>
                    <div className="space-y-3">
                      {profile.hasTradeQualification === 'yes' && (
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-[#FE8A0F]" />
                          <span className="text-gray-700">Trade Qualified</span>
                        </div>
                      )}
                      {profile.hasPublicLiability === 'yes' && (
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-[#FE8A0F]" />
                          <span className="text-gray-700">Public Liability Insurance</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#FE8A0F]" />
                        <span className="text-gray-700">Service area: {displayLocation}</span>
                      </div>
                      {profile.travelDistance && (
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-5 h-5 text-[#FE8A0F]" />
                          <span className="text-gray-700">Travel distance: {profile.travelDistance}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* My Services Tab */}
              <TabsContent value="services">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[#003D82] text-[20px] font-semibold mb-4">
                      My Services
                    </h3>
                    <div className="space-y-4">
                      {professionalServices.length > 0 ? (
                        professionalServices.map((service) => (
                          <Link
                            key={service.id}
                            to={`/service/${service.id}`}
                            className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#FE8A0F] hover:shadow-md transition-all cursor-pointer"
                          >
                            <ImageWithFallback
                              src={service.image}
                              alt={service.description}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="text-[#003D82] font-semibold mb-1">
                                {service.description}
                              </h4>
                              <p className="text-gray-600 text-[14px] mb-2">
                                {service.category}
                              </p>
                              <div className="flex items-center gap-3">
                                <span className="text-[#FE8A0F] font-semibold text-[18px]">
                                  £{service.price}
                                </span>
                                {service.badges && service.badges.length > 0 && (
                                  <Badge className="bg-green-500 text-white">
                                    {service.badges[0]}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))
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
                            <p className="text-gray-600 text-[14px]">
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
                                <p className="text-gray-700 leading-relaxed">
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
            {professionalServices.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-[#003D82] text-[18px] font-semibold mb-4">
                    Available Services
                  </h3>
                  <div className="space-y-3">
                    {professionalServices.slice(0, 5).map((service) => (
                      <Link
                        key={service.id}
                        to={`/service/${service.id}`}
                        className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#FE8A0F] transition-all cursor-pointer"
                      >
                        <ImageWithFallback
                          src={service.image}
                          alt={service.description}
                          className="w-16 h-16 rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[#003D82] text-[14px] font-semibold line-clamp-2 mb-1">
                            {service.description}
                          </h4>
                          <span className="text-[#FE8A0F] font-semibold text-[16px]">
                            £{service.price}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
