import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useSectors } from "../hooks/useSectorsAndCategories";
import type { Sector, Category, SubCategory } from "../hooks/useSectorsAndCategories";
import { getSectorIcon, getCategoryIcon, getSubCategoryIcon } from "./categoryIconMappings";

type ViewMode = "sectors" | "categories" | "subcategories";

export default function AllCategoriesPage() {
  const { sectors, loading, error } = useSectors(true, true); // Include categories and subcategories
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("sectors");

  // Sort sectors by order
  const sortedSectors = [...sectors].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Get categories for selected sector, sorted by order
  const getCategoriesForSector = (sector: Sector): Category[] => {
    const categories = ((sector.categories || []) as Category[])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return categories;
  };

  // Get subcategories for selected category, sorted by order
  const getSubCategoriesForCategory = (category: Category): SubCategory[] => {
    const subCategories = ((category.subCategories || []) as SubCategory[])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return subCategories;
  };

  const handleSectorClick = (sector: Sector) => {
    setSelectedSector(sector);
    setSelectedCategory(null);
    setViewMode("categories");
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setViewMode("subcategories");
  };

  const handleBackToSectors = () => {
    setSelectedSector(null);
    setSelectedCategory(null);
    setViewMode("sectors");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setViewMode("categories");
  };

  const handleImageError = (key: string) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
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

      {/* Main Content */}
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
          <div className="bg-white rounded-[16px] shadow-[0px_4px_16px_rgba(0,0,0,0.06)] p-6 md:p-8">
            {/* Breadcrumb Navigation */}
            {(viewMode === "categories" || viewMode === "subcategories") && (
              <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                <button
                  onClick={handleBackToSectors}
                  className="flex items-center gap-1 hover:text-[#3D78CB] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>All Sectors</span>
                </button>
                {selectedSector && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-[#3D78CB] font-medium">{selectedSector.name}</span>
                  </>
                )}
                {selectedCategory && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-[#3D78CB] font-medium">{selectedCategory.name}</span>
                  </>
                )}
              </div>
            )}

            {/* Sectors View */}
            {viewMode === "sectors" && (
              <div>
                <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] mb-6">
                  Select a Sector
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedSectors.map((sector) => {
                    const IconComponent = getSectorIcon(sector.name);
                    const hasIcon = sector.icon && !imageErrors[`sector-${sector._id}`];
                    const categories = getCategoriesForSector(sector);
                    
                    return (
                      <button
                        key={sector._id}
                        onClick={() => handleSectorClick(sector)}
                        className="group flex items-center gap-4 p-4 bg-gray-50 hover:bg-white rounded-[12px] border border-gray-200 hover:border-[#3D78CB] hover:shadow-[0px_4px_12px_rgba(61,120,203,0.15)] transition-all duration-200 text-left w-full"
                      >
                        {/* Sector Icon */}
                        <div className="w-14 h-14 rounded-[10px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#3D78CB]/10 to-[#FE8A0F]/10 flex-shrink-0">
                          {hasIcon ? (
                            <img 
                              src={sector.icon} 
                              alt={sector.name}
                              className="w-full h-full object-contain p-2"
                              onError={() => handleImageError(`sector-${sector._id}`)}
                            />
                          ) : (
                            <IconComponent
                              className="w-7 h-7 text-[#3D78CB]"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-['Poppins',sans-serif] text-[#2c353f] text-[16px] font-semibold group-hover:text-[#3D78CB] transition-colors mb-1">
                            {sector.name}
                          </h3>
                          <p className="text-[12px] text-gray-500 font-['Poppins',sans-serif]">
                            {categories.length} {categories.length === 1 ? 'category' : 'categories'} available
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#3D78CB] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories View */}
            {viewMode === "categories" && selectedSector && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] mb-2">
                      {selectedSector.name}
                    </h2>
                    <p className="text-gray-500 text-[14px] font-['Poppins',sans-serif]">
                      Select a category to view services
                    </p>
                  </div>
                </div>
                {(() => {
                  const categories = getCategoriesForSector(selectedSector);
                  return categories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories.map((category) => {
                        const CategoryIconComponent = getCategoryIcon(category.name);
                        const hasIcon = category.icon && !imageErrors[`category-${category._id}`];
                        const subCategories = getSubCategoriesForCategory(category);
                        
                        return (
                          <button
                            key={category._id}
                            onClick={() => handleCategoryClick(category)}
                            className="group flex items-center gap-4 p-4 bg-gray-50 hover:bg-white rounded-[12px] border border-gray-200 hover:border-[#3D78CB] hover:shadow-[0px_4px_12px_rgba(61,120,203,0.15)] transition-all duration-200 text-left w-full"
                          >
                            {/* Category Icon */}
                            <div className="w-12 h-12 rounded-[10px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#3D78CB]/10 to-[#FE8A0F]/10 flex-shrink-0">
                              {hasIcon ? (
                                <img 
                                  src={category.icon} 
                                  alt={category.name}
                                  className="w-full h-full object-contain p-1.5"
                                  onError={() => handleImageError(`category-${category._id}`)}
                                />
                              ) : (
                                <CategoryIconComponent
                                  className="w-6 h-6 text-[#3D78CB]"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-['Poppins',sans-serif] text-[#2c353f] text-[15px] font-semibold group-hover:text-[#3D78CB] transition-colors mb-1">
                                {category.name}
                              </h3>
                              {subCategories.length > 0 && (
                                <p className="text-[12px] text-gray-500 font-['Poppins',sans-serif]">
                                  {subCategories.length} {subCategories.length === 1 ? 'service' : 'services'} available
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#3D78CB] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 font-['Poppins',sans-serif] text-[14px]">
                        No categories available in this sector
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Subcategories View */}
            {viewMode === "subcategories" && selectedCategory && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] mb-2">
                      {selectedCategory.name}
                    </h2>
                    <p className="text-gray-500 text-[14px] font-['Poppins',sans-serif]">
                      Available services in this category
                    </p>
                  </div>
                </div>
                {(() => {
                  const subCategories = getSubCategoriesForCategory(selectedCategory);
                  return subCategories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {subCategories.map((subCategory) => {
                        const SubCategoryIconComponent = getSubCategoryIcon(subCategory.name);
                        const hasIcon = (subCategory as any).icon && !imageErrors[`subcategory-${subCategory._id}`];
                        
                        return (
                          <Link
                            key={subCategory._id}
                            to={`/services?category=${encodeURIComponent(selectedSector?.name || '')}&subcategory=${encodeURIComponent(selectedCategory.name)}&service=${encodeURIComponent(subCategory.name)}`}
                            className="group flex items-center gap-3 p-3 bg-gray-50 hover:bg-white rounded-[10px] border border-gray-200 hover:border-[#3D78CB] hover:shadow-[0px_2px_8px_rgba(61,120,203,0.12)] transition-all duration-200"
                          >
                            {/* SubCategory Icon */}
                            <div className="w-10 h-10 rounded-[8px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#3D78CB]/10 to-[#FE8A0F]/10 flex-shrink-0">
                              {hasIcon ? (
                                <img 
                                  src={(subCategory as any).icon} 
                                  alt={subCategory.name}
                                  className="w-full h-full object-contain p-1"
                                  onError={() => handleImageError(`subcategory-${subCategory._id}`)}
                                />
                              ) : (
                                <SubCategoryIconComponent
                                  className="w-5 h-5 text-[#3D78CB]"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-['Poppins',sans-serif] text-[#2c353f] text-[14px] font-medium group-hover:text-[#3D78CB] transition-colors">
                                {subCategory.name}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#3D78CB] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 font-['Poppins',sans-serif] text-[14px]">
                        No services available in this category
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
