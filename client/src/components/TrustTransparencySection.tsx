import { ShieldCheck, CreditCard, Medal } from "lucide-react";
import FloatingShapesBackground from "./FloatingShapesBackground";
import { useRef, useState, useEffect } from "react";

export default function TrustTransparencySection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const features = [
    {
      icon: ShieldCheck,
      title: "Verified Professionals",
      description: "Background-checked and certified tradespeople only.",
      iconColor: "text-[#FE8A0F]",
      borderColor: "border-[#FE8A0F]"
    },
    {
      icon: CreditCard,
      title: "Milestone Payments",
      description: "Pay only when work milestones are completed.",
      iconColor: "text-[#FE8A0F]",
      borderColor: "border-[#FE8A0F]"
    },
    {
      icon: Medal,
      title: "Transparent Price",
      description: "Clear pricing and payment structure from start to finish.",
      iconColor: "text-[#FE8A0F]",
      borderColor: "border-[#FE8A0F]"
    }
  ];

  // Track scroll position to update dots
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.75 + 24; // 75% card width + 24px gap
      const index = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(index);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCard = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const cardWidth = container.offsetWidth * 0.75 + 24; // 75% card width + 24px gap
    container.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
  };

  return (
    <section className="w-full bg-[#f0f0f0] pt-2 md:pt-3 pb-16 md:pb-20 relative overflow-hidden">
      {/* Floating Shapes Background */}
      <FloatingShapesBackground />
      
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="font-['Roboto',sans-serif] text-[24px] md:text-[42px] lg:text-[48px] mb-2 md:mb-4">
            <span className="text-[#2c353f]">Built for </span>
            <span className="text-[#FE8A0F]">Trust</span>
            <span className="text-[#2c353f]\"> & </span>
            <span className="text-[#FE8A0F]">Transparency</span>
          </h2>
          <p className="font-['Roboto',sans-serif] text-[14px] md:text-[18px] text-[#5b5b5b]">
            Your peace of mind is our{" "}
            <span className="text-[#FE8A0F]">priority</span>.
          </p>
        </div>

        {/* Mobile Slider */}
        <div className="md:hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 px-[12.5%]"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="flex-shrink-0 w-[75%] snap-center"
                >
                  <div className="bg-white rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] h-full">
                    {/* Icon with Circle Border */}
                    <div className="flex justify-center mb-4">
                      <div className={`w-14 h-14 rounded-full border-2 ${feature.borderColor} flex items-center justify-center bg-white`}>
                        <IconComponent className={`w-7 h-7 ${feature.iconColor}`} strokeWidth={1.8} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] text-center mb-2">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] text-center leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToCard(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === index 
                    ? 'w-6 bg-[#FE8A0F]' 
                    : 'w-2 bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid - Original */}
        <div className="hidden md:grid grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon with Circle Border */}
                <div className="flex justify-center mb-6">
                  <div className={`w-20 h-20 rounded-full border-2 ${feature.borderColor} flex items-center justify-center bg-white hover:bg-opacity-5 transition-all duration-300`}>
                    <IconComponent className={`w-10 h-10 ${feature.iconColor}`} strokeWidth={1.8} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-['Roboto',sans-serif] text-[20px] md:text-[22px] text-[#2c353f] text-center mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="font-['Roboto',sans-serif] text-[14px] md:text-[15px] text-[#6b6b6b] text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}