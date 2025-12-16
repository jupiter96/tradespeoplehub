import { useState } from "react";

interface FaqItem {
  question: string;
  answer?: string;
}

const faqData: FaqItem[] = [
  {
    question: "How do I list my service?",
    answer: "Listing your service is easy! Simply sign up and create your professional profile. Then, add detailed descriptions of the services you provide, including pricing, availability, and what makes your offering unique. Upload photos of your past work to showcase your skills and attract more clients."
  },
  {
    question: "How much does it cost?",
    answer: "Creating an account and listing your services is completely free! We only charge a small service fee when you successfully complete a job through our platform. This means you only pay when you earn, making it risk-free to get started."
  },
  {
    question: "How much money can I make?",
    answer: "Your earning potential is unlimited! It depends on your skills, availability, and the services you offer. Many professionals earn a full-time income through our platform, while others use it to supplement their existing income. The more services you offer and the better your ratings, the more you can earn."
  },
  {
    question: "How do I get paid?",
    answer: "After successfully completing a service, payment is processed through our secure payment system. Funds are typically released to your account within 2-3 business days after job completion. You can withdraw your earnings directly to your bank account or keep them in your platform wallet for future use."
  },
  {
    question: "How do I price my service?",
    answer: "You have full control over your pricing! Research what similar professionals charge in your area and set competitive rates. You can offer different pricing tiers, package deals, or hourly rates depending on your service type. Our platform also provides pricing recommendations based on market data."
  },
  {
    question: "Do I have to work all the time?",
    answer: "No, you have complete flexibility! You control your own schedule and decide when you're available to take on jobs. You can set your working hours, take breaks whenever you need, and only accept jobs that fit your schedule. Work as much or as little as you want."
  },
  {
    question: "Can I list pricing based on unit measurement, hourly rate and so on?",
    answer: "Absolutely! Our platform supports multiple pricing structures to fit your business model. You can charge by the hour, per project, per square foot, per unit, or any other measurement that makes sense for your service. This flexibility allows you to accurately price your work and attract the right clients."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="w-full">
      {/* Title */}
      <h2 className="font-['Roboto:Bold',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] lg:text-[36px] text-center mb-8 md:mb-12 px-4">
        Frequently Asked Questions
      </h2>

      {/* FAQ Items */}
      <div className="max-w-[928px] mx-auto space-y-4">
        {faqData.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-[10px] overflow-hidden transition-all duration-300"
          >
            {/* Question */}
            <button
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 md:py-5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-['Roboto:Bold',sans-serif] text-[#3d78cb] text-[14px] md:text-[16px] lg:text-[20px] pr-3 md:pr-4 leading-snug">
                {faq.question}
              </span>
              <span className="font-['Roboto:Black',sans-serif] text-[#fe8a0f] text-[20px] md:text-[24px] flex-shrink-0">
                {openIndex === index ? "-" : "+"}
              </span>
            </button>

            {/* Answer */}
            {openIndex === index && faq.answer && (
              <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-5 pt-2">
                <p className="font-['Roboto:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.6]">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
