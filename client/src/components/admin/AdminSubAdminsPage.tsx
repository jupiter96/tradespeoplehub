import React, { useState, useRef } from "react";
import AdminPageLayout from "./AdminPageLayout";
import AdminUsersTable from "./AdminUsersTable";
import AdminSubAdminModal from "./AdminSubAdminModal";

export default function AdminSubAdminsPage() {
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
        title="Sub Admins"
        description="Manage sub-admin accounts with limited permissions"
      >
        <AdminUsersTable
          ref={tableRef}
          role="admin"
          title="Sub Admins"
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </AdminPageLayout>

      <AdminSubAdminModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subAdmin={selectedUser}
        onSuccess={handleSuccess}
      />
    </>
  );
}

