import { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const categoryImages = [
  {
    url: "https://images.unsplash.com/photo-1635221798248-8a3452ad07cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmVyJTIwcHJvZmVzc2lvbmFsJTIwd29ya2luZ3xlbnwxfHx8fDE3NjM0OTE0NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Plumbing Services",
    description: "Expert plumbers ready to help"
  },
  {
    url: "https://images.unsplash.com/photo-1467733238130-bb6846885316?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2lhbiUyMHdvcmtpbmclMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzMzk2Nzk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Electrical Work",
    description: "Certified electricians at your service"
  },
  {
    url: "https://images.unsplash.com/photo-1601155474324-8f3481386742?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50ZXIlMjBjcmFmdHNtYW4lMjB3b29kd29ya3xlbnwxfHx8fDE3NjM0OTE0NTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Carpentry & Woodwork",
    description: "Skilled craftsmen for your projects"
  },
  {
    url: "https://images.unsplash.com/photo-1688372199140-cade7ae820fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludGVyJTIwZGVjb3JhdG9yJTIwd29ya2luZ3xlbnwxfHx8fDE3NjM0OTE0NTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Painting & Decorating",
    description: "Professional painters & decorators"
  },
  {
    url: "https://images.unsplash.com/photo-1724556295135-ff92b9aa0a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5lciUyMGxhbmRzY2FwaW5nJTIwb3V0ZG9vcnxlbnwxfHx8fDE3NjM0OTE0NTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Gardening & Landscaping",
    description: "Transform your outdoor space"
  },
  {
    url: "https://images.unsplash.com/photo-1671179517648-0e4e6ddd3ea7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNoYW5pYyUyMHJlcGFpciUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjM0OTE0NTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Repair & Maintenance",
    description: "Quick fixes by professionals"
  },
  {
    url: "https://images.unsplash.com/photo-1692166567037-4009225486ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXIlMjBidWlsZGluZ3xlbnwxfHx8fDE3NjM0MDQ3Njh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Construction Services",
    description: "Building your dreams together"
  },
  {
    url: "https://images.unsplash.com/photo-1760827797819-4361cd5cd353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBjbGVhbmluZyUyMHNlcnZpY2V8ZW58MXx8fHwxNzYzNDkwNDA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Professional Cleaning",
    description: "Spotless results guaranteed"
  }
];

export default function HeroImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % categoryImages.length);
        setNextIndex((prev) => (prev + 2) % categoryImages.length);
        setIsTransitioning(false);
      }, 1200); // Half of transition duration for smooth crossfade
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (newIndex: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setNextIndex((newIndex + 1) % categoryImages.length);
      setIsTransitioning(false);
    }, 1200);
  };

  const currentImage = categoryImages[currentIndex];

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Cinematic image layers with Ken Burns effect */}
      <div className="absolute inset-0 w-full h-full">
        {categoryImages.map((image, index) => {
          const isActive = index === currentIndex;
          const isNext = index === nextIndex;
          const shouldShow = isActive || (isNext && isTransitioning);
          
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-[2400ms] ease-in-out ${
                shouldShow ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                zIndex: isActive ? 2 : isNext ? 3 : 1,
              }}
            >
              <div className="relative w-full h-full overflow-hidden">
                {/* Ken Burns cinematic zoom with rotation */}
                <div 
                  className="w-full h-full"
                  style={{
                    transform: shouldShow ? 'scale(1.15) rotate(0.5deg)' : 'scale(1) rotate(0deg)',
                    transition: 'transform 6000ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <ImageWithFallback
                    src={image.url}
                    alt={image.category}
                    className="w-full h-full object-cover"
                    style={{
                      filter: isTransitioning && isNext ? 'blur(0px)' : isTransitioning && isActive ? 'blur(2px)' : 'blur(0px)',
                      transition: 'filter 1200ms ease-in-out',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dark blue overlay with animated gradient */}
      <div 
        className="absolute inset-0 z-10 transition-all duration-1000"
        style={{
          background: 'linear-gradient(90deg, rgba(0,30,60,0.75) 0%, rgba(0,40,80,0.65) 50%, rgba(0,50,100,0.5) 100%)',
          opacity: isTransitioning ? 0.85 : 1,
        }}
      />
      
      {/* Deep blue color overlay with pulse effect */}
      <div 
        className="absolute inset-0 z-10 transition-opacity duration-1000"
        style={{
          background: 'linear-gradient(135deg, rgba(0,61,130,0.5) 0%, rgba(0,45,90,0.4) 50%, rgba(0,30,60,0.35) 100%)',
          opacity: isTransitioning ? 0.7 : 1,
        }}
      />

      {/* Decorative geometric elements with fluid animation */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        {/* Top right accent */}
        <div 
          className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#FE8A0F]/10 to-transparent rounded-bl-full transition-all duration-[1500ms] ease-out"
          style={{
            transform: isTransitioning ? 'scale(1.15) rotate(8deg)' : 'scale(1) rotate(0deg)',
            opacity: isTransitioning ? 0.6 : 1,
          }}
        />
        
        {/* Bottom left accent */}
        <div 
          className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-[#003D82]/10 to-transparent rounded-tr-full transition-all duration-[1500ms] ease-out"
          style={{
            transform: isTransitioning ? 'scale(1.15) rotate(-8deg)' : 'scale(1) rotate(0deg)',
            opacity: isTransitioning ? 0.6 : 1,
          }}
        />
        
        {/* Floating circles with organic motion */}
        <div 
          className="absolute top-[20%] right-[15%] w-[120px] h-[120px] border-2 border-white/30 rounded-full transition-all duration-[1200ms] ease-out"
          style={{
            transform: isTransitioning ? 'scale(1.3) translate(-10px, 10px)' : 'scale(1) translate(0, 0)',
            opacity: isTransitioning ? 0.3 : 1,
          }}
        />
        <div 
          className="absolute bottom-[25%] right-[8%] w-[80px] h-[80px] border-2 border-[#FE8A0F]/20 rounded-full transition-all duration-[1200ms] ease-out delay-75"
          style={{
            transform: isTransitioning ? 'scale(1.4) translate(10px, -10px)' : 'scale(1) translate(0, 0)',
            opacity: isTransitioning ? 0.3 : 1,
          }}
        />
      </div>

      {/* Minimalist navigation dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-1.5">
        {categoryImages.map((_, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(index)}
            disabled={isTransitioning}
            className={`transition-all duration-500 rounded-full ${
              index === currentIndex 
                ? 'w-6 h-1.5 bg-white' 
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
            } disabled:cursor-not-allowed`}
            aria-label={`Go to ${categoryImages[index].category}`}
          />
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
