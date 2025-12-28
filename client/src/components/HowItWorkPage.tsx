import Hero from "../imports/Hero";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import HowItWorksSection from "./HowItWorksSection";
import NeedMoreJobsSection from "./NeedMoreJobsSection";
import WhyUseUsSection from "./WhyUseUsSection";
import TipsForSuccessSection from "./TipsForSuccessSection";
import MobileAppSection from "./MobileAppSection";
import TaskDoneSection from "./TaskDoneSection";
import PeopleLoveUsSection from "./PeopleLoveUsSection";
import ClientFaqSection from "./ClientFaqSection";
import Vector3 from "../imports/Vector3";
import Vector4 from "../imports/Vector4";
import { SEOHead } from "./SEOHead";

export default function HowItWorkPage() {
  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* SEO Meta Tags */}
      <SEOHead
        title="How It Works for Clients - Hire Professionals Online | Sortars"
        description="Learn how to order professional services on Sortars. Post your job, receive quotes from verified experts, compare reviews, and hire with confidence. Simple, fast, and secure."
        ogTitle="How to Hire Professionals Online - Sortars Client Guide"
        ogDescription="Post jobs, get instant quotes, compare professionals, and book online. Our complete guide to hiring trusted tradespeople and specialists on the UK's leading service marketplace."
        ogType="website"
        robots="index,follow"
      />
      {/* Header */}
      <header className="sticky top-0 h-[122px] z-50 bg-white">
        <Nav />
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Banner Section with White Background */}
        <div className="w-full bg-white">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6">
            <div className="w-full h-[300px] md:h-[400px] lg:h-[514px] relative">
              <Hero />
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Need More Jobs Section */}
        <NeedMoreJobsSection />

        {/* Why Use Us Section - Full Width Background */}
        <div className="w-full bg-white">
          <div className="w-full relative min-h-[600px] md:min-h-[800px] lg:min-h-[1000px]">
            {/* Background Shape - Full Width */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <Vector3 />
            </div>
            {/* Content - Constrained Width */}
            <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16">
              <WhyUseUsSection />
            </div>
          </div>
        </div>

        {/* Tips for Success Section */}
        <TipsForSuccessSection />

        {/* Task Done Section */}
        <TaskDoneSection />

        {/* People Love Us Section */}
        <PeopleLoveUsSection />

        {/* Mobile App Section */}
        <MobileAppSection />

        {/* FAQ Section - Full Width Background */}
        <div className="w-full relative bg-[#ffffff] min-h-[500px] md:min-h-[650px] lg:min-h-[813px]">
          {/* Background Shape - Full Width */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <Vector4 />
          </div>
          {/* Content - Constrained Width */}
          <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16">
            <ClientFaqSection />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}