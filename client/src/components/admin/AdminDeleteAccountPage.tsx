import React from "react";
import AdminPageLayout from "./AdminPageLayout";

export default function AdminDeleteAccountPage() {
  return (
    <AdminPageLayout
      title="Delete Account"
      description="Manage account deletion requests"
      tabs={[
        { key: "client", label: "Client" },
        { key: "professional", label: "Professional" },
      ]}
      defaultTab="client"
    >
      {(activeTab) => (
        <div className="rounded-3xl border-2 border-[#FE8A0F] bg-[#07013d] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <div className="text-center py-12">
            <p className="text-lg font-semibold text-[#FE8A0F] mb-2">
              Delete Account - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </p>
            <p className="text-sm text-slate-900 dark:text-white">
              Account deletion requests for {activeTab}s will be displayed here.
            </p>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}

