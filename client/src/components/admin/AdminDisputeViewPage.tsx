import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageCircle, Paperclip, ArrowLeft } from "lucide-react";
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { resolveAvatarUrl, getTwoLetterInitials } from "../orders/utils";
import { toast } from "sonner";

interface AdminDisputeMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp?: string;
  isTeamResponse?: boolean;
  attachments?: { url: string; fileName?: string; fileType?: string }[];
}

interface AdminDispute {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  requirements?: string;
  unmetRequirements?: string;
  evidenceFiles?: string[];
  claimantId: string;
  respondentId: string;
  claimantName: string;
  respondentName: string;
  claimantAvatar?: string;
  respondentAvatar?: string;
  amount: number;
  messages: AdminDisputeMessage[];
  clientOffer?: number;
  professionalOffer?: number;
  responseDeadline?: string;
  respondedAt?: string;
  negotiationDeadline?: string;
  createdAt?: string;
  closedAt?: string;
  milestoneIndices?: number[];
}

const resolveFileUrl = (filePath: string) => {
  if (!filePath) return "";
  let normalizedPath = filePath.replace(/\\/g, "/");
  const uploadsMatch = normalizedPath.match(/(uploads\/.+)$/i);
  if (uploadsMatch) {
    normalizedPath = "/" + uploadsMatch[1];
  } else if (!normalizedPath.startsWith("/")) {
    normalizedPath = "/uploads/" + normalizedPath;
  } else if (!normalizedPath.startsWith("/uploads")) {
    normalizedPath = "/uploads" + normalizedPath;
  }
  return resolveApiUrl(normalizedPath);
};

const getFileType = (fileName: string): "image" | "video" | "other" => {
  const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "video";
  return "other";
};

