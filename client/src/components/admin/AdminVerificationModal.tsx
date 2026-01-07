import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Shield,
  Eye,
  Download,
  ExternalLink,
} from "lucide-react";

import API_BASE_URL from "../../config/api";

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onOpen?: () => void;
}

const verificationTypes = [
  { id: "email", label: "Email Address", icon: Mail },
  { id: "phone", label: "Phone Number", icon: Phone },
  { id: "address", label: "Address Verification", icon: MapPin },
  { id: "idCard", label: "ID Verification", icon: FileText },
  { id: "paymentMethod", label: "Payment Method", icon: CreditCard },
  { id: "publicLiabilityInsurance", label: "Public Liability Insurance", icon: Shield },
];

export default function AdminVerificationModal({
  open,
  onClose,
  userId,
  userName,
  onOpen,
}: VerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [updatingType, setUpdatingType] = useState<string | null>(null); // Track which type is being updated
  const [verificationData, setVerificationData] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<Record<string, string>>({});
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string; type: string } | null>(null);

  useEffect(() => {
    if (open && userId) {
      // Call onOpen callback when modal opens
      if (onOpen) {
        onOpen();
      }
      fetchVerificationData();
      // Mark verification documents as viewed by admin when modal opens
      markDocumentsAsViewed();
      // Reset form states when modal opens
      setNewStatus({});
      setRejectionReason({});
      setUpdatingType(null);
    }
  }, [open, userId]); // Remove onOpen from dependencies to prevent unnecessary re-renders

  const markDocumentsAsViewed = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/verification/mark-viewed`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to mark documents as viewed');
      }
    } catch (error) {
      // console.error('Error marking documents as viewed:', error);
      // Don't show error toast to user, as this is a background operation
    }
  };

  const fetchVerificationData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/verification`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch verification data");
      }

      const data = await response.json();
      setVerificationData(data.verification || {});
    } catch (error) {
      // console.error("Error fetching verification:", error);
      toast.error("Failed to load verification data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (type: string) => {
    const status = newStatus[type];
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    if (status === "rejected" && !rejectionReason[type]?.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    // Set updating type to show loading state only for this specific type
    setUpdatingType(type);
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${userId}/verification/${type}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: status,
            rejectionReason: status === "rejected" ? rejectionReason[type] : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update verification status");
      }

      const responseData = await response.json();
      
      // Update local state immediately with the response data
      if (responseData.verification) {
        setVerificationData((prev: any) => ({
          ...prev,
          [type]: responseData.verification,
        }));
      }

      toast.success("Verification status updated successfully");
      
      // Also refetch to ensure we have the latest data from the server
      await fetchVerificationData();
      // Clear the status and reason for this type only
      setNewStatus(prev => {
        const updated = { ...prev };
        delete updated[type];
        return updated;
      });
      setRejectionReason(prev => {
        const updated = { ...prev };
        delete updated[type];
        return updated;
      });
    } catch (error) {
      // console.error("Error updating verification:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update verification status");
    } finally {
      setLoading(false);
      setUpdatingType(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5 h-5">
            <CheckCircle2 className="w-3 h-3 mr-0.5" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs px-2 py-0.5 h-5">
            <Clock className="w-3 h-3 mr-0.5" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 text-xs px-2 py-0.5 h-5">
            <XCircle className="w-3 h-3 mr-0.5" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-xs px-2 py-0.5 h-5">
            <AlertCircle className="w-3 h-3 mr-0.5" />
            Not Started
          </Badge>
        );
    }
  };

  const getVerificationInfo = (type: string) => {
    if (!verificationData || !verificationData[type]) {
      return { status: "not-started", documentUrl: null, documentName: null, rejectionReason: null };
    }
    return verificationData[type];
  };

  const getDocumentType = (url: string) => {
    if (!url) return "unknown";
    const extension = url.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return "image";
    } else if (extension === "pdf") {
      return "pdf";
    }
    return "file";
  };

  const handleViewDocument = (url: string, name: string) => {
    const docType = getDocumentType(url);
    setViewingDocument({ url, name, type: docType });
  };

  const handleDownloadDocument = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <Dialog open={open && !viewingDocument} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-black p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-semibold text-black dark:text-white">
            Verification - {userName}
          </DialogTitle>
        </DialogHeader>

        {loading && !verificationData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE8A0F] mx-auto mb-2"></div>
              <p className="text-sm text-black dark:text-white">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Verification Status List */}
            <div className="space-y-2">
              {verificationTypes.map((type) => {
                const info = getVerificationInfo(type.id);
                const Icon = type.icon;
                const currentStatus = newStatus[type.id] || "";
                const currentRejectionReason = rejectionReason[type.id] || "";
                return (
                  <div
                    key={type.id}
                    className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#FE8A0F]" />
                        <span className="text-sm font-medium text-black dark:text-white">{type.label}</span>
                      </div>
                      {getStatusBadge(info.status)}
                    </div>
                    
                    {info.documentName && info.documentUrl && (
                      <div className="mt-2 mb-2 space-y-1.5">
                        <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                          <FileText className="w-3 h-3 text-[#FE8A0F] flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">
                            {info.documentName}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(info.documentUrl, info.documentName)}
                            className="h-7 px-2 text-xs text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(info.documentUrl, info.documentName)}
                            className="h-7 px-2 text-xs text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(info.documentUrl, "_blank")}
                            className="h-7 px-2 text-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Payment Method Account Details */}
                    {type.id === "paymentMethod" && info.firstName && (
                      <div className="mt-2 mb-2 space-y-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1.5">
                          Bank Account Details
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">First Name:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100 font-medium">{info.firstName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Last Name:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100 font-medium">{info.lastName}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600 dark:text-gray-400">Address:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100 font-medium">{info.address}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Sort Code:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100 font-medium">
                              {info.sortCode ? (info.sortCode.length === 6 
                                ? `${info.sortCode.slice(0, 2)}-${info.sortCode.slice(2, 4)}-${info.sortCode.slice(4, 6)}`
                                : info.sortCode) 
                                : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100 font-medium">
                              {info.accountNumber ? `****${info.accountNumber.slice(-4)}` : "N/A"}
                            </span>
                          </div>
                          {info.bankStatementDate && (
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Statement Date:</span>
                              <span className="ml-1 text-gray-900 dark:text-gray-100 font-medium">
                                {new Date(info.bankStatementDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {info.rejectionReason && (
                      <p className="text-xs text-red-600 dark:text-red-400 mb-2 mt-1">
                        <span className="font-medium">Rejection:</span> {info.rejectionReason}
                      </p>
                    )}

                    {/* Status Changer Box - Aligned to each section */}
                    <div className="border-0 shadow-sm pt-2 mt-2 space-y-2">
                      <div>
                        <Label className="text-black dark:text-white text-xs font-medium">Status</Label>
                        <Select 
                          value={currentStatus} 
                          onValueChange={(value) => {
                            setNewStatus(prev => ({ ...prev, [type.id]: value }));
                            // Clear rejection reason if status is changed from rejected
                            if (value !== "rejected") {
                              setRejectionReason(prev => {
                                const updated = { ...prev };
                                delete updated[type.id];
                                return updated;
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black text-black dark:text-white h-8 text-xs mt-0.5">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="verified" className="text-black dark:text-white text-xs">
                              Verified
                            </SelectItem>
                            <SelectItem value="pending" className="text-black dark:text-white text-xs">
                              Pending
                            </SelectItem>
                            <SelectItem value="rejected" className="text-black dark:text-white text-xs">
                              Rejected
                            </SelectItem>
                            <SelectItem value="not-started" className="text-black dark:text-white text-xs">
                              Not Started
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {currentStatus === "rejected" && (
                        <div>
                          <Label className="text-black dark:text-white text-xs font-medium">
                            Reason <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            value={currentRejectionReason}
                            onChange={(e) => setRejectionReason(prev => ({ ...prev, [type.id]: e.target.value }))}
                            placeholder="Enter rejection reason..."
                            className="bg-white dark:bg-black text-black dark:text-white mt-0.5 border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 focus:shadow-lg focus:shadow-red-500/30 text-xs h-16 transition-shadow"
                            rows={2}
                            required
                          />
                          {currentStatus === "rejected" && !currentRejectionReason.trim() && (
                            <p className="text-xs text-red-500 mt-0.5">Required</p>
                          )}
                        </div>
                      )}

                      {currentStatus && (
                        <Button
                          onClick={() => handleStatusChange(type.id)}
                          disabled={(updatingType !== null && updatingType !== type.id) || !currentStatus || (currentStatus === "rejected" && !currentRejectionReason.trim())}
                          className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] text-white disabled:opacity-50 disabled:cursor-not-allowed h-7 text-xs"
                          size="sm"
                        >
                          {updatingType === type.id ? "Updating..." : currentStatus === "rejected" ? "Reject" : "Update"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Document Viewer Modal */}
    {viewingDocument && (
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="w-[70vw] max-h-[90vh] bg-white dark:bg-black p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-black dark:text-white">
                {viewingDocument.name}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(viewingDocument.url, viewingDocument.name)}
                  className="text-[#FE8A0F] border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(viewingDocument.url, "_blank")}
                  className="text-[#FE8A0F] border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 transition-all"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 overflow-auto max-h-[calc(90vh-120px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            {viewingDocument.type === "image" ? (
              <img
                src={viewingDocument.url}
                alt={viewingDocument.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            ) : viewingDocument.type === "pdf" ? (
              <iframe
                src={viewingDocument.url}
                className="w-full h-[calc(90vh-180px)] min-h-[600px] border-0 rounded-lg"
                title={viewingDocument.name}
              />
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-black dark:text-white mb-4">Preview not available for this file type</p>
                <Button
                  onClick={() => window.open(viewingDocument.url, "_blank")}
                  className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Document
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}

