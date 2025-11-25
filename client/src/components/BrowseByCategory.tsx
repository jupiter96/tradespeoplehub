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
  Package
} from "lucide-react";
import { Link } from "react-router-dom";
import { sectors } from "./unifiedCategoriesData";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export default function BrowseByCategory() {
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
      image: "https://images.unsplash.com/photo-1559006863-03e0799b836a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGdhcmRlbnxlbnwxfHx8fDE3NjM0NzQ1NDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(59, 130, 246, 0.75)" // Blue
    },
    "Business Services": { 
      image: "https://images.unsplash.com/photo-1642522029686-5485ea7e6042?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG9mZmljZSUyMG1lZXRpbmd8ZW58MXx8fHwxNzYzNDYxNjgxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(139, 92, 246, 0.75)" // Purple
    },
    "Personal Services": { 
      image: "https://images.unsplash.com/photo-1635367216109-aa3353c0c22e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGglMjB3ZWxsbmVzcyUyMHlvZ2F8ZW58MXx8fHwxNzYzNTUxMTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(16, 185, 129, 0.75)" // Green
    },
    "Repair & Maintenance": { 
      image: "https://images.unsplash.com/photo-1760310936486-4dd450aab2a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXBhaXIlMjB0b29scyUyMG1haW50ZW5hbmNlfGVufDF8fHx8MTc2MzU1NjAwMnww&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(230, 126, 34, 0.75)" // Orange
    },
    "Technology Services": { 
      image: "https://images.unsplash.com/photo-1608742213509-815b97c30b36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwY29tcHV0ZXIlMjBjb2Rpbmd8ZW58MXx8fHwxNzYzNTQ5MjI2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(71, 85, 105, 0.75)" // Slate Gray
    },
    "Education & Tutoring": { 
      image: "https://images.unsplash.com/photo-1759922378123-a1f4f1e39bae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBjbGFzc3Jvb20lMjBsZWFybmluZ3xlbnwxfHx8fDE3NjM1NTYwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(245, 158, 11, 0.75)" // Amber
    },
    "Beauty & Wellness": { 
      image: "https://images.unsplash.com/photo-1632937145991-91620be68319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NjM1MDg0MTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(236, 72, 153, 0.75)" // Pink
    },
    "Health & Wellness": { 
      image: "https://images.unsplash.com/photo-1635367216109-aa3353c0c22e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGglMjB3ZWxsbmVzcyUyMHlvZ2F8ZW58MXx8fHwxNzYzNTUxMTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(16, 185, 129, 0.75)" // Green
    },
    "Legal & Financial": { 
      image: "https://images.unsplash.com/photo-1528747008803-f9f5cc8f1a64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWdhbCUyMGZpbmFuY2lhbCUyMHNlcnZpY2VzfGVufDF8fHx8MTc2MzU1NjAwMnww&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(142, 68, 173, 0.75)" // Purple
    },
    "Event Services": { 
      image: "https://images.unsplash.com/photo-1630329800929-5a9dac105c12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2VyZW1vbnklMjBkZWNvcmF0aW9ufGVufDF8fHx8MTc2MzQ4NjgxM3ww&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(219, 39, 119, 0.75)" // Pink
    },
    "Pet Services": { 
      image: "https://images.unsplash.com/photo-1623249670310-7b7c39de2d07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBkb2clMjBjYXJlfGVufDF8fHx8MTc2MzU1NjAwMnww&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(251, 146, 60, 0.75)" // Orange
    },
    "Automotive": { 
      image: "https://images.unsplash.com/photo-1698732018617-305c903f593a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBhdXRvbW90aXZlJTIwZ2FyYWdlfGVufDF8fHx8MTc2MzU1NjAwMHww&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(239, 68, 68, 0.75)" // Red
    },
    "Moving & Storage": { 
      image: "https://images.unsplash.com/photo-1761807997279-26ce9256bc56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpbmclMjBib3hlcyUyMHN0b3JhZ2V8ZW58MXx8fHwxNzYzNDY3Mjk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      overlay: "rgba(22, 160, 133, 0.75)" // Teal
    },
  };

  // Calculate service count for each sector and get top 6
  const sectorsWithCount = sectors.map(sector => ({
    ...sector,
    serviceCount: sector.categories.length
  }));

  // Sort by service count (descending) and take top 6
  const topSectors = sectorsWithCount
    .sort((a, b) => b.serviceCount - a.serviceCount)
    .slice(0, 6);

  const categories = topSectors.map(sector => {
    const IconComponent = iconMap[sector.name] || Home;
    const styles = categoryStyles[sector.name] || categoryStyles["Home & Garden"];
    
    return {
      id: sector.id,
      name: sector.displayName,
      subtitle: sector.subtitle,
      icon: IconComponent,
      styles: styles,
      categoryName: sector.name,
      sectorSlug: sector.sectorValue,
    };
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <h2 className="font-['Poppins',sans-serif] text-[#003D82] text-[22px] md:text-[26px] font-semibold">
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
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                    <IconComponent 
                      className="w-4 h-4 text-white"
                      strokeWidth={2}
                    />
                  </div>
                  
                  {/* Category Name */}
                  <div className="text-center font-['Poppins',sans-serif]">
                    <p className="text-white text-[11px] font-semibold leading-tight drop-shadow-md">
                      {category.name}
                    </p>
                    {category.subtitle && (
                      <p className="text-white text-[11px] font-semibold leading-tight drop-shadow-md">
                        {category.subtitle}
                      </p>
                    )}
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
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 mb-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                  <IconComponent 
                    className="w-7 h-7 text-white"
                    strokeWidth={2}
                  />
                </div>
                
                {/* Category Name */}
                <div className="text-center font-['Poppins',sans-serif]">
                  <p className="text-white text-[14px] font-semibold leading-tight drop-shadow-md">
                    {category.name}
                  </p>
                  {category.subtitle && (
                    <p className="text-white text-[14px] font-semibold leading-tight drop-shadow-md">
                      {category.subtitle}
                    </p>
                  )}
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