import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageCircle, Paperclip, ArrowLeft, ChevronDown, X } from "lucide-react";
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
  inFavorOfName?: string | null;
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
  arbitrationPaymentsCount?: number;
  bothPartiesPaidArbitrationFee?: boolean;
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

function NativeModal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "520px",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9000 }}
      className="flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      {/* Modal box — no transform, no stacking context issue */}
      <div
        style={{ position: "relative", zIndex: 9001, maxWidth }}
        className="bg-white rounded-lg shadow-xl w-[90vw] p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold leading-tight">
              {title}
            </h2>
            {description && (
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4 text-[#2c353f]" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function FavorSelect({
  value,
  onChange,
  options,
  placeholder = "Select a party",
}: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.id === value);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-3 text-[15px] font-['Poppins',sans-serif] outline-none focus:border-[#FE8A0F] focus:ring-1 focus:ring-[#FE8A0F] cursor-pointer"
      >
        <span className={selected ? "text-[#2c353f]" : "text-[#9ca3af]"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </button>
      {open && rect && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 9002,
          }}
          className="bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-[15px] font-['Poppins',sans-serif] hover:bg-[#FFF5EE] cursor-pointer ${
                opt.id === value ? "bg-[#FFF5EE] text-[#FE8A0F] font-medium" : "text-[#2c353f]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function AdminDisputeViewPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  useAdminRouteGuard();

  const [dispute, setDispute] = useState<AdminDispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [replyRecipient, setReplyRecipient] = useState<string>("");
  const [replyComment, setReplyComment] = useState("");
  const [decisionFavor, setDecisionFavor] = useState<string>("");
  const [decisionComment, setDecisionComment] = useState("");

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
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const dLabel = days <= 1 ? "day" : "days";
      const hLabel = hours <= 1 ? "hour" : "hours";
      const mLabel = minutes <= 1 ? "min" : "mins";
      setTimeLeft(`${days} ${dLabel} ${hours} ${hLabel} ${minutes} ${mLabel}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [dispute?.responseDeadline, dispute?.negotiationDeadline]);

  const clientOffer = dispute?.clientOffer;
  const professionalOffer = dispute?.professionalOffer;
  const hasClientOffer = clientOffer !== undefined && clientOffer !== null;
  const hasProfessionalOffer = professionalOffer !== undefined && professionalOffer !== null;
  const favorOptions = dispute
    ? [
        { id: dispute.claimantId, label: dispute.claimantName || "Claimant" },
        { id: dispute.respondentId, label: dispute.respondentName || "Respondent" },
      ].filter((opt, idx, arr) => {
        const hasValidId = opt.id && opt.id.trim() !== "";
        const isFirstOccurrence = arr.findIndex((x) => x.id === opt.id) === idx;
        return hasValidId && isFirstOccurrence;
      })
    : [];
  const isArbitrationStage = dispute?.status === "admin_arbitration" || dispute?.status === "arbitration";
  const bothArbitrationFeesPaid = dispute?.bothPartiesPaidArbitrationFee === true;
  const showArbitrationActions = isArbitrationStage && bothArbitrationFeesPaid;

  const handleSubmitReply = async () => {
    if (!dispute || !replyRecipient) {
      toast.error("Please select who should receive this reply.");
      return;
    }
    try {
      const res = await fetch(resolveApiUrl(`/api/admin/disputes/${encodeURIComponent(dispute.id)}/reply`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipientId: replyRecipient,
          comment: replyComment,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send reply");
      }
      const data = await res.json();
      setDispute(data.dispute || dispute);
      setReplyComment("");
      setReplyRecipient("");
      setIsReplyOpen(false);
      toast.success("Reply sent");
    } catch (e: any) {
      toast.error(e.message || "Failed to send reply");
    }
  };

  const handleSubmitDecision = async () => {
    if (!dispute || !decisionFavor) {
      toast.error("Please select who the decision is in favor of.");
      return;
    }
    try {
      const res = await fetch(resolveApiUrl(`/api/admin/disputes/${encodeURIComponent(dispute.id)}/decide`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          winnerId: decisionFavor,
          decisionNotes: decisionComment,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit decision");
      }
      const data = await res.json();
      setDispute(data.dispute || dispute);
      setDecisionComment("");
      setDecisionFavor("");
      setIsDecisionOpen(false);
      toast.success("Final decision submitted");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit decision");
    }
  };

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
                  {(dispute.id || "").replace("DISP-", "").replace("dispute-", "")}
                </p>
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">Case status:</p>
                <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                  {dispute.status ? dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1) : ""}
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
                  const isTeamResponse = msg.isTeamResponse === true;
                  const showDeadline =
                    msg.id === dispute.messages[dispute.messages.length - 1]?.id && isClaimant && !isTeamResponse;

                  return (
                    <div
                      key={msg.id}
                      className={`border rounded-lg p-4 ${isTeamResponse ? "bg-[#FFF5EE] border-[#FFD4B8]" : showDeadline ? "bg-orange-50 border-orange-200" : "border-gray-200"}`}
                    >
                      <div className="flex gap-3">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          {resolveAvatarUrl(msg.userAvatar) && (
                            <AvatarImage src={resolveAvatarUrl(msg.userAvatar)} />
                          )}
                          <AvatarFallback className={isTeamResponse ? "bg-[#FE8A0F] text-white" : "bg-[#3D78CB] text-white"}>
                            {getTwoLetterInitials(senderName, "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="mb-2">
                            {isTeamResponse ? (
                              <p className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-medium">
                                {senderName}
                              </p>
                            ) : (
                              <>
                                {isClaimant && (
                                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                                    Claimant:
                                  </p>
                                )}
                                <p className="font-['Poppins',sans-serif] text-[15px] text-[#3D78CB] font-medium">
                                  {senderName}
                                </p>
                              </>
                            )}
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
            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-end">
              {showArbitrationActions && (
                <Button
                  onClick={() => setIsDecisionOpen(true)}
                  className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                >
                  Make Final Decision
                </Button>
              )}
              {showArbitrationActions && (
                <Button
                  onClick={() => setIsReplyOpen(true)}
                  variant="outline"
                  className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F]/10 font-['Poppins',sans-serif]"
                >
                  Reply
                </Button>
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
              £{(dispute.amount ?? 0).toFixed(0)}
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

      <NativeModal
        open={isReplyOpen}
        onClose={() => setIsReplyOpen(false)}
        title="Reply on Dispute"
      >
        <div className="space-y-6" style={{ width: "400px" }}>
          <div>
            <p className="font-['Poppins',sans-serif] text-[16px] font-medium text-[#2c353f] mb-3">Send To:</p>
            {favorOptions.length > 0 ? (
              <FavorSelect
                value={replyRecipient}
                onChange={setReplyRecipient}
                options={favorOptions}
              />
            ) : (
              <p className="font-['Poppins',sans-serif] text-[15px] text-red-500">
                Unable to load parties. Please refresh the page.
              </p>
            )}
          </div>
          <div>
            <p className="font-['Poppins',sans-serif] text-[16px] font-medium text-[#2c353f] mb-3">Comment:</p>
            <Textarea
              value={replyComment}
              onChange={(e) => setReplyComment(e.target.value)}
              rows={10}
              className="text-[15px] font-['Poppins',sans-serif] p-4 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" className="px-6 py-2 text-[15px]" onClick={() => setIsReplyOpen(false)}>
            Close
          </Button>
          <Button onClick={handleSubmitReply} className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white px-6 py-2 text-[15px]">
            Submit
          </Button>
        </div>
      </NativeModal>

      <NativeModal
        open={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        title="Make Final Decision"
        description="Select who the decision is in favor of and provide a comment."
      >
        <div className="space-y-4">
          <div>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">In Favor of:</p>
            {favorOptions.length > 0 ? (
              <FavorSelect
                value={decisionFavor}
                
                onChange={setDecisionFavor}
                options={favorOptions}
              />
            ) : (
              <p className="font-['Poppins',sans-serif] text-[14px] text-red-500">
                Unable to load parties. Please refresh the page.
              </p>
            )}
          </div>
          <div>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">Comment:</p>
            <Textarea
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setIsDecisionOpen(false)}>
            Close
          </Button>
          <Button onClick={handleSubmitDecision} className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white">
            Submit
          </Button>
        </div>
      </NativeModal>
    </div>
  );
}
