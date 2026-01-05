import { 
  ChevronRight, 
  Home, 
  Briefcase, 
  User, 
  Wrench, 
  Laptop, 
  GraduationCap, 
  Sparkles, 
  Heart, 
  Scale, 
  PartyPopper, 
  PawPrint, 
  Car,
  Package,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSectors } from "../hooks/useSectorsAndCategories";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Sector } from "../hooks/useSectorsAndCategories";
import serviceVector from "../assets/service_vector.jpg";

export default function BrowseByCategory() {
  const { sectors, loading: sectorsLoading } = useSectors(false, false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  // Removed unnecessary service categories fetch - BrowseByCategory only uses sectors
  const loading = sectorsLoading;
  // Icon mapping for sectors - Each sector now has a unique icon
  const iconMap: Record<string, any> = {
    "Home & Garden": Home,
    "Business Services": Briefcase,
    "Personal Services": User,
    "Repair & Maintenance": Wrench,
    "Technology Services": Laptop,
    "Education & Tutoring": GraduationCap,
    "Beauty & Wellness": Sparkles,
    "Health & Wellness": Heart,
    "Legal & Financial": Scale,
    "Event Services": PartyPopper,
    "Pet Services": PawPrint,
    "Automotive": Car,
    "Moving & Storage": Package,
  };

  // Background images and color overlays for each sector
  const categoryStyles: Record<string, { image: string, overlay: string }> = {
    "Home & Garden": { 
      image: serviceVector,
      overlay: "rgba(59, 130, 246, 0.75)" // Blue
    },
    "Business Services": { 
      image: serviceVector,
      overlay: "rgba(139, 92, 246, 0.75)" // Purple
    },
    "Personal Services": { 
      image: serviceVector,
      overlay: "rgba(16, 185, 129, 0.75)" // Green
    },
    "Repair & Maintenance": { 
      image: serviceVector,
      overlay: "rgba(230, 126, 34, 0.75)" // Orange
    },
    "Technology Services": { 
      image: serviceVector,
      overlay: "rgba(71, 85, 105, 0.75)" // Slate Gray
    },
    "Education & Tutoring": { 
      image: serviceVector,
      overlay: "rgba(245, 158, 11, 0.75)" // Amber
    },
    "Beauty & Wellness": { 
      image: serviceVector,
      overlay: "rgba(236, 72, 153, 0.75)" // Pink
    },
    "Health & Wellness": { 
      image: serviceVector,
      overlay: "rgba(16, 185, 129, 0.75)" // Green
    },
    "Legal & Financial": { 
      image: serviceVector,
      overlay: "rgba(142, 68, 173, 0.75)" // Purple
    },
    "Event Services": { 
      image: serviceVector,
      overlay: "rgba(219, 39, 119, 0.75)" // Pink
    },
    "Pet Services": { 
      image: serviceVector,
      overlay: "rgba(251, 146, 60, 0.75)" // Orange
    },
    "Automotive": { 
      image: serviceVector,
      overlay: "rgba(239, 68, 68, 0.75)" // Red
    },
    "Moving & Storage": { 
      image: serviceVector,
      overlay: "rgba(22, 160, 133, 0.75)" // Teal
    },
  };

  // Sort by order field (ascending) and take top 6 sectors
  const topSectors = sectors
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 6);

  // Build categories: Show sectors directly (not service categories)
  const categories = topSectors.map((sector: Sector) => {
    const IconComponent = iconMap[sector.name] || Home;
    const styles = categoryStyles[sector.name] || categoryStyles["Home & Garden"];
    
    return {
      id: sector._id,
      name: sector.name,
      subtitle: undefined,
      icon: IconComponent,
      iconImage: sector.icon, // Sector icon
      styles: styles,
      categoryName: sector.name,
      sectorSlug: sector.slug,
      serviceCategorySlug: undefined,
      isServiceCategory: false,
    };
  });

  if (sectorsLoading || loading) {
    return (
      <div className="w-full" aria-busy="true">
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h2 className="font-['Poppins',sans-serif] text-[#003D82] text-[22px] md:text-[26px] font-semibold">
            Browse Service by Category
          </h2>
        </div>
        <div className="py-10">
          <span className="sr-only">Loading categories</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <h2 className="font-['Poppins',sans-serif] text-gray-700 text-[22px] md:text-[26px] font-normal">
          Browse Service by Category
        </h2>
        <Link 
          to="/all-categories" 
          className="flex items-center gap-2 text-[#FE8A0F] font-['Poppins',sans-serif] text-[14px] font-medium hover:text-[#E67A00] transition-colors cursor-pointer group"
        >
          Browse all
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Category Grid - Mobile: Horizontal Slider, Desktop: Grid */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3 pb-2">
          {categories.map((category) => {
            const IconComponent = category.icon;
            
            return (
              <Link
                key={category.id}
                to={`/sector/${category.sectorSlug}`}
                className="relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl group cursor-pointer flex-shrink-0 w-[110px] aspect-[4/3]"
              >
                {/* Background Image */}
                <ImageWithFallback 
                  src={category.styles.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Color Overlay */}
                <div 
                  className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                  style={{
                    backgroundColor: category.styles.overlay
                  }}
                />
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-2">
                  {/* Icon Circle */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30 overflow-hidden">
                    {category.iconImage && !imageErrors[category.id] ? (
                      <img 
                        src={category.iconImage} 
                        alt={category.name}
                        className="w-full h-full object-contain p-1"
                        onError={() => {
                          // Mark image as failed to load
                          setImageErrors(prev => ({ ...prev, [category.id]: true }));
                        }}
                      />
                    ) : (
                      <IconComponent 
                        className="w-4 h-4 text-white"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  
                  {/* Category Name */}
                  <div className="text-center font-['Poppins',sans-serif]">
                    <p className="text-white text-[11px] font-semibold leading-tight drop-shadow-md">
                      {category.name}
                    </p>
                  </div>
                  
                  {/* Arrow Icon on Hover */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ChevronRight className="w-4 h-4 text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          
          return (
            <Link
              key={category.id}
              to={`/sector/${category.sectorSlug}`}
              className="relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl group cursor-pointer aspect-[4/3]"
            >
              {/* Background Image */}
              <ImageWithFallback 
                src={category.styles.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Color Overlay */}
              <div 
                className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                style={{
                  backgroundColor: category.styles.overlay
                }}
              />
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
                {/* Icon Circle */}
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 mb-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30 overflow-hidden">
                  {category.iconImage && !imageErrors[category.id] ? (
                    <img 
                      src={category.iconImage} 
                      alt={category.name}
                      className="w-full h-full object-contain p-1.5"
                      onError={() => {
                        // Mark image as failed to load
                        setImageErrors(prev => ({ ...prev, [category.id]: true }));
                      }}
                    />
                  ) : (
                    <IconComponent 
                      className="w-7 h-7 text-white"
                      strokeWidth={2}
                    />
                  )}
                </div>
                
                {/* Category Name */}
                <div className="text-center font-['Poppins',sans-serif]">
                  <p className="text-white text-[14px] font-semibold leading-tight drop-shadow-md">
                    {category.name}
                  </p>
                </div>
                
                {/* Arrow Icon on Hover */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <ChevronRight className="w-5 h-5 text-white drop-shadow-md" strokeWidth={2.5} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}