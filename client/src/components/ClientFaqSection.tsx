import { useState } from "react";

interface FaqItem {
  question: string;
  answer?: string;
}

const faqData: FaqItem[] = [
  {
    question: "How do I find the right PRO?",
    answer: "Browse through our extensive directory of verified professionals, read reviews from other clients, and compare their portfolios. Use our advanced search filters to find professionals by service type, location, price range, and ratings. Each professional's profile includes detailed information about their expertise, past work, and client feedback to help you make an informed decision."
  },
  {
    question: "Can I communicate with PROs before ordering?",
    answer: "Yes! We encourage you to message professionals before placing an order. This allows you to discuss your project requirements, ask questions, clarify details, and ensure they're the right fit for your needs. Our messaging system keeps all communication secure and organized in one place."
  },
  {
    question: "What happens if a PRO doesn't deliver on time?",
    answer: "We take timely delivery seriously. If a professional doesn't deliver on time, you can request a deadline extension or cancel the order for a full refund. Our customer support team is available to help mediate any issues and ensure you get the service you paid for."
  },
  {
    question: "Can I cancel an order?",
    answer: "Yes, you can cancel an order before the professional starts working on it for a full refund. If work has already begun, cancellation terms depend on the project progress. Our buyer protection policy ensures fair treatment for both parties, and our support team can assist with any cancellation-related questions."
  },
  {
    question: "How long does it take to get my project completed?",
    answer: "Project completion time varies depending on the service type and complexity. Each professional lists their typical turnaround time on their profile. For custom projects, you can discuss and agree on a timeline directly with the professional before placing your order. Most simple tasks are completed within 1-3 days."
  },
  {
    question: "What if I'm not happy with the work?",
    answer: "Your satisfaction is our priority. If you're not happy with the delivered work, you can request revisions according to the agreed terms. If the issue isn't resolved, you can open a dispute and our support team will review the case and help find a fair solution, which may include a partial or full refund."
  },
  {
    question: "How do your payments work?",
    answer: "When you place an order, payment is securely held by our platform until the work is completed to your satisfaction. Once you approve the delivery, the payment is released to the professional. This ensures you only pay for work you're happy with. We accept all major credit cards, debit cards, and digital payment methods."
  },
  {
    question: "How do I know the price before ordering?",
    answer: "All professionals clearly display their pricing on their service listings. Prices may be per project, hourly, or based on other measurements like square footage. For custom projects, you can request a detailed quote before ordering. There are no hidden fees—the price you see is what you pay, plus any optional service upgrades you choose."
  },
  {
    question: "What should I do if I'm unhappy with the seller's work?",
    answer: "First, communicate your concerns directly with the professional and request revisions if applicable. If the issue persists, contact our customer support team who will mediate the situation. Depending on the circumstances, we can facilitate revisions, offer partial refunds, or provide a full refund under our buyer protection guarantee."
  },
  {
    question: "Can I schedule a specific delivery date for my order?",
    answer: "Yes! When placing an order, you can discuss your preferred timeline with the professional. Many professionals offer scheduled delivery options, allowing you to plan your project around specific dates. Make sure to communicate your deadline clearly when ordering, and the professional will confirm if they can meet your timeline."
  },
  {
    question: "Can I schedule a future project with a seller?",
    answer: "Absolutely! If you've worked with a professional before and want to schedule future work, you can message them to discuss upcoming projects and availability. Many professionals are happy to plan ahead and reserve time for repeat clients. You can also save your favorite professionals for easy access."
  },
  {
    question: "What happens if I don't accept the delivery on time?",
    answer: "Once a professional delivers the work, you have a set period (typically 3-7 days depending on the service) to review and accept or request revisions. If you don't respond within this timeframe, the order is automatically marked as complete and the payment is released to the professional. We send multiple reminders to ensure you don't miss the deadline."
  },
  {
    question: "How can I check the status of my order?",
    answer: "You can track all your orders in real-time from your account dashboard. Each order shows its current status (in progress, delivered, completed, etc.), messages with the professional, delivery timeline, and any files or updates. You'll also receive email and app notifications for important order updates."
  }
];

export default function ClientFaqSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="w-full">
      {/* Title */}
      <h2 className="font-['Poppins:Bold',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] text-center mb-12">
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
              className="w-full flex items-center justify-between px-6 md:px-8 py-5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-['Poppins:Bold',sans-serif] text-[#3d78cb] text-[16px] md:text-[20px] pr-4">
                {faq.question}
              </span>
              <span className="font-['Poppins:Black',sans-serif] text-[#fe8a0f] text-[24px] flex-shrink-0">
                {openIndex === index ? "-" : "+"}
              </span>
            </button>

            {/* Answer */}
            {openIndex === index && faq.answer && (
              <div className="px-6 md:px-8 pb-5 pt-2">
                <p className="font-['Poppins:Regular',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.43]">
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
