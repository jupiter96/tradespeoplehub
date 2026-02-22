import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useJobs } from "./JobsContext";
import { useOrders } from "./OrdersContext";
import { useAccount } from "./AccountContext";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { MessageCircle, Clock, AlertCircle, Send, Paperclip, X, XCircle, CreditCard, Wallet, Info } from "lucide-react";
import { toast } from "sonner@2.0.3";
import SEOHead from "./SEOHead";
import { resolveApiUrl } from "../config/api";
import { resolveAvatarUrl, getTwoLetterInitials } from "./orders/utils";
import paypalLogo from "../assets/paypal-logo.png";
import adminAvatar from "figma:asset/e0cd63eca847c922f306abffb67a5c6de3fd7001.png";

const getCardType = (brand?: string, cardNumber?: string): "visa" | "mastercard" | "unknown" => {
  if (brand) {
    const b = brand.toLowerCase();
    if (b.includes("visa")) return "visa";
    if (b.includes("mastercard") || b.includes("master")) return "mastercard";
  }
  if (cardNumber) {
    const last4 = cardNumber.slice(-4);
    if (last4.startsWith("4")) return "visa";
    if (last4.startsWith("5")) return "mastercard";
  }
  return "visa";
};

const VisaLogo = () => (
  <svg width="48" height="32" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white" />
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1" />
    <path d="M22.5859 22.75H19.9609L21.7859 14H24.4109L22.5859 22.75ZM17.7109 14L15.2109 20.125L14.9109 18.375L14.0359 14.875C14.0359 14.875 13.8859 14 13.2859 14H9.08594V14.15C9.08594 14.15 10.2609 14.45 11.5859 15.175L13.9609 22.75H16.8359L20.9609 14H17.7109ZM37.8359 22.75H40.1859L38.2859 14H36.2859C35.8359 14 35.5359 14.3 35.3859 14.75L31.4609 22.75H34.3359L34.9359 21.3H38.3359L38.6359 22.75H37.8359ZM35.6359 19.125L36.9609 16.0625L37.6859 19.125H35.6359ZM31.5859 16.875L32.0359 14.875C32.0359 14.875 30.8609 14 29.6859 14C28.3609 14 25.3359 14.75 25.3359 17.5625C25.3359 20.1875 29.1859 20.1875 29.1859 21.3125C29.1859 22.4375 25.9609 22.1875 24.9359 21.4375L24.4859 23.4375C24.4859 23.4375 25.6609 24 27.4359 24C29.0609 24 31.8359 23.125 31.8359 20.5C31.8359 17.875 28.0359 17.625 28.0359 16.75C28.0359 15.75 30.5359 15.875 31.5859 16.875Z" fill="#1434CB" />
  </svg>
);

const MastercardLogo = () => (
  <svg width="48" height="32" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white" />
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1" />
    <circle cx="21" cy="18" r="8" fill="#EB001B" />
    <circle cx="35" cy="18" r="8" fill="#F79E1B" />
    <path d="M28 11.5C26.25 13 25 15.35 25 18C25 20.65 26.25 23 28 24.5C29.75 23 31 20.65 31 18C31 15.35 29.75 13 28 11.5Z" fill="#FF5F00" />
  </svg>
);

