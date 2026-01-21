import { CheckCircle2, Shield, Clock, CreditCard, Award } from "lucide-react";

export default function CategorySection() {
  const taglines = [
    { id: 1, name: "Transparent Price", icon: CheckCircle2 },
    { id: 2, name: "Satisfaction Guarantee", icon: Shield },
    { id: 3, name: "Delivers in 2 days", icon: Clock },
    { id: 4, name: "Milestone Payment", icon: CreditCard },
    { id: 5, name: "Verified Professionals", icon: Award },
  ];

  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-3 w-full px-4">
      {taglines.map((tagline) => {
        const IconComponent = tagline.icon;
        return (
          <button
            key={tagline.id}
            className="flex items-center gap-3 bg-[rgba(182,212,255,0.2)] hover:bg-[rgba(182,212,255,0.35)] transition-colors rounded-[30px] px-4 py-2 min-h-[60px] w-full md:w-auto group cursor-pointer"
          >
            <div className="flex items-center justify-center size-[45px] bg-white rounded-full shrink-0">
              <IconComponent className="w-6 h-6 text-[#3D78CB]" />
            </div>
            <span className="font-['Poppins',sans-serif] text-[14px] text-[#5b5b5b] group-hover:text-[#3D78CB] transition-colors whitespace-nowrap">
              {tagline.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
