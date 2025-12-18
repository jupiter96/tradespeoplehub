import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useSectors, useServiceCategories, type ServiceCategory, type ServiceSubCategory } from "../hooks/useSectorsAndCategories";
import type { Sector } from "../hooks/useSectorsAndCategories";
import { getSectorIcon, getCategoryIcon, getSubCategoryIcon } from "./categoryIconMappings";
import serviceVector from "../assets/service_vector.jpg";

type ViewMode = "sectors" | "categories" | "subcategories";

export default function AllCategoriesPage() {
  const { sectors, loading: sectorsLoading, error: sectorsError } = useSectors(false, false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<ServiceCategory | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("sectors");
  const [serviceCategoriesBySector, setServiceCategoriesBySector] = useState<Record<string, ServiceCategory[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch service categories for all sectors
  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        if (sectors.length > 0) {
          const { resolveApiUrl } = await import("../config/api");
          const categoriesMap: Record<string, ServiceCategory[]> = {};
          
          const promises = sectors.map(async (sector: Sector) => {
            try {
              const response = await fetch(
                resolveApiUrl(`/api/service-categories?sectorId=${sector._id}&activeOnly=true&includeSubCategories=true&sortBy=order&sortOrder=asc`),
                { credentials: 'include' }
              );
              if (response.ok) {
                const data = await response.json();
                categoriesMap[sector._id] = data.serviceCategories || [];
              }
            } catch (error) {
              console.error(`Error fetching service categories for sector ${sector._id}:`, error);
            }
          });
          
          await Promise.all(promises);
          setServiceCategoriesBySector(categoriesMap);
        }
      } catch (error) {
        console.error('Error fetching service categories:', error);
        setError('Failed to load service categories');
      } finally {
        setLoading(false);
      }
    };
    
    if (sectors.length > 0) {
      fetchServiceCategories();
    } else {
      setLoading(false);
    }
  }, [sectors]);

  // Sort sectors by order
  const sortedSectors = [...sectors].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Get service categories for selected sector, sorted by order
  const getServiceCategoriesForSector = (sector: Sector): ServiceCategory[] => {
    const serviceCategories = serviceCategoriesBySector[sector._id] || [];
    return serviceCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Get subcategories for selected service category, sorted by order
  const getSubCategoriesForServiceCategory = (serviceCategory: ServiceCategory): ServiceSubCategory[] => {
    const subCategories = ((serviceCategory.subCategories || []) as ServiceSubCategory[])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return subCategories;
  };

  const handleSectorClick = (sector: Sector) => {
    setSelectedSector(sector);
    setSelectedServiceCategory(null);
    setViewMode("categories");
  };

  const handleCategoryClick = (serviceCategory: ServiceCategory) => {
    setSelectedServiceCategory(serviceCategory);
    setViewMode("subcategories");
  };

  const handleBackToSectors = () => {
    setSelectedSector(null);
    setSelectedServiceCategory(null);
    setViewMode("sectors");
  };

  const handleBackToCategories = () => {
    setSelectedServiceCategory(null);
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
            backgroundImage: `url('${serviceVector}')`,
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
        {(sectorsLoading || loading) ? (
          <div className="py-20" aria-busy="true">
            <span className="sr-only">Loading categories</span>
          </div>
        ) : (sectorsError || error) ? (
          <div className="text-center py-20">
            <p className="text-red-500 font-['Poppins',sans-serif]">{sectorsError || error}</p>
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
                {selectedServiceCategory && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-[#3D78CB] font-medium">{selectedServiceCategory.name}</span>
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
                    const categories = getServiceCategoriesForSector(sector);
                    
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
                  const serviceCategories = getServiceCategoriesForSector(selectedSector);
                  return serviceCategories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {serviceCategories.map((serviceCategory) => {
                        const CategoryIconComponent = getCategoryIcon(serviceCategory.name);
                        const hasIcon = serviceCategory.icon && !imageErrors[`serviceCategory-${serviceCategory._id}`];
                        const subCategories = getSubCategoriesForServiceCategory(serviceCategory);
                        const sectorSlug = selectedSector.slug || selectedSector.name.toLowerCase().replace(/\s+/g, '-');
                        const serviceCategorySlug = serviceCategory.slug || serviceCategory.name.toLowerCase().replace(/\s+/g, '-');
                        
                        return (
                          <Link
                            key={serviceCategory._id}
                            to={`/sector/${sectorSlug}/${serviceCategorySlug}`}
                            className="group flex items-center gap-4 p-4 bg-gray-50 hover:bg-white rounded-[12px] border border-gray-200 hover:border-[#3D78CB] hover:shadow-[0px_4px_12px_rgba(61,120,203,0.15)] transition-all duration-200 text-left w-full"
                          >
                            {/* Category Icon */}
                            <div className="w-12 h-12 rounded-[10px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#3D78CB]/10 to-[#FE8A0F]/10 flex-shrink-0">
                              {hasIcon ? (
                                <img 
                                  src={serviceCategory.icon} 
                                  alt={serviceCategory.name}
                                  className="w-full h-full object-contain p-1.5"
                                  onError={() => handleImageError(`serviceCategory-${serviceCategory._id}`)}
                                />
                              ) : (
                                <CategoryIconComponent
                                  className="w-6 h-6 text-[#3D78CB]"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-['Poppins',sans-serif] text-[#2c353f] text-[15px] font-semibold group-hover:text-[#3D78CB] transition-colors mb-1">
                                {serviceCategory.name}
                              </h3>
                              {subCategories.length > 0 && (
                                <p className="text-[12px] text-gray-500 font-['Poppins',sans-serif]">
                                  {subCategories.length} {subCategories.length === 1 ? 'service' : 'services'} available
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#3D78CB] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </Link>
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
            {viewMode === "subcategories" && selectedServiceCategory && selectedSector && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] mb-2">
                      {selectedServiceCategory.name}
                    </h2>
                    <p className="text-gray-500 text-[14px] font-['Poppins',sans-serif]">
                      Available services in this category
                    </p>
                  </div>
                </div>
                {(() => {
                  const subCategories = getSubCategoriesForServiceCategory(selectedServiceCategory);
                  const sectorSlug = selectedSector.slug || selectedSector.name.toLowerCase().replace(/\s+/g, '-');
                  const serviceCategorySlug = selectedServiceCategory.slug || selectedServiceCategory.name.toLowerCase().replace(/\s+/g, '-');
                  
                  return subCategories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {subCategories.map((subCategory) => {
                        const SubCategoryIconComponent = getSubCategoryIcon(subCategory.name);
                        const hasIcon = subCategory.icon && !imageErrors[`subcategory-${subCategory._id}`];
                        const subCategorySlug = subCategory.slug || subCategory.name.toLowerCase().replace(/\s+/g, '-');
                        
                        return (
                          <Link
                            key={subCategory._id}
                            to={`/sector/${sectorSlug}/${serviceCategorySlug}/${subCategorySlug}`}
                            className="group flex items-center gap-3 p-3 bg-gray-50 hover:bg-white rounded-[10px] border border-gray-200 hover:border-[#3D78CB] hover:shadow-[0px_2px_8px_rgba(61,120,203,0.12)] transition-all duration-200"
                          >
                            {/* SubCategory Icon */}
                            <div className="w-10 h-10 rounded-[8px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#3D78CB]/10 to-[#FE8A0F]/10 flex-shrink-0">
                              {hasIcon ? (
                                <img 
                                  src={subCategory.icon} 
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
