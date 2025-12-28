import Banner from "../imports/Banner";
import HowItWorks from "../imports/HowItWorks";
import NeedMoreJobs from "../imports/NeedMoreJobs";
import Vector3 from "../imports/Vector3";
import Vector4 from "../imports/Vector4";
import WhyUsSection from "./WhyUsSection";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import AppDownloadSection from "./AppDownloadSection";
import FaqSection from "./FaqSection";
import GrowBusinessSection from "./GrowBusinessSection";
import img22 from "figma:asset/01f369f7145a1bda02cadae942ff191c7c2cda51.png";
import img0125 from "figma:asset/10d3d015685dee0b00951bf262608d69093ccde4.png";
import img127 from "figma:asset/f1d010159c6cb7c35142621cdde2a80e22049b68.png";
import thumbnailImage from "https://i.ibb.co/23knmvB9/thumbnail.jpg";
import { SEOHead } from "./SEOHead";

export default function HowItWorkProPage() {
  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Join as a Professional - Grow Your Business Online | Sortars"
        description="Start selling your services on Sortars. Join 50,000+ verified professionals earning online. Create your profile, showcase your work, receive job requests, and grow your business. Free to join."
        ogTitle="Grow Your Professional Service Business Online - Sortars Pro"
        ogDescription="Join the UK's trusted service marketplace for professionals. Get more clients, manage bookings, receive payments online. Perfect for tradespeople, freelancers, and service providers."
        ogImage={`${window.location.origin}${thumbnailImage}`}
        ogType="website"
        robots="index,follow"
      />
      {/* Header */}
      <header className="sticky top-0 h-[122px] z-50 bg-white">
        <Nav />
      </header>

      {/* Main Content */}
      <main>
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          {/* Banner Section */}
          <div className="w-full relative overflow-hidden min-h-[300px] md:min-h-[400px] h-auto">
            <div className="hidden md:block h-[597px] relative">
              <Banner />
            </div>
            {/* Mobile Banner */}
            <div className="md:hidden bg-[#002f77] rounded-[20px] p-6 py-8 relative overflow-hidden">
              {/* Profile Images at Top */}
              <div className="relative z-10 flex justify-center gap-3 mb-6">
                <div className="relative w-[90px] h-[130px] rounded-lg overflow-hidden border border-white/50">
                  <img src={img0125} alt="Amber" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-[10px] mb-0">Amber</p>
                    <p className="text-white/80 text-[9px]">Professional</p>
                  </div>
                </div>
                <div className="relative w-[110px] h-[160px] rounded-lg overflow-hidden border border-white/50">
                  <img src={img127} alt="Pamela" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-[10px] mb-0">Pamela</p>
                    <p className="text-white/80 text-[9px]">Training Instructor</p>
                  </div>
                </div>
                <div className="relative w-[90px] h-[130px] rounded-lg overflow-hidden border border-white/50">
                  <img src={img22} alt="Morgan" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-[10px] mb-0">Morgan</p>
                    <p className="text-white/80 text-[9px]">Pet Specialist</p>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10">
                <h1 className="text-white mb-4 leading-tight">
                  <span>Join a Thriving Community of Skilled Professionals and Watch Your Business </span>
                  <span className="text-[#fe8a0f]">Flourish!</span>
                </h1>
                <p className="text-white text-[14px] mb-6 leading-relaxed">
                  With thousands of services sold every month, the opportunities for growth are limitless. Whether you're an experienced professional offering your expertise or someone just starting out, this platform connects you with clients ready to purchase your services.
                  <br /><br />
                  Start today, build your reputation, and unlock your potential to earn and grow.
                </p>
                <button className="bg-[#fe8a0f] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 rounded-[20px] px-6 py-3 text-white text-[15px] cursor-pointer">
                  Join US Now
                </button>
              </div>
              {/* Decorative circle */}
              <div className="absolute bottom-4 right-4 w-[60px] h-[60px] rounded-full bg-[#3D78CB] opacity-30" />
            </div>
          </div>
          
          {/* How It Works Section */}
          <div className="w-full mt-8 md:mt-6">
            <HowItWorks />
          </div>

          {/* Need More Jobs Section */}
          <div className="w-full mt-8 md:mt-12 relative overflow-hidden min-h-[300px] h-auto">
            <div className="hidden md:block h-[500px] relative">
              <NeedMoreJobs />
            </div>
            {/* Mobile Need More Jobs */}
            <div className="md:hidden py-8">
              <h2 className="text-[#2c353f] text-center mb-8">Need more jobs?</h2>
              <div className="space-y-6">
                <div className="bg-white rounded-[10px] shadow-md p-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-[48px] h-[48px] bg-[#CEE3FF] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#002f77"/>
                      </svg>
                    </div>
                    <h3 className="text-[#5b5b5b]">Choose a Location</h3>
                  </div>
                  <p className="text-[#5b5b5b] text-[14px] leading-relaxed">
                    Choose the location you want to work in and how much distance you can travel, get a list of posted jobs or get notified when new jobs are posted.
                  </p>
                </div>

                <div className="bg-white rounded-[10px] shadow-md p-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-[48px] h-[48px] bg-[#CEE3FF] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#002f77"/>
                      </svg>
                    </div>
                    <h3 className="text-[#5b5b5b]">Quote Jobs</h3>
                  </div>
                  <p className="text-[#5b5b5b] text-[14px] leading-relaxed">
                    Access list of jobs and provide quotes for free of charge. Discuss details. Milestone payment created.
                  </p>
                </div>

                <div className="bg-white rounded-[10px] shadow-md p-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-[48px] h-[48px] bg-[#CEE3FF] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#002f77"/>
                      </svg>
                    </div>
                    <h3 className="text-[#5b5b5b]">Deliver Work</h3>
                  </div>
                  <p className="text-[#5b5b5b] text-[14px] leading-relaxed">
                    Job done as agreed. Milestone released and payment made. Share your experience and let other Pro know what it is like working with the client.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why You Should Join Us Section - Full Width Background */}
        <div className="w-full mt-12 md:mt-16 relative overflow-hidden min-h-[500px] md:min-h-[600px]">
          {/* Background Shape - Full Width - Hide on mobile */}
          <div className="hidden md:block absolute inset-0 w-full h-full overflow-hidden">
            <Vector3 />
          </div>
          {/* Content - Constrained Width */}
          <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16">
            <WhyUsSection />
          </div>
        </div>

        {/* Grow Your Business Section */}
        <GrowBusinessSection />

        {/* Download Our App Section */}
        <div className="w-full">
          <AppDownloadSection />
        </div>

        {/* FAQ Section - Full Width Background */}
        <div className="w-full relative overflow-hidden min-h-[500px] md:min-h-[600px]">
          {/* Background Shape - Full Width - Hide on mobile */}
          <div className="hidden md:block absolute inset-0 w-full h-full overflow-hidden">
            <Vector4 />
          </div>
          {/* Content - Constrained Width */}
          <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16">
            <FaqSection />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}