import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, MapPin, Info, Check } from "lucide-react";
import serviceVector from "../assets/service_vector.jpg";

interface Professional {
  id: string;
  name: string;
  title: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  location: string;
  skills?: string[];
  responseTime?: string;
  portfolioImages?: string[];
  relevanceScore?: number;
}

interface InviteProfessionalsListProps {
  professionals: Professional[];
  onInvite: (professional: Professional) => void;
  invitedProfessionalIds: Set<string>;
}

export default function InviteProfessionalsList({
  professionals,
  onInvite,
  invitedProfessionalIds,
}: InviteProfessionalsListProps) {
  const [showInvitedOnly, setShowInvitedOnly] = useState(false);
  const navigate = useNavigate();

  if (professionals.length === 0) return null;

  // Navigate to professional profile
  const handleNavigateToProfile = (professionalId: string) => {
    navigate(`/profile/${professionalId}`);
  };

  // Get portfolio images - use professional's portfolio or default category images
  const getPortfolioImages = (pro: Professional) => {
    if (pro.portfolioImages && pro.portfolioImages.length > 0) {
      return pro.portfolioImages.slice(0, 3);
    }
    // Default images based on category
    return [
      serviceVector,
      serviceVector,
      serviceVector,
    ];
  };

  // Filter professionals based on toggle
  const filteredProfessionals = showInvitedOnly
    ? professionals.filter(pro => invitedProfessionalIds.has(pro.id))
    : professionals;

  // Generate professional summary based on skills and category
  const generateProfessionalSummary = (pro: Professional) => {
    const skills = pro.skills || [];
    const category = pro.category.toLowerCase();
    
    // Create contextual summaries based on skills and category
    if (skills.some(s => s.toLowerCase().includes('plumb'))) {
      return "Specializing in residential and commercial plumbing services including emergency repairs, installations, and maintenance. Gas Safe registered with extensive experience in boiler servicing and central heating systems. Available for urgent callouts with same-day service in most cases.";
    }
    
    if (skills.some(s => s.toLowerCase().includes('electric'))) {
      return "Qualified electrician providing comprehensive electrical services for homes and businesses. Expert in rewiring, fault finding, consumer unit upgrades, and smart home installations. All work certified to current regulations with public liability insurance.";
    }
    
    if (skills.some(s => s.toLowerCase().includes('carpet'))) {
      return "Professional carpentry and joinery services with attention to detail and quality craftsmanship. Experienced in bespoke furniture, kitchen fitting, door hanging, and general woodwork repairs. Using premium materials with a focus on customer satisfaction.";
    }
    
    if (skills.some(s => s.toLowerCase().includes('paint'))) {
      return "Experienced decorator offering interior and exterior painting services with a flawless finish. Skilled in wallpapering, plastering preparation, and colour consultation. Committed to protecting your property and completing projects on time and within budget.";
    }
    
    if (skills.some(s => s.toLowerCase().includes('garden'))) {
      return "Professional gardening and landscaping services to transform your outdoor space. Expertise in garden design, maintenance, lawn care, and seasonal planting. Reliable service with eco-friendly practices and competitive pricing.";
    }
    
    if (skills.some(s => s.toLowerCase().includes('clean'))) {
      return "Thorough and reliable cleaning services for residential and commercial properties. Fully insured with eco-friendly products and attention to detail. Flexible scheduling including one-off deep cleans and regular maintenance contracts.";
    }
    
    // Default summary based on category and experience
    return `Experienced ${pro.title.toLowerCase()} with a proven track record of delivering quality work. Committed to professional service, clear communication, and customer satisfaction. Fully insured and available for consultations to discuss your specific requirements.`;
  };

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold mb-2">
          Recommended Professionals
        </h2>
        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-5">
          These professionals match your job requirements and are ready to help
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mb-1">
              Invite the professionals that match your needs to send you offers
            </p>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              View new offers in the 'Quotes' tab.
            </p>
          </div>
        </div>
      </div>

      {/* Header with count and toggle */}
      <div className="flex items-center justify-between mb-5">
        <p className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
          <span className="font-semibold">Found {filteredProfessionals.length} professionals</span> who match your brief
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInvitedOnly}
            onChange={(e) => setShowInvitedOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#FE8A0F] focus:ring-[#FE8A0F]"
          />
          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Show invited professionals only
          </span>
        </label>
      </div>

      {/* Professionals List */}
      <div className="space-y-4">
        {filteredProfessionals.map((pro) => {
          return (
            <div
              key={pro.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-[#FE8A0F] hover:shadow-md transition-all duration-300"
            >
              {/* Mobile Layout */}
              <div className="block sm:hidden">
                <div className="flex gap-3 p-4">
                  {/* Image - Square */}
                  <div 
                    className="w-24 h-24 flex-shrink-0 relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer shadow-sm"
                    onClick={() => handleNavigateToProfile(pro.id)}
                  >
                    <img
                      src={pro.image}
                      alt={pro.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Name - BOLD */}
                    <h3 
                      className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-bold truncate mb-1.5 cursor-pointer hover:text-[#FE8A0F] transition-colors"
                      onClick={() => handleNavigateToProfile(pro.id)}
                    >
                      {pro.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Math.floor(pro.rating)
                              ? 'text-[#FE8A0F] fill-[#FE8A0F]'
                              : 'text-gray-300 fill-gray-300'
                          }`}
                        />
                      ))}
                      <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-semibold ml-0.5">
                        {pro.rating}
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                        ({pro.reviewCount})
                      </span>
                    </div>

                    {/* Location - BOLD */}
                    <div className="flex items-center gap-1 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-[#FE8A0F] flex-shrink-0" />
                      <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-bold truncate">
                        {Math.floor(Math.random() * 50 + 1)} miles away
                      </span>
                    </div>

                    {/* Button */}
                    {invitedProfessionalIds.has(pro.id) ? (
                      <Button
                        disabled
                        className="w-full bg-green-50 text-green-700 border-2 border-green-300 font-['Poppins',sans-serif] text-[12px] font-semibold h-8 px-3 cursor-not-allowed shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        Invited
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onInvite(pro)}
                        className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-lg text-white font-['Poppins',sans-serif] text-[12px] font-semibold h-8 px-3 transition-all duration-300"
                      >
                        Send invitation
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Layout - 2 Column Layout */}
              <div className="hidden sm:flex h-[260px] hover:shadow-xl transition-all duration-300">
                {/* Left Column - Image */}
                <div 
                  className="w-[200px] h-[260px] flex-shrink-0 relative bg-gray-100 cursor-pointer overflow-hidden group"
                  onClick={() => handleNavigateToProfile(pro.id)}
                >
                  <img
                    src={pro.image}
                    alt={pro.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Right Column - Content */}
                <div className="flex-1 p-5 flex flex-col">
                  {/* Top Section */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      {/* Name - BOLD */}
                      <h3 
                        className="font-['Poppins',sans-serif] text-[17px] text-[#2c353f] font-bold truncate mb-2 cursor-pointer hover:text-[#FE8A0F] transition-colors"
                        onClick={() => handleNavigateToProfile(pro.id)}
                      >
                        {pro.name}
                      </h3>
                      
                      {/* Location with Distance - BOLD */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <MapPin className="w-4 h-4 text-[#FE8A0F] flex-shrink-0" />
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-bold truncate">
                          {Math.floor(Math.random() * 50 + 1)} miles away
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          • {pro.location}
                        </span>
                      </div>

                      {/* Skills - Stronger borders */}
                      {pro.skills && pro.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {pro.skills.slice(0, 3).map((skill, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 text-[#2c353f] font-['Poppins',sans-serif] text-[11px] font-semibold px-3 py-1 rounded-full hover:border-blue-300 hover:bg-blue-100 transition-all duration-200"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Side: Rating and Button */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      {/* 5 Star Rating Display - Enhanced */}
                      <div className="flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.floor(pro.rating)
                                ? 'text-[#FE8A0F] fill-[#FE8A0F]'
                                : 'text-gray-300 fill-gray-300'
                            }`}
                          />
                        ))}
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-bold ml-1">
                          {pro.rating}
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                          ({pro.reviewCount})
                        </span>
                      </div>

                      {/* Invitation Button - Enhanced */}
                      {invitedProfessionalIds.has(pro.id) ? (
                        <Button
                          disabled
                          className="bg-green-50 text-green-700 border-2 border-green-300 font-['Poppins',sans-serif] text-[13px] font-semibold h-9 px-5 cursor-not-allowed shadow-sm"
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          Invited
                        </Button>
                      ) : (
                        <Button
                          onClick={() => onInvite(pro)}
                          className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-lg text-white font-['Poppins',sans-serif] text-[13px] font-semibold h-9 px-5 transition-all duration-300"
                        >
                          Send invitation
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] leading-relaxed line-clamp-4 mt-auto">
                    {generateProfessionalSummary(pro)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}