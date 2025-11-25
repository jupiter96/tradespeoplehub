import svgPaths from "../imports/svg-wmm88gheyb";
import imgFilter1 from "figma:asset/fd9129499c9c9a681a5a7faf0843ea90742e29c4.png";
import Group18 from "../imports/Group18";

// Icon Components
function FilterIcon() {
  return (
    <div className="w-12 h-12 flex-shrink-0">
      <img alt="" className="w-full h-full object-cover" src={imgFilter1} />
    </div>
  );
}

function ReviewIcon() {
  return (
    <div className="w-12 h-12 flex-shrink-0">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
        <g clipPath="url(#clip0_72_102)">
          <path d={svgPaths.p1462c000} fill="#3D78CB" />
          <path d={svgPaths.p2a3ae880} fill="#FE8A0F" />
        </g>
        <defs>
          <clipPath id="clip0_72_102">
            <rect fill="white" height="48" width="48" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function PortfolioIcon() {
  return (
    <div className="w-12 h-12 flex-shrink-0">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 42 39">
        <g>
          <path d={svgPaths.p1c1cad00} fill="#3D78CB" />
          <path d={svgPaths.p3924a00} fill="#FE8A0F" />
        </g>
      </svg>
    </div>
  );
}

function CommunicationIcon() {
  return (
    <div className="w-12 h-12 flex-shrink-0">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 49 49">
        <g>
          <path d={svgPaths.p2ac3fc80} fill="#3D78CB" />
          <path d={svgPaths.p3df03200} fill="#FE8A0F" />
        </g>
      </svg>
    </div>
  );
}

function CustomOffersIcon() {
  return (
    <div className="w-12 h-12 flex-shrink-0">
      <Group18 />
    </div>
  );
}

function EnhancementsIcon() {
  return (
    <div className="w-14 h-14 flex-shrink-0">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 55 55">
        <g clipPath="url(#clip0_72_94)">
          <path d={svgPaths.p17d76100} fill="#FE8A0F" />
          <path d={svgPaths.p1506ce00} fill="#FE8A0F" />
          <path d={svgPaths.p93bd900} fill="#FE8A0F" />
          <path d={svgPaths.p20fce400} fill="#E77802" />
          <path d={svgPaths.p172ac780} fill="#FE8A0F" />
          <path d={svgPaths.p1f0fb180} fill="#3D78CB" />
        </g>
        <defs>
          <clipPath id="clip0_72_94">
            <rect fill="white" height="55" width="55" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

interface TipCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function TipCard({ icon, title, description }: TipCardProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-[#5b5b5b]">{title}</h3>
      <p className="text-[#5b5b5b] leading-[1.24]">{description}</p>
    </div>
  );
}

export default function TipsForSuccessSection() {
  const tips = [
    {
      icon: <FilterIcon />,
      title: "Use Filters and Search Smartly",
      description: "We offers a search feature with filters, allowing you to narrow down results based on service type, pricing, delivery time, and freelancer ratings. This can help you find the best match for your budget and project requirements."
    },
    {
      icon: <ReviewIcon />,
      title: "Read Reviews",
      description: "Take time to read reviews from previous clients. Pay attention to the feedback related to the quality of the work, communication, and meeting deadlines."
    },
    {
      icon: <PortfolioIcon />,
      title: "Check Portfolios",
      description: "Review the freelancer's portfolio to get a sense of their style and expertise. This will help you understand if their previous work aligns with your vision."
    },
    {
      icon: <CommunicationIcon />,
      title: "Communication",
      description: "Message Pros to clarify details before ordering to align on project expectations confidently."
    },
    {
      icon: <CustomOffersIcon />,
      title: "Custom Offers",
      description: "Request custom offers for a Gig tailored to your specific needs."
    },
    {
      icon: <EnhancementsIcon />,
      title: "Order Enhancements",
      description: "Explore extras, like fast delivery or additional service, to make your order even better."
    }
  ];

  return (
    <section className="w-full bg-white py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-[#2c353f] mb-4">Tips for Success on Our Platform</h2>
          <p className="text-[#5b5b5b] max-w-[568px] mx-auto">
            Here's how to make the most of your search:
          </p>
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {tips.map((tip, index) => (
            <TipCard
              key={index}
              icon={tip.icon}
              title={tip.title}
              description={tip.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
