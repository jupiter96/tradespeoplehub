import imgRectangle34 from "figma:asset/1019e6dc4684d37b305b45dcefe21071ebdf61a7.png";
import imgRectangle35 from "figma:asset/79244d6dc3d64c61191868a8b41899fc8525c6f2.png";
import imgPhone1 from "figma:asset/d9a98abc9580028a3a705de6265792ca99657c3c.png";
import imgAppStore from "figma:asset/36bc166354a0af18b92c1b4cc94416c79f3cdd6c.png";
import imgGooglePlay from "figma:asset/e7c88619f3afccee7ec2a322316aa19c8536ed04.png";
import imgMobilePhone1 from "figma:asset/288456a929894c1b68838d43c6cabf1532dcfaef.png";
import imgMobilePhone2 from "figma:asset/a300990eec525f09f7ce33541380441ca39f485c.png";
import imgMobilePhone3 from "figma:asset/9e1fa7019bb76742ab74f35d79e90baab00a59e9.png";

export default function MobileAppSection() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Side - Phone Mockups */}
          <div className="relative w-full lg:w-1/2 flex justify-center lg:justify-start">
            {/* MOBILE VERSION - Simple 3 phones */}
            <div className="relative h-[280px] flex items-center justify-center lg:hidden">
              <div className="relative bg-[#DBEAFF] rounded-[30px] p-8">
                <div className="flex items-end justify-center">
                  <img 
                    src={imgMobilePhone1} 
                    alt="App Screen 1" 
                    className="h-[220px] w-auto object-contain rounded-[12px] -mr-2"
                  />
                  <img 
                    src={imgMobilePhone2} 
                    alt="App Screen 2" 
                    className="h-[250px] w-auto object-contain rounded-[12px] z-10"
                  />
                  <img 
                    src={imgMobilePhone3} 
                    alt="App Screen 3" 
                    className="h-[220px] w-auto object-contain rounded-[12px] -ml-2"
                  />
                </div>
              </div>
            </div>

            {/* DESKTOP VERSION - Original layout from homepage */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Orange dots decoration */}
                <div className="absolute -left-8 -top-8 flex flex-col gap-1 z-0">
                  {[...Array(8)].map((_, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1">
                      {[...Array(4)].map((_, colIndex) => (
                        <div
                          key={colIndex}
                          className="w-1 h-1 rounded-full bg-[#FE8A0F]"
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Blue rounded background */}
                <div className="relative bg-[#DBEAFF] rounded-[20px] p-8 md:p-12">
                  {/* Phone images container */}
                  <div className="relative w-[350px] md:w-[450px] h-[350px] md:h-[400px]">
                    {/* Left phone - slightly rotated */}
                    <div className="absolute left-0 top-[10%] z-10">
                      <div
                        className="w-[140px] md:w-[158px] shadow-[0px_4px_10px_rgba(2,42,99,0.15)]"
                        style={{
                          transform: 'rotate(-3.554deg)',
                        }}
                      >
                        <img
                          src={imgRectangle35}
                          alt="App screen"
                          className="w-full h-auto rounded-[12px]"
                        />
                      </div>
                    </div>

                    {/* Center phone - main focus */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                      <div className="w-[150px] md:w-[164px]">
                        <img
                          src={imgPhone1}
                          alt="App main screen"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>

                    {/* Right phone - slightly rotated */}
                    <div className="absolute right-0 top-[10%] z-20">
                      <div
                        className="w-[140px] md:w-[175px] shadow-[0px_4px_10px_rgba(6,40,86,0.15)]"
                        style={{
                          transform: 'rotate(3.146deg)',
                        }}
                      >
                        <img
                          src={imgRectangle34}
                          alt="App screen"
                          className="w-full h-auto rounded-[12px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Orange wave decoration */}
                  <div className="absolute -bottom-8 right-8">
                    <svg
                      width="54"
                      height="27"
                      viewBox="0 0 54 27"
                      fill="none"
                      className="opacity-80"
                    >
                      <path
                        d="M1.24939 7.76797C6.24939 3.76797 13.0494 -1.53203 18.2494 5.26797C24.7494 13.768 28.2494 8.26797 29.2494 6.76797C30.2494 5.26797 34.2494 -0.232026 38.7494 5.26797C43.2494 10.768 45.7494 10.268 48.2494 7.76797C50.2494 5.76797 52.7494 2.6013 53.7494 1.26797M1.24939 22.768C6.24939 18.768 13.0494 13.468 18.2494 20.268C24.7494 28.768 28.2494 23.268 29.2494 21.768C30.2494 20.268 34.2494 14.768 38.7494 20.268C43.2494 25.768 45.7494 25.268 48.2494 22.768C50.2494 20.768 52.7494 17.6013 53.7494 16.268"
                        stroke="#FE8A0F"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] mb-4 md:mb-6">
              Our Mobile App
            </h2>
            <p className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px] md:text-[16px] leading-[1.6] mb-8 max-w-[500px] mx-auto lg:mx-0">
              Stay productive on the go—download our app to manage your tasks wherever you are.
            </p>

            {/* Download buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <a href="#" className="inline-block transition-transform hover:scale-105">
                <img 
                  src={imgAppStore} 
                  alt="Download on the App Store" 
                  className="h-12 w-40 md:h-14 md:w-48 lg:h-16 lg:w-56 object-contain rounded-lg"
                />
              </a>
              <a href="#" className="inline-block transition-transform hover:scale-105">
                <img 
                  src={imgGooglePlay} 
                  alt="Get it on Google Play" 
                  className="h-12 w-40 md:h-14 md:w-48 lg:h-16 lg:w-56 object-cover rounded-lg"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
