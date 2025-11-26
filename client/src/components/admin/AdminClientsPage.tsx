import React from "react";
import AdminPageLayout from "./AdminPageLayout";

export default function AdminClientsPage() {
  return (
    <AdminPageLayout
      title="Clients"
      description="Manage client accounts, permissions, and onboarding flows"
    >
      <div className="rounded-3xl border-2 border-[#FE8A0F] bg-[#07013d] p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-[#FE8A0F] mb-2">Clients Management</p>
          <p className="text-sm text-slate-900 dark:text-white">
            Client management interface will be displayed here.
          </p>
        </div>
      </div>
    </AdminPageLayout>
  );
}

