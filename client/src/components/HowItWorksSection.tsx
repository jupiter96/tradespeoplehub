import imgProfile2 from "figma:asset/0980bfd64c81584e7347191b955bcd26c6dd5821.png";
import imgChecklist1 from "figma:asset/dd6fe2ef1a03984d604a84733ad3fc028f219515.png";
import imgBook1 from "figma:asset/46588005695464b7def72a24e7bb7c324232fb8e.png";

interface StepCardProps {
  number: string;
  icon: string;
  title: string;
  description: string;
}

function StepCard({ number, icon, title, description }: StepCardProps) {
  return (
    <div className="flex flex-col items-start relative">
      {/* Large number background */}
      <div className="relative mb-8">
        <p className="font-['Poppins:Black',sans-serif] text-[#e1eeff] text-[96px] leading-none select-none">
          {number}
        </p>
        {/* Icon overlay */}
        <div className="absolute left-0 top-[64px] w-[45px] h-[45px]">
          <img 
            alt="" 
            className="w-full h-full object-cover" 
            src={icon} 
          />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-['Poppins:Bold',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.24] mb-4">
        {title}
      </h3>

      {/* Description */}
      <p className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.24]">
        {description}
      </p>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section className="w-full bg-white py-16 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Section Title */}
        <h2 className="font-['Poppins:Bold',sans-serif] text-[#2c353f] text-[24px] text-center mb-16">
          How it works
        </h2>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-12">
          <StepCard
            number="01"
            icon={imgProfile2}
            title="Browse & Search"
            description="Explore a wide range of services by browsing categories, using search keywords, and applying filters to find the perfect match for your needs. Compare PRO gigs and pricing to make an informed decision."
          />
          <StepCard
            number="02"
            icon={imgChecklist1}
            title="Place Your Order"
            description="Choose a service package that meets your needs or request a custom offer tailored to your need. Need more details? Chat with the professional before placing your order to ensure everything aligns."
          />
          <StepCard
            number="03"
            icon={imgBook1}
            title="Review & Approve"
            description="Once the work is delivered, review it carefully. If adjustments are needed, request revisions. When satisfied, approve the order and leave feedback to help others make informed decisions."
          />
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <button className="bg-[#fe8a0f] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 rounded-[20px] px-8 py-3 cursor-pointer">
            <span className="font-['Poppins:Regular',sans-serif] text-[15px] text-white">
              Order Now
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
