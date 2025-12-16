import { WhiteCircle, WeddingIcon, AssemblingIcon, HealthIcon, LegalIcon, FashionIcon } from "../components/svg";
import { useNavigate } from "react-router-dom";

function Category() {
  const navigate = useNavigate();
  
  return (
    <button 
      className="relative shrink-0 w-[216px] h-[60px] cursor-pointer group" 
      data-name="Category 1"
      onClick={() => navigate("/sector/wedding-events")}
    >
      <div className="absolute bg-[rgba(182,212,255,0.2)] group-hover:bg-[rgba(182,212,255,0.35)] h-[60px] left-0 rounded-[30px] top-0 w-[216px] transition-colors" />
      <p className="absolute font-['Roboto:Regular',sans-serif] leading-[0] left-[127.5px] not-italic text-[#5b5b5b] group-hover:text-[#3D78CB] text-[14px] text-center text-nowrap top-[30px] translate-x-[-50%] whitespace-pre transition-colors">{`Wedding & Events`}</p>
      <WhiteCircle className="absolute left-[8px] top-[7px]" />
      <WeddingIcon className="absolute left-[16px] size-[30px] top-[13px]" />
    </button>
  );
}

function Category1() {
  const navigate = useNavigate();
  
  return (
    <button 
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0 cursor-pointer group" 
      data-name="Category 2"
      onClick={() => navigate("/sector/home-garden")}
    >
      <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-0 mt-0 place-items-start relative">
        <div className="[grid-area:1_/_1] bg-[rgba(182,212,255,0.2)] group-hover:bg-[rgba(182,212,255,0.35)] h-[60px] ml-0 mt-0 rounded-[30px] w-[239px] transition-colors" />
        <p className="[grid-area:1_/_1] font-['Roboto:Regular',sans-serif] ml-[63px] mt-[30px] not-italic relative text-[#5b5b5b] group-hover:text-[#3D78CB] text-[14px] text-nowrap whitespace-pre transition-colors">{`Assembling & Repairs`}</p>
        <WhiteCircle className="[grid-area:1_/_1] ml-[8px] mt-[7px] relative" />
        <AssemblingIcon className="[grid-area:1_/_1] h-[21px] ml-[13px] mt-[19px] overflow-clip relative w-[36px]" />
      </div>
    </button>
  );
}

function Category2() {
  const navigate = useNavigate();
  
  return (
    <button 
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0 cursor-pointer group" 
      data-name="Category 3"
      onClick={() => navigate("/sector/health-wellbeing")}
    >
      <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-0 mt-0 place-items-start relative">
        <div className="[grid-area:1_/_1] bg-[rgba(182,212,255,0.2)] group-hover:bg-[rgba(182,212,255,0.35)] h-[60px] ml-0 mt-0 rounded-[30px] w-[219px] transition-colors" />
        <p className="[grid-area:1_/_1] font-['Roboto:Regular',sans-serif] ml-[63px] mt-[30px] not-italic relative text-[#5b5b5b] group-hover:text-[#3D78CB] text-[14px] text-nowrap whitespace-pre transition-colors">{`Health & Wellbeing `}</p>
        <WhiteCircle className="[grid-area:1_/_1] ml-[8px] mt-[7px] relative" />
        <HealthIcon className="[grid-area:1_/_1] ml-[16px] mt-[16px] relative size-[28px]" />
      </div>
    </button>
  );
}

function Category3() {
  const navigate = useNavigate();
  
  return (
    <button 
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0 cursor-pointer group" 
      data-name="Category 4"
      onClick={() => navigate("/sector/legal-financial")}
    >
      <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-0 mt-0 place-items-start relative">
        <div className="[grid-area:1_/_1] bg-[rgba(182,212,255,0.2)] group-hover:bg-[rgba(182,212,255,0.35)] h-[60px] ml-0 mt-0 rounded-[30px] w-[192px] transition-colors" />
        <p className="[grid-area:1_/_1] font-['Roboto:Regular',sans-serif] ml-[63px] mt-[30px] not-italic relative text-[#5b5b5b] group-hover:text-[#3D78CB] text-[14px] text-nowrap whitespace-pre transition-colors">{`Legal & Advice`}</p>
        <WhiteCircle className="[grid-area:1_/_1] ml-[8px] mt-[7px] relative" />
        <LegalIcon className="[grid-area:1_/_1] ml-[17px] mt-[16px] overflow-clip relative size-[24px]" />
      </div>
    </button>
  );
}

function Category4() {
  const navigate = useNavigate();
  
  return (
    <button 
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0 cursor-pointer group" 
      data-name="Category 5"
      onClick={() => navigate("/sector/fashion-beauty")}
    >
      <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-0 mt-0 place-items-start relative">
        <div className="[grid-area:1_/_1] bg-[rgba(182,212,255,0.2)] group-hover:bg-[rgba(182,212,255,0.35)] h-[60px] ml-0 mt-0 rounded-[30px] w-[205px] transition-colors" />
        <p className="[grid-area:1_/_1] font-['Roboto:Regular',sans-serif] ml-[63px] mt-[30px] not-italic relative text-[#5b5b5b] group-hover:text-[#3D78CB] text-[14px] text-nowrap whitespace-pre transition-colors">{`Fashion & Beauty`}</p>
        <WhiteCircle className="[grid-area:1_/_1] ml-[8px] mt-[7px] relative" />
        <FashionIcon className="[grid-area:1_/_1] h-[28px] ml-[21px] mt-[15px] overflow-clip relative w-[23px]" />
      </div>
    </button>
  );
}

export default function CategoryBase() {
  return (
    <div className="flex items-center justify-center gap-3 relative" data-name="Category Base">
      <Category />
      <Category1 />
      <Category2 />
      <Category3 />
      <Category4 />
    </div>
  );
}
