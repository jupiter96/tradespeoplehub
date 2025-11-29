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

const API_BASE_URL = "http://localhost:5000";

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
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
}: VerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string; type: string } | null>(null);

  useEffect(() => {
    if (open && userId) {
      fetchVerificationData();
    }
  }, [open, userId]);

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
      console.error("Error fetching verification:", error);
      toast.error("Failed to load verification data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedType || !newStatus) {
      toast.error("Please select a verification type and status");
      return;
    }

    if (newStatus === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${userId}/verification/${selectedType}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            rejectionReason: newStatus === "rejected" ? rejectionReason : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update verification status");
      }

      toast.success("Verification status updated successfully");
      await fetchVerificationData();
      setSelectedType(null);
      setNewStatus("");
      setRejectionReason("");
    } catch (error) {
      console.error("Error updating verification:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update verification status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
      case "completed":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-white">
            Verification Management - {userName}
          </DialogTitle>
        </DialogHeader>

        {loading && !verificationData ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE8A0F] mx-auto mb-4"></div>
              <p className="text-black dark:text-white">Loading verification data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Verification Status List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">Current Status</h3>
              {verificationTypes.map((type) => {
                const info = getVerificationInfo(type.id);
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-[#FE8A0F]" />
                        <span className="font-medium text-black dark:text-white">{type.label}</span>
                      </div>
                      {getStatusBadge(info.status)}
                    </div>
                    {info.documentName && info.documentUrl && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <FileText className="w-4 h-4 text-[#FE8A0F]" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                            {info.documentName}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(info.documentUrl, info.documentName)}
                            className="flex-1 text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(info.documentUrl, info.documentName)}
                            className="flex-1 text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(info.documentUrl, "_blank")}
                            className="text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {info.rejectionReason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        Rejection Reason: {info.rejectionReason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Update Status Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                Update Verification Status
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-black dark:text-white">Verification Type</Label>
                  <Select value={selectedType || ""} onValueChange={setSelectedType}>
                    <SelectTrigger className="bg-white dark:bg-black text-black dark:text-white">
                      <SelectValue placeholder="Select verification type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {verificationTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id} className="text-black dark:text-white">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedType && (
                  <>
                    <div>
                      <Label className="text-black dark:text-white">New Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="bg-white dark:bg-black text-black dark:text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="verified" className="text-black dark:text-white">
                            Verified
                          </SelectItem>
                          <SelectItem value="completed" className="text-black dark:text-white">
                            Completed
                          </SelectItem>
                          <SelectItem value="pending" className="text-black dark:text-white">
                            Pending
                          </SelectItem>
                          <SelectItem value="rejected" className="text-black dark:text-white">
                            Rejected
                          </SelectItem>
                          <SelectItem value="not-started" className="text-black dark:text-white">
                            Not Started
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newStatus === "rejected" && (
                      <div>
                        <Label className="text-black dark:text-white">Rejection Reason</Label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter reason for rejection..."
                          className="bg-white dark:bg-black text-black dark:text-white"
                          rows={3}
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleStatusChange}
                      disabled={loading || !newStatus}
                      className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
                    >
                      {loading ? "Updating..." : "Update Status"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Document Viewer Modal */}
    {viewingDocument && (
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="sm:max-w-[90vw] max-w-[95vw] max-h-[90vh] bg-white dark:bg-black p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-black dark:text-white">
                {viewingDocument.name}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(viewingDocument.url, viewingDocument.name)}
                  className="text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(viewingDocument.url, "_blank")}
                  className="text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
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

