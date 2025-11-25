import imgProfile2 from "figma:asset/0980bfd64c81584e7347191b955bcd26c6dd5821.png";
import imgChecklist1 from "figma:asset/dd6fe2ef1a03984d604a84733ad3fc028f219515.png";
import imgBook1 from "figma:asset/46588005695464b7def72a24e7bb7c324232fb8e.png";
import Frame from "../imports/Frame";

interface StepItemProps {
  number: string;
  icon: string;
  title: string;
  description: string;
}

function StepItem({ number, icon, title, description }: StepItemProps) {
  return (
    <div className="flex items-start gap-4 mb-6">
      {/* Icon Circle */}
      <div className="flex-shrink-0 w-12 h-12 bg-[#CEE3FF] rounded-full flex items-center justify-center">
        <img src={icon} alt="" className="w-6 h-6 object-contain" />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="font-['Poppins:SemiBold',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.24] mb-2">
          {title}
        </h3>
        <p className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.24]">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function NeedMoreJobsSection() {
  return (
    <section className="w-full bg-white py-16 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Background Container */}
        <div className="bg-[#f3f9ff] rounded-[30px] px-6 py-12 md:px-12 md:py-16 relative overflow-hidden border-2 border-[rgba(219,238,255,0.8)] shadow-[0px_14px_20px_0px_rgba(158,197,252,0.1)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Illustration */}
            <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
              <div className="w-full max-w-[450px] h-[600px]">
                <Frame />
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="order-1 lg:order-2">
              {/* Title */}
              <h2 className="font-['Poppins:SemiBold',sans-serif] text-[#2c353f] text-[28px] md:text-[36px] leading-[1.2] mb-4">
                Looking for competitive quotes with staged payment options?
              </h2>

              {/* Subtitle */}
              <p className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.4] mb-8">
                Get competitive quotes from top professionals while enjoying flexible staged payment options. Here's how it works:
              </p>

              {/* Steps */}
              <div className="space-y-2 mb-10">
                <StepItem
                  number="01"
                  icon={imgProfile2}
                  title="Post a task"
                  description="Describe what you need done in a few sentences. Keep it simple and clear to attract the best Taskers."
                />
                <StepItem
                  number="02"
                  icon={imgChecklist1}
                  title="Set your budget"
                  description="Enter your preferred budget range that you wish to get quote around"
                />
                <StepItem
                  number="03"
                  icon={imgBook1}
                  title="Compare quotes."
                  description="Review offers from Taskers, checking their profiles, ratings, and reviews to find the best fit for your project."
                />
                <StepItem
                  number="04"
                  icon={imgBook1}
                  title="Stage payments"
                  description="Award the job, set up a milestone payment. Once the task is complete and your 100% satisfied with work done, release payment and leave a review."
                />
              </div>

              {/* CTA Button */}
              <div className="flex justify-start">
                <button className="bg-[#fe8a0f] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 rounded-[20px] px-8 py-3 cursor-pointer">
                  <span className="font-['Poppins:Regular',sans-serif] text-[15px] text-white">
                    Post Task Now
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
