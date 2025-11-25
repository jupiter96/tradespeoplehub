import { useState } from "react";
import { Link } from "react-router-dom";
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
  FileText
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { allServices } from "./servicesData";
import { userProfiles, getProfileById, getSkillsByCategory, type ProfileData } from "./profilesData";
import InviteToQuoteModal from "./InviteToQuoteModal";

export default function ProfilePage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("about");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  
  // Get default profile for fallback data
  const defaultProfile = getProfileById("117")!;
  
  // Find the service by ID to get professional info
  const currentService = id ? allServices.find(s => s.id === parseInt(id)) : null;
  
  // Use professional info from the service, fallback to profile data
  const professional: ProfileData = currentService ? {
    id: id || "117",
    name: currentService.tradingName,
    title: currentService.specialization || "Professional Service Provider",
    category: currentService.category,
    image: currentService.providerImage,
    rating: currentService.rating,
    reviewCount: currentService.reviewCount,
    completedJobs: currentService.completedTasks,
    memberSince: "2022",
    location: currentService.location,
    postcode: currentService.postcode,
    responseTime: "Within 2 hours",
    bio: `I am a qualified and experienced professional with proven track record. I specialize in ${currentService.category} services and am committed to providing excellent customer service.`,
    skills: getSkillsByCategory(currentService.category),
    qualifications: defaultProfile.qualifications,
    insurance: defaultProfile.insurance,
    verifications: {
      phone: true,
      identity: true,
      address: true,
      insurance: true,
      qualifications: currentService.rating >= 4.5,
    },
    portfolio: [],
    reviews: defaultProfile.reviews
  } : getProfileById(id || "117")!;
  
  // Get professional's services from allServices based on trading name
  const professionalServices = allServices.filter(
    service => service.tradingName === professional.name
  ).slice(0, 5);

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
                src={professional.image}
                alt={professional.name}
                className="w-full aspect-square rounded-xl object-cover"
              />
              {/* Online Status */}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* Second Column: Info - 40% */}
            <div className="w-[40%] flex-shrink-0 min-w-0">
              <h1 className="text-[#003D82] text-[14px] font-['Poppins',sans-serif] mb-1.5 truncate">
                {professional.name}
              </h1>
              
              <div className="flex items-center gap-1 text-gray-600 text-[11px] mb-1.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{professional.location}</span>
              </div>

              <div className="flex items-center gap-1 text-gray-600 text-[11px] mb-1.5">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>Joined {professional.memberSince}</span>
              </div>

              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3 h-3 fill-[#FE8A0F] text-[#FE8A0F]" />
                ))}
                <span className="text-gray-600 text-[10px] ml-1">
                  ({professional.reviewCount})
                </span>
              </div>
            </div>

            {/* Third Column: Action Icon Buttons - 20% */}
            <div className="w-[20%] flex-shrink-0 flex flex-col gap-2 items-end">
              <Button 
                className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white w-10 h-10 p-0 flex items-center justify-center rounded-lg"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                <FileText className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                className="border-[#003D82] text-[#003D82] hover:bg-[#003D82]/5 w-10 h-10 p-0 flex items-center justify-center rounded-lg"
              >
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0 relative">
              <ImageWithFallback
                src={professional.image}
                alt={professional.name}
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
                    {professional.name}
                  </h1>
                  <p className="text-gray-600 text-[16px] mb-3">
                    {professional.title}
                  </p>
                  
                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-500 text-[14px] mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{professional.location}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-[#FE8A0F] text-[#FE8A0F]" />
                      <span className="font-semibold text-[16px]">{professional.rating}</span>
                      <span className="text-gray-500 text-[14px]">
                        ({professional.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="text-[14px] text-gray-600">
                      <span className="font-semibold text-[16px] text-[#003D82]">
                        {professional.completedJobs}
                      </span>{" "}
                      completed jobs
                    </div>
                    <div className="text-[14px] text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Member since {professional.memberSince}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white px-6" onClick={() => setIsQuoteModalOpen(true)}>
                    Get Quote
                  </Button>
                  <Button variant="outline" className="border-[#003D82] text-[#003D82] hover:bg-[#003D82]/5">
                    Message
                  </Button>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2">
                {professional.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-50 text-[#003D82] hover:bg-blue-100"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Skills - Mobile */}
          <div className="flex md:hidden flex-wrap gap-2 mt-3">
            {professional.skills.map((skill, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-blue-50 text-[#003D82] hover:bg-blue-100 text-[10px] px-2 py-0.5"
              >
                {skill}
              </Badge>
            ))}
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
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[#003D82] text-[20px] font-semibold mb-4">
                      About Me
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      {professional.bio}
                    </p>

                    <Separator className="my-6" />

                    {/* Skills Section */}
                    <h4 className="text-[#003D82] text-[18px] font-semibold mb-4">
                      Skills & Expertise
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {professional.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-blue-50 text-[#003D82] hover:bg-blue-100 px-3 py-1"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    {/* Qualifications Section */}
                    {professional.qualifications && (
                      <>
                        <h4 className="text-[#003D82] text-[18px] font-semibold mb-4">
                          Qualifications & Certifications
                        </h4>
                        <div className="space-y-3 mb-6">
                          {professional.qualifications.map((qual, index) => (
                            <div 
                              key={index}
                              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-[#FE8A0F]" />
                                  <span className="font-semibold text-gray-800">
                                    {qual.name}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-[14px] mt-1 ml-6">
                                  {qual.year ? `Obtained: ${qual.year}` : ''}
                                  {qual.number ? `Registration: ${qual.number}` : ''}
                                </p>
                              </div>
                              {qual.verified && (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>

                        <Separator className="my-6" />
                      </>
                    )}

                    {/* Public Liability Insurance Section */}
                    {professional.insurance && (
                      <>
                        <h4 className="text-[#003D82] text-[18px] font-semibold mb-4">
                          Public Liability Insurance
                        </h4>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                          <div className="flex items-start gap-3">
                            <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-800">
                                  Insured up to {professional.insurance.publicLiability}
                                </span>
                                {professional.insurance.verified && (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <p className="text-gray-600 text-[14px]">
                                Provider: {professional.insurance.provider}
                              </p>
                              <p className="text-gray-600 text-[14px]">
                                Valid until: {professional.insurance.expiryDate}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-6" />
                      </>
                    )}

                    <h4 className="text-[#003D82] text-[18px] font-semibold mb-4">
                      Professional Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-[#FE8A0F]" />
                        <span className="text-gray-700">Response time: {professional.responseTime}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#FE8A0F]" />
                        <span className="text-gray-700">Service area: {professional.location}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-[#FE8A0F]" />
                        <span className="text-gray-700">
                          {professional.completedJobs} jobs completed
                        </span>
                      </div>
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
                      {professional.portfolio.length > 0 ? professional.portfolio.map((item) => (
                        <div
                          key={item.id}
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
                      Reviews ({professional.reviewCount})
                    </h3>
                    <div className="space-y-6">
                      {professional.reviews.map((review) => (
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
                      ))}
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
                    {professional.verifications.phone ? (
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
                    {professional.verifications.identity ? (
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
                    {professional.verifications.address ? (
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
                    {professional.verifications.insurance ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-[#003D82] text-[18px] font-semibold mb-4">
                  Available Services
                </h3>
                <div className="space-y-3">
                  {professionalServices.length > 0 ? (
                    professionalServices.map((service) => (
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
                    ))
                  ) : (
                    <p className="text-gray-500 text-[14px] text-center py-4">
                      No services available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <InviteToQuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        professionalName={professional.name}
        professionalId={professional.id}
        category={professional.category}
      />
    </div>
  );
}