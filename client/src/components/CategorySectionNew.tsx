import { useNavigate } from "react-router-dom";
import { useRef } from "react";

const quickCategories = [
  {
    id: 1,
    name: "Loft Conversion",
    emoji: "🏠",
    path: "/sector/home-garden",
    bgColor: "#FFF4E6"
  },
  {
    id: 2,
    name: "Heating Engineers",
    emoji: "🔥",
    path: "/sector/home-garden",
    bgColor: "#FFE8CC"
  },
  {
    id: 3,
    name: "Other Storage",
    emoji: "📦",
    path: "/sector/home-garden",
    bgColor: "#FFF0DB"
  },
  {
    id: 4,
    name: "Bathroom Designer",
    emoji: "🛁",
    path: "/sector/home-garden",
    bgColor: "#FFECD1"
  },
  {
    id: 5,
    name: "Bathroom Repair",
    emoji: "🔧",
    path: "/sector/home-garden",
    bgColor: "#FFE8C2"
  },
  {
    id: 6,
    name: "Interior Painting",
    emoji: "🎨",
    path: "/sector/home-garden",
    bgColor: "#FFF2DD"
  },
  {
    id: 7,
    name: "Electrician",
    emoji: "⚡",
    path: "/sector/home-garden",
    bgColor: "#FFEDD4"
  },
  {
    id: 8,
    name: "Handyman",
    emoji: "🔨",
    path: "/sector/home-garden",
    bgColor: "#FFF1DA"
  },
  {
    id: 9,
    name: "Photography",
    emoji: "📷",
    path: "/sector/photography",
    bgColor: "#FFEFD8"
  },
  {
    id: 10,
    name: "Wedding Planning",
    emoji: "💒",
    path: "/sector/wedding-events",
    bgColor: "#FFE6BF"
  }
];

const mainCategories = [
  {
    id: 1,
    name: "Home & Garden",
    emoji: "🏠",
    path: "/sector/home-garden",
    count: "2,450+ services",
    color: "#4F46E5"
  },
  {
    id: 2,
    name: "Wedding & Events",
    emoji: "💒",
    path: "/sector/wedding-events",
    count: "1,820+ services",
    color: "#EC4899"
  },
  {
    id: 3,
    name: "Business Services",
    emoji: "💼",
    path: "/sector/business-services",
    count: "3,150+ services",
    color: "#8B5CF6"
  },
  {
    id: 4,
    name: "Automotive",
    emoji: "🚗",
    path: "/sector/automotive",
    count: "1,340+ services",
    color: "#EF4444"
  },
  {
    id: 5,
    name: "Education",
    emoji: "🎓",
    path: "/sector/education-training",
    count: "980+ services",
    color: "#F59E0B"
  },
  {
    id: 6,
    name: "Technology",
    emoji: "💻",
    path: "/sector/technology",
    count: "2,890+ services",
    color: "#06B6D4"
  },
  {
    id: 7,
    name: "Repairs & Maintenance",
    emoji: "🔧",
    path: "/sector/repairs-assembly",
    count: "1,750+ services",
    color: "#10B981"
  },
  {
    id: 8,
    name: "Photography & Video",
    emoji: "📷",
    path: "/sector/photography",
    count: "1,230+ services",
    color: "#A855F7"
  }
];

export default function CategorySectionNew() {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full px-4 md:px-6 bg-white pb-0">
      <div className="max-w-[1400px] mx-auto">
        {/* Quick Access Categories - Horizontal Scroll */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-0">
          <div className="relative">
            {/* Scroll Left Button */}
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Scroll Right Button */}
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Scrollable Container */}
            <div 
              ref={scrollContainerRef}
              className="overflow-x-auto scrollbar-hide"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="flex gap-3 pb-2">
                {quickCategories.map((category) => {
                  return (
                    <button
                      key={category.id}
                      onClick={() => navigate(category.path)}
                      className="group flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-200 hover:shadow-md border border-orange-200"
                      style={{ backgroundColor: category.bgColor }}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg">
                        <span className="text-[32px]">{category.emoji}</span>
                      </div>
                      <span className="text-gray-800 font-['Roboto',sans-serif] font-medium text-[14px] whitespace-nowrap">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>


      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
