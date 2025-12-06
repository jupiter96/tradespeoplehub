import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import API_BASE_URL from "../../config/api";

interface SubAdmin {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  permissions?: string[];
  [key: string]: any;
}

interface AdminSubAdminModalProps {
  open: boolean;
  onClose: () => void;
  subAdmin?: SubAdmin | null;
  onSuccess?: () => void;
}

// Available permissions for sub-admins
const AVAILABLE_PERMISSIONS = [
  { value: "admin-management", label: "Admin Management" },
  { value: "professionals-management", label: "Professional Management" },
  { value: "clients-management", label: "Client Management" },
  { value: "category-management", label: "Category Management" },
  { value: "package-management", label: "Package Management" },
  { value: "contact-management", label: "Contact Management" },
  { value: "region-management", label: "Region Management" },
  { value: "content-management", label: "Content Management" },
  { value: "user-plans-management", label: "User Plans Management" },
  { value: "job-management", label: "Job Management" },
  { value: "dispute-management", label: "Dispute Management" },
  { value: "ratings-management", label: "Ratings Management" },
  { value: "payment-settings", label: "Payment Settings" },
  { value: "withdrawal-request", label: "Withdrawal Request" },
  { value: "refunds", label: "Refunds" },
  { value: "message-center", label: "Message Center" },
  { value: "affiliate", label: "Affiliate" },
  { value: "referrals", label: "Referrals" },
  { value: "flagged", label: "Flagged" },
  { value: "service", label: "Service" },
  { value: "service-order", label: "Service Order" },
  { value: "custom-order", label: "Custom Order" },
  { value: "transaction-history", label: "Transaction History" },
  { value: "coupon-manage", label: "Coupon Manage" },
];

export default function AdminSubAdminModal({
  open,
  onClose,
  subAdmin,
  onSuccess,
}: AdminSubAdminModalProps) {
  const isEditMode = !!subAdmin;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    if (subAdmin) {
      setFormData({
        name: subAdmin.firstName && subAdmin.lastName 
          ? `${subAdmin.firstName} ${subAdmin.lastName}` 
          : subAdmin.name || "",
        email: subAdmin.email || "",
        password: "",
        permissions: subAdmin.permissions || [],
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        permissions: [],
      });
    }
  }, [subAdmin, open]);

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simple validation - only name, email, password, and roles are required
      const trimmedName = formData.name?.trim() || "";
      const trimmedEmail = formData.email?.trim() || "";
      const trimmedPassword = formData.password?.trim() || "";

      if (!trimmedName) {
        toast.error("Name is required");
        setLoading(false);
        return;
      }

      if (!trimmedEmail) {
        toast.error("Email is required");
        setLoading(false);
        return;
      }

      if (!isEditMode && !trimmedPassword) {
        toast.error("Password is required");
        setLoading(false);
        return;
      }

      if (formData.permissions.length === 0) {
        toast.error("Please select at least one role");
        setLoading(false);
        return;
      }

      // Split name into firstName and lastName
      const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const payload: any = {
        firstName,
        lastName,
        email: trimmedEmail.toLowerCase(),
        role: "subadmin",
        permissions: formData.permissions,
        ...(trimmedPassword && { password: trimmedPassword }),
      };

      if (isEditMode) {
        // Update sub-admin
        const response = await fetch(`${API_BASE_URL}/api/admin/admins/${subAdmin?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update sub-admin");
        }

        toast.success("Sub-admin updated successfully");
      } else {
        // Create sub-admin
        const response = await fetch(`${API_BASE_URL}/api/admin/admins`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create sub-admin");
        }

        toast.success("Sub-admin created successfully");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving sub-admin:", error);
      toast.error(error.message || "Failed to save sub-admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-0 shadow-2xl shadow-gray-400 dark:shadow-gray-950">
        <DialogHeader>
          <DialogTitle className="text-[#FE8A0F] text-2xl">
            {isEditMode ? "Edit Sub Admin" : "Add Sub Admin"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-black dark:text-white">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow mt-2"
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-black dark:text-white">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isEditMode}
              className="bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white disabled:opacity-50 focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow mt-2"
              placeholder="Enter email address"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-black dark:text-white">
              Password {!isEditMode && <span className="text-red-500">*</span>}
              {isEditMode && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!isEditMode}
              className="bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow mt-2"
              placeholder="Enter password"
            />
          </div>

          {/* Roles/Permissions */}
          <div>
            <Label className="text-black dark:text-white mb-3 block">
              Roles <span className="text-red-500">*</span>
            </Label>
            <div className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 rounded-md p-4 max-h-[300px] overflow-y-auto bg-white dark:bg-black">
              <div className="space-y-2">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission.value} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={permission.value}
                      checked={formData.permissions.includes(permission.value)}
                      onCheckedChange={() => handlePermissionToggle(permission.value)}
                      className="border-0 shadow-sm data-[state=checked]:bg-[#FE8A0F] data-[state=checked]:border-0 data-[state=checked]:shadow-md data-[state=checked]:shadow-[#FE8A0F]/30 transition-all"
                    />
                    <Label
                      htmlFor={permission.value}
                      className="text-sm font-medium cursor-pointer text-black dark:text-white"
                    >
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-[#FE8A0F] hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/90 text-white border-0 shadow-lg shadow-[#FE8A0F]/40 hover:shadow-xl hover:shadow-[#FE8A0F]/50 transition-all"
            >
              {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
