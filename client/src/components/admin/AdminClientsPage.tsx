import React, { useState, useRef } from "react";
import AdminPageLayout from "./AdminPageLayout";
import AdminUsersTable from "./AdminUsersTable";
import AdminUserModal from "./AdminUserModal";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";

export default function AdminClientsPage() {
  useAdminRouteGuard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const tableRef = useRef<{ refresh: () => void }>(null);

  const handleCreateNew = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: any) => {
    // Handled by AdminUsersTable
  };

  const handleSuccess = () => {
    // Refresh table
    if (tableRef.current) {
      tableRef.current.refresh();
    }
  };

  return (
    <>
      <AdminPageLayout
        title="Clients"
        description="Manage client accounts, permissions, and onboarding flows"
      >
        <AdminUsersTable
          ref={tableRef}
          role="client"
          title="Clients"
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </AdminPageLayout>

      <AdminUserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        role="client"
        onSuccess={handleSuccess}
      />
    </>
  );
}

