import imgProfile2 from "figma:asset/bfc01ea5c03a091e73d461f3681a71e684945f27.png";
import imgChecklist1 from "figma:asset/dd6b7ad36bfc9ef5f2da8fc39b0baee836560c6c.png";
import imgBook1 from "figma:asset/2fa508abd8bc61df185ff4ce820134445a5b35b5.png";
import imgPayment2 from "figma:asset/6b805fdfa5d668a5a60fc3360ae7753813961bf5.png";

function Cta() {
  return (
    <div className="flex justify-center mt-8">
      <button className="bg-[#fe8a0f] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 rounded-[20px] px-8 py-3 text-white text-[15px] cursor-pointer">
        Sell your service now!
      </button>
    </div>
  );
}

function Component() {
  return (
    <div className="flex flex-col items-start" data-name="01">
      <p className="font-['Roboto:Black',sans-serif] text-[#B8D4EB] text-[64px] md:text-[80px] lg:text-[96px] text-center mb-[-10px] md:mb-[-15px] lg:mb-[-20px]">01</p>
      <div className="size-[40px] md:size-[45px] mb-3 md:mb-4" data-name="Profile 2">
        <img alt="" className="max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgProfile2} />
      </div>
      <p className="font-['Roboto:Bold',sans-serif] text-[#5b5b5b] text-[14px] md:text-[15px] mb-2">Create Your Profile</p>
      <p className="font-['Roboto:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.5] max-w-full">Sign up and set up your professional profile. Showcase your skills, experience, and the services you offer.</p>
    </div>
  );
}

function Component1() {
  return (
    <div className="flex flex-col items-start" data-name="02">
      <p className="font-['Roboto:Black',sans-serif] text-[#B8D4EB] text-[64px] md:text-[80px] lg:text-[96px] text-center mb-[-10px] md:mb-[-15px] lg:mb-[-20px]">02</p>
      <div className="h-[40px] md:h-[45px] w-[30px] md:w-[34px] mb-3 md:mb-4" data-name="checklist 1">
        <img alt="" className="max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgChecklist1} />
      </div>
      <p className="font-['Roboto:Bold',sans-serif] text-[#5b5b5b] text-[14px] md:text-[15px] mb-2">List Your Services</p>
      <p className="font-['Roboto:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.5] max-w-full">Add detailed descriptions of the services you provide, along with pricing and availability. Make sure to highlight what makes your offering unique!</p>
    </div>
  );
}

function Component2() {
  return (
    <div className="flex flex-col items-start" data-name="03">
      <p className="font-['Roboto:Black',sans-serif] text-[#B8D4EB] text-[64px] md:text-[80px] lg:text-[96px] text-center mb-[-10px] md:mb-[-15px] lg:mb-[-20px]">03</p>
      <div className="size-[46px] md:size-[53px] mb-3 md:mb-4" data-name="Book 1">
        <img alt="" className="max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgBook1} />
      </div>
      <p className="font-['Roboto:Bold',sans-serif] text-[#5b5b5b] text-[14px] md:text-[15px] mb-2">Get Booked</p>
      <p className="font-['Roboto:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.5] max-w-full">Once your services are listed, clients will find you and book your services directly through the platform.</p>
    </div>
  );
}

function Component3() {
  return (
    <div className="flex flex-col items-start" data-name="04">
      <p className="font-['Roboto:Black',sans-serif] text-[#B8D4EB] text-[64px] md:text-[80px] lg:text-[96px] text-center mb-[-10px] md:mb-[-15px] lg:mb-[-20px]">04</p>
      <div className="size-[46px] md:size-[52px] mb-3 md:mb-4" data-name="Payment 2">
        <img alt="" className="max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgPayment2} />
      </div>
      <p className="font-['Roboto:Bold',sans-serif] text-[#5b5b5b] text-[14px] md:text-[15px] mb-2">Receive Payment</p>
      <p className="font-['Roboto:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.5] max-w-full">After successful delivery, you'll receive payment through our secure payment system. The more you offer, the more you can earn!</p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="w-full py-8 md:py-12" data-name="How it works">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <p className="font-['Roboto:Bold',sans-serif] text-[#2c353f] text-[20px] md:text-[24px] mb-3 md:mb-4 px-4">How it works</p>
        <p className="font-['Roboto:Regular',sans-serif] text-[#5b5b5b] text-[14px] md:text-[16px] leading-[1.5] max-w-[770px] mx-auto px-4">
          We are your go-to platform for selling and buying services, much like Amazon for professionals. Here's how it works:
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-12 px-4 mb-8 max-w-[1200px] mx-auto">
        <Component />
        <Component1 />
        <Component2 />
        <Component3 />
      </div>

      {/* CTA Button */}
      <Cta />
    </div>
  );
}
