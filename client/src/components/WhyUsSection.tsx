import { 
  Wallet, 
  RefreshCw, 
  FolderOpen, 
  MessageCircle, 
  Package, 
  Zap, 
  CreditCard, 
  Rocket 
} from "lucide-react";

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <div className="bg-white rounded-[10px] shadow-[0px_14px_18px_0px_#ecf0f5] p-6 hover:shadow-[0px_20px_30px_0px_rgba(236,240,245,0.8)] transition-all duration-300">
      <div className="bg-[#ecf4ff] rounded-[10px] w-[66px] h-[66px] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-[#2c353f] mb-2">{title}</h3>
      <p className="text-[#5b5b5b] text-[14px] leading-[20px]">{description}</p>
    </div>
  );
}

export default function WhyUsSection() {
  const benefits = [
    {
      icon: <Wallet className="w-8 h-8 text-[#3D78CB]" />,
      title: "No More Paying for Leads",
      description: "No more paying to access customer contact details or quote on jobs that often don't result in sales. Simply list your services once and let customers come to you instead."
    },
    {
      icon: <RefreshCw className="w-8 h-8 text-[#FE8A0F]" />,
      title: "One-Off Listing, Thousands of Orders",
      description: "Once you list your services, your gig stays live and accessible to clients 24/7, potentially attracting thousands of orders over time."
    },
    {
      icon: <FolderOpen className="w-8 h-8 text-[#3D78CB]" />,
      title: "Portfolio Building",
      description: "Your profile with completed projects and positive reviews acts as a portfolio, helping you attract more clients."
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-[#FE8A0F]" />,
      title: "No Need for Cold Pitching",
      description: "Unlike traditional platforms, clients come to you instead of you having to send proposals and bids."
    },
    {
      icon: <Package className="w-8 h-8 text-[#3D78CB]" />,
      title: "Custom Offers & Packages",
      description: "You can negotiate prices and create customized services for clients who need something different from your standard offerings."
    },
    {
      icon: <Zap className="w-8 h-8 text-[#FE8A0F]" />,
      title: "Automation & Convenience",
      description: "Set up FAQs, delivery times, and predefined packages to minimize back-and-forth communication."
    },
    {
      icon: <CreditCard className="w-8 h-8 text-[#3D78CB]" />,
      title: "No Need to Chase Payments",
      description: "We ensure clients pay upfront, reducing the risk of non-payment."
    },
    {
      icon: <Rocket className="w-8 h-8 text-[#FE8A0F]" />,
      title: "Quick Start for Beginners",
      description: "No need to have an established business or website—just create a profile and start selling your services."
    }
  ];

  return (
    <div className="w-full">
      <h2 className="font-['Roboto:Bold',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] lg:text-[36px] text-center mb-8 md:mb-12 px-4">
        Why You Should Join Us
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {benefits.map((benefit, index) => (
          <BenefitCard
            key={index}
            icon={benefit.icon}
            title={benefit.title}
            description={benefit.description}
          />
        ))}
      </div>
    </div>
  );
}
