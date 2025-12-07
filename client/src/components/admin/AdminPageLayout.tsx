import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  tabs?: { key: string; label: string }[];
  defaultTab?: string;
  children?: React.ReactNode | ((activeTab: string) => React.ReactNode);
  enableTabSlider?: boolean;
}

export default function AdminPageLayout({
  title,
  description,
  tabs,
  defaultTab,
  children,
  enableTabSlider = false,
}: AdminPageLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs?.[0]?.key || "");
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (tabs && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [tabs, defaultTab]);

  useEffect(() => {
    if (enableTabSlider && tabsContainerRef.current) {
      const checkScrollability = () => {
        const container = tabsContainerRef.current;
        if (!container || isScrollingRef.current) return;
        
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        const newCanScrollLeft = scrollLeft > 5; // Add small threshold to prevent flickering
        const newCanScrollRight = scrollLeft < scrollWidth - clientWidth - 5;
        
        // Only update state if values actually changed
        setCanScrollLeft((prev) => {
          if (prev !== newCanScrollLeft) {
            return newCanScrollLeft;
          }
          return prev;
        });
        
        setCanScrollRight((prev) => {
          if (prev !== newCanScrollRight) {
            return newCanScrollRight;
          }
          return prev;
        });
      };

      // Initial check
      const initialCheck = () => {
        if (scrollCheckTimeoutRef.current) {
          clearTimeout(scrollCheckTimeoutRef.current);
        }
        scrollCheckTimeoutRef.current = setTimeout(() => {
          checkScrollability();
        }, 100);
      };

      initialCheck();
      
      const container = tabsContainerRef.current;
      const handleScroll = () => {
        if (scrollCheckTimeoutRef.current) {
          clearTimeout(scrollCheckTimeoutRef.current);
        }
        scrollCheckTimeoutRef.current = setTimeout(() => {
          checkScrollability();
        }, 50);
      };

      container?.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", initialCheck, { passive: true });

      return () => {
        if (scrollCheckTimeoutRef.current) {
          clearTimeout(scrollCheckTimeoutRef.current);
        }
        container?.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", initialCheck);
      };
    }
  }, [enableTabSlider, tabs]);

  const scrollTabs = (direction: "left" | "right") => {
    if (!tabsContainerRef.current || isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    const container = tabsContainerRef.current;
    const scrollAmount = 200;
    const newPosition =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
    
    container.scrollTo({ left: newPosition, behavior: "smooth" });
    
    // Reset scrolling flag after animation
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 300);
  };

  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey);
    
    // Scroll active tab into view if slider is enabled
    if (enableTabSlider && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tabButton = container.querySelector(`[data-tab-key="${tabKey}"]`) as HTMLElement;
      if (tabButton) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = tabButton.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const tabLeft = tabRect.left - containerRect.left + scrollLeft;
        const tabWidth = tabRect.width;
        const containerWidth = container.clientWidth;
        
        // Calculate desired scroll position to center the tab
        const desiredScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
        
        container.scrollTo({
          left: Math.max(0, Math.min(desiredScroll, container.scrollWidth - containerWidth)),
          behavior: "smooth"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-6xl font-semibold text-[#FE8A0F] mb-2">{title}</h1>
        {description && (
          <p className="text-sm text-black dark:text-white">{description}</p>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="border-b border-[#FE8A0F]/30 relative">
          {enableTabSlider && (
            <>
              {canScrollLeft && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollTabs("left")}
                  className="absolute left-0 top-0 bottom-0 z-10 bg-white dark:bg-black hover:bg-[#FE8A0F]/10 border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 rounded-none h-full"
                >
                  <ChevronLeft className="h-5 w-5 text-[#FE8A0F]" />
                </Button>
              )}
              {canScrollRight && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollTabs("right")}
                  className="absolute right-0 top-0 bottom-0 z-10 bg-white dark:bg-black hover:bg-[#FE8A0F]/10 border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 rounded-none h-full"
                >
                  <ChevronRight className="h-5 w-5 text-[#FE8A0F]" />
                </Button>
              )}
            </>
          )}
          <div
            ref={tabsContainerRef}
            className={`flex gap-4 ${enableTabSlider ? "overflow-x-auto scrollbar-hide scroll-smooth" : ""}`}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingLeft: enableTabSlider ? "40px" : "0",
              paddingRight: enableTabSlider ? "40px" : "0",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                data-tab-key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.key
                    ? "text-[#FE8A0F] shadow-md shadow-[#FE8A0F]/30"
                    : "text-black dark:text-white hover:text-[#FE8A0F] hover:shadow-sm"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {typeof children === "function"
          ? children(activeTab)
          : children}
      </div>
    </div>
  );
}

