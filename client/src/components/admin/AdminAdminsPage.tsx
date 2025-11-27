import React, { useState, useRef } from "react";
import AdminPageLayout from "./AdminPageLayout";
import AdminUsersTable from "./AdminUsersTable";
import AdminUserModal from "./AdminUserModal";

export default function AdminAdminsPage() {
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
    if (tableRef.current) {
      tableRef.current.refresh();
    }
  };

  return (
    <>
      <AdminPageLayout
        title="Admins"
        description="Manage admin accounts and permissions"
      >
        <AdminUsersTable
          ref={tableRef}
          role="admin"
          title="Admins"
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </AdminPageLayout>

      <AdminUserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        role="admin"
        onSuccess={handleSuccess}
      />
    </>
  );
}

