import { WhiteCircle, WeddingIcon, AssemblingIcon, HealthIcon, LegalIcon, FashionIcon } from "../components/svg";

function Group2() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute bg-[rgba(182,212,255,0.2)] h-[60px] left-0 rounded-[30px] top-0 w-[216px]" />
      <p className="absolute font-['Poppins:Regular',sans-serif] leading-[0] left-[127.5px] not-italic text-[#5b5b5b] text-[14px] text-center text-nowrap top-[30px] translate-x-[-50%] whitespace-pre">{`Wedding & Events`}</p>
      <WhiteCircle className="absolute left-[8px] top-[7px]" />
      <WeddingIcon className="absolute left-[16px] size-[30px] top-[13px]" />
    </div>
  );
}

function Category() {
  return (
    <div className="absolute contents left-0 top-0" data-name="Category 1">
      <Group2 />
    </div>
  );
}

function Group3() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-0 mt-0 place-items-start relative">
      <div className="[grid-area:1_/_1] bg-[rgba(182,212,255,0.2)] h-[60px] ml-0 mt-0 rounded-[30px] w-[239px]" />
      <p className="[grid-area:1_/_1] font-['Poppins:Regular',sans-serif] ml-[63px] mt-[30px] not-italic relative text-[#5b5b5b] text-[14px] text-nowrap whitespace-pre">{`Assembling & Repairs`}</p>
      <WhiteCircle className="[grid-area:1_/_1] ml-[8px] mt-[7px] relative" />
      <AssemblingIcon className="[grid-area:1_/_1] h-[21px] ml-[13px] mt-[19px] overflow-clip relative w-[36px]" />
    </div>
  );
}

function Category1() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-name="Category 2">
      <Group3 />
    </div>
  );
}

function Group4() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-0 mt-0 place-items-start relative">
      <div className="[grid-area:1_/_1] bg-[rgba(182,212,255,0.2)] h-[60px] ml-0 mt-0 rounded-[30px] w-[219px]" />
      <p className="[grid-area:1_/_1] font-['Poppins:Regular',sans-serif] ml-[63px] mt-[30px] not-italic relative text-[#5b5b5b] text-[14px] text-nowrap whitespace-pre">{`Health & Wellbeing `}</p>
      <WhiteCircle className="[grid-area:1_/_1] ml-[8px] mt-[7px] relative" />
    </div>
  );
}

function Category2() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-name="Category 3">
      <Group4 />
    </div>
  );
}

function Group5() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-0 mt-0 place-items-start relative">
      <div className="[grid-area:1_/_1] bg-[rgba(182,212,255,0.2)] h-[60px] ml-0 mt-0 rounded-[30px] w-[192px]" />
      <p className="[grid-area:1_/_1] font-['Poppins:Regular',sans-serif] ml-[63px] mt-[30px] not-italic relative text-[#5b5b5b] text-[14px] text-nowrap whitespace-pre">{`Legal & Advice`}</p>
      <WhiteCircle className="[grid-area:1_/_1] ml-[8px] mt-[7px] relative" />
    </div>
  );
}

function Category3() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-name="Category 4">
      <Group5 />
    </div>
  );
}

function Group6() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-0 mt-0 place-items-start relative">
      <div className="[grid-area:1_/_1] bg-[rgba(182,212,255,0.2)] h-[60px] ml-0 mt-0 rounded-[30px] w-[205px]" />
      <p className="[grid-area:1_/_1] font-['Poppins:Regular',sans-serif] ml-[63px] mt-[30px] not-italic relative text-[#5b5b5b] text-[14px] text-nowrap whitespace-pre">{`Fashion & Beauty`}</p>
      <WhiteCircle className="[grid-area:1_/_1] ml-[8px] mt-[7px] relative" />
      <FashionIcon className="[grid-area:1_/_1] h-[28px] ml-[21px] mt-[15px] overflow-clip relative w-[23px]" />
    </div>
  );
}

function Category4() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-name="Category 5">
      <Group6 />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex gap-[12px] items-center leading-[0] left-[228px] top-0">
      <Category1 />
      <Category2 />
      <Category3 />
      <Category4 />
    </div>
  );
}

export default function CategoryBase() {
  return (
    <div className="relative size-full" data-name="Category Base">
      <Category />
      <Frame />
      <HealthIcon className="absolute left-[496px] size-[28px] top-[16px]" />
      <LegalIcon className="absolute left-[729px] overflow-clip size-[24px] top-[16px]" />
    </div>
  );
}
