import imgGear11 from "figma:asset/4a74865021eb9512b59f5bc11f033af368534062.png";
import imgReward1 from "figma:asset/4ad4c017fbf91e11f444db29743f7a30ca763299.png";
import imgMissionAccomplished1 from "figma:asset/a0d52e41421368b587d5d25694189717343e2473.png";
import imgWalet1 from "figma:asset/5e487abc93ede172b03a538cd75dcefc0440110d.png";
import imgShield61 from "figma:asset/aa5c744503b85acab051f49dd766555a7ab2fa90.png";
import imgQuickResponse1 from "figma:asset/093b46b735fb2f7849e654493d93baad63b06ab7.png";
import imgSolutions1 from "figma:asset/d3ef20f75187a58dc84d379242cc00930b0fe7dd.png";
import imgCustomer1 from "figma:asset/9ad96818ef3777dbb7fdf1d81b6c4cf8f3be25fa.png";
import imgCustomer2 from "figma:asset/c313d07ef25a44718fc787493850afb4fd972533.png";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-[10px] shadow-[0px_14px_18px_0px_#ecf0f5] p-6 flex gap-4 hover:shadow-lg transition-shadow duration-300">
      {/* Icon */}
      <div className="flex-shrink-0 w-[66px] h-[116px] bg-[#ecf4ff] rounded-[10px] flex items-center justify-center">
        <img src={icon} alt="" className="w-[50px] h-[50px] object-contain" />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="font-['Poppins:SemiBold',sans-serif] text-[#5b5b5b] text-[14px] leading-[20px] mb-2">
          {title}
        </h3>
        <p className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[20px]">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function WhyUseUsSection() {
  const features = [
    {
      icon: imgGear11,
      title: "Predefined Services",
      description: "We work on a gig-based model where each PRO lists specific services with clear descriptions and problem that the gig is solving.This ensures you know exactly what to expect in terms of deliverables, which minimises any potential misunderstandings."
    },
    {
      icon: imgReward1,
      title: "Transparent Pricing",
      description: "Our gig-based model offers transparent pricing, so you know the cost of each service upfront. No hidden fees or surprise charges—just clear pricing for the work you want to get done."
    },
    {
      icon: imgMissionAccomplished1,
      title: "Milestones for Large Projects",
      description: "For more extensive projects, you can set milestones (for instance, breaking the work into phases). This ensures you can assess the work as it progresses and make adjustments if needed."
    },
    {
      icon: imgWalet1,
      title: "Affordable Options",
      description: "The platform allows you to find professionals at various price points, making it easier to match your budget with the services you need."
    },
    {
      icon: imgShield61,
      title: "Built-in Trust and Security",
      description: "We handles payments and offers dispute resolution, reducing risks compared to dealing with PROs independently. Payments are made upfront, but the PRO only receives them after the project is completed and approved by you."
    },
    {
      icon: imgQuickResponse1,
      title: "Ease of Communication",
      description: "Our platform includes messaging tools that allow you to communicate directly with PROs to discuss project details, timelines, and revisions."
    },
    {
      icon: imgQuickResponse1,
      title: "Quick Turnaround",
      description: "Many PRO​​s on our platform offer fast delivery times for urgent projects, often within 6 to 48 hours, making it a great platform when you need quick results without compromising quality."
    },
    {
      icon: imgSolutions1,
      title: "Customisable Solution",
      description: "You can find PROs with expertise in niche areas or request custom services tailored to your exact needs. This makes us a great option for both common and highly specific project requirements."
    },
    {
      icon: imgCustomer1,
      title: "Customer Support",
      description: "We offers customer support in case there are any issues or disputes during the project. Our team helps facilitate communication between clients and PROs, ensuring problems are resolved smoothly."
    },
    {
      icon: imgCustomer2,
      title: "Pre-Vetted Professionals",
      description: "Our platform carefully vets and verifies top professionals, ensuring they meet the highest standards of skill, reliability, and professionalism."
    }
  ];

  return (
    <div className="w-full">
      {/* Title */}
      <h2 className="font-['Poppins:Bold',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] text-center mb-12">
        Why you should use us
      </h2>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </div>
  );
}
