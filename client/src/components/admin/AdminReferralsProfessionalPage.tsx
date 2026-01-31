import React from "react";
import AdminPageLayout from "./AdminPageLayout";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";

export default function AdminReferralsProfessionalPage() {
  useAdminRouteGuard();
  return (
    <AdminPageLayout
      title="Referrals - Professional"
      description="Manage professional referral program"
      tabs={[
        { key: "shareable-links", label: "Shareable Links" },
        { key: "invitees", label: "Invitees" },
        { key: "pay-outs", label: "Pay Outs" },
        { key: "setting", label: "Setting" },
      ]}
      defaultTab="shareable-links"
    >
      {(activeTab) => (
        <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <div className="text-center py-12">
            <p className="text-lg font-semibold text-[#FE8A0F] mb-2">
              Professional Referrals - {activeTab.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </p>
            <p className="text-sm text-black">
              Professional referral {activeTab} management will be displayed here.
            </p>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}

