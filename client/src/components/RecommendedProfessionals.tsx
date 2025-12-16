import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, MapPin, CheckCircle2, Send, Info, MessageCircle, Briefcase } from "lucide-react";

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
}

interface RecommendedProfessionalsProps {
  professionals: Professional[];
  onInvite: (professional: Professional) => void;
  onMessage?: (professional: Professional) => void;
}

export default function RecommendedProfessionals({
  professionals,
  onInvite,
  onMessage,
}: RecommendedProfessionalsProps) {
  if (professionals.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 rounded-2xl shadow-sm p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="font-['Roboto',sans-serif] text-[22px] text-[#2c353f] mb-2 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#FE8A0F]" />
            <span>Recommended Professionals</span>
          </h2>
          <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
            Don't want to wait? Invite these verified professionals to quote on your job
          </p>
        </div>

        {/* Professionals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {professionals.map((pro) => (
            <div
              key={pro.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#FE8A0F] hover:shadow-lg transition-all duration-300 group"
            >
              {/* Professional Header */}
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-20 h-20 border-2 border-gray-100 group-hover:border-[#FE8A0F] transition-colors flex-shrink-0">
                  <AvatarImage src={pro.image} />
                  <AvatarFallback className="bg-gradient-to-br from-[#FE8A0F] to-[#FF6B35] text-white font-['Roboto',sans-serif] text-[20px]">
                    {pro.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Roboto',sans-serif] text-[17px] text-[#2c353f] mb-1 font-medium">
                    {pro.name}
                  </h3>
                  <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-3">
                    {pro.title}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#FE8A0F] fill-[#FE8A0F]" />
                      <span className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] font-medium">
                        {pro.rating}
                      </span>
                      <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                        ({pro.reviewCount})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                        {pro.completedJobs} jobs
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 mb-4">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                  {pro.location}
                </span>
              </div>

              {/* Skills */}
              {pro.skills && pro.skills.length > 0 && (
                <div className="mb-4">
                  <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] font-medium mb-2">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pro.skills.slice(0, 6).map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-['Roboto',sans-serif] text-[12px] px-2.5 py-0.5 border-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {pro.skills.length > 6 && (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 font-['Roboto',sans-serif] text-[12px] px-2.5 py-0.5 border-0"
                      >
                        +{pro.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onInvite(pro)}
                  className="flex-1 bg-gradient-to-r from-[#FE8A0F] to-[#FF9E2C] hover:from-[#FF9E2C] hover:to-[#FE8A0F] text-white font-['Roboto',sans-serif] text-[14px] h-10 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Invite to Quote
                </Button>
                {onMessage && (
                  <Button
                    onClick={() => onMessage(pro)}
                    variant="outline"
                    className="flex-1 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 font-['Roboto',sans-serif] text-[14px] h-10 transition-all duration-300"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] leading-relaxed">
                <span className="font-medium">Pro tip:</span> Inviting professionals directly can help you get quotes faster. All professionals shown here match your job requirements and have great reviews.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
