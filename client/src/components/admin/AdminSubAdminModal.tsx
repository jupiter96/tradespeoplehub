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
  { value: "tradesmen-management", label: "Tradesmen Management" },
  { value: "homeowners-management", label: "Homeowners Management" },
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
    confirmPassword: "",
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
        confirmPassword: "",
        permissions: subAdmin.permissions || [],
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
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
      // Validation
      if (!formData.name || !formData.email) {
        toast.error("Name and email are required");
        setLoading(false);
        return;
      }

      if (!isEditMode && !formData.password) {
        toast.error("Password is required for new sub-admins");
        setLoading(false);
        return;
      }

      if (formData.password && formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      if (!isEditMode && formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      if (formData.permissions.length === 0) {
        toast.error("Please select at least one permission");
        setLoading(false);
        return;
      }

      // Split name into firstName and lastName
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const payload: any = {
        firstName,
        lastName,
        email: formData.email.trim().toLowerCase(),
        role: "admin",
        permissions: formData.permissions,
        ...(formData.password && { password: formData.password }),
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-[#FE8A0F]">
        <DialogHeader>
          <DialogTitle className="text-[#FE8A0F] text-2xl">
            {isEditMode ? "Edit Sub Admin" : "Add Sub Admin"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
              className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
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
              className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white disabled:opacity-50"
              placeholder="Email"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-black dark:text-white">
              Password {!isEditMode && <span className="text-red-500">*</span>}
              {isEditMode && <span className="text-xs text-black/60 dark:text-white/60">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!isEditMode}
              minLength={6}
              className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
              placeholder="Password"
            />
          </div>

          {/* Confirm Password - Only for new sub-admins */}
          {!isEditMode && (
            <div>
              <Label htmlFor="confirmPassword" className="text-black dark:text-white">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
                placeholder="Confirm Password"
              />
            </div>
          )}

          {/* Roles/Permissions */}
          <div>
            <Label className="text-black dark:text-white mb-3 block">
              Roles <span className="text-red-500">*</span>
            </Label>
            <div className="border border-[#FE8A0F] rounded-md p-4 max-h-[300px] overflow-y-auto bg-white dark:bg-black">
              <div className="space-y-2">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.value}
                      checked={formData.permissions.includes(permission.value)}
                      onCheckedChange={() => handlePermissionToggle(permission.value)}
                      className="border-[#FE8A0F] data-[state=checked]:bg-[#FE8A0F] data-[state=checked]:border-[#FE8A0F]"
                    />
                    <Label
                      htmlFor={permission.value}
                      className="text-sm font-normal cursor-pointer text-black dark:text-white"
                    >
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#FE8A0F]/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {loading ? "Saving..." : isEditMode ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



