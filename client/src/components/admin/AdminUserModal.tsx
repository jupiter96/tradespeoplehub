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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import AddressAutocomplete from "../AddressAutocomplete";

import API_BASE_URL from "../../config/api";
import { validatePassword, getPasswordHint } from "../../utils/passwordValidation";

interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  postcode?: string;
  townCity?: string;
  address?: string;
  travelDistance?: string;
  sector?: string;
  tradingName?: string;
  referralCode?: string;
  [key: string]: any;
}

interface AdminUserModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  role?: "client" | "professional" | "admin";
  onSuccess?: () => void;
}

export default function AdminUserModal({
  open,
  onClose,
  user,
  role = "client",
  onSuccess,
}: AdminUserModalProps) {
  const isEditMode = !!user;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    postcode: "",
    townCity: "",
    address: "",
    travelDistance: "",
    sector: "",
    tradingName: "",
    referralCode: "",
    role: role,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        postcode: user.postcode || "",
        townCity: user.townCity || "",
        address: user.address || "",
        travelDistance: user.travelDistance || "",
        sector: user.sector || "",
        tradingName: user.tradingName || "",
        referralCode: user.referralCode || "",
        role: user.role || role,
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        postcode: "",
        townCity: "",
        address: "",
        travelDistance: "",
        sector: "",
        tradingName: "",
        referralCode: "",
        role: role,
      });
    }
  }, [user, open, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation based on role
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.postcode) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Professional-specific required fields
      if (formData.role === "professional") {
        if (!formData.tradingName?.trim()) {
          toast.error("Trading name is required for professionals");
          setLoading(false);
          return;
        }
        // Town/City is only required if address is not provided
        if (!formData.address?.trim() && !formData.townCity?.trim()) {
          toast.error("Address or Town/City is required for professionals");
          setLoading(false);
          return;
        }
        if (!formData.address?.trim()) {
          toast.error("Address is required for professionals");
          setLoading(false);
          return;
        }
        if (!formData.travelDistance?.trim()) {
          toast.error("Travel distance is required for professionals");
          setLoading(false);
          return;
        }
      }

      if (!isEditMode && !formData.password) {
        toast.error("Password is required for new users");
        setLoading(false);
        return;
      }

      if (formData.password) {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
          toast.error(passwordValidation.errors[0] || "Password does not meet requirements");
          setLoading(false);
          return;
        }
      }

      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        postcode: formData.postcode.trim(),
        role: formData.role,
        ...(formData.referralCode && { referralCode: formData.referralCode.trim() }),
      };

      // Add professional-specific fields only if role is professional
      if (formData.role === "professional") {
        payload.tradingName = formData.tradingName.trim();
        payload.townCity = formData.townCity.trim();
        payload.address = formData.address.trim();
        payload.travelDistance = formData.travelDistance.trim();
        if (formData.sector) {
          payload.sector = formData.sector.trim();
        }
      }

      if (isEditMode) {
        // Update user
        if (formData.password) {
          payload.password = formData.password;
        }

        const endpoint = formData.role === "admin" ? `/api/admin/admins/${user?.id}` : `/api/admin/users/${user?.id}`;
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update user");
        }

        toast.success("User updated successfully");
      } else {
        // Create user
        payload.password = formData.password;

        const endpoint = formData.role === "admin" ? "/api/admin/admins" : "/api/admin/users";
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create user");
        }

        toast.success("User created successfully");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast.error(error.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-[#FE8A0F]">
        <DialogHeader>
          <DialogTitle className="text-[#FE8A0F] text-2xl">
            {isEditMode ? "Edit User" : "Create New User"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <Label htmlFor="firstName" className="text-black dark:text-white">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName" className="text-black dark:text-white">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
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
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-black dark:text-white">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
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
                placeholder="Must include uppercase, lowercase, and numbers"
                className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
              />
              {formData.password && (
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {getPasswordHint(formData.password)}
                </p>
              )}
              {!formData.password && !isEditMode && (
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Password must include uppercase, lowercase, and numbers
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="role" className="text-black dark:text-white">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={isEditMode && formData.role === "admin" || (!isEditMode && role !== undefined)}
              >
                <SelectTrigger className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black border-[#FE8A0F]">
                  <SelectItem value="client" className="text-black dark:text-white hover:bg-[#FE8A0F]/10">
                    Client
                  </SelectItem>
                  <SelectItem value="professional" className="text-black dark:text-white hover:bg-[#FE8A0F]/10">
                    Professional
                  </SelectItem>
                </SelectContent>
              </Select>
              {!isEditMode && role !== undefined && (
                <p className="mt-1 text-xs text-black/60 dark:text-white/60">
                  Role is pre-selected based on the page you're creating from
                </p>
              )}
            </div>

            {/* Address Autocomplete - Postcode, Full Address */}
            <div className="md:col-span-2">
              <AddressAutocomplete
                postcode={formData.postcode}
                onPostcodeChange={(value) => setFormData({ ...formData, postcode: value })}
                address={formData.address}
                onAddressChange={(value) => setFormData({ ...formData, address: value })}
                onAddressSelect={(address) => {
                  setFormData({
                    ...formData,
                    postcode: address.postcode,
                    address: address.address,
                  });
                }}
                label="Postcode"
                required
                showAddressField={formData.role === "professional"}
                showTownCityField={false}
                addressLabel="Full Address"
              />
            </div>

            {/* Professional-only fields */}
            {formData.role === "professional" && (
              <>
                {/* Trading Name */}
                <div>
                  <Label htmlFor="tradingName" className="text-black dark:text-white">
                    Trading Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tradingName"
                    value={formData.tradingName}
                    onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                    required
                    className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
                    placeholder="Your business/trading name"
                  />
                </div>

                {/* Travel Distance */}
                <div>
                  <Label htmlFor="travelDistance" className="text-black dark:text-white">
                    Travel Distance <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="travelDistance"
                    value={formData.travelDistance}
                    onChange={(e) => setFormData({ ...formData, travelDistance: e.target.value })}
                    required
                    placeholder="e.g., 15 miles"
                    className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
                  />
                </div>

                {/* Sector */}
                <div>
                  <Label htmlFor="sector" className="text-black dark:text-white">
                    Sector
                  </Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
                    placeholder="e.g., Home & Garden"
                  />
                </div>
              </>
            )}

            {/* Referral Code */}
            <div>
              <Label htmlFor="referralCode" className="text-black dark:text-white">
                Referral Code
              </Label>
              <Input
                id="referralCode"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                className="bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
              />
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {loading ? "Saving..." : isEditMode ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

