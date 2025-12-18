import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSectors, useServiceCategories, type ServiceCategory } from "../hooks/useSectorsAndCategories";

export default function TopCategoriesSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { sectors } = useSectors(false, false);
  const [topServiceCategories, setTopServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopServiceCategories = async () => {
      try {
        setLoading(true);
        if (sectors.length > 0) {
          const { resolveApiUrl } = await import("../config/api");
          // Fetch service categories for all sectors and take top 16
          const serviceCategoriesPromises = sectors.map(async (sector) => {
            try {
              const response = await fetch(
                resolveApiUrl(`/api/service-categories?sectorId=${sector._id}&activeOnly=true&includeSubCategories=false&sortBy=order&sortOrder=asc&limit=16`),
                { credentials: 'include' }
              );
              if (response.ok) {
                const data = await response.json();
                return data.serviceCategories || [];
              }
              return [];
            } catch (error) {
              console.error(`Error fetching service categories for sector ${sector._id}:`, error);
              return [];
            }
          });
          
          const allCategories = await Promise.all(serviceCategoriesPromises);
          const flattened = allCategories.flat();
          // Take top 16 by order
          const sorted = flattened.sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 16);
          setTopServiceCategories(sorted);
        }
      } catch (error) {
        console.error('Error fetching top service categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (sectors.length > 0) {
      fetchTopServiceCategories();
    } else {
      setLoading(false);
    }
  }, [sectors]);

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

  // Icon mapping for service categories
  const getCategoryIcon = (name: string) => {
    const iconMap: Record<string, string> = {
      "Builders": "👷",
      "Handymen": "🔧",
      "Gardeners": "🌱",
      "Bathroom Fitters": "🚿",
      "Cleaners": "🧹",
      "Legal & Advice": "⚖️",
      "Plumbers": "🔧",
      "Electricians": "⚡",
      "Painters": "🎨",
      "Landscapers": "🌳",
      "Roofers": "🏠",
      "Carpenters": "🪚",
      "Locksmiths": "🔐",
      "Pet Services": "🐕",
      "Moving Services": "📦",
      "HVAC Specialists": "❄️"
    };
    return iconMap[name] || "📋";
  };

  if (loading) {
    return (
      <div className="w-full bg-[#f0f0f0] py-12 md:py-16">
        <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#3D78CB]" />
          </div>
        </div>
      </div>
    );
  }

  if (topServiceCategories.length === 0) {
    return null;
  }

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
          {topServiceCategories.map((serviceCategory) => {
            const sector = sectors.find((s) => {
              const sectorId = typeof serviceCategory.sector === 'object' ? serviceCategory.sector._id : serviceCategory.sector;
              return sectorId === s._id;
            });
            const sectorSlug = sector?.slug || (sector?.name || '').toLowerCase().replace(/\s+/g, '-');
            const serviceCategorySlug = serviceCategory.slug || serviceCategory.name.toLowerCase().replace(/\s+/g, '-');
            
            return (
              <Link
                key={serviceCategory._id}
                to={`/sector/${sectorSlug}/${serviceCategorySlug}`}
                className="flex-shrink-0 w-[159px] md:w-[168px] h-[68px] bg-white rounded-[4px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] cursor-pointer hover:shadow-[0px_4px_12px_0px_rgba(0,0,0,0.2)] transition-all duration-300 group"
              >
                <div className="flex items-center h-full px-3 gap-3">
                  {/* Icon Background */}
                  <div className="w-[45px] h-[45px] bg-[#f0f6ff] rounded-[4px] flex items-center justify-center group-hover:bg-[#e3efff] transition-colors overflow-hidden">
                    {serviceCategory.icon ? (
                      <img 
                        src={serviceCategory.icon} 
                        alt={serviceCategory.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[24px]">{getCategoryIcon(serviceCategory.name)}</span>
                    )}
                  </div>
                  
                  {/* Category Name */}
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#5b5b5b] group-hover:text-[#FE8A0F] transition-colors">
                      {serviceCategory.name}
                    </span>
                    <ChevronRight className="w-[11px] h-[7px] text-[#5b5b5b] group-hover:text-[#FE8A0F] transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
