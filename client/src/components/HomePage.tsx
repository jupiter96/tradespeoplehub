import Nav from "../imports/Nav";
import BrowseByCategory from "./BrowseByCategory";
import FeaturedServices from "./FeaturedServices";
import TrustTransparencySection from "./TrustTransparencySection";
import Footer from "./Footer";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from "react";
import mobileBannerImage from "figma:asset/618daa9a68ee59f7a6ae2af4cb4c10ea44a1211f.png";

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handlePopularSearch = (term: string) => {
    navigate(`/services?search=${encodeURIComponent(term)}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Header */}
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section 
          className="relative flex items-center justify-center w-full"
        >
          {/* Desktop Video Container - Original design preserved */}
          <div className="hidden md:block relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <div style={{ position: 'relative', width: '100%', height: 0, paddingBottom: '56.250%' }}>
            <iframe
                allow="fullscreen;autoplay"
                allowFullScreen
                height="100%"
                src="https://streamable.com/e/udoifu?autoplay=1&muted=1&nocontrols=1"
                width="100%"
              style={{
                border: 'none',
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  overflow: 'hidden'
                }}
            />
            
            {/* Dark overlay */}
            <div 
              className="absolute inset-0 z-10"
              style={{
                background: 'linear-gradient(90deg, rgba(0,30,60,0.75) 0%, rgba(0,40,80,0.65) 50%, rgba(0,50,100,0.5) 100%)',
              }}
            />
          
              <div className="absolute inset-0 z-40 px-6 md:px-12 lg:px-20 xl:px-24 w-full h-full flex flex-col justify-start pt-[3%] md:pt-[2%] lg:pt-[3%] xl:pt-[4%]">
              <div className="max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1200px] mx-auto w-full flex flex-col items-center">
                {/* Modern Badge */}
                <div className="inline-flex items-center gap-2 px-3 md:px-3.5 py-1.5 md:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-3 md:mb-4 lg:mb-5">
                  <span className="w-2 h-2 rounded-full bg-[#FE8A0F] animate-pulse"></span>
                  <span className="text-white/90 text-[11px] md:text-[11px] lg:text-[12px] xl:text-[13px] 2xl:text-[14px] font-medium whitespace-nowrap">
                    Trusted by 50,000+ professionals
                  </span>
                </div>

                {/* Hero Title - Desktop Responsive */}
                <h1 className="mb-4 md:mb-5 lg:mb-6 xl:mb-7 text-center w-full px-2">
                  <div className="text-white font-['Poppins',sans-serif] text-[24px] md:text-[28px] lg:text-[36px] xl:text-[44px] 2xl:text-[52px] leading-[1.2] md:leading-[1.2] lg:leading-[1.25]"
                    style={{
                      textShadow: '0 2px 30px rgba(0, 0, 0, 0.3)'
                    }}>
                    Order <span className="text-[#FE8A0F] relative inline-block"
                      style={{
                        textShadow: '0 0 20px rgba(254, 138, 15, 0.4), 0 0 40px rgba(254, 138, 15, 0.25), 0 2px 30px rgba(0, 0, 0, 0.3)',
                        filter: 'blur(0.3px)'
                      }}>professional services</span> as effortlessly as shopping online.
                  </div>
                </h1>

                {/* Search Bar - Desktop Responsive */}
                <div className="relative w-full max-w-[90%] md:max-w-[500px] lg:max-w-[550px] xl:max-w-[600px] 2xl:max-w-[650px] mb-4 md:mb-5 lg:mb-6">
                  <div className="relative flex items-center bg-white rounded-xl md:rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden">
                    <div className="absolute left-4 md:left-5 lg:left-6 text-gray-400">
                      <svg className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input 
                      type="text"
                      placeholder="What service do you need?"
                      className="flex-1 h-[54px] md:h-[56px] lg:h-[60px] xl:h-[64px] 2xl:h-[70px] pl-11 md:pl-12 lg:pl-14 pr-3 md:pr-4 text-[14px] md:text-[14px] lg:text-[15px] xl:text-[16px] 2xl:text-[17px] text-gray-700 outline-none bg-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchEnter}
                    />
                    <button className="h-[54px] md:h-[56px] lg:h-[60px] xl:h-[64px] 2xl:h-[70px] px-5 md:px-6 lg:px-7 xl:px-9 2xl:px-10 bg-[#FE8A0F] text-white font-['Poppins',sans-serif] font-semibold hover:bg-[#FF9E2C] transition-all duration-300 text-[14px] md:text-[14px] lg:text-[15px] xl:text-[16px] 2xl:text-[17px] flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
                      onClick={handleSearch}
                    >
                      Search
                      <svg className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Popular Searches - Centered */}
                  <div className="flex flex-nowrap items-center justify-center gap-2 md:gap-2.5 lg:gap-4 xl:gap-5 2xl:gap-6 mt-3 md:mt-3.5 lg:mt-4">
                    {/* Popular Keywords */}
                    <div className="flex flex-nowrap gap-1.5 md:gap-2 justify-center">
                      {['Plumber', 'Electrician', 'Cleaner', 'Painter'].map((term) => (
                        <button
                          key={term}
                          className="px-2 md:px-2.5 lg:px-3 py-0.5 md:py-1 lg:py-1.5 rounded-full text-[9px] md:text-[10px] lg:text-[11px] xl:text-[12px] font-medium text-white/90 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-200 whitespace-nowrap"
                          onClick={() => handlePopularSearch(term)}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Video Container - Separate design */}
          <div className="md:hidden relative w-full overflow-hidden" style={{ height: '34vh', minHeight: '300px' }}>
            {/* Background Image */}
            <img 
              src={mobileBannerImage}
              alt="Mobile Banner Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Dark overlay for better text readability */}
            <div 
              className="absolute inset-0 bg-black/20"
            />
          
            <div className="relative z-40 px-4 sm:px-6 w-full h-full flex flex-col justify-center py-6">
              <div className="max-w-[600px] mx-auto w-full flex flex-col items-center">
                {/* Hero Title - Mobile */}
                <h1 className="mb-4 text-center px-2">
                  <div className="text-white font-['Poppins',sans-serif] text-[22px] sm:text-[26px] leading-[1.2]"
                    style={{
                      textShadow: '0 2px 30px rgba(0, 0, 0, 0.3)'
                    }}>
                    Order <span className="text-[#FE8A0F] relative inline-block"
                      style={{
                        textShadow: '0 0 20px rgba(254, 138, 15, 0.4), 0 0 40px rgba(254, 138, 15, 0.25), 0 2px 30px rgba(0, 0, 0, 0.3)',
                        filter: 'blur(0.3px)'
                      }}>professional services</span> as effortlessly as shopping online.
                  </div>
                </h1>

                {/* Search Bar - Mobile */}
                <div className="relative w-full px-2">
                  <div className="relative flex items-center bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
                    <div className="absolute left-4 sm:left-5 text-gray-400">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input 
                      type="text"
                      placeholder="What service do you need?"
                      className="flex-1 h-[52px] sm:h-[56px] pl-12 sm:pl-14 pr-2 text-[14px] sm:text-[15px] text-gray-700 outline-none bg-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchEnter}
                    />
                    <button className="h-[52px] sm:h-[56px] px-6 sm:px-8 bg-[#FE8A0F] text-white font-['Poppins',sans-serif] font-semibold hover:bg-[#FF9E2C] transition-all duration-300 text-[14px] sm:text-[15px] flex items-center gap-2"
                      onClick={handleSearch}
                    >
                      <span className="hidden xs:inline">Search</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category and Featured Services Section */}
        <section className="relative md:-mt-[20%] z-40 bg-white pt-8">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6">
            {/* Browse Service by Category */}
            <div className="w-full py-6 md:py-8">
              <BrowseByCategory />
            </div>
            
            {/* Featured Services */}
            <div className="w-full pt-6 md:pt-8 pb-3 md:pb-4">
              <FeaturedServices />
            </div>
          </div>
        </section>

        {/* Trust & Transparency Section */}
        <TrustTransparencySection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}