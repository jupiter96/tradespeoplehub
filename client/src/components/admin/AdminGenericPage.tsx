import React from "react";
import AdminPageLayout from "./AdminPageLayout";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";

interface AdminGenericPageProps {
  title: string;
  description?: string;
  tabs?: { key: string; label: string }[];
  defaultTab?: string;
}

export default function AdminGenericPage({
  title,
  description,
  tabs,
  defaultTab,
}: AdminGenericPageProps) {
  useAdminRouteGuard();
  
  return (
    <AdminPageLayout
      title={title}
      description={description}
      tabs={tabs}
      defaultTab={defaultTab}
    >
      {tabs && tabs.length > 0
        ? (activeTab: string) => (
            <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
              <div className="text-center py-12">
                <p className="text-sm text-black mb-4">
                  Active Tab: <span className="text-[#FE8A0F] font-semibold">{activeTab.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</span>
                </p>
                <p className="text-sm text-black">
                  This section is under development. Content will be displayed here.
                </p>
              </div>
            </div>
          )
        : (
            <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
              <div className="text-center py-12">
                <p className="text-sm text-black">
                  This section is under development. Content will be displayed here.
                </p>
              </div>
            </div>
          )}
    </AdminPageLayout>
  );
}

