import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import {
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
} from "lucide-react";

type Status = "verified" | "pending" | "not-started" | "rejected";

type VerificationData = Record<string, { status?: string } | undefined> | null | undefined;

function normalizeStatus(raw: any): Status {
  const s = String(raw || "not-started");
  if (s === "completed") return "verified";
  if (s === "verified") return "verified";
  if (s === "pending") return "pending";
  if (s === "rejected") return "rejected";
  return "not-started";
}

export default function VerificationProgressModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verification: VerificationData;
  onGoToVerification: () => void;
  onCancel: () => void;
}) {
  const items = useMemo(() => {
    const v = props.verification || {};
    return [
      { id: "email", title: "Email Address", icon: Mail, status: normalizeStatus((v as any)?.email?.status) },
      { id: "phone", title: "Phone Number", icon: Phone, status: normalizeStatus((v as any)?.phone?.status) },
      { id: "address", title: "Address Verification", icon: MapPin, status: normalizeStatus((v as any)?.address?.status) },
      { id: "paymentMethod", title: "Payment Method", icon: CreditCard, status: normalizeStatus((v as any)?.paymentMethod?.status) },
      { id: "idCard", title: "ID Verification", icon: FileText, status: normalizeStatus((v as any)?.idCard?.status) },
      {
        id: "publicLiabilityInsurance",
        title: "Public Liability Insurance",
        icon: Shield,
        status: normalizeStatus((v as any)?.publicLiabilityInsurance?.status),
      },
    ] as const;
  }, [props.verification]);

  const verifiedCount = items.filter((i) => i.status === "verified").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const progress = Math.round((verifiedCount / items.length) * 100);
  const unverifiedItems = items.filter((i) => i.status !== "verified");

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[920px] h-[90vh] max-h-[90vh] md:h-[85vh] md:max-h-[85vh] p-0 overflow-hidden flex flex-col m-4 md:m-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Account verification progress</DialogTitle>
        </DialogHeader>
        <div className="h-full min-h-0 p-4 md:p-6 lg:p-8 flex flex-col">
          {/* Scrollable content area (progress card + list) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 -mr-2">
            {/* Progress Overview Card (same visual language as Account Verification) */}
            <div className="bg-gradient-to-br from-[#FFF5EB] via-white to-[#E3F2FD] border-2 border-[#FE8A0F] rounded-2xl p-4 md:p-6 lg:p-8 mb-4">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-[#FE8A0F] rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] lg:text-[20px] text-[#2c353f] mb-0.5 md:mb-1">
                    Verification Progress
                  </h3>
                  <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] lg:text-[13px] text-[#6b6b6b]">
                    {verifiedCount} of {items.length} items verified
                  </p>
                </div>
              </div>

              {/* Progress bar and count cards in one row on mobile */}
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5 md:mb-2">
                    <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] lg:text-[14px] text-[#2c353f]">Overall Progress</span>
                    <span className="font-['Poppins',sans-serif] text-[16px] md:text-[17px] lg:text-[18px] text-[#FE8A0F] flex-shrink-0 ml-2">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2.5 md:h-3 bg-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-[#FE8A0F] to-[#FFB347] rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </Progress>
                </div>

                <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                  <div className="bg-white rounded-xl border-2 border-green-200 p-2 md:p-3 text-center min-w-[60px] md:min-w-[70px]">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f]">{verifiedCount}</p>
                    <p className="font-['Poppins',sans-serif] text-[9px] md:text-[10px] text-[#6b6b6b]">Verified</p>
                  </div>

                  {pendingCount > 0 && (
                    <div className="bg-white rounded-xl border-2 border-yellow-200 p-2 md:p-3 text-center min-w-[60px] md:min-w-[70px]">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-600" />
                      </div>
                      <p className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f]">{pendingCount}</p>
                      <p className="font-['Poppins',sans-serif] text-[9px] md:text-[10px] text-[#6b6b6b]">Pending</p>
                    </div>
                  )}
                </div>
              </div>

              {progress < 100 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 md:px-4 md:py-3">
                  <div className="flex items-start gap-2 md:gap-3">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] lg:text-[13px] text-blue-800">
                      Complete all verification steps to increase your chances of winning jobs and earning client trust
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable items list (only not-yet-verified) */}
            <div>
              {unverifiedItems.length === 0 ? (
                <div className="bg-white border border-green-200 rounded-2xl p-4 md:p-6 max-w-[420px] w-full mx-auto md:max-w-none">
                  <div className="font-['Poppins',sans-serif] text-[14px] md:text-[15px] lg:text-[16px] text-[#2c353f] font-semibold">
                    All verification steps are completed
                  </div>
                  <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] lg:text-[13px] text-[#6b6b6b] mt-1">
                    You're fully verified. Great job!
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 md:gap-3 max-w-[420px] w-full mx-auto md:max-w-none">
                  {unverifiedItems.map((item) => {
                    const Icon = item.icon;
                    const border =
                      item.status === "pending"
                        ? "border-yellow-200"
                        : item.status === "rejected"
                          ? "border-red-200"
                          : "border-gray-200";

                    const chip =
                      item.status === "pending"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : item.status === "rejected"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-50 text-gray-700 border-gray-200";

                    const statusText = item.status === "pending" ? "Pending" : item.status === "rejected" ? "Rejected" : "Not verified";

                    return (
                      <div
                        key={item.id}
                        className={`bg-white border-2 ${border} rounded-xl px-3 py-2.5 md:px-4 md:py-3 flex items-center justify-between gap-2 md:gap-4`}
                      >
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 md:w-5 md:h-5 text-[#2c353f]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] lg:text-[14px] text-[#2c353f] font-medium truncate">
                              {item.id === "publicLiabilityInsurance" ? (
                                <>
                                  <span className="block md:hidden">Insurance</span>
                                  <span className="hidden md:inline">Public Liability Insurance</span>
                                </>
                              ) : (
                                item.title
                              )}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] md:text-[11px] lg:text-[12px] font-['Poppins',sans-serif] font-semibold border rounded-full px-2 py-0.5 md:px-3 md:py-1 ${chip} flex-shrink-0`}
                        >
                          {statusText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 md:gap-3 sm:justify-end flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-[13px] md:text-[14px] py-2 md:py-2.5"
              onClick={props.onCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white text-[13px] md:text-[14px] py-2 md:py-2.5"
              onClick={props.onGoToVerification}
            >
              Go to verification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


