import characterImg from "figma:asset/23211fe5353777e348b64b894b371ef67db44cfb.png";

export default function PostTaskSection() {
  return (
    <div className="relative w-full bg-[#f0f0f0] py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="relative bg-[#DBEAFF] rounded-[20px] overflow-hidden">
          <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8 lg:gap-12 items-center min-h-[400px] md:min-h-[500px]">
            {/* Left Content */}
            <div className="relative z-10 px-6 md:px-12 lg:px-16 py-12 md:py-16 lg:pr-8">
              <h2 className="font-['Roboto',sans-serif] text-[#2c353f] text-[28px] md:text-[36px] mb-6 leading-[1.22]">
                Post a Task Today & Receive Quotes from Skilled Professionals!
              </h2>
              
              <div className="font-['Roboto',sans-serif] font-normal text-[#5b5b5b] text-[14px] leading-[1.24] mb-8 space-y-4">
                <p className="font-normal">
                  Whether you're seeking a home improvement expert, legal advisor, or business consultant, posting your task is the next step toward finding the right professional for the job. Receive competitive quotes, browse detailed profiles, choose the best candidate, set up milestone payments and release them when the task is completed to your satisfaction.
                </p>
                <p className="font-['Roboto',sans-serif] font-normal">
                  Post Your Task Now!
                </p>
              </div>
              
              <button className="bg-[#fe8a0f] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white px-8 py-3 rounded-[20px] font-['Roboto',sans-serif] text-[15px] transition-all duration-300 cursor-pointer">
                Start Posting Task
              </button>
            </div>
            
            {/* Right Illustration */}
            <div className="relative h-[350px] md:h-[500px] lg:h-full">
              {/* Decorative dots - top right */}
              <div className="absolute right-8 md:right-16 top-8 md:top-12 font-extrabold text-[20px] md:text-[24px] text-[rgba(254,138,15,0.2)] leading-[0.36] tracking-[3.5px] md:tracking-[4.08px] hidden md:block">
                <p className="mb-0">....</p>
                <p className="mb-0">....</p>
                <p className="mb-0">....</p>
                <p className="mb-0">....</p>
                <p className="mb-0">....</p>
                <p className="mb-0">....</p>
                <p className="mb-0">....</p>
                <p>....</p>
              </div>
              
              {/* Blue gradient circle background - center aligned to bottom edge */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-[300px] h-[300px] md:w-[416px] md:h-[416px]">
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'radial-gradient(circle, rgba(169, 205, 255, 0.5) 0%, rgba(169, 205, 255, 0) 70%)'
                }}>
                  <svg className="block size-full" fill="none" viewBox="0 0 416 416">
                    <circle cx="208" cy="208" r="208" fill="rgba(169, 205, 255, 0.5)" />
                  </svg>
                </div>
              </div>
              
              {/* Character Illustration - scaled up significantly */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
                <img 
                  src={characterImg} 
                  alt="Professional with phone" 
                  style={{ 
                    width: '300px',
                    height: 'auto',
                    minWidth: '300px'
                  }}
                  className="object-contain object-bottom md:!w-[420px] md:!min-w-[420px] lg:!w-[480px] lg:!min-w-[480px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
