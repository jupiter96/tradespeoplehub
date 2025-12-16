import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bannerBg from "figma:asset/6bbce490789ed9401b274940c0210ca96c857be3.png";

export default function ServicesBannerSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-[#f0f0f0] py-8 md:py-10">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Banner Container - Clean and Simple */}
        <div className="relative overflow-hidden -mx-4 md:-mx-6">
          {/* Background Pattern */}
          <div className="relative h-[140px] md:h-[160px] bg-[#003D82]">
            {/* Background Image */}
            <img 
              src={bannerBg}
              alt="Professional Services"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            
            {/* Content Container */}
            <div className="relative h-full flex items-center">
              <div className="w-full px-6 md:px-8 lg:px-12 flex items-center justify-center md:justify-between">
                {/* Text Content - Hidden on mobile */}
                <div className="flex-1 hidden md:block">
                  {/* Main Heading */}
                  <h2 className="font-['Roboto',sans-serif] text-white mb-2 md:mb-3">
                    <span className="text-[18px] md:text-[28px] lg:text-[32px] leading-tight">
                      Discover{" "}
                      <span className="text-[#FE8A0F]">Thousands</span>
                      {" "}of Professional Services
                    </span>
                  </h2>
                  
                  {/* Description */}
                  <p className="text-white/90 text-[12px] md:text-[14px] font-['Roboto',sans-serif] leading-relaxed">
                    Browse our complete marketplace and find the perfect professional for any task
                  </p>
                </div>
                
                {/* CTA Button - Centered on mobile */}
                <div className="md:ml-8">
                  <button 
                    onClick={() => navigate("/services")}
                    className="px-5 md:px-8 py-2.5 md:py-3.5 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white rounded-full font-['Roboto',sans-serif] text-[12px] md:text-[14px] whitespace-nowrap cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      Browse All Services
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
