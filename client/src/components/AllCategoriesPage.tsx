import { Link } from "react-router-dom";
import {
  Home,
  Briefcase,
  User,
  GraduationCap,
  Car,
  Package,
  ChevronRight,
  Wrench,
  Laptop,
  Heart,
  Stethoscope,
  Scale,
  Camera,
  PawPrint,
  Sparkles,
  FileText,
  Loader2,
} from "lucide-react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useSectors } from "../hooks/useSectorsAndCategories";
import type { Sector, Category } from "../hooks/useSectorsAndCategories";

export default function AllCategoriesPage() {
  const { sectors, loading, error } = useSectors(true, true); // Include categories and subcategories
  const sectorIcons: Record<string, any> = {
    "Home & Garden": Home,
    "Business Services": Briefcase,
    "Personal Services": User,
    "Repair & Maintenance": Wrench,
    "Technology Services": Laptop,
    "Education & Tutoring": GraduationCap,
    "Beauty & Wellness": Heart,
    "Health & Wellness": Stethoscope,
    "Legal & Financial": Scale,
    "Event Services": Camera,
    "Pet Services": PawPrint,
    "Automotive": Car,
    "Moving & Storage": Package,
  };

  const sectorColors: Record<string, string> = {
    "Home & Garden": "#3F51B5",
    "Business Services": "#E91E63",
    "Personal Services": "#9C27B0",
    "Repair & Maintenance": "#FF5722",
    "Technology Services": "#2196F3",
    "Education & Tutoring": "#FF9800",
    "Beauty & Wellness": "#E91E63",
    "Health & Wellness": "#4CAF50",
    "Legal & Financial": "#795548",
    "Event Services": "#9C27B0",
    "Pet Services": "#FF9800",
    "Automotive": "#00BCD4",
    "Moving & Storage": "#4CAF50",
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>

      {/* Hero Section */}
      <div className="relative pt-32 pb-24 md:pt-40 md:pb-32 mt-[50px] md:mt-0">
        {/* Background Image with Fixed Height */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMGRlc2lnbnxlbnwxfHx8fDE3NjI3NzQ4MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          }}
        />
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/90 via-[#16213e]/85 to-[#0f3460]/90" />
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#FE8A0F]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-['Poppins',sans-serif] text-[#FE8A0F] mb-4 text-[42px] md:text-[56px] lg:text-[64px] drop-shadow-[0_4px_12px_rgba(254,138,15,0.3)]">
              All Service Categories
            </h1>
            <p className="font-['Poppins',sans-serif] text-white/90 text-[16px] md:text-[18px] max-w-2xl mx-auto">
              Explore our comprehensive range of professional services across all categories
            </p>
          </div>
        </div>
      </div>

      {/* Sectors and Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-16 pb-16 md:pb-24 relative z-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#3D78CB]" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 font-['Poppins',sans-serif]">{error}</p>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            {sectors.map((sector) => {
              const IconComponent = sectorIcons[sector.name] || Home;
              const color = sectorColors[sector.name] || "#3F51B5";
              const categories = (sector.categories || []) as Category[];
              
              return (
                <div 
                  key={sector._id} 
                  id={`sector-${sector.slug}`}
                  className="bg-white rounded-[16px] shadow-[0px_4px_16px_rgba(0,0,0,0.06)] p-6 md:p-8 scroll-mt-[180px]"
                >
                  {/* Sector Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-[12px] flex items-center justify-center"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <IconComponent
                          className="w-7 h-7"
                          style={{ color: color }}
                        />
                      </div>
                      <div>
                        <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[22px] md:text-[26px]">
                          {sector.name}
                        </h2>
                        <p className="font-['Poppins',sans-serif] text-[#8d8d8d] text-[13px]">
                          {categories.length} categories available
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/sector/${sector.slug}`}
                      className="hidden md:flex items-center gap-2 text-[#3D78CB] hover:text-[#2d68bb] font-['Poppins',sans-serif] text-[14px] transition-colors cursor-pointer"
                    >
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Categories Grid */}
                  {categories.length > 0 ? (
                    <div className="space-y-4">
                      {categories.map((category) => {
                        const subCategories = (category.subCategories || []) as any[];
                        return (
                          <div key={category._id} className="space-y-2">
                            <Link
                              to={`/services?category=${encodeURIComponent(sector.name)}&subcategory=${encodeURIComponent(category.name)}`}
                              className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-white rounded-[8px] border border-gray-100 hover:border-[#3D78CB] hover:shadow-[0px_4px_12px_rgba(61,120,203,0.15)] transition-all duration-200 cursor-pointer"
                            >
                              <div>
                                <span className="font-['Poppins',sans-serif] text-[#2c353f] text-[14px] font-semibold group-hover:text-[#3D78CB] transition-colors">
                                  {category.name}
                                </span>
                                {subCategories.length > 0 && (
                                  <p className="text-[11px] text-gray-500 font-['Poppins',sans-serif] mt-1">
                                    {subCategories.length} services available
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#3D78CB] group-hover:translate-x-0.5 transition-all" />
                            </Link>
                            {/* Subcategories */}
                            {subCategories.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 ml-4">
                                {subCategories.map((subCategory) => (
                                  <Link
                                    key={subCategory._id}
                                    to={`/services?category=${encodeURIComponent(sector.name)}&subcategory=${encodeURIComponent(category.name)}&service=${encodeURIComponent(subCategory.name)}`}
                                    className="group bg-white hover:bg-gray-50 rounded-[6px] border border-gray-100 hover:border-[#3D78CB] transition-all duration-200 p-2 flex items-center justify-between cursor-pointer"
                                  >
                                    <span className="font-['Poppins',sans-serif] text-[#2c353f] text-[12px] group-hover:text-[#3D78CB] transition-colors">
                                      {subCategory.name}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 font-['Poppins',sans-serif] text-[14px]">
                      No categories available
                    </p>
                  )}

                  {/* View All Link for Mobile */}
                  <Link
                    to={`/sector/${sector.slug}`}
                    className="md:hidden flex items-center justify-center gap-2 text-[#3D78CB] font-['Poppins',sans-serif] text-[14px] mt-4 pt-4 border-t border-gray-100 cursor-pointer"
                  >
                    View all {sector.name} services
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
