import React, { useRef } from "react";
import AdminPageLayout from "./AdminPageLayout";
import AdminUsersTable from "./AdminUsersTable";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";

export default function AdminDeleteAccountPage() {
  useAdminRouteGuard();
  const tableRef = useRef<{ refresh: () => void }>(null);

  const handleEdit = (user: any) => {
    // Edit functionality can be added if needed
    console.log("Edit user:", user);
  };

  const handleDelete = (user: any) => {
    // Delete functionality - this would permanently delete
    console.log("Delete user:", user);
  };

  const handleSuccess = () => {
    if (tableRef.current) {
      tableRef.current.refresh();
    }
  };

  return (
    <AdminPageLayout
      title="Deleted Account"
      description="View and manage deleted accounts"
      tabs={[
        { key: "client", label: "Client" },
        { key: "professional", label: "Professional" },
      ]}
      defaultTab="client"
    >
      {(activeTab) => (
        <AdminUsersTable
          ref={tableRef}
          role={activeTab as "client" | "professional"}
          title={`Deleted ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Accounts`}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showVerification={false}
        />
      )}
    </AdminPageLayout>
  );
}

