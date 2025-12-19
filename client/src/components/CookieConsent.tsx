import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Show dialog after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookieConsent", "accepted");
    localStorage.setItem("cookiePreferences", JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
    }));
    setIsOpen(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem("cookieConsent", "rejected");
    localStorage.setItem("cookiePreferences", JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
    }));
    setIsOpen(false);
  };

  const handleCustomise = () => {
    // Placeholder for a future customise modal.
    // IMPORTANT: Do NOT set consent here so the banner keeps showing
    // until the user explicitly accepts or rejects.
    console.info("Cookie customise clicked - no consent stored yet.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-3 md:bottom-4 left-1/2 md:left-4 -translate-x-1/2 md:translate-x-0 z-[300] w-[92vw] max-w-[400px] bg-white rounded-lg px-3 py-3 md:p-4 shadow-[0_4px_12px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]">
      <div className="space-y-2.5 md:space-y-3">
        <h2 className="font-['Poppins',sans-serif] text-[14px] md:text-[16px] font-semibold text-[#2c353f]">
          We value your privacy
        </h2>
        
        <p className="font-['Poppins',sans-serif] text-[11px] md:text-[13px] text-[#6b6b6b] leading-relaxed">
          We use cookies to enhance your browsing experience, serve personalised ads or content, and analyse our traffic. By clicking "Accept All", you consent to our use of cookies.
        </p>

        <div className="flex gap-1.5 md:gap-2 pt-1">
          <Button
            onClick={handleCustomise}
            variant="outline"
            className="flex-1 border-2 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10 font-['Poppins',sans-serif] text-[10px] md:text-[12px] py-1 h-auto md:py-1.5 whitespace-nowrap"
          >
            Customise
          </Button>
          <Button
            onClick={handleAcceptAll}
            className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[10px] md:text-[12px] py-1 h-auto md:py-1.5 whitespace-nowrap"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}

