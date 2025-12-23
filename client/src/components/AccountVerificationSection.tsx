import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "./AccountContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import PhoneInput from "./PhoneInput";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Shield,
  Mail,
  CreditCard,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Eye,
  Trash2,
  CheckCheck,
  Send,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner@2.0.3";

import API_BASE_URL from "../config/api";

interface VerificationItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: "verified" | "pending" | "not-started" | "rejected";
  type: "input" | "upload";
  value?: string;
  documentUrl?: string;
  documentName?: string;
  rejectionReason?: string;
}

interface AccountVerificationSectionProps {
  onVerificationStatusChange?: () => void;
}

export default function AccountVerificationSection({ onVerificationStatusChange }: AccountVerificationSectionProps = {}) {
  const navigate = useNavigate();
  const { userInfo, refreshUserInfo } = useAccount();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState(true);
  
  // Verification code states
  const [verificationStep, setVerificationStep] = useState<"input" | "code">("input");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const [verificationData, setVerificationData] = useState<any>(null);

  // Map verification type IDs to database field names
  const verificationTypeMap: Record<string, string> = {
    "email": "email",
    "phone": "phone",
    "address": "address",
    "payment": "paymentMethod",
    "id-card": "idCard",
    "public-liability": "publicLiabilityInsurance",
  };

  // Fetch verification status from API
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verification`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch verification status");
        }

        const data = await response.json();
        setVerificationData(data.verification);
      } catch (error) {
        // console.error("Error fetching verification status:", error);
        toast.error("Failed to load verification status");
      } finally {
        setLoadingVerification(false);
      }
    };

    fetchVerificationStatus();
  }, []);

  // Build verification items from API data
  const verificationItems: VerificationItem[] = useMemo(() => {
    const allItems: VerificationItem[] = [
    {
      id: "email",
      title: "Email Address",
      description: "Verify your email address to receive important notifications",
      icon: Mail,
      status: (verificationData?.email?.status as VerificationItem["status"]) || (userInfo?.email ? "verified" : "not-started"),
      type: "input",
      value: userInfo?.email,
    },
    {
      id: "phone",
      title: "Phone Number",
      description: "Add and verify your phone number for account security",
      icon: Phone,
      status: (verificationData?.phone?.status as VerificationItem["status"]) || (userInfo?.phone ? "verified" : "not-started"),
      type: "input",
      value: userInfo?.phone,
    },
    {
      id: "address",
      title: "Address Verification",
      description: "Upload a bill statement or bank statement to verify your address",
      icon: MapPin,
      status: (verificationData?.address?.status as VerificationItem["status"]) || "not-started",
      type: "upload",
      documentUrl: verificationData?.address?.documentUrl,
      documentName: verificationData?.address?.documentName,
      rejectionReason: verificationData?.address?.rejectionReason,
    },
    {
      id: "payment",
      title: "Payment Method",
      description: "Verify your bank account to receive earnings",
      icon: CreditCard,
      status: (verificationData?.paymentMethod?.status as VerificationItem["status"]) || "not-started",
      type: "upload",
      documentUrl: verificationData?.paymentMethod?.documentUrl,
      documentName: verificationData?.paymentMethod?.documentName,
      rejectionReason: verificationData?.paymentMethod?.rejectionReason,
    },
    {
      id: "id-card",
      title: "ID Verification",
      description: "Upload a government-issued ID card or passport",
      icon: FileText,
      status: (verificationData?.idCard?.status as VerificationItem["status"]) || "not-started",
      type: "upload",
      documentUrl: verificationData?.idCard?.documentUrl,
      documentName: verificationData?.idCard?.documentName,
      rejectionReason: verificationData?.idCard?.rejectionReason,
    },
    {
      id: "public-liability",
      title: "Public Liability Insurance",
      description: "Upload proof of public liability insurance coverage",
      icon: Shield,
      status: (verificationData?.publicLiabilityInsurance?.status as VerificationItem["status"]) || "not-started",
      type: "upload",
      documentUrl: verificationData?.publicLiabilityInsurance?.documentUrl,
      documentName: verificationData?.publicLiabilityInsurance?.documentName,
      rejectionReason: verificationData?.publicLiabilityInsurance?.rejectionReason,
    },
  ];

    // Always show all items (don't filter out insurance)
    return allItems;
  }, [verificationData, userInfo]);

  const [formData, setFormData] = useState({
    email: userInfo?.email || "",
    phone: userInfo?.phone || "",
    // Payment method form data
    firstName: userInfo?.firstName || "",
    lastName: userInfo?.lastName || "",
    address: userInfo?.address || "",
    sortCode: "",
    accountNumber: "",
    bankStatementFile: null as File | null,
    bankStatementDate: "",
  });

  const currentItem = verificationItems.find((item) => item.id === selectedItem);

  const getStatusBadge = (status: VerificationItem["status"]) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 font-['Poppins',sans-serif]">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 font-['Poppins',sans-serif]">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 font-['Poppins',sans-serif]">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200 font-['Poppins',sans-serif]">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  const calculateProgress = () => {
    const verified = verificationItems.filter((item) => item.status === "verified").length;
    return Math.round((verified / verificationItems.length) * 100);
  };

  const handleOpenDialog = (itemId: string) => {
    setSelectedItem(itemId);
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedItem) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF, JPG, or PNG file");
      return;
    }

    const verificationType = verificationTypeMap[selectedItem];
    if (!verificationType) {
      toast.error("Invalid verification type");
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch(`${API_BASE_URL}/api/auth/verification/${verificationType}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload document");
      }

      const data = await response.json();
      
      // Refresh verification status
      const statusResponse = await fetch(`${API_BASE_URL}/api/auth/verification`, {
        credentials: "include",
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setVerificationData(statusData.verification);
        // Notify parent component of status change
        if (onVerificationStatusChange) {
          onVerificationStatusChange();
        }
      }

      toast.success("Document uploaded successfully! Under review...");
      setIsDialogOpen(false);
      setVerificationStep("input");
    } catch (error) {
      // console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendVerificationCode = () => {
    const value = formData[selectedItem as keyof typeof formData];
    if (!value) {
      toast.error("Please enter your information first");
      return;
    }

    // Use test code 1234 for demo
    const code = "1234";
    setSentCode(code);
    setCodeSent(true);
    setVerificationStep("code");

    // Show the code in a toast (in real app, this would be sent via email/SMS)
    toast.success(`Verification code sent! (Test code: ${code})`);
  };

  const handleVerifyCode = async () => {
    if (verificationCode !== sentCode) {
      toast.error("Invalid verification code. Please try again.");
      return;
    }

    if (!selectedItem) return;

    const verificationType = verificationTypeMap[selectedItem];
    if (!verificationType) {
      toast.error("Invalid verification type");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verification/${verificationType}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify");
      }

      // Refresh verification status
      const statusResponse = await fetch(`${API_BASE_URL}/api/auth/verification`, {
        credentials: "include",
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setVerificationData(statusData.verification);
        // Notify parent component of status change
        if (onVerificationStatusChange) {
          onVerificationStatusChange();
        }
      }

      toast.success("Verification successful!");
      setIsDialogOpen(false);
      setVerificationStep("input");
      setVerificationCode("");
      setSentCode("");
      setCodeSent(false);
    } catch (error) {
      // console.error("Verification error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to verify");
    }
  };

  const handleSubmitPaymentMethod = async () => {
    // Validate required fields
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
    // Validate sort code format (6 digits, can be formatted as XX-XX-XX or XXXXXX)
    const sortCodeDigits = formData.sortCode.replace(/\D/g, "");
    if (sortCodeDigits.length !== 6 || !/^\d+$/.test(sortCodeDigits)) {
      toast.error("Please enter a valid 6-digit sort code");
      return;
    }
    if (!formData.accountNumber.trim()) {
      toast.error("Account number is required");
      return;
    }
    // Validate account number (8-10 digits)
    const accountNumberDigits = formData.accountNumber.replace(/\D/g, "");
    if (accountNumberDigits.length < 8 || accountNumberDigits.length > 10 || !/^\d+$/.test(accountNumberDigits)) {
      toast.error("Please enter a valid account number (8-10 digits)");
      return;
    }
    if (!formData.bankStatementFile) {
      toast.error("Please upload a bank statement");
      return;
    }
    if (!formData.bankStatementDate) {
      toast.error("Please enter the bank statement issue date");
      return;
    }

    // Validate bank statement date (must be within 3 months)
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

    // Validate file size (max 10MB)
    if (formData.bankStatementFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(formData.bankStatementFile.type)) {
      toast.error("Please upload a PDF, JPG, or PNG file");
      return;
    }

    setUploadingFile(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("document", formData.bankStatementFile);
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

      // Refresh verification status
      const statusResponse = await fetch(`${API_BASE_URL}/api/auth/verification`, {
        credentials: "include",
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setVerificationData(statusData.verification);
        if (onVerificationStatusChange) {
          onVerificationStatusChange();
        }
      }

      toast.success("Payment method verification submitted! Under review...");
      setIsDialogOpen(false);
      
      // Reset payment form
      setFormData(prev => ({
        ...prev,
        sortCode: "",
        accountNumber: "",
        bankStatementFile: null,
        bankStatementDate: "",
      }));
    } catch (error) {
      // console.error("Payment method verification error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit payment method verification");
    } finally {
      setUploadingFile(false);
    }
  };



  const handleDeleteDocument = async (itemId: string) => {
    const verificationType = verificationTypeMap[itemId];
    if (!verificationType) {
      toast.error("Invalid verification type");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verification/${verificationType}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete document");
      }

      // Refresh verification status
      const statusResponse = await fetch(`${API_BASE_URL}/api/auth/verification`, {
        credentials: "include",
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setVerificationData(statusData.verification);
      }

      toast.success("Document removed");
    } catch (error) {
      // console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete document");
    }
  };

  const progress = calculateProgress();
  const verifiedCount = verificationItems.filter((item) => item.status === "verified").length;
  const pendingCount = verificationItems.filter((item) => item.status === "pending").length;

  if (loadingVerification) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE8A0F] mx-auto mb-4"></div>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
          Account Verification
        </h2>
        <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
          Complete your profile verification to build trust with clients and unlock all features
        </p>
      </div>

      {/* Progress Overview Card */}
      <div className="bg-gradient-to-br from-[#FFF5EB] via-white to-[#E3F2FD] border-2 border-[#FE8A0F] rounded-2xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-[#FE8A0F] rounded-full flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-1">
                  Verification Progress
                </h3>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                  {verifiedCount} of {verificationItems.length} items verified
                </p>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                  Overall Progress
                </span>
                <span className="font-['Poppins',sans-serif] text-[18px] text-[#FE8A0F]">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-3 bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-[#FE8A0F] to-[#FFB347] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </Progress>
            </div>

            {progress === 100 && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mt-3">
                <CheckCheck className="w-5 h-5 text-green-600" />
                <p className="font-['Poppins',sans-serif] text-[13px] text-green-700">
                  Congratulations! Your account is fully verified
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="bg-white rounded-xl border-2 border-green-200 p-4 text-center min-w-[100px]">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">
                {verifiedCount}
              </p>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                Verified
              </p>
            </div>

            {pendingCount > 0 && (
              <div className="bg-white rounded-xl border-2 border-yellow-200 p-4 text-center min-w-[100px]">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">
                  {pendingCount}
                </p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                  Pending
                </p>
              </div>
            )}
          </div>
        </div>

        {progress < 100 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="font-['Poppins',sans-serif] text-[13px] text-blue-800">
                Complete all verification steps to increase your chances of winning jobs and earning client trust
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Verification Items Grid */}
      <div className="grid gap-4">
        {verificationItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`bg-white border-2 rounded-xl p-5 transition-all duration-300 ${
                item.status === "verified"
                  ? "border-green-200 hover:border-green-300"
                  : item.status === "pending"
                  ? "border-yellow-200 hover:border-yellow-300"
                  : item.status === "rejected"
                  ? "border-red-200 hover:border-red-300"
                  : "border-gray-200 hover:border-[#FE8A0F]"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Side - Icon and Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.status === "verified"
                        ? "bg-green-100"
                        : item.status === "pending"
                        ? "bg-yellow-100"
                        : item.status === "rejected"
                        ? "bg-red-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        item.status === "verified"
                          ? "text-green-600"
                          : item.status === "pending"
                          ? "text-yellow-600"
                          : item.status === "rejected"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        {item.title}
                      </h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                      {item.description}
                    </p>

                    {/* Show value/document info */}
                    {item.value && item.status === "verified" && (
                      <div className="flex items-center gap-2 text-[#6b6b6b] font-['Poppins',sans-serif] text-[13px]">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        {item.value}
                      </div>
                    )}

                    {item.documentName && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                            {item.documentName}
                          </span>
                        </div>
                        {/* Only show delete button if status is not verified or completed */}
                        {item.status !== "verified" && item.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDocument(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-['Poppins',sans-serif]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}

                    {item.status === "rejected" && item.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-red-700">
                          <strong>Reason:</strong> {item.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Show message for insurance when set to "no" */}
                    {item.id === "public-liability" && userInfo?.hasPublicLiability === "no" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-blue-800">
                          Please go to <strong>"My Details"</strong> page and add your insurance information before you can upload verification documents.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Action Button */}
                <div className="flex gap-2 md:flex-shrink-0">
                  {item.id === "public-liability" && userInfo?.hasPublicLiability === "no" ? (
                    <Button
                      onClick={() => navigate("/account?tab=details")}
                      className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Go to My Details
                    </Button>
                  ) : item.status === "verified" ? (
                    <Button
                      variant="outline"
                      onClick={() => handleOpenDialog(item.id)}
                      className="font-['Poppins',sans-serif] text-[#3B82F6] border-[#3B82F6] hover:bg-[#EFF6FF]"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Update
                    </Button>
                  ) : item.status === "pending" ? (
                    <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 font-['Poppins',sans-serif] px-4 py-2">
                      <Clock className="w-4 h-4 mr-2" />
                      Under Review
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handleOpenDialog(item.id)}
                      className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
                    >
                      {item.type === "upload" ? (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setVerificationStep("input");
          setVerificationCode("");
          setCodeSent(false);
        }
      }}>
        <DialogContent className="w-[70vw]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
              {currentItem?.type === "upload" 
                ? "Upload Document" 
                : currentItem?.id === "payment"
                ? "Add Payment Method"
                : verificationStep === "code"
                ? "Enter Verification Code"
                : "Verify Information"}
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px]">
              {currentItem?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Payment Method - Special handling with account details */}
            {currentItem?.id === "payment" ? (
              <div className="space-y-4">
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
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
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
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
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
                          // Format as XX-XX-XX
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
                    onChange={(e) =>
                      setFormData({ ...formData, bankStatementDate: e.target.value })
                    }
                    max={new Date().toISOString().split('T')[0]}
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
                          setFormData({ ...formData, bankStatementFile: file });
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="bank-statement-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      {formData.bankStatementFile ? (
                        <div className="text-center">
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                            {formData.bankStatementFile.name}
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
                    onClick={() => setIsDialogOpen(false)}
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
            ) : /* Document Upload - for other upload types */
            currentItem?.type === "upload" ? (
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] mb-3 block">
                  Upload {currentItem.title}
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#FE8A0F] transition-all cursor-pointer">
                  <input
                    type="file"
                    id={`file-${currentItem.id}`}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  <label
                    htmlFor={`file-${currentItem.id}`}
                    className="cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                      {uploadingFile ? "Uploading..." : "Click to upload or drag and drop"}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                      PDF, JPG, PNG (max 10MB)
                    </p>
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="font-['Poppins',sans-serif] text-[12px] text-blue-800">
                      Documents are reviewed within 24-48 hours. Make sure your document is clear and valid.
                    </p>
                  </div>
                </div>
              </div>
            ) : /* Email or Phone with verification code */
            verificationStep === "input" ? (
              <div className="space-y-4">
                {currentItem?.id === "phone" ? (
                  <PhoneInput
                    id={currentItem?.id}
                    label={currentItem?.title || "Phone Number"}
                    value={formData[currentItem?.id as keyof typeof formData] || ""}
                    onChange={(value) =>
                      setFormData({ ...formData, [currentItem?.id || ""]: value })
                    }
                    placeholder="7XXX XXXXXX"
                  />
                ) : (
                <div>
                  <Label htmlFor={currentItem?.id} className="font-['Poppins',sans-serif] text-[14px] mb-2">
                    {currentItem?.title}
                  </Label>
                  <Input
                    id={currentItem?.id}
                      type="email"
                      placeholder="your.email@gmail.com"
                    value={formData[currentItem?.id as keyof typeof formData] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [currentItem?.id || ""]: e.target.value })
                    }
                    className="font-['Poppins',sans-serif]"
                  />
                </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="font-['Poppins',sans-serif] text-[12px] text-blue-800">
                      We'll send you a verification code to confirm your {currentItem?.id}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 font-['Poppins',sans-serif]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendVerificationCode}
                    className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Code
                  </Button>
                </div>
              </div>
            ) : (
              /* Verification Code Entry */
              <div className="space-y-4">
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] mb-2">
                    Enter 4-Digit Code
                  </Label>
                  <Input
                    type="text"
                    placeholder="1234"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 4) {
                        setVerificationCode(value);
                      }
                    }}
                    maxLength={4}
                    className="font-['Poppins',sans-serif] text-center text-[32px] tracking-[0.5em]"
                  />
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-2 text-center">
                    Code sent to {formData[currentItem?.id as keyof typeof formData]}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-green-800 mb-1">
                        Verification code sent successfully!
                      </p>
                      <button
                        onClick={handleSendVerificationCode}
                        className="font-['Poppins',sans-serif] text-[12px] text-green-700 underline hover:text-green-900"
                      >
                        Resend code
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setVerificationStep("input");
                      setVerificationCode("");
                    }}
                    className="flex-1 font-['Poppins',sans-serif]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 4}
                    className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
