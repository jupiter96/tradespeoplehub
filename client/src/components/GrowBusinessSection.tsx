import imgEllipse16 from "figma:asset/075935dbf0c3e993b37e29b71812432fcef83604.png";
import imgEllipse17 from "figma:asset/5a3e222d04cdbb6fc8cb9e863cde9888e9436a78.png";
import imgRectangle30 from "figma:asset/080dc1995a18f4792c8fb8df7a8c42cff8c2c3ed.png";
import imgRectangle13 from "figma:asset/552aa6a2ab864900418cd17dabcb4627fbb80d42.png";
import imgRectangle29 from "figma:asset/0e944ae825916234b6dfadd9ea362b6ac507e753.png";
import imgConfetti1 from "figma:asset/16f87142f626c781659c1db02943abdceac4a69c.png";
import Group17 from "../imports/Group17";

export default function GrowBusinessSection() {
  return (
    <section className="w-full bg-[#f0f0f0] py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="bg-[#f3f9ff] rounded-[30px] p-8 md:p-12 lg:p-16 shadow-[0px_14px_30px_0px_rgba(158,197,252,0.3)]">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Side - Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left px-4 lg:px-0">
              {/* Title with confetti decoration */}
              <div className="relative inline-block">
                <h2 className="font-['Poppins:Bold',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] lg:text-[32px] xl:text-[36px] leading-[1.3] mb-6">
                  The Easiest Way to<br />
                  Sell Your Services<br />
                  & Grow<br />
                  Your Business
                </h2>
                {/* Confetti decoration */}
                <img 
                  src={imgConfetti1} 
                  alt="" 
                  className="absolute -right-4 top-20 w-8 h-8 md:w-10 md:h-10 hidden lg:block"
                />
              </div>

              {/* Description */}
              <p className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[14px] md:text-[15px] leading-[1.7] mb-8 max-w-[500px] mx-auto lg:mx-0">
                Whether you're a genius spreadsheet guru, a skilled carpenter, or anything in between, find your next job with ease on our platform. Sell your services directly to a wide audience and watch your business grow!
              </p>

              {/* CTA Button */}
              <button className="bg-[#fe8a0f] text-white px-8 py-3 rounded-[20px] font-['Poppins:Regular',sans-serif] text-[15px] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300">
                Start Selling Now!
              </button>

              {/* Decorative shapes - Mobile hidden */}
              <div className="hidden lg:block">
                <div className="absolute left-20 top-32 w-[11px] h-[11px] rounded-full bg-[#FFBDE5]" />
                <div className="absolute left-32 top-64 w-[6px] h-[6px] bg-[#3d78cb] transform rotate-[26deg]" />
              </div>
            </div>

            {/* Right Side - Image Gallery with Reviews */}
            <div className="w-full lg:w-1/2 relative">
              <div className="relative h-[500px] md:h-[550px] lg:h-[500px]">
                {/* Background decorative elements */}
                <div className="absolute right-4 top-8 w-[10px] h-[11px] bg-[#cebbf0] transform rotate-[64deg]" />
                <div className="absolute right-0 top-16 w-[6px] h-[7px] bg-[#b89cea] transform rotate-[26deg]" />
                <div className="absolute left-4 bottom-8 w-[6px] h-[6px] bg-[#ffe16b] transform rotate-[26deg]" />

                {/* Z-index 1: Rectangle 30 - Right bottom image (내려옴) */}
                <div className="absolute right-0 bottom-0 md:bottom-4 z-[1]">
                  <img 
                    src={imgRectangle30} 
                    alt="Beach houses" 
                    className="w-[150px] md:w-[203px] h-[210px] md:h-[289px] object-cover rounded-[20px] shadow-lg"
                  />
                </div>

                {/* Z-index 2: Rectangle 13 - Main center image (우측으로 올림) */}
                <div className="absolute left-[52%] md:left-[55%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-[2]">
                  <img 
                    src={imgRectangle13} 
                    alt="Mountain landscape" 
                    className="w-[200px] md:w-[285px] h-[210px] md:h-[292px] object-cover rounded-[20px] shadow-lg"
                  />
                </div>

                {/* Z-index 3: Group 15 - Josef Flores review card (아래로 내림) */}
                <div className="absolute right-0 top-[240px] md:top-[280px] z-[3] bg-white rounded-[34px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.25)] px-4 py-3 flex items-center gap-3">
                  <img 
                    src={imgEllipse16} 
                    alt="Josef Flores" 
                    className="w-[38px] h-[38px] rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[14px] whitespace-nowrap">
                      Josef Flores
                    </span>
                    <div className="flex items-center gap-1">
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M4.74403 0.282232L5.71993 2.43067C5.78779 2.58009 5.91901 2.68363 6.0708 2.70755L8.25309 3.0521C8.63536 3.11249 8.78787 3.62274 8.51137 3.91551L6.93227 5.58782C6.82254 5.70411 6.77236 5.87177 6.79835 6.0359L7.17106 8.3973C7.23639 8.81086 6.83679 9.12619 6.49495 8.93107L4.54315 7.81626C4.40742 7.7388 4.24516 7.7388 4.10943 7.81626L2.15763 8.93107C1.81578 9.12638 1.41618 8.81086 1.48152 8.3973L1.85423 6.0359C1.88022 5.87177 1.83004 5.70411 1.72031 5.58782L0.141213 3.91551C-0.135296 3.62254 0.0172169 3.1123 0.399492 3.0521L2.58178 2.70755C2.73357 2.68363 2.86478 2.58009 2.93265 2.43067L3.90855 0.282232C4.07929 -0.0940773 4.57311 -0.0940773 4.74403 0.282232Z" fill="#ED8A19"/>
                      </svg>
                      <span className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[10px]">4.3</span>
                    </div>
                  </div>
                </div>

                {/* Z-index 4: Group 16 - Alexander Lesli review card (아래로 내림) */}
                <div className="absolute left-0 top-16 md:top-24 z-[4] bg-white rounded-[34px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.25)] px-4 py-3 flex items-center gap-3">
                  <img 
                    src={imgEllipse17} 
                    alt="Alexander Lesli" 
                    className="w-[39px] h-[39px] rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[14px] whitespace-nowrap">
                      Alexander Lesli
                    </span>
                    <div className="flex items-center gap-1">
                      <svg width="9" height="10" viewBox="0 0 9 10" fill="none">
                        <path d="M4.85311 0.288721L5.85144 2.48655C5.92087 2.63941 6.0551 2.74533 6.21038 2.76981L8.44284 3.12227C8.83391 3.18406 8.98993 3.70603 8.70706 4.00553L7.09166 5.7163C6.9794 5.83526 6.92807 6.00677 6.95466 6.17468L7.33594 8.59037C7.40277 9.01344 6.99399 9.33602 6.64428 9.13641L4.6476 7.99597C4.50875 7.91673 4.34276 7.91673 4.20392 7.99597L2.20724 9.13641C1.85753 9.33622 1.44874 9.01344 1.51558 8.59037L1.89686 6.17468C1.92345 6.00677 1.87212 5.83526 1.75986 5.7163L0.144459 4.00553C-0.138407 3.70583 0.0176128 3.18386 0.408677 3.12227L2.64114 2.76981C2.79642 2.74533 2.93065 2.63941 3.00008 2.48655L3.99841 0.288721C4.17308 -0.0962404 4.67825 -0.0962404 4.85311 0.288721Z" fill="#ED8A19"/>
                      </svg>
                      <span className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[10px]">4.3</span>
                    </div>
                  </div>
                </div>

                {/* Z-index 5: Group 17 - Small circular profile (Rectangle 13 상단 우측) */}
                <div className="absolute left-[52%] md:left-[55%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5]">
                  <div className="absolute -top-[115px] md:-top-[155px] right-[-15px] md:right-[-25px] w-[62.509px] h-[59.868px]">
                    <Group17 />
                  </div>
                </div>

                {/* Z-index 6: Rectangle 29 - Bottom left image (highest) */}
                <div className="absolute left-0 bottom-0 z-[6]">
                  <img 
                    src={imgRectangle29} 
                    alt="Alpacas" 
                    className="w-[160px] md:w-[221px] h-[170px] md:h-[239px] object-cover rounded-[20px] shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
