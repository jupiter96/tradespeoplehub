import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

export default function TopCategoriesSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const categories = [
    { name: "Builders", icon: "👷" },
    { name: "Handymen", icon: "🔧" },
    { name: "Gardeners", icon: "🌱" },
    { name: "Bathroom Fitters", icon: "🚿" },
    { name: "Cleaners", icon: "🧹" },
    { name: "Legal & Advice", icon: "⚖️" },
    { name: "Plumbers", icon: "🔧" },
    { name: "Electricians", icon: "⚡" },
    { name: "Painters", icon: "🎨" },
    { name: "Landscapers", icon: "🌳" },
    { name: "Roofers", icon: "🏠" },
    { name: "Carpenters", icon: "🪚" },
    { name: "Locksmiths", icon: "🔐" },
    { name: "Pet Services", icon: "🐕" },
    { name: "Moving Services", icon: "📦" },
    { name: "HVAC Specialists", icon: "❄️" }
  ];

  return (
    <div className="w-full bg-[#f0f0f0] py-12 md:py-16">
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Title and Navigation */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[#5b5b5b] text-[16px] font-['Poppins',sans-serif]">
            Top Home and Garden Categories
          </h2>
          
          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={scrollLeft}
              className="w-[24px] h-[24px] rounded-full border border-[#D9D9D9] bg-white flex items-center justify-center hover:bg-[#f0f0f0] transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-[#5b5b5b]" />
            </button>
            <button
              onClick={scrollRight}
              className="w-[24px] h-[24px] rounded-full bg-[#FE8A0F] flex items-center justify-center hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/services?category=Home & Garden`}
              className="flex-shrink-0 w-[159px] md:w-[168px] h-[68px] bg-white rounded-[4px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] cursor-pointer hover:shadow-[0px_4px_12px_0px_rgba(0,0,0,0.2)] transition-all duration-300 group"
            >
              <div className="flex items-center h-full px-3 gap-3">
                {/* Icon Background */}
                <div className="w-[45px] h-[45px] bg-[#f0f6ff] rounded-[4px] flex items-center justify-center group-hover:bg-[#e3efff] transition-colors">
                  <span className="text-[24px]">{category.icon}</span>
                </div>
                
                {/* Category Name */}
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#5b5b5b] group-hover:text-[#FE8A0F] transition-colors">
                    {category.name}
                  </span>
                  <ChevronRight className="w-[11px] h-[7px] text-[#5b5b5b] group-hover:text-[#FE8A0F] transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