export default function AdminDisputeViewPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  useAdminRouteGuard();

  const [dispute, setDispute] = useState<AdminDispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!disputeId) {
      setLoading(false);
      return;
    }
    const fetchDispute = async () => {
      try {
        setLoading(true);
        const res = await fetch(resolveApiUrl(`/api/admin/disputes/${encodeURIComponent(disputeId)}`), {
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load dispute");
        }
        const data = await res.json();
        setDispute(data.dispute || null);
      } catch (e: any) {
        toast.error(e.message || "Failed to load dispute");
        setDispute(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDispute();
  }, [disputeId]);

  useEffect(() => {
    if (!dispute?.responseDeadline && !dispute?.negotiationDeadline) return;
    const deadline = dispute.negotiationDeadline || dispute.responseDeadline;
    const updateTimer = () => {
      const now = Date.now();
      const deadlineTime = new Date(deadline!).getTime();
      const diff = deadlineTime - now;
      if (diff <= 0) {
        setTimeLeft("Deadline passed");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${days} days, ${hours} hours`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [dispute?.responseDeadline, dispute?.negotiationDeadline]);

  const clientOffer = dispute?.clientOffer;
  const professionalOffer = dispute?.professionalOffer;
  const hasClientOffer = clientOffer !== undefined && clientOffer !== null;
  const hasProfessionalOffer = professionalOffer !== undefined && professionalOffer !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[#2c353f]">Loading dispute...</p>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">Dispute not found</h2>
          <Button
            onClick={() => navigate("/admin/dispute-list")}
            className="mt-4 bg-[#FE8A0F] hover:bg-[#FFB347]"
          >
            Back to Dispute List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
      <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-md p-6 border-b border-gray-200">
        <div>
          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">Admin — Observer view</p>
          <h1 className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] text-[#2c353f]">
            Order payment dispute
          </h1>
        </div>
        <Button
          onClick={() => navigate("/admin/dispute-list")}
          variant="ghost"
          className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] hover:text-[#2C5AA0] hover:bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dispute List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">Dispute ID:</p>
                <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                  {dispute.id.replace("DISP-", "").replace("dispute-", "")}
                </p>
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">Case status:</p>
                <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                  {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">Decided in:</p>
                <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                  {dispute.status === "open" || dispute.status === "negotiation"
                    ? "In progress"
                    : `${dispute.claimantName} favour`}
                </p>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <div className="flex gap-3 items-start">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  {resolveAvatarUrl(dispute.claimantAvatar) && (
                    <AvatarImage src={resolveAvatarUrl(dispute.claimantAvatar)} />
                  )}
                  <AvatarFallback className="bg-[#3D78CB] text-white">
                    {getTwoLetterInitials(dispute.claimantName, "C")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Claimant:</p>
                  <p className="font-['Poppins',sans-serif] text-[15px] text-[#3D78CB] font-medium mb-2">
                    {dispute.claimantName}
                  </p>
                  {dispute.evidenceFiles && dispute.evidenceFiles.length > 0 && (
                    <div className="mt-3">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">Evidence Files:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {dispute.evidenceFiles.map((file: string, idx: number) => {
                          const fileUrl = resolveFileUrl(file);
                          const fileName = file.split("/").pop() || "";
                          const fileType = getFileType(fileName);
                          return (
                            <div key={idx} className="relative group">
                              {fileType === "image" ? (
                                <img
                                  src={fileUrl}
                                  alt={fileName}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(fileUrl, "_blank")}
                                />
                              ) : fileType === "video" ? (
                                <video
                                  src={fileUrl}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer"
                                  controls
                                />
                              ) : (
                                <div
                                  className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                  onClick={() => window.open(fileUrl, "_blank")}
                                >
                                  <Paperclip className="w-6 h-6 text-gray-600" />
                                </div>
                              )}
                              <p className="font-['Poppins',sans-serif] text-[10px] text-[#6b6b6b] mt-1 truncate" title={fileName}>
                                {fileName}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {dispute.messages && dispute.messages.length > 0 ? (
                dispute.messages.map((msg) => {
                  const senderName =
                    msg.userName ||
                    (msg.userId === dispute.claimantId ? dispute.claimantName : dispute.respondentName);
                  const isClaimant = msg.userId === dispute.claimantId;
                  const showDeadline =
                    msg.id === dispute.messages[dispute.messages.length - 1]?.id && isClaimant;

                  return (
                    <div
                      key={msg.id}
                      className={`border rounded-lg p-4 ${showDeadline ? "bg-orange-50 border-orange-200" : "border-gray-200"}`}
                    >
                      <div className="flex gap-3">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          {resolveAvatarUrl(msg.userAvatar) && (
                            <AvatarImage src={resolveAvatarUrl(msg.userAvatar)} />
                          )}
                          <AvatarFallback className="bg-[#3D78CB] text-white">
                            {getTwoLetterInitials(senderName, "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="mb-2">
                            {isClaimant && (
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                                Claimant:
                              </p>
                            )}
                            <p className="font-['Poppins',sans-serif] text-[15px] text-[#3D78CB] font-medium">
                              {senderName}
                            </p>
                            {showDeadline && timeLeft && (
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#d97706] mt-1">
                                Deadline: {timeLeft}
                              </p>
                            )}
                          </div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 whitespace-pre-wrap">
                            {msg.message}
                          </p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                              {msg.attachments.map((att, attIdx) => {
                                const fileUrl = resolveFileUrl(att.url || "");
                                const fileName = att.fileName || "";
                                const fileType = att.fileType || getFileType(fileName);
                                return (
                                  <div key={attIdx} className="relative group">
                                    {fileType === "image" ? (
                                      <img
                                        src={fileUrl}
                                        alt={fileName}
                                        className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80"
                                        onClick={() => window.open(fileUrl, "_blank")}
                                      />
                                    ) : fileType === "video" ? (
                                      <video
                                        src={fileUrl}
                                        className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                        controls
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200"
                                        onClick={() => window.open(fileUrl, "_blank")}
                                      >
                                        <Paperclip className="w-6 h-6 text-gray-600" />
                                      </div>
                                    )}
                                    <p className="font-['Poppins',sans-serif] text-[10px] text-[#6b6b6b] mt-1 truncate">
                                      {fileName}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] text-right mt-2">
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).replace(",", "")
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">No messages yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {(dispute.status === "open" || dispute.status === "negotiation") && timeLeft && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <p className="font-['Poppins',sans-serif] text-[32px] text-[#2c353f] font-bold text-center mb-2">
                {timeLeft}
              </p>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] text-center">
                left for {dispute.respondentName} to respond
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
              Total disputed order
            </p>
            <p className="font-['Poppins',sans-serif] text-[42px] text-[#2c353f] font-bold mb-4">
              £{dispute.amount.toFixed(0)}
            </p>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3 text-center">
                Current Offer Status
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                    Client
                    <br />
                    wants to pay:
                  </p>
                  {hasClientOffer ? (
                    <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-bold">
                      £{clientOffer!.toFixed(2)}
                    </p>
                  ) : (
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">No offer yet</p>
                  )}
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                    Professional
                    <br />
                    want to receive:
                  </p>
                  {hasProfessionalOffer ? (
                    <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-bold">
                      £{professionalOffer!.toFixed(2)}
                    </p>
                  ) : (
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">No offer yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
