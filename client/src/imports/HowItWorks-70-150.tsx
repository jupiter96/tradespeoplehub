import imgProfile2 from "figma:asset/0980bfd64c81584e7347191b955bcd26c6dd5821.png";
import imgChecklist1 from "figma:asset/dd6fe2ef1a03984d604a84733ad3fc028f219515.png";
import imgBook1 from "figma:asset/46588005695464b7def72a24e7bb7c324232fb8e.png";

function Component() {
  return (
    <div className="absolute contents left-0 top-[101px]" data-name="01">
      <p className="absolute font-['Poppins:Bold',sans-serif] h-[36px] leading-[1.24] left-[2px] not-italic text-[#5b5b5b] text-[14px] top-[232px] w-[212px]">{`Browse & Search`}</p>
      <p className="absolute font-['Poppins:Regular',sans-serif] h-[97px] leading-[1.24] left-[2px] not-italic text-[#5b5b5b] text-[14px] top-[270px] w-[349px]">Explore a wide range of services by browsing categories, using search keywords, and applying filters to find the perfect match for your needs. Compare PRO gigs and pricing to make an informed decision.</p>
      <p className="absolute font-['Poppins:Black',sans-serif] leading-[normal] left-[70px] not-italic text-[#e1eeff] text-[96px] text-center text-nowrap top-[101px] translate-x-[-50%] whitespace-pre">01</p>
      <div className="absolute left-0 size-[45px] top-[165px]" data-name="Profile 2">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgProfile2} />
      </div>
    </div>
  );
}

function Component1() {
  return (
    <div className="absolute contents left-[386px] top-[101px]" data-name="02">
      <p className="absolute font-['Poppins:Bold',sans-serif] h-[36px] leading-[1.24] left-[386px] not-italic text-[#5b5b5b] text-[14px] top-[232px] w-[212px]">Place Your Order</p>
      <p className="absolute font-['Poppins:Regular',sans-serif] h-[97px] leading-[1.24] left-[386px] not-italic text-[#5b5b5b] text-[14px] top-[270px] w-[355px]">Choose a service package that meets your needs or request a custom offer tailored to your need. Need more details? Chat with the professional before placing your order to ensure everything aligns.</p>
      <p className="absolute font-['Poppins:Black',sans-serif] leading-[normal] left-[454px] not-italic text-[#e1eeff] text-[96px] text-center text-nowrap top-[101px] translate-x-[-50%] whitespace-pre">02</p>
      <div className="absolute left-[386px] size-[45px] top-[165px]" data-name="checklist 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgChecklist1} />
      </div>
    </div>
  );
}

function Component2() {
  return (
    <div className="absolute contents left-[770px] top-[101px]" data-name="03">
      <p className="absolute font-['Poppins:Bold',sans-serif] h-[36px] leading-[1.24] left-[770px] not-italic text-[#5b5b5b] text-[14px] top-[232px] w-[212px]">{`Review & Approve`}</p>
      <p className="absolute font-['Poppins:Regular',sans-serif] h-[97px] leading-[1.24] left-[770px] not-italic text-[#5b5b5b] text-[14px] top-[270px] w-[349px]">Once the work is delivered, review it carefully. If adjustments are needed, request revisions. When satisfied, approve the order and leave feedback to help others make informed decisions.</p>
      <p className="absolute font-['Poppins:Black',sans-serif] leading-[normal] left-[841.5px] not-italic text-[#e1eeff] text-[96px] text-center text-nowrap top-[101px] translate-x-[-50%] whitespace-pre">03</p>
      <div className="absolute left-[770px] size-[43px] top-[173px]" data-name="Book 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgBook1} />
      </div>
    </div>
  );
}

function Cta() {
  return (
    <div className="absolute contents left-[calc(50%-0.1px)] top-0 translate-x-[-50%]" data-name="CTA">
      <div className="absolute bg-[#fe8a0f] bottom-0 left-[9.54%] right-[9.67%] rounded-[20px] top-0" />
      <p className="absolute font-['Poppins:Regular',sans-serif] leading-[normal] left-[78.5px] not-italic text-[15px] text-center text-white top-[9px] translate-x-[-50%] w-[111px]">Order Now</p>
    </div>
  );
}

function Cta1() {
  return (
    <div className="absolute h-[40px] left-[calc(50%+0.1px)] top-[436px] translate-x-[-50%] w-[157.201px]" data-name="CTA">
      <Cta />
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="relative size-full" data-name="How it works">
      <p className="absolute font-['Poppins:Bold',sans-serif] leading-none left-[calc(50%+0.5px)] not-italic text-[#2c353f] text-[24px] text-center text-nowrap top-[45px] translate-x-[-50%] whitespace-pre">How it works</p>
      <Component />
      <Component1 />
      <Component2 />
      <Cta1 />
    </div>
  );
}