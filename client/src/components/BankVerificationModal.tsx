import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Shield, Upload } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useAccount } from "./AccountContext";
import API_BASE_URL from "../config/api";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type BankVerificationData = {
  firstName?: string;
  lastName?: string;
  address?: string;
  sortCode?: string;
  accountNumber?: string;
  bankStatementDate?: string | Date;
};

interface BankVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: BankVerificationData | null;
  onSubmitted?: () => void;
  description?: string;
}

export default function BankVerificationModal({
  open,
  onOpenChange,
  initialData,
  onSubmitted,
  description,
}: BankVerificationModalProps) {
  const { userInfo } = useAccount();
  const [uploadingFile, setUploadingFile] = useState(false);
  const [bankStatementFile, setBankStatementFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    sortCode: "",
    accountNumber: "",
    bankStatementDate: "",
  });

  const hasExistingData = useMemo(() => {
    return Boolean(initialData?.sortCode || initialData?.accountNumber);
  }, [initialData]);

  const buildAddress = (source?: {
    address?: string;
    county?: string;
    townCity?: string;
    postcode?: string;
  }) => {
    return [
      source?.address,
      source?.county,
      source?.townCity,
      source?.postcode,
    ]
      .map((value) => value?.toString().trim())
      .filter(Boolean)
      .join(", ");
  };

  useEffect(() => {
    if (!open) return;
    const statementDate =
      initialData?.bankStatementDate
        ? new Date(initialData.bankStatementDate).toISOString().split("T")[0]
        : "";
    setFormData({
      firstName: initialData?.firstName || userInfo?.firstName || "",
      lastName: initialData?.lastName || userInfo?.lastName || "",
      address: initialData?.address || buildAddress(userInfo) || "",
      sortCode: initialData?.sortCode || "",
      accountNumber: initialData?.accountNumber || "",
      bankStatementDate: statementDate,
    });
    setBankStatementFile(null);
  }, [open, initialData, userInfo]);

  const handleSubmitPaymentMethod = async () => {
    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required");
      return;
    }
    if (!formData.address.trim()) {
      toast.error("Address is required");
      return;
    }
    if (!formData.sortCode.trim()) {
      toast.error("Sort code is required");
      return;
    }
    const sortCodeDigits = formData.sortCode.replace(/\D/g, "");
    if (sortCodeDigits.length !== 6 || !/^\d+$/.test(sortCodeDigits)) {
      toast.error("Please enter a valid 6-digit sort code");
      return;
    }
    if (!formData.accountNumber.trim()) {
      toast.error("Account number is required");
      return;
    }
    const accountNumberDigits = formData.accountNumber.replace(/\D/g, "");
    if (accountNumberDigits.length < 8 || accountNumberDigits.length > 10 || !/^\d+$/.test(accountNumberDigits)) {
      toast.error("Please enter a valid account number (8-10 digits)");
      return;
    }
    if (!bankStatementFile) {
      toast.error("Please upload a bank statement");
      return;
    }
    if (!formData.bankStatementDate) {
      toast.error("Please enter the bank statement issue date");
      return;
    }

    const statementDate = new Date(formData.bankStatementDate);
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    if (statementDate > today) {
      toast.error("Bank statement date cannot be in the future");
      return;
    }
    if (statementDate < threeMonthsAgo) {
      toast.error("Bank statement must be issued within the last 3 months");
      return;
    }

    if (bankStatementFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(bankStatementFile.type)) {
      toast.error("Please upload a PDF, JPG, or PNG file");
      return;
    }

    setUploadingFile(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("document", bankStatementFile);
      uploadFormData.append("firstName", formData.firstName.trim());
      uploadFormData.append("lastName", formData.lastName.trim());
      uploadFormData.append("address", formData.address.trim());
      uploadFormData.append("sortCode", sortCodeDigits);
      uploadFormData.append("accountNumber", accountNumberDigits);
      uploadFormData.append("bankStatementDate", formData.bankStatementDate);

      const response = await fetch(`${API_BASE_URL}/api/auth/verification/paymentMethod/upload`, {
        method: "POST",
        credentials: "include",
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload payment method verification");
      }

      toast.success("Payment method verification submitted! Under review...");
      onSubmitted?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit payment method verification");
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
      <DialogContent className="w-[70vw]">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
            {hasExistingData ? "Update Bank Account Details" : "Add Bank Account Details"}
          </DialogTitle>
          {description?.trim() ? (
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px]">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="font-['Poppins',sans-serif] text-[12px] text-blue-800">
                Please upload a bank statement issued within the last 3 months. The statement should show your account number and sort code.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] mb-2">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="font-['Poppins',sans-serif]"
              />
            </div>
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] mb-2">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="font-['Poppins',sans-serif]"
              />
            </div>
          </div>

          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] mb-2">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="123 Main Street, City"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="font-['Poppins',sans-serif]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] mb-2">
                Sort Code <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="12-34-56"
                value={formData.sortCode}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 6) {
                    if (value.length > 2) {
                      value = value.slice(0, 2) + "-" + value.slice(2);
                    }
                    if (value.length > 5) {
                      value = value.slice(0, 5) + "-" + value.slice(5, 7);
                    }
                    setFormData({ ...formData, sortCode: value });
                  }
                }}
                maxLength={8}
                className="font-['Poppins',sans-serif]"
              />
            </div>
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] mb-2">
                Account Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="12345678"
                value={formData.accountNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setFormData({ ...formData, accountNumber: value });
                  }
                }}
                maxLength={10}
                className="font-['Poppins',sans-serif]"
              />
            </div>
          </div>

          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] mb-2">
              Bank Statement Issue Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={formData.bankStatementDate}
              onChange={(e) => setFormData({ ...formData, bankStatementDate: e.target.value })}
              max={new Date().toISOString().split("T")[0]}
              className="font-['Poppins',sans-serif]"
            />
            <p className="font-['Poppins',sans-serif] text-[11px] text-gray-500 mt-1">
              Must be within the last 3 months
            </p>
          </div>

          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] mb-2">
              Upload Bank Statement <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#FE8A0F] transition-colors">
              <input
                type="file"
                id="bank-statement-upload"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setBankStatementFile(file);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="bank-statement-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                {bankStatementFile ? (
                  <div className="text-center">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                      {bankStatementFile.name}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-gray-500 mt-1">
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-gray-500 mt-1">
                      PDF, JPG, or PNG (max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="font-['Poppins',sans-serif] text-[12px] text-green-800">
                Your bank account information is encrypted and secure. Documents are reviewed within 24-48 hours.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 font-['Poppins',sans-serif]"
              disabled={uploadingFile}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPaymentMethod}
              disabled={uploadingFile}
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] disabled:opacity-50"
            >
              {uploadingFile ? "Uploading..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
