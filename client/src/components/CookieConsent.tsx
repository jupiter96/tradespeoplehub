import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import "../styles/globals.css";
export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    necessary: false,
    performance: false,
    targeting: false,
  });
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    performance: false,
    targeting: false,
  });
  const [hasCustomized, setHasCustomized] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    console.log("[CookieConsent] Checking localStorage cookieConsent:", consent);
    if (!consent) {
      // Show dialog after a short delay
      const timer = setTimeout(() => {
        console.log("[CookieConsent] Setting isOpen to true");
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log("[CookieConsent] Consent already exists, not showing banner");
    }
  }, []);

  const handleAcceptAll = () => {
    if (hasCustomized) {
      // If customized, apply current preferences and close GDPR box
      localStorage.setItem("cookieConsent", "customised");
      localStorage.setItem("cookiePreferences", JSON.stringify({
        necessary: cookiePreferences.necessary,
        analytics: cookiePreferences.performance,
        marketing: cookiePreferences.targeting,
      }));
    } else {
      // If not customized, accept all
      localStorage.setItem("cookieConsent", "accepted");
      localStorage.setItem("cookiePreferences", JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true,
      }));
    }
    setIsOpen(false);
    setIsModalOpen(false);
  };

  const handleCustomise = () => {
    // Load existing preferences if available
    const savedPreferences = localStorage.getItem("cookiePreferences");
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        setCookiePreferences({
          necessary: true, // Always true
          performance: prefs.analytics || false,
          targeting: prefs.marketing || false,
        });
        // Check if preferences differ from default (all false except necessary)
        const hasCustomSettings = prefs.analytics !== false || prefs.marketing !== false;
        setHasCustomized(hasCustomSettings);
      } catch (e) {
        // Use defaults if parsing fails
        setCookiePreferences({
          necessary: true,
          performance: false,
          targeting: false,
        });
        setHasCustomized(false);
      }
    } else {
      // No saved preferences, use defaults
      setCookiePreferences({
        necessary: true,
        performance: false,
        targeting: false,
      });
      setHasCustomized(false);
    }
    setIsModalOpen(true);
  };

  const handleAllowAllInModal = () => {
    setCookiePreferences({
      necessary: true,
      performance: true,
      targeting: true,
    });
    setHasCustomized(false); // Reset since we're accepting all
  };

  const handleAcceptInModal = () => {
    // Save preferences but don't set cookieConsent
    // User must click "Accept" in GDPR box to apply and close it
    localStorage.setItem("cookiePreferences", JSON.stringify({
      necessary: cookiePreferences.necessary,
      analytics: cookiePreferences.performance,
      marketing: cookiePreferences.targeting,
    }));
    setIsModalOpen(false);
    // Don't close GDPR box - user must click "Accept" in GDPR box
  };

  const handleConfirmChoices = () => {
    // Save preferences but don't set cookieConsent
    // This allows GDPR box to remain visible after refresh
    // Only "Accept" button in GDPR box will set cookieConsent
    localStorage.setItem("cookiePreferences", JSON.stringify({
      necessary: cookiePreferences.necessary,
      analytics: cookiePreferences.performance,
      marketing: cookiePreferences.targeting,
    }));
    setIsModalOpen(false);
    // Keep hasCustomized true so GDPR box button shows "Accept"
    // Don't reset hasCustomized here
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCookie = (type: "performance" | "targeting") => {
    setCookiePreferences(prev => {
      const updated = {
        ...prev,
        [type]: !prev[type],
      };
      // If all cookies are enabled (performance and targeting both true), 
      // it's equivalent to "Accept All", so reset hasCustomized
      if (updated.performance && updated.targeting) {
        setHasCustomized(false);
      } else {
        setHasCustomized(true);
      }
      return updated;
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed bottom-3 md:bottom-4 left-1/4 md:left-4 gdpr isolate bg-white rounded-lg px-3 py-3 md:p-4 shadow-[0_4px_12px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]">
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
              {hasCustomized ? "Accept" : "Accept All"}
            </Button>
          </div>
        </div>
      </div>

      {/* Privacy Preference Center Modal */}
      <Dialog 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          // When modal closes, check if preferences were customized
          if (!open && hasCustomized) {
            // Keep hasCustomized true so GDPR box button shows "Accept"
            // Preferences are already in state, ready to be applied when "Accept" is clicked
          }
        }}
      >
        <DialogContent className="privacy max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 [&>button]:!hidden !z-[99999] [&_div[data-slot='dialog-overlay']]:!z-[99998]">
          <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-['Poppins',sans-serif] text-[18px] md:text-[24px] font-semibold text-[#2c353f]">
                Privacy Preference Center
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
            {/* Introduction Text */}
            <div className="space-y-4">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[14px] text-[#5b5b5b] leading-relaxed">
                When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences or your device and is mostly used to make the site work as you expect it to. The information does not usually directly identify you, but it can give you a more personalized web experience. Because we respect your right to privacy, you can choose not to allow some types of cookies. Click on the different category headings to find out more and change our default settings. However, blocking some types of cookies may impact your experience of the site and the services we are able to offer.{" "}
                <a href="#" className="text-[#FE8A0F] hover:underline">
                  More information on our cookies.
                </a>
              </p>
            </div>

            {/* Allow All / Accept Button */}
            {hasCustomized ? (
              <Button
                onClick={handleAcceptInModal}
                className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[12px] md:text-[14px] font-semibold py-2.5 md:py-3 uppercase"
              >
                Accept
              </Button>
            ) : (
              <Button
                onClick={handleAllowAllInModal}
                className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[12px] md:text-[14px] font-semibold py-2.5 md:py-3 uppercase"
              >
                Allow All
              </Button>
            )}

            {/* Manage Consent Preferences Section */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] font-semibold text-[#2c353f]">
                Manage Consent Preferences
              </h3>

              {/* Strictly Necessary Cookies */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection("necessary")}
                  className="w-full flex items-center justify-between px-3 md:px-4 py-3 md:py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    {expandedSections.necessary ? (
                      <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-[#5b5b5b]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-[#5b5b5b]" />
                    )}
                    <span className="font-['Poppins',sans-serif] text-[14px] md:text-[16px] font-medium text-[#2c353f]">
                      Strictly Necessary Cookies
                    </span>
                  </div>
                  <span className="font-['Poppins',sans-serif] text-[12px] md:text-[14px] text-[#FE8A0F] font-medium">
                    Always Active
                  </span>
                </button>
                {expandedSections.necessary && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 pt-0 border-t border-gray-200">
                    <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#5b5b5b] leading-relaxed pt-3 md:pt-4">
                      These cookies are essential for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt-out of these cookies as they are necessary for the website to work.
                    </p>
                  </div>
                )}
              </div>

              {/* Performance Cookies */}
              <div className="border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between px-3 md:px-4 py-3 md:py-4">
                  <button
                    onClick={() => toggleSection("performance")}
                    className="flex items-center gap-2 md:gap-3 hover:bg-gray-50 -ml-3 md:-ml-4 -mr-3 md:-mr-4 px-3 md:px-4 py-2 rounded transition-colors flex-1"
                  >
                    {expandedSections.performance ? (
                      <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-[#5b5b5b]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-[#5b5b5b]" />
                    )}
                    <span className="font-['Poppins',sans-serif] text-[14px] md:text-[16px] font-medium text-[#2c353f]">
                      Performance Cookies
                    </span>
                  </button>
                  <Switch
                    checked={cookiePreferences.performance}
                    onCheckedChange={() => toggleCookie("performance")}
                    className="ml-2 md:ml-4 flex-shrink-0 data-[state=checked]:bg-[#FE8A0F]"
                  />
                </div>
                {expandedSections.performance && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 pt-0 border-t border-gray-200">
                    <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#5b5b5b] leading-relaxed pt-3 md:pt-4">
                      These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.
                    </p>
                  </div>
                )}
              </div>

              {/* Targeting Cookies */}
              <div className="border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between px-3 md:px-4 py-3 md:py-4">
                  <button
                    onClick={() => toggleSection("targeting")}
                    className="flex items-center gap-2 md:gap-3 hover:bg-gray-50 -ml-3 md:-ml-4 -mr-3 md:-mr-4 px-3 md:px-4 py-2 rounded transition-colors flex-1"
                  >
                    {expandedSections.targeting ? (
                      <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-[#5b5b5b]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-[#5b5b5b]" />
                    )}
                    <span className="font-['Poppins',sans-serif] text-[14px] md:text-[16px] font-medium text-[#2c353f]">
                      Targeting Cookies
                    </span>
                  </button>
                  <Switch
                    checked={cookiePreferences.targeting}
                    onCheckedChange={() => toggleCookie("targeting")}
                    className="ml-2 md:ml-4 flex-shrink-0 data-[state=checked]:bg-[#FE8A0F]"
                  />
                </div>
                {expandedSections.targeting && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 pt-0 border-t border-gray-200">
                    <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#5b5b5b] leading-relaxed pt-3 md:pt-4">
                      These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm My Choices Button */}
            <Button
              onClick={handleConfirmChoices}
              className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[12px] md:text-[14px] font-semibold py-2.5 md:py-3 uppercase"
            >
              Confirm My Choices
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