export default function DisputeDiscussionPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getDisputeById, getJobById, addDisputeMessage, makeDisputeOffer } = useJobs();
  const { getOrderDisputeById, addOrderDisputeMessage, makeOrderDisputeOffer, acceptDisputeOffer, rejectDisputeOffer, cancelDispute, refreshOrders, orders } = useOrders();
  const { currentUser } = useAccount();
  
  // Try to get dispute from both contexts
  const [dispute, setDispute] = useState<any | null>(null);
  const [job, setJob] = useState<any | undefined>(undefined);
  const [order, setOrder] = useState<any | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [newOffer, setNewOffer] = useState("");
  const [showMilestones, setShowMilestones] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [hasReplied, setHasReplied] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isArbitrationWarningOpen, setIsArbitrationWarningOpen] = useState(false);
  const [isArbitrationPaymentOpen, setIsArbitrationPaymentOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(
    typeof (currentUser as any)?.walletBalance === "number" ? (currentUser as any).walletBalance : 0
  );
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [isPayingArbitration, setIsPayingArbitration] = useState(false);
  // Controls whether Accept/Reject buttons are expanded in Current Offer Status card
  const [showRespondActions, setShowRespondActions] = useState(false);
  const [isAcceptConfirmOpen, setIsAcceptConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  
  // Determine if this is an order dispute or job dispute
  const isOrderDispute = dispute && "orderId" in dispute;

  useEffect(() => {
    const jobDispute = getDisputeById(disputeId || "");
    const orderDispute = getOrderDisputeById(disputeId || "");
    const currentDispute = jobDispute || orderDispute;
    setDispute(currentDispute);
    
    if (currentDispute) {
      if ("jobId" in currentDispute) {
        setJob(getJobById(currentDispute.jobId));
      } else if ("orderId" in currentDispute) {
        const foundOrder = orders.find(o => o.disputeId === disputeId);
        setOrder(foundOrder);
      }
    }
  }, [disputeId, getDisputeById, getOrderDisputeById, getJobById, orders]);

  const handleSendMessage = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || !disputeId) return;
    let messageResponseData: { dispute?: { status?: string; respondedAt?: string; negotiationDeadline?: string; messages?: any[] } } = {};
    try {
      if (isOrderDispute) {
        const order = orders.find(o => o.disputeId === disputeId);
        if (!order) {
          toast.error("Order not found");
          return;
        }

        const formData = new FormData();
        formData.append('message', message.trim() || '');
        selectedFiles.forEach((file) => {
          formData.append('attachments', file);
        });

        const response = await fetch(resolveApiUrl(`/api/orders/${order.id}/dispute/message`), {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const data = await response.json().catch(() => ({}));
        messageResponseData = data;
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send message');
        }

        setMessage("");
        setSelectedFiles([]);
        setHasReplied(true);
        toast.success("Message sent");

        // If server returned updated dispute (first response → negotiation), merge so timer resets to step-in deadline immediately
        if (data.dispute?.negotiationDeadline != null || data.dispute?.respondedAt != null) {
          setDispute((prev: any) =>
            prev
              ? {
                  ...prev,
                  status: data.dispute?.status ?? prev.status,
                  respondedAt: data.dispute?.respondedAt ?? prev.respondedAt,
                  negotiationDeadline: data.dispute?.negotiationDeadline ?? prev.negotiationDeadline,
                  messages: Array.isArray(data.dispute?.messages) ? data.dispute.messages : prev.messages,
                }
              : prev
          );
        }

        // Refresh orders so list/context stay in sync
        await refreshOrders?.();
      } else {
        addDisputeMessage(disputeId, message);
        setMessage("");
        setSelectedFiles([]);
        setHasReplied(true);
        toast.success("Message sent");
      }

      // Refresh dispute from context (only if we didn't already set from server response)
      if (!isOrderDispute) {
        setDispute(getDisputeById(disputeId));
      } else if (!messageResponseData?.dispute?.negotiationDeadline && !messageResponseData?.dispute?.respondedAt) {
        setDispute(getOrderDisputeById(disputeId));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const resolveFileUrl = (filePath: string) => {
    if (!filePath) return '';
    
    // Already a full URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // Normalize the path - handle both absolute and relative paths
    let normalizedPath = filePath.replace(/\\/g, '/'); // Convert backslashes to forward slashes
    
    // Extract the uploads path from absolute paths
    // e.g., "E:/trades_new/server/uploads/disputes/file.jpg" -> "/uploads/disputes/file.jpg"
    const uploadsMatch = normalizedPath.match(/(uploads\/.+)$/i);
    if (uploadsMatch) {
      normalizedPath = '/' + uploadsMatch[1];
    } else if (!normalizedPath.startsWith('/')) {
      // If it's a relative path without /uploads, add it
      normalizedPath = '/uploads/' + normalizedPath;
    } else if (!normalizedPath.startsWith('/uploads')) {
      // If it starts with / but not /uploads, prepend uploads
      normalizedPath = '/uploads' + normalizedPath;
    }
    
    // Use resolveApiUrl to get full URL
    return resolveApiUrl(normalizedPath);
  };

  const getFileType = (fileName: string): 'image' | 'video' | 'other' => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video';
    return 'other';
  };

  const handleMakeOffer = async () => {
    if (!newOffer || !disputeId || !dispute) return;
    if (isRespondent && !respondentHasReplied) {
      toast.error("You cannot submit an offer without first replying to the dispute.");
      return;
    }
    const amount = parseFloat(newOffer);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!isCurrentUserClient && typeof userOffer === "number" && amount > userOffer) {
      toast.error("You cannot make an offer higher than your initial offer.");
      return;
    }
    if (isCurrentUserClient && typeof userOffer === "number" && amount < userOffer) {
      toast.error("You cannot make an offer lower than your initial offer.");
      return;
    }
    if (amount > maxOfferAmount) {
      toast.error(`Offer cannot exceed ${isOrderDispute ? "order" : "milestone"} amount of £${maxOfferAmount.toFixed(2)}`);
      return;
    }
    try {
      if (isOrderDispute) {
        await makeOrderDisputeOffer(disputeId, amount);
      } else {
        makeDisputeOffer(disputeId, amount);
      }
      setNewOffer("");
      toast.success("Offer submitted");
      // Refresh dispute
      if (isOrderDispute) {
        setDispute(getOrderDisputeById(disputeId));
      } else {
        setDispute(getDisputeById(disputeId));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit offer");
    }
  };

  const handleAcceptOffer = async () => {
    if (!disputeId) return;
    try {
      const acceptAction = isOrderDispute ? acceptDisputeOffer(disputeId) : Promise.resolve();
      await toast.promise(acceptAction, {
        loading: "Processing...",
        success: "Dispute resolved successfully",
        error: (e: any) => e?.message || "Failed to accept offer",
      });
      if (isOrderDispute && order?.id) {
        navigate(`/account?tab=orders&orderId=${order.id}`);
      } else {
        const jobId = (job as any)?.id || (job as any)?._id;
        navigate(jobId ? `/account?tab=jobs&jobId=${jobId}` : "/account?tab=jobs");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to accept offer");
    }
  };

  const handleRejectOffer = async () => {
    if (!disputeId) return;
    try {
      if (isOrderDispute) {
        await rejectDisputeOffer(disputeId);
      }
      toast.success("Offer rejected");
      // Refresh orders first to get updated dispute info, then refresh dispute
      if (isOrderDispute) {
        await refreshOrders();
        setDispute(getOrderDisputeById(disputeId));
      } else {
        setDispute(getDisputeById(disputeId));
      }
      setShowRespondActions(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to reject offer");
    }
  };

  const handleConfirmAccept = async () => {
    setIsAcceptConfirmOpen(false);
    await handleAcceptOffer();
  };

  const handleConfirmReject = async () => {
    setIsRejectConfirmOpen(false);
    await handleRejectOffer();
  };

  const formatDeadlineDateTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  /** DD-MM-YYYY HH:MM AM/PM for arbitration warning modal */
  const formatArbitrationDeadline = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${d}-${m}-${y} ${time}`;
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/payment/wallet/balance"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const rawBalance = data?.balance;
        const parsedBalance = typeof rawBalance === "number" ? rawBalance : parseFloat(rawBalance || "0");
        const balance = Number.isFinite(parsedBalance) ? parsedBalance : 0;
        setWalletBalance(balance);
        return balance;
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
    const fallback =
      typeof (currentUser as any)?.walletBalance === "number" ? (currentUser as any).walletBalance : 0;
    setWalletBalance(fallback);
    return fallback;
  };

  const fetchPaymentMethods = async (balanceForDisplay?: number) => {
    setLoadingPaymentMethods(true);
    try {
      const [methodsResponse, settingsResponse] = await Promise.all([
        fetch(resolveApiUrl("/api/payment-methods"), { credentials: "include" }),
        fetch(resolveApiUrl("/api/payment/publishable-key"), { credentials: "include" }),
      ]);
      let paypalEnabled = false;
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        paypalEnabled = Boolean(settingsData.paypalEnabled);
      }
      const methods: any[] = [
        {
          id: "account_balance",
          type: "account_balance",
          isDefault: true,
          balance: typeof balanceForDisplay === "number" ? balanceForDisplay : walletBalance,
        },
      ];
      if (methodsResponse.ok) {
        const data = await methodsResponse.json();
        methods.push(
          ...(data.paymentMethods || []).map((pm: any) => {
            const last4 = pm.card?.last4 || pm.last4 || (pm.cardNumber ? String(pm.cardNumber).slice(-4) : null);
            return {
              id: pm.paymentMethodId || pm.id,
              type: "card",
              cardNumber: last4 ? `**** **** **** ${last4}` : "**** **** **** ****",
              cardHolder: pm.billing_details?.name || pm.cardHolder || "Card Holder",
              expiryDate: pm.card?.exp_month && pm.card?.exp_year ? `${pm.card.exp_month}/${(pm.card.exp_year % 100)}` : pm.expiryDate || "MM/YY",
              isDefault: pm.isDefault || false,
              brand: pm.card?.brand || pm.brand || "visa",
            };
          })
        );
      }
      if (paypalEnabled) {
        methods.push({ id: "paypal", type: "paypal", isDefault: false });
      }
      setPaymentMethods(methods);
      const defaultMethod = methods.find((m: any) => m.isDefault) || methods[0];
      if (defaultMethod) {
        setSelectedPayment(defaultMethod.id);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  useEffect(() => {
    if (isArbitrationPaymentOpen) {
      fetchWalletBalance().then((balance) => fetchPaymentMethods(balance));
    }
  }, [isArbitrationPaymentOpen]);

  // Keep local wallet balance in sync with account context (client/pro both)
  useEffect(() => {
    if (typeof (currentUser as any)?.walletBalance === "number") {
      setWalletBalance((currentUser as any).walletBalance);
    }
  }, [currentUser]);

  // Handle return from PayPal: capture arbitration fee and clear URL params
  useEffect(() => {
    const paypalCapture = searchParams.get("paypalCapture");
    const token = searchParams.get("token");
    const orderIdFromUrl = searchParams.get("orderId");
    if (paypalCapture !== "1" || !token || !orderIdFromUrl) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(resolveApiUrl(`/api/orders/${orderIdFromUrl}/dispute/capture-paypal-arbitration`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ paypalOrderId: token }),
        });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          toast.error(data.error || "Failed to complete PayPal payment");
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("paypalCapture");
            next.delete("token");
            next.delete("orderId");
            return next;
          });
          return;
        }
        toast.success(data.message || "Arbitration fee paid.");
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("paypalCapture");
          next.delete("token");
          next.delete("orderId");
          return next;
        });
        await refreshOrders();
        if (!cancelled) setDispute(getOrderDisputeById(disputeId || ""));
      } catch (e: any) {
        if (!cancelled) {
          toast.error(e?.message || "Failed to complete PayPal payment");
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("paypalCapture");
            next.delete("token");
            next.delete("orderId");
            return next;
          });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams, disputeId, getOrderDisputeById, refreshOrders, setSearchParams]);

  const handleRequestArbitration = async () => {
    if (!order?.id || !isOrderDispute) return;
    const deadline = dispute?.negotiationDeadline;
    const deadlineTime = deadline ? new Date(deadline).getTime() : null;
    if (deadlineTime && Date.now() < deadlineTime) {
      setIsArbitrationWarningOpen(true);
      return;
    }
    setIsArbitrationPaymentOpen(true);
  };

  const handlePayArbitrationFee = async () => {
    if (!order?.id || !selectedPayment) return;
    const selectedMethod = paymentMethods.find((m: any) => m.id === selectedPayment);
    const feeAmount = typeof dispute?.arbitrationFeeAmount === "number" ? dispute.arbitrationFeeAmount : 0;
    if (!feeAmount || feeAmount <= 0) {
      toast.error("Arbitration fee is not available");
      return;
    }
    let latestBalance = walletBalance;
    if (selectedMethod?.type === "account_balance") {
      latestBalance = await fetchWalletBalance();
    }
    if (selectedMethod?.type === "account_balance" && latestBalance < feeAmount) {
      toast.error(`Insufficient wallet balance. Fee is £${feeAmount.toFixed(2)}.`);
      return;
    }
    setIsPayingArbitration(true);
    try {
      const paymentPayload: { paymentMethod: string; paymentMethodId?: string } = {
        paymentMethod: selectedMethod?.type === "account_balance" ? "account_balance" : selectedMethod?.type === "paypal" ? "paypal" : "card",
        paymentMethodId: selectedMethod?.type === "card" ? selectedMethod.id : undefined,
      };
      const response = await fetch(resolveApiUrl(`/api/orders/${order.id}/dispute/request-arbitration`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(paymentPayload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to request arbitration");
      }
      if (data.requiresRedirect && data.approveUrl) {
        window.location.href = data.approveUrl;
        return;
      }
      toast.success(data.message || "Arbitration payment submitted.");
      setIsArbitrationPaymentOpen(false);
      setDispute(getOrderDisputeById(disputeId || ""));
      refreshOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to request arbitration");
    } finally {
      setIsPayingArbitration(false);
    }
  };

  const handleCancelDispute = async () => {
    if (!disputeId || !order) return;
    try {
      await cancelDispute(order.id);
      toast.success("Dispute cancelled successfully");
      setIsCancelConfirmOpen(false);
      navigate(isOrderDispute ? "/account?tab=orders" : "/account?tab=jobs");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel dispute");
    }
  };

  // Calculate time left until response/negotiation/arbitration-fee deadline
  // This useEffect must be before early returns to satisfy Rules of Hooks
  useEffect(() => {
    if (!dispute?.responseDeadline && !dispute?.negotiationDeadline && !dispute?.arbitrationFeeDeadline) return;

    const updateTimer = () => {
      const now = Date.now();
      // Compute isNegotiationPhase locally to avoid dependency issues
      const respondentIdStrLocal = typeof dispute?.respondentId === 'object'
        ? (dispute?.respondentId as any)?._id?.toString() || dispute?.respondentId?.toString()
        : dispute?.respondentId;
      const respondentHasRepliedLocal = Boolean(
        dispute?.respondedAt ||
        (dispute?.messages || []).some((msg: any) => {
          const msgUserId = typeof msg.userId === "object"
            ? (msg.userId as any)?._id?.toString() || msg.userId?.toString()
            : msg.userId;
          return respondentIdStrLocal && msgUserId && String(msgUserId) === String(respondentIdStrLocal);
        }) || (currentUser?.id === respondentIdStrLocal && hasReplied)
      );
      // Use step-in (negotiation) deadline when respondent has replied; otherwise use initial response deadline
      const isNegotiationPhaseLocal = Boolean(
        dispute?.negotiationDeadline && (dispute?.status === "negotiation" || respondentHasRepliedLocal)
      );
      const paidUserIdsLocal = new Set(
        (dispute?.arbitrationPayments || [])
          .map((p: any) => {
            const uid = p?.userId;
            return typeof uid === "object" ? uid?._id?.toString?.() || uid?.toString?.() : uid?.toString?.();
          })
          .filter(Boolean)
      );
      const isArbitrationFeeWaitingStageLocal = Boolean(
        dispute?.arbitrationFeeDeadline &&
          paidUserIdsLocal.size === 1 &&
          dispute?.status !== "admin_arbitration" &&
          dispute?.status !== "closed"
      );

      const deadline = isArbitrationFeeWaitingStageLocal
        ? dispute?.arbitrationFeeDeadline
        : (isNegotiationPhaseLocal ? dispute?.negotiationDeadline : dispute?.responseDeadline);
      if (!deadline) {
        setTimeLeft("");
        return;
      }
      const deadlineTime = new Date(deadline).getTime();
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
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dispute?.responseDeadline, dispute?.negotiationDeadline, dispute?.arbitrationFeeDeadline, dispute?.arbitrationPayments, dispute?.status, dispute?.respondedAt, dispute?.respondentId, dispute?.messages, currentUser?.id, hasReplied]);

  if (!dispute || (!job && !order)) {
    return (
      <>
        <SEOHead
          title="Dispute Not Found"
          description="Dispute not found"
          robots="noindex,nofollow"
        />
        <div className="min-h-screen bg-[#f0f0f0]">
          <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
            <Nav />
          </header>
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-20 mt-[50px] md:mt-0 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
              Dispute Not Found
            </h1>
            <Button
              onClick={() => navigate(isOrderDispute ? "/account?tab=orders" : "/account?tab=jobs")}
              className="mt-4 bg-[#FE8A0F] hover:bg-[#FFB347]"
            >
              Go to My {isOrderDispute ? "Orders" : "Jobs"}
            </Button>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  // Determine if current user is client or professional
  // Convert to string to handle both ObjectId and string types
  const claimantIdStr = typeof dispute.claimantId === 'object'
    ? (dispute.claimantId as any)?._id?.toString() || dispute.claimantId?.toString()
    : dispute.claimantId;
  const respondentIdStr = typeof dispute.respondentId === 'object'
    ? (dispute.respondentId as any)?._id?.toString() || dispute.respondentId?.toString()
    : dispute.respondentId;
  const isClaimant = currentUser?.id === claimantIdStr;
  const isRespondent = currentUser?.id === respondentIdStr;
  const respondentHasReplied = Boolean(
    (dispute.messages || []).some((msg: any) => {
      const msgUserId = typeof msg.userId === "object"
        ? (msg.userId as any)?._id?.toString() || msg.userId?.toString()
        : msg.userId;
      return respondentIdStr && msgUserId && String(msgUserId) === String(respondentIdStr);
    }) || (isRespondent && hasReplied)
  );
  // Negotiation phase: respondent has replied (timer restarts from step-in time) or status is negotiation
  const isNegotiationPhase = Boolean(
    dispute?.negotiationDeadline && (dispute?.status === "negotiation" || respondentHasReplied)
  );
  // Show "ask admin to step in" label as soon as the other side has replied
  const showAdminStepInLabel = Boolean(
    dispute?.status === "negotiation" || respondentHasReplied
  );
  const hasPaidArbitrationFee = Boolean(
    (dispute?.arbitrationPayments || []).some((p: any) => p?.userId?.toString?.() === currentUser?.id)
  );
  const arbitrationPaidUserIds = new Set(
    (dispute?.arbitrationPayments || [])
      .map((p: any) => {
        const uid = p?.userId;
        return typeof uid === "object" ? uid?._id?.toString?.() || uid?.toString?.() : uid?.toString?.();
      })
      .filter(Boolean)
  );
  const isWaitingOtherPartyArbitrationFee = Boolean(
    dispute?.arbitrationFeeDeadline &&
      arbitrationPaidUserIds.size === 1 &&
      dispute?.status !== "admin_arbitration" &&
      dispute?.status !== "closed"
  );
  const hasAnyArbitrationPayment = Boolean((dispute?.arbitrationPayments || []).length > 0);
  const bothPaidArbitrationFee = arbitrationPaidUserIds.size >= 2;
  const arbitrationPaymentsOrdered = [...(dispute?.arbitrationPayments || [])]
    .sort((a: any, b: any) => {
      const at = a?.paidAt ? new Date(a.paidAt).getTime() : 0;
      const bt = b?.paidAt ? new Date(b.paidAt).getTime() : 0;
      return at - bt;
    })
    .map((payment: any) => {
      const payerId = payment?.userId
        ? (typeof payment.userId === "object"
            ? payment.userId?._id?.toString?.() || payment.userId?.toString?.()
            : payment.userId?.toString?.())
        : null;
      const payerName =
        payerId && String(payerId) === String(claimantIdStr)
          ? (dispute?.claimantName || "One party")
          : payerId && String(payerId) === String(respondentIdStr)
            ? (dispute?.respondentName || "One party")
            : "One party";
      const amount =
        typeof payment?.amount === "number"
          ? payment.amount
          : (typeof dispute?.arbitrationFeeAmount === "number" ? dispute.arbitrationFeeAmount : 0);
      return { payment, payerId, payerName, amount };
    });
  const firstPaymentPayerId = arbitrationPaymentsOrdered[0]?.payerId || null;
  const firstPayerName = arbitrationPaymentsOrdered[0]?.payerName || "One party";
  const arbitrationUnpaidPartyName =
    firstPaymentPayerId && String(firstPaymentPayerId) === String(claimantIdStr)
      ? (dispute?.respondentName || "The other party")
      : (dispute?.claimantName || "The other party");
  const arbitrationDaysToPay = dispute?.arbitrationFeeDeadline
    ? Math.max(0, Math.ceil((new Date(dispute.arbitrationFeeDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const displayTimeLeft = bothPaidArbitrationFee ? "0 day 0 hour 0 min" : timeLeft;
  // Show "Ask to admin step in" button as soon as respondent has replied (negotiation phase); no need to wait for negotiationDeadline in state
  const canShowArbitrationButton = Boolean(
    isOrderDispute &&
      order?.id &&
      (isNegotiationPhase || respondentHasReplied) &&
      dispute?.status !== "admin_arbitration" &&
      dispute?.status !== "closed" &&
      !hasPaidArbitrationFee
  );

  // Negotiation deadline has passed → arbitration stage: user can pay fee to ask admin to step in (no warning modal)
  const negotiationDeadlineTime = dispute?.negotiationDeadline ? new Date(dispute.negotiationDeadline).getTime() : null;
  const isNegotiationDeadlinePassed = Boolean(
    isNegotiationPhase && negotiationDeadlineTime != null && Date.now() >= negotiationDeadlineTime
  );

  // For order disputes, check order.clientId, for job disputes use claimantId
  let isCurrentUserClient = false;
  if (order) {
    // Order dispute: check if current user is the client
    isCurrentUserClient = currentUser?.id === order.clientId || currentUser?.id === order.client;
  } else if (job) {
    // Job dispute: client is the one who posted the job (claimant)
    isCurrentUserClient = currentUser?.id === dispute.claimantId;
  }
  
  const userRole = isCurrentUserClient ? "Client (you)" : "Professional (you)";
  const otherRole = isCurrentUserClient ? `Professional (${dispute.respondentName || dispute.claimantName})` : `Client (${dispute.claimantName || dispute.respondentName})`;

  // Client's offer = what they want to pay, Professional's offer = what they want to receive
  const userOffer = isCurrentUserClient ? (dispute as any).clientOffer : (dispute as any).professionalOffer;
  const otherOffer = isCurrentUserClient ? (dispute as any).professionalOffer : (dispute as any).clientOffer;
  const maxOfferAmount = isOrderDispute
    ? (order?.refundableAmount ?? dispute.amount)
    : dispute.amount;

  const hasUserMadeOffer = userOffer !== undefined && userOffer !== null;
  const hasOtherMadeOffer = otherOffer !== undefined && otherOffer !== null;
  const normalizedDisputeStatus = dispute?.status === "final" ? "closed" : dispute?.status;
  const canRespondToOffer = normalizedDisputeStatus === "open" || normalizedDisputeStatus === "negotiation";

  // Pro: can only lower offer → max = their last offer (or order amount if no offer yet)
  // Client: can only raise offer → min = their last offer (or 0 if no offer yet)
  const offerMin = isCurrentUserClient
    ? (hasUserMadeOffer && typeof userOffer === "number" ? userOffer : 0)
    : 0;
  const offerMax = !isCurrentUserClient
    ? (hasUserMadeOffer && typeof userOffer === "number" ? userOffer : maxOfferAmount)
    : maxOfferAmount;

  const newOfferValue = parseFloat(newOffer);
  const isOfferOutOfRange = !Number.isNaN(newOfferValue) && (newOfferValue < offerMin || newOfferValue > offerMax);

  const milestone = job?.milestones?.find((m) => m.id === (dispute as any).milestoneId);
  const isResolvedDispute = normalizedDisputeStatus === "closed";
  const acceptedByIdStr = typeof dispute?.acceptedBy === "object"
    ? dispute?.acceptedBy?._id?.toString?.() || dispute?.acceptedBy?.toString?.()
    : dispute?.acceptedBy?.toString?.();
  const orderClientIdStr = order
    ? (typeof (order as any).clientId === "object"
        ? (order as any).clientId?._id?.toString?.() || (order as any).clientId?.toString?.()
        : (order as any).clientId?.toString?.() || (order as any).client?.toString?.())
    : null;
  const acceptedByNameByRole = dispute?.acceptedByRole === "client"
    ? (orderClientIdStr && String(orderClientIdStr) === String(claimantIdStr)
        ? (dispute?.claimantName || "Client")
        : orderClientIdStr && String(orderClientIdStr) === String(respondentIdStr)
          ? (dispute?.respondentName || "Client")
          : "Client")
    : dispute?.acceptedByRole === "professional"
      ? (orderClientIdStr && String(orderClientIdStr) === String(claimantIdStr)
          ? (dispute?.respondentName || "Professional")
          : orderClientIdStr && String(orderClientIdStr) === String(respondentIdStr)
            ? (dispute?.claimantName || "Professional")
            : "Professional")
      : null;
  const acceptedByName = acceptedByIdStr
    ? (String(acceptedByIdStr) === String(claimantIdStr)
        ? (dispute?.claimantName || "Claimant")
        : String(acceptedByIdStr) === String(respondentIdStr)
          ? (dispute?.respondentName || "Respondent")
          : "One party")
    : (acceptedByNameByRole || "One party");
  const offererName = acceptedByIdStr
    ? (String(acceptedByIdStr) === String(claimantIdStr)
        ? (dispute?.respondentName || "Respondent")
        : String(acceptedByIdStr) === String(respondentIdStr)
          ? (dispute?.claimantName || "Claimant")
          : "the other party")
    : (dispute?.acceptedByRole === "client"
        ? (orderClientIdStr && String(orderClientIdStr) === String(claimantIdStr)
            ? (dispute?.respondentName || "Professional")
            : orderClientIdStr && String(orderClientIdStr) === String(respondentIdStr)
              ? (dispute?.claimantName || "Professional")
              : "Professional")
        : dispute?.acceptedByRole === "professional"
          ? (orderClientIdStr && String(orderClientIdStr) === String(claimantIdStr)
              ? (dispute?.claimantName || "Client")
              : orderClientIdStr && String(orderClientIdStr) === String(respondentIdStr)
                ? (dispute?.respondentName || "Client")
                : "Client")
          : "the other party");
  const settlementAmount = (() => {
    if (typeof dispute?.finalAmount === "number") return dispute.finalAmount;
    if (typeof dispute?.clientOffer === "number" && typeof dispute?.professionalOffer === "number" && dispute.clientOffer === dispute.professionalOffer) {
      return dispute.clientOffer;
    }
    return null;
  })();
  const winnerIdStr = typeof dispute?.winnerId === "object"
    ? dispute?.winnerId?._id?.toString?.() || dispute?.winnerId?.toString?.()
    : dispute?.winnerId?.toString?.();
  const winnerName = winnerIdStr
    ? (String(winnerIdStr) === String(claimantIdStr)
        ? (dispute?.claimantName || "Claimant")
        : String(winnerIdStr) === String(respondentIdStr)
          ? (dispute?.respondentName || "Respondent")
          : "the selected party")
    : "the selected party";
  const cleanAdminDecisionText = (value?: string) =>
    (value || "")
      .replace(/^\s*decision\s*:\s*/i, "")
      .replace(/^\s*comment\s*:\s*/i, "")
      .trim();
  const adminDecisionSummary = `Dispute decided in the favour of ${winnerName}.`;
  const adminDecisionCommentRaw =
    typeof dispute?.decisionNotes === "string" ? dispute.decisionNotes.trim() : "";
  const adminDecisionComment =
    cleanAdminDecisionText(adminDecisionCommentRaw) || "No additional comment provided.";
  const resolvedReasonText = dispute?.adminDecision
    ? `${adminDecisionSummary}\n${adminDecisionComment}`
    : dispute?.acceptedAt
      ? `Dispute resolved positively as ${acceptedByName} accepted the ${typeof settlementAmount === "number" ? `£${settlementAmount.toFixed(2)} ` : ""}offer from ${offererName}.`
      : dispute?.autoClosed
        ? "Resolved automatically because the required response/payment deadline passed."
        : `Dispute resolved as ${acceptedByName} accepted the ${typeof settlementAmount === "number" ? `£${settlementAmount.toFixed(2)} ` : ""}offer from ${offererName}.`;
  const resolvedAtLabel = dispute?.closedAt
    ? new Date(dispute.closedAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(",", "")
    : null;
  const visibleDisputeMessages = (dispute?.messages || []).filter((msg: any) => {
    const text = typeof msg?.message === "string" ? msg.message.trim() : "";
    const isLegacySettlementTeamMessage =
      msg?.isTeamResponse === true &&
      text.startsWith("Dispute resolved as ");
    if (isLegacySettlementTeamMessage) return false;
    // Hide admin final decision messages (shown in Arbitrate team card instead)
    const isAdminDecisionMessage =
      msg?.isTeamResponse === true &&
      text.startsWith("Decision: Dispute decided in the favour of");
    if (isAdminDecisionMessage) return false;
    // Hide admin replies targeted to the other party
    if (msg?.inFavorOfId && msg.inFavorOfId !== currentUser?.id) return false;
    return true;
  });

  // Unified timeline: merge regular messages + arbitration payment notices + resolved notice, sorted by timestamp
  type TimelineItem =
    | { kind: 'message'; ts: number; data: any }
    | { kind: 'arb_payment'; ts: number; entry: any; idx: number; isLast: boolean }
    | { kind: 'resolved'; ts: number };

  const unifiedTimeline: TimelineItem[] = [
    ...visibleDisputeMessages.map((msg: any) => ({
      kind: 'message' as const,
      ts: msg.timestamp ? new Date(msg.timestamp).getTime() : 0,
      data: msg,
    })),
    ...arbitrationPaymentsOrdered.map((entry: any, idx: number) => ({
      kind: 'arb_payment' as const,
      ts: entry.payment?.paidAt ? new Date(entry.payment.paidAt).getTime() : 0,
      entry,
      idx,
      isLast: idx === arbitrationPaymentsOrdered.length - 1,
    })),
    ...(isResolvedDispute ? [{
      kind: 'resolved' as const,
      ts: dispute?.closedAt ? new Date(dispute.closedAt).getTime() : Date.now(),
    }] : []),
  ].sort((a, b) => a.ts - b.ts);

  // Parse "X day(s) Y hour(s) Z min(s)" into parts so we can style numbers vs labels differently.
  const timeParts = (() => {
    if (!displayTimeLeft) return null;
    const match = displayTimeLeft.match(/(\d+)\s+days?\s+(\d+)\s+hours?\s+(\d+)\s+mins?/);
    if (!match) return null;
    const d = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    const m = parseInt(match[3], 10);
    return {
      days: match[1],
      hours: match[2],
      minutes: match[3],
      dLabel: d <= 1 ? "day" : "days",
      hLabel: h <= 1 ? "hour" : "hours",
      mLabel: m <= 1 ? "min" : "mins",
    };
  })();

  return (
    <>
      <SEOHead
        title="Dispute Discussion"
        description="Dispute discussion page"
        robots="noindex,nofollow"
      />
      <div className="min-h-screen bg-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 mt-[50px] md:mt-0">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-md p-6 border-b border-gray-200">
            <h1 className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] text-[#2c353f]">
              {isOrderDispute ? "Order payment dispute" : "Milestone payment dispute"}
            </h1>
            {isOrderDispute && order && (
              <Button
                onClick={() => navigate(`/account?tab=orders&orderId=${order.id}`)}
                variant="ghost"
                className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] hover:text-[#2C5AA0] hover:bg-transparent"
              >
                Go Back to Order Details
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4">
            {/* Dispute Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                    Dispute ID:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                    {dispute.id.replace("DISP-", "").replace("dispute-", "")}
                  </p>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                    Case status:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                    {normalizedDisputeStatus
                      ? normalizedDisputeStatus.charAt(0).toUpperCase() + normalizedDisputeStatus.slice(1)
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                    {isResolvedDispute ? "Decided in:" : "Opened by:"}
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                    {isResolvedDispute ? `${winnerName} favour` : dispute.claimantName}
                  </p>
                </div>
              </div>

              {/* Claimant Info Section */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex gap-3 items-start">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    {resolveAvatarUrl(dispute.claimantAvatar) && (
                      <AvatarImage src={resolveAvatarUrl(dispute.claimantAvatar)} />
                    )}
                    <AvatarFallback className="bg-[#3D78CB] text-white">
                      {getTwoLetterInitials(dispute.claimantName, 'C')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                      Claimant:
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[15px] text-[#3D78CB] font-medium mb-2">
                      {dispute.claimantName}
                    </p>
                    {dispute.evidenceFiles && dispute.evidenceFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                          Evidence Files:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {dispute.evidenceFiles.map((file: string, idx: number) => {
                            const fileUrl = resolveFileUrl(file);
                            const fileName = file.split('/').pop() || '';
                            const fileType = getFileType(fileName);
                            
                            return (
                              <div key={idx} className="relative group">
                                {fileType === 'image' ? (
                                  <img
                                    src={fileUrl}
                                    alt={fileName}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(fileUrl, '_blank')}
                                  />
                                ) : fileType === 'video' ? (
                                  <video
                                    src={fileUrl}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer"
                                    controls
                                  />
                                ) : (
                                  <div
                                    className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={() => window.open(fileUrl, '_blank')}
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

              {/* Messages Thread — unified timeline sorted by timestamp */}
              <div className="space-y-4">
                {unifiedTimeline.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      No messages yet
                    </p>
                  </div>
                ) : unifiedTimeline.map((item, timelineIdx) => {
                  if (item.kind === 'message') {
                    const msg = item.data;
                    const senderName = msg.userName || (msg.userId === dispute.claimantId ? dispute.claimantName : dispute.respondentName);
                    const isClaimant = msg.userId === dispute.claimantId?.toString();
                    const isTeamResponse = msg.isTeamResponse === true;
                    const isLastRegular = timelineIdx === unifiedTimeline.length - 1;
                    const showDeadline = isLastRegular && isClaimant && !isTeamResponse;
                    return (
                      <div key={msg.id} className={`border rounded-lg p-4 ${isTeamResponse ? 'bg-[#FFF5EE] border-[#FFD4B8]' : showDeadline ? 'bg-orange-50 border-orange-200' : 'border-gray-200'}`}>
                        <div className="flex gap-3">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            {resolveAvatarUrl(msg.userAvatar) && (
                              <AvatarImage src={resolveAvatarUrl(msg.userAvatar)} />
                            )}
                            <AvatarFallback className={isTeamResponse ? "bg-[#FE8A0F] text-white" : "bg-[#3D78CB] text-white"}>
                              {getTwoLetterInitials(senderName, 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
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
                            </div>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 whitespace-pre-wrap">
                              {msg.message}
                            </p>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {msg.attachments.map((attachment: any, attIdx: number) => {
                                  const fileUrl = resolveFileUrl(attachment.url || attachment);
                                  const fileName = attachment.fileName || (typeof attachment === 'string' ? attachment.split('/').pop() : '');
                                  const fileType = attachment.fileType || getFileType(fileName);
                                  return (
                                    <div key={attIdx} className="relative group">
                                      {fileType === 'image' ? (
                                        <img src={fileUrl} alt={fileName} className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(fileUrl, '_blank')} />
                                      ) : fileType === 'video' ? (
                                        <video src={fileUrl} className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer" controls />
                                      ) : (
                                        <div className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => window.open(fileUrl, '_blank')}>
                                          <Paperclip className="w-6 h-6 text-gray-600" />
                                        </div>
                                      )}
                                      <p className="font-['Poppins',sans-serif] text-[10px] text-[#6b6b6b] mt-1 truncate" title={fileName}>{fileName}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] text-right mt-2">
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(',', '') : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (item.kind === 'arb_payment') {
                    const { entry, idx, isLast } = item;
                    return (
                      <div key={`arb-payment-msg-${idx}`} className="border rounded-lg p-4 bg-[#f4b183] border-[#f4b183] shadow-sm">
                        <div className="flex gap-3">
                          <Avatar className="w-12 h-12 flex-shrink-0 border border-[#f4b183]">
                            <AvatarImage src={adminAvatar} />
                            <AvatarFallback className="bg-[#FE8A0F] text-white">AD</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-semibold mb-2">Arbitrate team</p>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-4 leading-[1.45]">
                              {`${entry.payerName} has paid £${entry.amount.toFixed(2)} to escalate the dispute to arbitration.`}
                            </p>
                            {idx === 0 && !bothPaidArbitrationFee && (
                              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-[1.45]">
                                {`${arbitrationUnpaidPartyName} has ${arbitrationDaysToPay} ${arbitrationDaysToPay <= 1 ? "day" : "days"} to pay the fee - failure to do so will result in deciding the case in the favour of ${firstPayerName}.`}
                              </p>
                            )}
                            {isLast && bothPaidArbitrationFee && (
                              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-[1.45]">
                                Both parties have now paid the arbitration fee. The dispute team will step in to review and decide the case.
                              </p>
                            )}
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] text-right mt-2">
                              {new Date(entry.payment?.paidAt || Date.now()).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(',', '')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (item.kind === 'resolved') {
                    return (
                      <div key="resolved-msg" className="border rounded-lg p-4 bg-[#f4b183] border-[#f4b183] shadow-sm">
                        <div className="flex gap-3">
                          <Avatar className="w-12 h-12 flex-shrink-0 border border-[#f4b183]">
                            <AvatarImage src={adminAvatar} />
                            <AvatarFallback className="bg-[#FE8A0F] text-white">AD</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-semibold mb-3">Arbitrate team</p>
                            {dispute?.adminDecision ? (
                              <div className="space-y-3">
                                <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-100 px-4 py-3 shadow-sm">
                                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-[1.5] font-semibold">
                                    {adminDecisionSummary}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-orange-200 bg-white/80 px-4 py-3 shadow-sm">
                                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-[1.55] whitespace-pre-line">
                                    {adminDecisionComment}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-[1.45] whitespace-pre-line">{resolvedReasonText}</p>
                            )}
                            {resolvedAtLabel && (
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] text-right mt-2">{resolvedAtLabel}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Reply Section */}
              {(dispute.status === "open" || dispute.status === "negotiation") && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="font-['Poppins',sans-serif] text-[14px] mb-3 resize-none"
                    rows={3}
                  />
                  
                  {/* File Upload */}
                  <div className="mb-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Paperclip className="w-4 h-4 text-[#3D78CB]" />
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#3D78CB]">
                        Attach Files
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*"
                      />
                    </label>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <Paperclip className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] flex-1 truncate">
                              {file.name}
                            </span>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() && selectedFiles.length === 0}
                    className="bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif]"
                  >
                    Reply
                  </Button>
                </div>
              )}
            </div>
          </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
            {/* Response Timeline Card */}
            {(dispute.status === "open" || dispute.status === "negotiation" || isWaitingOtherPartyArbitrationFee || bothPaidArbitrationFee) && displayTimeLeft && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                {timeParts ? (
                  <div className="flex flex-wrap justify-center items-baseline gap-1 mb-2">
                    <span className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f] font-bold">
                      {timeParts.days}
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[5px] text-[#6b6b6b]">
                      {timeParts.dLabel}
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f] font-bold">
                      {timeParts.hours}
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[5px] text-[#6b6b6b]">
                      {timeParts.hLabel}
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f] font-bold">
                      {timeParts.minutes}
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[5px] text-[#6b6b6b]">
                      {timeParts.mLabel}
                    </span>
                  </div>
                ) : (
                  <p className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f] font-bold text-center mb-2">
                    {displayTimeLeft}
                  </p>
                )}
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] text-center">
                  {isWaitingOtherPartyArbitrationFee
                    ? (hasPaidArbitrationFee ? "left for the other party to pay arbitration fee" : "left for you to pay arbitration fee")
                    : showAdminStepInLabel
                    ? isNegotiationDeadlinePassed || timeLeft === "Deadline passed"
                      ? "Arbitration stage: You can now ask the dispute team to step in by paying the fee."
                      : "left to ask admin to step in"
                    : `left for ${dispute.respondentName} to respond`}
                </p>
                {isWaitingOtherPartyArbitrationFee && (
                  <p className="mt-3 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] text-center">
                    {`One party has paid. The other party must pay by ${formatDeadlineDateTime(dispute?.arbitrationFeeDeadline) || "the deadline"} or the case will be decided in favor of the paying party.`}
                  </p>
                )}
                {showAdminStepInLabel && !isWaitingOtherPartyArbitrationFee && !isNegotiationDeadlinePassed && timeLeft !== "Deadline passed" && (
                  <p className="mt-3 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] text-center">
                    {`If no agreement is reached, either party can ask the dispute team to step in after ${formatDeadlineDateTime(dispute?.negotiationDeadline) || "the deadline"}. Both parties must pay ${typeof dispute?.arbitrationFeeAmount === "number" ? `£${dispute.arbitrationFeeAmount.toFixed(2)}` : "the required fee"}.`}
                  </p>
                )}
              </div>
            )}
            
            {/* Amount Disputed Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                Total disputed {isOrderDispute ? "order" : "milestone"}
              </p>
              <p className="font-['Poppins',sans-serif] text-[42px] text-[#2c353f] font-bold mb-4">
                £ {dispute.amount.toFixed(0)}
              </p>

              {!isOrderDispute && showMilestones && milestone && (
                <div className="mt-4 p-3 bg-[#f8f9fa] rounded-lg text-left">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                    Milestone:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {milestone.description}
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mt-2">
                    £{milestone.amount.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Current Offer Status */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3 text-center">
                  Current Offer Status
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Left Column – Current user (Client/Pro) */}
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      {isCurrentUserClient ? "Client (you)" : "Professional (you)"}<br />{isCurrentUserClient ? "wants to pay:" : "want to receive:"}
                    </p>
                    {hasUserMadeOffer && userOffer !== undefined ? (
                      <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-bold">
                        £{userOffer.toFixed(2)}
                      </p>
                    ) : (
                      <Button
                        className="w-full bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] text-[11px] h-auto py-2"
                        disabled
                      >
                        You've not made an offer yet
                      </Button>
                    )}
                  </div>
                  {/* Right Column – Other party (Pro/Client) */}
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      {isCurrentUserClient ? "Professional" : "Client"}<br />{isCurrentUserClient ? "want to receive:" : "wants to pay:"}
                    </p>
                    {hasOtherMadeOffer && otherOffer !== undefined ? (
                      <>
                        <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-bold">
                          £{otherOffer.toFixed(2)}
                        </p>
                        {canRespondToOffer && (
                          <div className="mt-3 space-y-2">
                            {!showRespondActions ? (
                              <Button
                                onClick={() => setShowRespondActions(true)}
                                className="w-full bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] text-[13px]"
                              >
                                Respond
                              </Button>
                            ) : (
                              <>
                                <Button
                                  onClick={() => setIsAcceptConfirmOpen(true)}
                                  className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                                >
                                  Accept and close
                                </Button>
                                <Button
                                  onClick={() => setIsRejectConfirmOpen(true)}
                                  variant="outline"
                                  className="w-full border-red-500 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif]"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    ) : dispute?.lastOfferRejectedAt ? (
                      (() => {
                        const myRole = isCurrentUserClient ? 'client' : 'professional';
                        const iRejected = dispute?.lastOfferRejectedByRole === myRole;
                        const rejectedAmount = dispute?.lastRejectedOfferAmount;
                        return (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-['Poppins',sans-serif] text-[13px] text-red-700">
                              {iRejected 
                                ? `You rejected the £${typeof rejectedAmount === 'number' ? rejectedAmount.toFixed(2) : '0.00'} offer. Waiting for a new offer.`
                                : `Your £${typeof rejectedAmount === 'number' ? rejectedAmount.toFixed(2) : '0.00'} offer was rejected.`
                              }
                            </p>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] italic">
                        No offer yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Offer Input Card - Only show if dispute is open or in negotiation */}
            {(dispute.status === "open" || dispute.status === "negotiation") && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3">
                  Make a new offer you wish to {isCurrentUserClient ? "pay" : "receive"}:
                </p>
                
                {!hasOtherMadeOffer && (
                  <div className="mb-3">
                    <Button
                      className="w-full bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] text-[13px]"
                      disabled
                    >
                      {isClaimant ? dispute.respondentName : dispute.claimantName} has not made an offer yet
                    </Button>
                  </div>
                )}

        {/* Accept Offer Confirmation Dialog */}
        <Dialog open={isAcceptConfirmOpen} onOpenChange={setIsAcceptConfirmOpen}>
          <DialogContent className="w-[400px] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
                Accept and close dispute?
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                This will accept the current offer and close the dispute. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsAcceptConfirmOpen(false)}
                className="font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAccept}
                className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
              >
                Yes, accept and close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Offer Confirmation Dialog */}
        <Dialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
          <DialogContent className="w-[400px] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
                Reject this offer?
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Are you sure you want to reject this offer? You can continue negotiating by sending a new offer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsRejectConfirmOpen(false)}
                className="font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReject}
                variant="destructive"
                className="font-['Poppins',sans-serif]"
              >
                Yes, reject
              </Button>
            </div>
          </DialogContent>
        </Dialog>
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      £
                    </span>
                    <Input
                      type="number"
                      value={newOffer}
                      onChange={(e) => setNewOffer(e.target.value)}
                      placeholder="0.00"
                      className="pl-7 font-['Poppins',sans-serif] text-[14px]"
                      step="0.01"
                      min={offerMin}
                      max={offerMax}
                    />
                  </div>
                  <Button
                    onClick={handleMakeOffer}
                    disabled={!newOffer}
                    className="bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] px-6"
                  >
                    SUBMIT
                  </Button>
                </div>
                <p
                  className={`mt-2 font-['Poppins',sans-serif] text-[12px] ${
                    isOfferOutOfRange ? "text-red-600 font-medium" : "text-[#6b6b6b]"
                  }`}
                >
                  {`Must be between £${offerMin.toFixed(2)} and £${offerMax.toFixed(2)}`}
                </p>
                
                {hasUserMadeOffer && (
                  <p className="font-['Poppins',sans-serif] text-[11px] text-green-600 mt-2 text-center">
                    Your current offer: £{userOffer?.toFixed(2)}
                  </p>
                )}
                
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-2 text-center">
                  Enter an amount between £{offerMin.toFixed(2)} and £{offerMax.toFixed(2)} GBP
                </p>

                {(isClaimant && isOrderDispute && (dispute.status === "open" || dispute.status === "negotiation")) || canShowArbitrationButton ? (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className={`grid gap-2 ${isClaimant && canShowArbitrationButton ? "grid-cols-2" : "grid-cols-1"}`}>
                      {isClaimant && isOrderDispute && (dispute.status === "open" || dispute.status === "negotiation") && (
                        <Button
                          onClick={() => setIsCancelConfirmOpen(true)}
                          variant="outline"
                          className="w-full border-red-500 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif] text-[13px]"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Dispute
                        </Button>
                      )}
                      {canShowArbitrationButton && (
                        <Button
                          onClick={handleRequestArbitration}
                          className="w-full bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] text-[13px]"
                        >
                          Ask admin to step in
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {isResolvedDispute && (
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    Dispute status
                  </p>
                  <Badge className="bg-red-100 text-red-700 border border-red-300 font-['Poppins',sans-serif] text-[14px] px-3 py-1">
                    Resolved
                  </Badge>
                </div>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-[1.45] whitespace-pre-line">
                  {resolvedReasonText}
                </p>
                {resolvedAtLabel && (
                  <p className="mt-3 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {`Closed on ${resolvedAtLabel}`}
                  </p>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Cancel Dispute Confirmation Dialog */}
        <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
          <DialogContent className="w-[90vw] max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                Cancel Dispute?
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Are you sure you want to cancel this dispute? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setIsCancelConfirmOpen(false)}
                variant="outline"
                className="flex-1 font-['Poppins',sans-serif]"
              >
                No, Keep It
              </Button>
              <Button
                onClick={handleCancelDispute}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif]"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Yes, Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isArbitrationWarningOpen} onOpenChange={setIsArbitrationWarningOpen}>
          <DialogContent className="w-[90vw] max-w-[420px]">
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b3d9f2]">
                <Info className="h-5 w-5 text-[#3D78CB]" />
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] text-center">
                Warning
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] text-center">
                {`Warning! You can ask our dispute team to step in after ${formatArbitrationDeadline(dispute?.negotiationDeadline) || "the deadline"}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => setIsArbitrationWarningOpen(false)}
                className="bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] px-8"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isArbitrationPaymentOpen} onOpenChange={setIsArbitrationPaymentOpen}>
          <DialogContent className="w-[90vw] max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                Arbitration Fee Payment
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Both parties must pay the arbitration fee before the dispute team can step in.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Arbitration Fee:</span>
                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    £{typeof dispute?.arbitrationFeeAmount === "number" ? dispute.arbitrationFeeAmount.toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Wallet balance:</span>
                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">£{walletBalance.toFixed(2)}</span>
                </div>
              </div>

              {loadingPaymentMethods ? (
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Loading payment methods...</p>
              ) : (
                <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment} className="space-y-3">
                  {paymentMethods.map((method: any) => (
                    <div
                      key={method.id}
                      className={`relative border-2 rounded-lg p-3 transition-all ${
                        selectedPayment === method.id ? "border-[#3B82F6] bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={method.id} id={`pm-${method.id}`} className="mt-0.5 shrink-0" />
                        <Label htmlFor={`pm-${method.id}`} className="flex-1 min-w-0 cursor-pointer">
                          {method.type === "account_balance" && (
                            <div className="flex items-center gap-2">
                              <Wallet className="w-5 h-5 text-[#3D78CB] shrink-0" />
                              <div>
                                <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">Wallet Balance</span>
                                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-0.5">£{walletBalance.toFixed(2)} available</p>
                              </div>
                            </div>
                          )}
                          {method.type === "card" && (
                            <div className="flex items-center gap-2">
                              <div className="shrink-0 scale-90">
                                {getCardType(method.brand, method.cardNumber) === "visa" ? (
                                  <VisaLogo />
                                ) : getCardType(method.brand, method.cardNumber) === "mastercard" ? (
                                  <MastercardLogo />
                                ) : (
                                  <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">{method.cardNumber}</span>
                                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-0.5">
                                  {method.cardHolder} • Exp. {method.expiryDate}
                                </p>
                              </div>
                            </div>
                          )}
                          {method.type === "paypal" && (
                            <div className="flex items-center gap-2">
                              <div className="shrink-0">
                                <img src={paypalLogo} alt="PayPal" className="h-8 w-auto object-contain" style={{ maxWidth: "100px" }} />
                              </div>
                              <div className="min-w-0">
                                <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">PayPal</span>
                                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-0.5">Pay securely with PayPal</p>
                              </div>
                            </div>
                          )}
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setIsArbitrationPaymentOpen(false)}
                variant="outline"
                className="flex-1 font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayArbitrationFee}
                disabled={!selectedPayment || isPayingArbitration}
                className="flex-1 bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif]"
              >
                Pay Fee
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </>
  );
}