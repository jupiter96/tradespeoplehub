import React, { useState, useEffect } from "react";

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  tabs?: { key: string; label: string }[];
  defaultTab?: string;
  children?: React.ReactNode | ((activeTab: string) => React.ReactNode);
}

export default function AdminPageLayout({
  title,
  description,
  tabs,
  defaultTab,
  children,
}: AdminPageLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs?.[0]?.key || "");

  useEffect(() => {
    if (tabs && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [tabs, defaultTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#FE8A0F] mb-2">{title}</h1>
        {description && (
          <p className="text-sm text-black dark:text-white">{description}</p>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="border-b border-[#FE8A0F]/30">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition-all ${
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

