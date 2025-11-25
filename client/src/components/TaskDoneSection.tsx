import svgPaths from "../imports/svg-a02ghvc8b7";
import { Receipt, CreditCard, ShieldCheck } from 'lucide-react';

// Icon Components
function PricingIcon() {
  return (
    <div className="relative w-[70px] h-[70px] flex items-center justify-center">
      <div className="absolute w-[60px] h-[60px] rounded-full bg-[#3D78CB]/10 flex items-center justify-center">
        <Receipt className="w-[32px] h-[32px] text-[#3D78CB]" strokeWidth={2} />
      </div>
      <div className="absolute top-0 right-0 w-[26px] h-[26px] rounded-full bg-[#FE8A0F]/20 flex items-center justify-center">
        <div className="w-[18px] h-[18px] rounded-full bg-[#FE8A0F] flex items-center justify-center">
          <span className="text-white text-[11px]">$</span>
        </div>
      </div>
    </div>
  );
}

function PaymentIcon() {
  return (
    <div className="relative w-[70px] h-[70px] flex items-center justify-center">
      <div className="absolute w-[60px] h-[60px] rounded-full bg-[#3D78CB]/10 flex items-center justify-center">
        <CreditCard className="w-[32px] h-[32px] text-[#3D78CB]" strokeWidth={2} />
      </div>
      <div className="absolute top-0 right-0 w-[26px] h-[26px] rounded-full bg-[#FE8A0F]/20 flex items-center justify-center">
        <div className="w-[18px] h-[18px] rounded-full bg-[#FE8A0F] flex items-center justify-center">
          <svg className="w-[12px] h-[12px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function GuaranteeIcon() {
  return (
    <div className="relative w-[70px] h-[70px] flex items-center justify-center">
      <div className="absolute w-[60px] h-[60px] rounded-full bg-[#3D78CB]/10 flex items-center justify-center">
        <ShieldCheck className="w-[32px] h-[32px] text-[#3D78CB]" strokeWidth={2} />
      </div>
      <div className="absolute top-0 right-0 w-[26px] h-[26px] rounded-full bg-[#FE8A0F]/20 flex items-center justify-center">
        <div className="w-[18px] h-[18px] rounded-full bg-[#FE8A0F] flex items-center justify-center">
          <svg className="w-[10px] h-[10px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function TaskDoneSection() {
  return (
    <div className="relative w-full overflow-hidden bg-[#FAFCFF] py-20 md:py-32">
      {/* Top Curve */}
      <div className="absolute top-0 left-0 right-0 h-[60px] md:h-[100px] overflow-hidden">
        <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 100">
          <path d="M0,0 L1440,0 L1440,100 Q720,20 0,100 Z" fill="#f0f0f0" />
        </svg>
      </div>
      
      {/* Background */}
      <div className="absolute top-[60px] md:top-[100px] bottom-[60px] md:bottom-[100px] left-0 right-0 bg-[#FAFCFF]" />
      
      {/* Bottom Curve */}
      <div className="absolute bottom-0 left-0 right-0 h-[60px] md:h-[100px] overflow-hidden">
        <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 100">
          <path d="M0,0 Q720,80 1440,0 L1440,100 L0,100 Z" fill="#f0f0f0" />
        </svg>
      </div>

      {/* Decorative Elements */}
      <div className="absolute left-4 md:left-12 top-24 md:top-32 w-[44px] h-[23px] opacity-50 md:opacity-100 z-10">
        <div className="rotate-[180deg]">
          <svg className="block size-full" fill="none" viewBox="0 0 46 25">
            <path d={svgPaths.p27458200} stroke="#FE8A0F" strokeOpacity="0.2" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <div className="absolute right-8 md:right-20 top-1/2 w-[122.5px] h-[59.304px] hidden md:block z-10">
        <div className="rotate-[180deg] scale-y-[-100%]">
          <svg className="block size-full" fill="none" viewBox="0 0 129 66">
            <path d={svgPaths.p16d29000} stroke="#FE8A0F" strokeOpacity="0.2" strokeWidth="8" />
          </svg>
        </div>
      </div>

      <div className="absolute left-0 md:left-8 top-48 md:top-56 font-extrabold text-[48px] text-[rgba(254,138,15,0.2)] leading-[0.36] tracking-[8.16px] hidden md:block z-10">
        <p className="mb-0">...</p>
        <p className="mb-0">...</p>
        <p className="mb-0">...</p>
        <p className="mb-0">...</p>
        <p className="mb-0">...</p>
        <p className="mb-0">...</p>
        <p className="mb-0">...</p>
      </div>

      <div className="relative max-w-[1000px] mx-auto px-4 md:px-6 z-10">
        {/* Title */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[20px] md:text-[24px] mb-0 leading-tight">
            Task Done,
          </h2>
          <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[20px] md:text-[24px] leading-tight">
            Quickly & Transparently
          </h2>
        </div>

        {/* Description */}
        <p className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px] md:text-[16px] text-center leading-[1.24] mb-12 md:mb-16 max-w-[568px] mx-auto">
          Discover the most efficient way to hire top-rated professionals for any task—whether it's around the home, for your business, or specialised services like driving instruction or legal support.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-8 md:mb-12">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center h-[70px]">
              <PricingIcon />
            </div>
            <h3 className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px] mb-3 leading-[1.24]">
              Clear & Transparent Pricing
            </h3>
            <p className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.6] min-h-[68px]">
              No hidden fees—just straightforward, upfront pricing to help you stay on budget.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center h-[70px]">
              <PaymentIcon />
            </div>
            <h3 className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px] mb-3 leading-[1.24]">
              Flexible Payment Options
            </h3>
            <p className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.6] min-h-[68px]">
              Per-service, hourly, or square metre rates—choose what works best for your budget.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center h-[70px]">
              <GuaranteeIcon />
            </div>
            <h3 className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px] mb-3 leading-[1.24]">
              Money Back Guarantee
            </h3>
            <p className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.6] min-h-[68px]">
              Order with confidence—satisfaction guaranteed with refunds for non-delivery.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="font-['Poppins',sans-serif] text-[#9c9c9c] text-[13px] md:text-[14px] text-center leading-[1.24] mb-8 max-w-[696px] mx-auto">
          *Order confidently with a satisfaction guarantee and refunds for non-delivery.*
        </p>

        {/* CTA Button */}
        <div className="flex justify-center">
          <button className="bg-[#fe8a0f] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white px-8 py-3 rounded-[20px] font-['Poppins',sans-serif] text-[15px] transition-all duration-300 cursor-pointer">
            Order Pro Now!
          </button>
        </div>
      </div>
    </div>
  );
}
