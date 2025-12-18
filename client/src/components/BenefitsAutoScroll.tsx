import { Check, Clock } from "lucide-react";

export default function BenefitsAutoScroll() {
  const benefits = [
    {
      icon: <Check className="w-5 h-5 text-[#10B981]" strokeWidth={3} />,
      bgColor: "bg-[#D1FAE5]",
      text: (
        <span className="font-['Poppins',sans-serif] text-[14px] whitespace-nowrap">
          <span className="text-[#FE8A0F] font-medium">Free</span>
          <span className="text-[#6B7280]"> to post</span>
        </span>
      )
    },
    {
      icon: <Clock className="w-5 h-5 text-[#3B82F6]" strokeWidth={2} />,
      bgColor: "bg-[#DBEAFE]",
      text: (
        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6B7280] whitespace-nowrap">
          Quotes in <span className="text-[#FE8A0F] font-medium">24hrs</span>
        </span>
      )
    },
    {
      icon: <Check className="w-5 h-5 text-[#FE8A0F]" strokeWidth={3} />,
      bgColor: "bg-[#FEF3E2]",
      text: (
        <span className="font-['Poppins',sans-serif] text-[14px] whitespace-nowrap">
          <span className="text-[#FE8A0F] font-medium">Verified</span>
          <span className="text-[#6B7280]"> pros only</span>
        </span>
      )
    }
  ];

  return (
    <div className="md:hidden overflow-hidden py-6 relative">
      <div className="benefits-auto-scroll flex gap-6">
        {/* First set */}
        <div className="flex gap-6 shrink-0">
          {benefits.map((benefit, index) => (
            <div key={`first-${index}`} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full ${benefit.bgColor} flex items-center justify-center shrink-0`}>
                {benefit.icon}
              </div>
              <div>{benefit.text}</div>
            </div>
          ))}
        </div>

        {/* Second set (duplicate for seamless loop) */}
        <div className="flex gap-6 shrink-0">
          {benefits.map((benefit, index) => (
            <div key={`second-${index}`} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full ${benefit.bgColor} flex items-center justify-center shrink-0`}>
                {benefit.icon}
              </div>
              <div>{benefit.text}</div>
            </div>
          ))}
        </div>

        {/* Third set (for smooth continuation) */}
        <div className="flex gap-6 shrink-0">
          {benefits.map((benefit, index) => (
            <div key={`third-${index}`} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full ${benefit.bgColor} flex items-center justify-center shrink-0`}>
                {benefit.icon}
              </div>
              <div>{benefit.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
