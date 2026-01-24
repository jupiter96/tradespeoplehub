import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrders } from "./OrdersContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
import { useCountdown } from "../hooks/useCountdown";
import { useElapsedTime } from "../hooks/useElapsedTime";
import { resolveApiUrl } from "../config/api";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Star,
  Upload,
  PlayCircle,
  Truck,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";
import {
  buildProfessionalTimeline,
  ProfessionalOrderDetailHeader,
  ProfessionalOrderDetailSidebar,
  ProfessionalOrderDetailsTab,
  ProfessionalOrderAdditionalInfoTab,
  ProfessionalOrderDeliveryTab,
  ProfessionalOrderServiceAddressSection,
  ProfessionalOrderDeliveryCompletionSection,
  ProfessionalOrderTimelineTab,
  DeliveryDialog,
  ExtensionDialog,
  CompletionDialog,
  DisputeDialog,
  DisputeResponseDialog,
  RevisionResponseDialog,
  WithdrawCancellationDialog,
  CancellationRequestDialog,
  AddInfoDialog,
  formatDate,
  formatDateTime,
  formatMoney,
  getStatusBadge,
  getStatusIcon,
  getStatusLabel,
  resolveFileUrl,
  resolveAvatarUrl,
  isVideoFile,
  VideoThumbnail,
} from "./orders";
import DeliveryCountdown from "./DeliveryCountdown";
import serviceVector from "../assets/service_vector.jpg";
import {
  ShoppingBag,
  Package,
  Calendar,
  MessageCircle,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Edit,
  Image,
  Film,
  X,
  PoundSterling,
  Paperclip,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { userRole, isLoggedIn } = useAccount();
  const { orders, refreshOrders } = useOrders();
  
  // Find the order
  const currentOrder = useMemo(() => {
    if (!orderId) return null;
    return orders.find((o) => o.id === orderId);
  }, [orderId, orders]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
  }, [isLoggedIn, navigate]);

  // Redirect if order not found
  useEffect(() => {
    if (isLoggedIn && orderId && orders.length > 0 && !currentOrder) {
      // Order not found, redirect to orders list
      navigate("/account?tab=orders");
    }
  }, [isLoggedIn, orderId, orders, currentOrder, navigate]);

  // Poll for latest order updates
  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(() => {
      refreshOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId, refreshOrders]);

  const handleBack = () => {
    navigate("/account?tab=orders");
  };

  if (!isLoggedIn) {
    return null; // Will redirect
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b] mb-4">
            Loading order...
          </p>
        </div>
      </div>
    );
  }

  // Render based on user role
  if (userRole === "client") {
    return <ClientOrderDetailView order={currentOrder} onBack={handleBack} />;
  } else if (userRole === "professional") {
    return <ProfessionalOrderDetailView order={currentOrder} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b]">
          Unauthorized access
        </p>
      </div>
    </div>
  );
}

function ClientOrderDetailView({ order, onBack }: { order: any; onBack: () => void }) {
  const navigate = useNavigate();
  const { userInfo } = useAccount();
  const { startConversation } = useMessenger();
  const { 
    orders, 
    cancelOrder, 
    acceptDelivery, 
    getOrderDisputeById, 
    rateOrder, 
    respondToExtension, 
    requestCancellation, 
    respondToCancellation, 
    withdrawCancellation, 
    requestRevision, 
    respondToDispute, 
    requestArbitration, 
    cancelDispute, 
    addAdditionalInfo, 
    refreshOrders 
  } = useOrders();
  
  const [orderDetailTab, setOrderDetailTab] = useState("timeline");
  const [showDisputeSection, setShowDisputeSection] = useState(false);
  const [serviceThumbnails, setServiceThumbnails] = useState<{[orderId: string]: { type: 'image' | 'video', url: string, thumbnail?: string }}>({});
  
  // Dialog states
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [isCancellationRequestDialogOpen, setIsCancellationRequestDialogOpen] = useState(false);
  const [isRevisionRequestDialogOpen, setIsRevisionRequestDialogOpen] = useState(false);
  const [isDisputeResponseDialogOpen, setIsDisputeResponseDialogOpen] = useState(false);
  const [isAddInfoDialogOpen, setIsAddInfoDialogOpen] = useState(false);
  
  // Form states
  const [rating, setRating] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFiles, setCancelFiles] = useState<File[]>([]);
  const [review, setReview] = useState("");
  const [communicationRating, setCommunicationRating] = useState(5);
  const [serviceAsDescribedRating, setServiceAsDescribedRating] = useState(5);
  const [buyAgainRating, setBuyAgainRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [disputeRequirements, setDisputeRequirements] = useState("");
  const [disputeUnmetRequirements, setDisputeUnmetRequirements] = useState("");
  const [disputeEvidenceFiles, setDisputeEvidenceFiles] = useState<File[]>([]);
  const [disputeOfferAmount, setDisputeOfferAmount] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [revisionFiles, setRevisionFiles] = useState<File[]>([]);
  const [disputeResponseMessage, setDisputeResponseMessage] = useState("");
  const [addInfoMessage, setAddInfoMessage] = useState("");
  const [addInfoFiles, setAddInfoFiles] = useState<File[]>([]);
  
  // Function to close all modals and reset related states
  const closeAllModals = () => {
    setIsRatingDialogOpen(false);
    setIsCancelDialogOpen(false);
    setIsDisputeDialogOpen(false);
    setIsCancellationRequestDialogOpen(false);
    setIsRevisionRequestDialogOpen(false);
    setIsDisputeResponseDialogOpen(false);
    setIsAddInfoDialogOpen(false);
    // Reset form states when closing modals
    setCancelReason("");
    setCancelFiles([]);
    setCancellationReason("");
    setRevisionReason("");
    setRevisionMessage("");
    setRevisionFiles([]);
    setDisputeResponseMessage("");
    setAddInfoMessage("");
    setAddInfoFiles([]);
  };

  // Function to open a specific modal and close all others
  const openModal = (modalName: 'rating' | 'cancel' | 'dispute' | 'cancellationRequest' | 'revisionRequest' | 'disputeResponse' | 'addInfo') => {
    closeAllModals();
    switch (modalName) {
      case 'rating':
        setIsRatingDialogOpen(true);
        break;
      case 'cancel':
        setIsCancelDialogOpen(true);
        break;
      case 'dispute':
        setIsDisputeDialogOpen(true);
        break;
      case 'cancellationRequest':
        setIsCancellationRequestDialogOpen(true);
        break;
      case 'revisionRequest':
        setIsRevisionRequestDialogOpen(true);
        break;
      case 'disputeResponse':
        setIsDisputeResponseDialogOpen(true);
        break;
      case 'addInfo':
        setIsAddInfoDialogOpen(true);
        break;
    }
  };

  // Client Timeline Event Type
  type ClientTimelineEvent = {
    id: string;
    at?: string;
    title: string;
    description?: string;
    colorClass: string;
    icon: JSX.Element;
    message?: string;
    files?: Array<{
      url: string;
      fileName: string;
      fileType?: string;
    }>;
  };

  // Build client timeline events
  const buildClientTimeline = (order: any): ClientTimelineEvent[] => {
    const events: ClientTimelineEvent[] = [];
    const push = (event: Omit<ClientTimelineEvent, "id">, id: string) =>
      events.push({ ...event, id });

    if (order.createdAt || order.date) {
      push(
        {
          at: order.createdAt || order.date,
          title: "Order Placed",
          description: "Your order has been placed successfully.",
          colorClass: "bg-gray-800",
          icon: <ShoppingBag className="w-5 h-5 text-white" />,
        },
        "placed"
      );
    }

    if (order.acceptedByProfessional && order.acceptedAt) {
      push(
        {
          at: order.acceptedAt,
          title: "Order Accepted",
          description: `${order.professional || "Professional"} accepted your order.`,
          colorClass: "bg-green-600",
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        },
        "accepted"
      );
    }

    if (order.deliveryStatus === "active" && order.status !== "disputed") {
      push(
        {
          at: order.expectedDelivery || order.scheduledDate,
          title: "Service In Progress",
          description: "The professional is currently working on your service.",
          colorClass: "bg-blue-500",
          icon: <PlayCircle className="w-5 h-5 text-white" />,
        },
        "in-progress"
      );
    }

    if (order.revisionRequest?.status) {
      push(
        {
          at: order.revisionRequest.requestedAt,
          title: "Revision Requested",
          description: "You requested a modification to the delivered work.",
          message: order.revisionRequest.clientMessage || order.revisionRequest.reason,
          files: order.revisionRequest.clientFiles,
          colorClass: "bg-orange-500",
          icon: <AlertTriangle className="w-5 h-5 text-white" />,
        },
        "revision-requested"
      );
    }

    if (order.additionalInformation?.submittedAt) {
      push(
        {
          at: order.additionalInformation.submittedAt,
          title: "Additional Information Submitted",
          description: "You submitted additional information for this order.",
          message: order.additionalInformation.message,
          files: order.additionalInformation.files,
          colorClass: "bg-blue-500",
          icon: <FileText className="w-5 h-5 text-white" />,
        },
        "additional-info"
      );
    }

    if (order.extensionRequest?.requestedAt) {
      push(
        {
          at: order.extensionRequest.requestedAt,
          title: "Extension Requested",
          description: order.extensionRequest.reason
            ? `Extension requested: ${order.extensionRequest.reason}`
            : "Extension requested for the delivery deadline.",
          colorClass: "bg-indigo-500",
          icon: <Clock className="w-5 h-5 text-white" />,
        },
        "extension-requested"
      );
    }

    if (order.extensionRequest?.respondedAt && order.extensionRequest?.status) {
      push(
        {
          at: order.extensionRequest.respondedAt,
          title:
            order.extensionRequest.status === "approved"
              ? "Extension Approved"
              : "Extension Rejected",
          description: order.extensionRequest.status === "approved"
            ? "Your extension request was approved."
            : "Your extension request was rejected.",
          colorClass:
            order.extensionRequest.status === "approved"
              ? "bg-green-600"
              : "bg-red-600",
          icon:
            order.extensionRequest.status === "approved" ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <XCircle className="w-5 h-5 text-white" />
            ),
        },
        "extension-response"
      );
    }

    if (
      order.deliveryStatus === "delivered" ||
      order.deliveryMessage ||
      (order.deliveryFiles && order.deliveryFiles.length > 0)
    ) {
      push(
        {
          at: order.deliveredDate || order.deliveryFiles?.[0]?.uploadedAt,
          title: "Work Delivered",
          description: `${order.professional || "Professional"} delivered the work.`,
          message: order.deliveryMessage,
          files: order.deliveryFiles,
          colorClass: "bg-purple-500",
          icon: <Truck className="w-5 h-5 text-white" />,
        },
        "delivered"
      );
    }

    if (order.cancellationRequest?.requestedAt && order.cancellationRequest?.status) {
      push(
        {
          at: order.cancellationRequest.requestedAt,
          title: "Cancellation Requested",
          description: order.cancellationRequest.reason
            ? `Cancellation reason: ${order.cancellationRequest.reason}`
            : "A cancellation was requested for this order.",
          files: order.cancellationRequest.files && order.cancellationRequest.files.length > 0 ? order.cancellationRequest.files : undefined,
          colorClass: "bg-red-500",
          icon: <AlertTriangle className="w-5 h-5 text-white" />,
        },
        "cancellation-requested"
      );
    }

    if (
      order.cancellationRequest &&
      order.cancellationRequest.status === "approved" &&
      order.status === "Cancelled"
    ) {
      push(
        {
          at: order.cancellationRequest.respondedAt,
          title: "Order Cancelled",
          description: order.cancellationRequest.reason
            ? `Cancellation reason: ${order.cancellationRequest.reason}`
            : "Order has been cancelled.",
          colorClass: "bg-red-600",
          icon: <XCircle className="w-5 h-5 text-white" />,
        },
        "cancelled"
      );
    }

    if (
      order.cancellationRequest &&
      order.cancellationRequest.status === "rejected" &&
      order.cancellationRequest.respondedAt
    ) {
      push(
        {
          at: order.cancellationRequest.respondedAt,
          title: "Cancellation Request Rejected",
          description: order.cancellationRequest.rejectionReason
            ? `Your cancellation request was rejected. Reason: ${order.cancellationRequest.rejectionReason}`
            : "Your cancellation request was rejected. The order will continue.",
          colorClass: "bg-green-600",
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        },
        "cancellation-rejected"
      );
    }

    if (order.status === "Completed") {
      push(
        {
          at: order.completedDate,
          title: "Order Completed",
          description: "This order has been completed successfully.",
          colorClass: "bg-green-600",
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        },
        "completed"
      );
    }

    return events.sort((a, b) => {
      const aTime = a.at ? new Date(a.at).getTime() : 0;
      const bTime = b.at ? new Date(b.at).getTime() : 0;
      return bTime - aTime;
    });
  };

  // Timeline events
  const timelineEvents = useMemo(
    () => buildClientTimeline(order),
    [order]
  );

  // Get primary item
  const primaryItem = order?.items?.[0];

  // Handler functions
  const cancelFileInputRef = useRef<HTMLInputElement>(null);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    if (order.status === "In Progress") {
      try {
        await requestCancellation(order.id, cancelReason, cancelFiles.length > 0 ? cancelFiles : undefined);
        toast.success("Cancellation request submitted. Waiting for professional approval.");
        closeAllModals();
        setCancelReason("");
        setCancelFiles([]);
      } catch (error: any) {
        toast.error(error.message || "Failed to request cancellation");
      }
    } else {
      try {
        await cancelOrder(order.id);
        toast.success("Order has been cancelled");
        closeAllModals();
        setCancelReason("");
        setCancelFiles([]);
      } catch (error: any) {
        toast.error(error.message || "Failed to cancel order");
      }
    }
  };

  const handleCancelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen?.length) return;
    const list = Array.from(chosen);
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "video/mp4", "video/mpeg", "video/quicktime", "video/webm", "application/pdf", "text/plain"];
    const valid = list.filter((f) => allowed.includes(f.type));
    if (valid.length < list.length) toast.error("Some files were skipped. Use images, videos, or documents only.");
    setCancelFiles((prev) => [...prev, ...valid].slice(0, 10));
    e.target.value = "";
  };

  const handleRequestCancellation = async () => {
    try {
      await requestCancellation(order.id, cancellationReason);
      toast.success("Cancellation request submitted. Waiting for response.");
      closeAllModals();
    } catch (error: any) {
      toast.error(error.message || "Failed to request cancellation");
    }
  };

  const handleRespondToCancellation = async (action: 'approve' | 'reject') => {
    try {
      await respondToCancellation(order.id, action);
      toast.success(`Cancellation request ${action}d successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} cancellation request`);
    }
  };

  const handleWithdrawCancellation = async () => {
    try {
      await withdrawCancellation(order.id);
      toast.success("Cancellation request withdrawn. Order status restored.");
    } catch (error: any) {
      toast.error(error.message || "Failed to withdraw cancellation request");
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionReason.trim()) {
      toast.error("Please provide a reason for the revision request");
      return;
    }
    try {
      await requestRevision(
        order.id,
        revisionReason,
        revisionMessage.trim() ? revisionMessage : undefined,
        revisionFiles.length > 0 ? revisionFiles : undefined
      );
      toast.success("Revision request submitted. The professional will review your request.");
      closeAllModals();
      await refreshOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to request revision");
    }
  };

  const handleRevisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const validFiles = newFiles.filter(file => {
      const type = file.type;
      return type.startsWith('image/') || type.startsWith('video/') || type === 'application/pdf' || type === 'text/plain';
    });
    if (validFiles.length !== newFiles.length) {
      toast.error("Only images, videos, or documents are allowed");
    }
    const filesToAdd = validFiles.slice(0, 10 - revisionFiles.length);
    if (filesToAdd.length < validFiles.length) {
      toast.error("Maximum 10 files allowed");
    }
    setRevisionFiles(prev => [...prev, ...filesToAdd]);
    e.target.value = '';
  };

  const handleRemoveRevisionFile = (index: number) => {
    setRevisionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRespondToDispute = async () => {
    try {
      await respondToDispute(order.id, disputeResponseMessage || undefined);
      toast.success("Dispute response submitted successfully. Negotiation period has started.");
      closeAllModals();
      setDisputeResponseMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to respond to dispute");
    }
  };

  const handleRequestArbitration = async () => {
    try {
      await requestArbitration(order.id);
      toast.success("Arbitration requested successfully. Admin will review the case.");
    } catch (error: any) {
      if (error.message.includes('Insufficient balance')) {
        toast.error(error.message);
      } else {
        toast.error(error.message || "Failed to request arbitration");
      }
    }
  };

  const handleCancelDispute = async () => {
    try {
      await cancelDispute(order.id);
      toast.success("Dispute cancelled successfully. Order restored to delivered status.");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel dispute");
    }
  };

  const handleAcceptDelivery = async () => {
    try {
      await acceptDelivery(order.id);
      toast.success("Order completed! Funds have been released to the professional. You can now rate the service.");
      openModal('rating');
      await refreshOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete order");
    }
  };

  const handleCreateDispute = async () => {
    // Validate required fields
    if (!disputeRequirements.trim()) {
      toast.error("Please describe what the requirements were for the order");
      return;
    }
    if (!disputeUnmetRequirements.trim()) {
      toast.error("Please describe which requirements were not completed");
      return;
    }
    
    const offerAmount = parseFloat(disputeOfferAmount);
    const orderAmount = order.amountValue || 0;
    
    if (disputeOfferAmount === '' || isNaN(offerAmount)) {
      toast.error("Please enter a valid offer amount");
      return;
    }
    if (offerAmount < 0) {
      toast.error("Offer amount cannot be negative");
      return;
    }
    if (offerAmount > orderAmount) {
      toast.error(`Offer amount cannot exceed the order amount (£${orderAmount.toFixed(2)})`);
      return;
    }
    
    // Check if order is delivered
    if (order.deliveryStatus !== 'delivered' && order.status !== 'In Progress') {
      toast.error("Disputes can only be opened for delivered orders");
      return;
    }
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('requirements', disputeRequirements);
      formData.append('unmetRequirements', disputeUnmetRequirements);
      formData.append('offerAmount', disputeOfferAmount);
      
      // Add evidence files
      disputeEvidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });
      
      // Call API to create dispute
      const response = await fetch(resolveApiUrl(`/api/orders/${order.id}/dispute`), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create dispute');
      }

      const data = await response.json();
      
      toast.success("Dispute has been created");
      closeAllModals();
      setDisputeRequirements("");
      setDisputeUnmetRequirements("");
      setDisputeEvidenceFiles([]);
      setDisputeOfferAmount("");
      
      // Refresh orders to get updated status
      await refreshOrders();
      
      // Navigate to dispute discussion page
      navigate(`/dispute/${data.disputeId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create dispute");
    }
  };

  const handleSubmitRating = async () => {
    // Calculate average rating from all categories
    const averageRating = Math.round((communicationRating + serviceAsDescribedRating + buyAgainRating) / 3);
    
    if (averageRating === 0) {
      toast.error("Please provide ratings");
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      await rateOrder(order.id, averageRating, review);
      toast.success("Thank you for your feedback! Your review has been submitted.");
      closeAllModals();
      setRating(0);
      setReview("");
      setCommunicationRating(5);
      setServiceAsDescribedRating(5);
      setBuyAgainRating(5);
      await refreshOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleStartConversation = () => {
    if (order.professional) {
      const participantId = order.professionalId || `prof-${order.id}`;
      startConversation({
        id: participantId,
        name: order.professional,
        avatar: order.professionalAvatar || "",
        online: true,
        jobId: order.id,
        jobTitle: order.service
      });
    }
  };

  const handleRespondToExtension = async (action: 'approve' | 'reject') => {
    try {
      await respondToExtension(order.id, action);
      toast.success(`Extension request ${action}d`);
      await refreshOrders();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} extension request`);
    }
  };

  const handleAddAdditionalInfo = async () => {
    try {
      await addAdditionalInfo(
        order.id,
        addInfoMessage.trim() ? addInfoMessage : undefined,
        addInfoFiles.length > 0 ? addInfoFiles : undefined
      );
      toast.success("Additional information submitted successfully.");
      closeAllModals();
      setAddInfoMessage("");
      setAddInfoFiles([]);
      await refreshOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit additional information");
    }
  };

  const handleAddInfoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const validFiles = newFiles.filter(file => {
      const type = file.type;
      return type.startsWith('image/') || type.startsWith('video/') || type === 'application/pdf' || type === 'text/plain';
    });
    if (validFiles.length !== newFiles.length) {
      toast.error("Only images, videos, or documents are allowed");
    }
    const filesToAdd = validFiles.slice(0, 10 - addInfoFiles.length);
    if (filesToAdd.length < validFiles.length) {
      toast.error("Maximum 10 files allowed");
    }
    setAddInfoFiles(prev => [...prev, ...filesToAdd]);
    e.target.value = '';
  };

  const handleRemoveAddInfoFile = (index: number) => {
    setAddInfoFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch service thumbnail
  useEffect(() => {
    const fetchServiceThumbnail = async () => {
      if (!order || !order.items || order.items.length === 0) return;
      
      const serviceId = (order.items[0] as any)?.serviceId || order.items[0]?.id;
      if (!serviceId || serviceThumbnails[order.id]) return;
      
      try {
        const response = await fetch(resolveApiUrl(`/api/services/${serviceId}`), {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const service = data.service;
          
          if (service) {
            let thumbnail: { type: 'image' | 'video', url: string, thumbnail?: string } | null = null;
            
            if (service.gallery && Array.isArray(service.gallery) && service.gallery.length > 0) {
              const firstItem = service.gallery[0];
              if (firstItem.type === 'video' && firstItem.url) {
                thumbnail = { type: 'video', url: firstItem.url, thumbnail: firstItem.thumbnail };
              } else if (firstItem.type === 'image' && firstItem.url) {
                thumbnail = { type: 'image', url: firstItem.url };
              }
            }
            
            if (!thumbnail) {
              if (service.videos && Array.isArray(service.videos) && service.videos.length > 0) {
                const firstVideo = service.videos[0];
                thumbnail = { type: 'video', url: firstVideo.url || firstVideo, thumbnail: firstVideo.thumbnail };
              } else if (service.images && Array.isArray(service.images) && service.images.length > 0) {
                thumbnail = { type: 'image', url: service.images[0] };
              } else if (service.image) {
                thumbnail = { type: 'image', url: service.image };
              }
            }
            
            if (thumbnail) {
              setServiceThumbnails(prev => ({ ...prev, [order.id]: thumbnail! }));
            }
          }
        }
      } catch (error) {
        // Silently fail
      }
    };
    
    fetchServiceThumbnail();
  }, [order?.id, (order?.items?.[0] as any)?.serviceId || order?.items?.[0]?.id, serviceThumbnails]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!showDisputeSection && (
          <>
            {/* Back Button */}
            <Button
              onClick={onBack}
              variant="ghost"
              className="mb-4 font-['Poppins',sans-serif] text-[13px] hover:text-[#FE8A0F]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>

            {/* Header with Title and Status */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
                  {order.service}
                </h2>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Order ID: {order.id}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {(() => {
                  const cr = (order as any).cancellationRequest ?? order.metadata?.cancellationRequest;
                  const displayStatus = cr?.status === "pending" ? "Cancellation Pending" : order.status;
                  return (
                    <Badge
                      className={`${getStatusBadge(displayStatus)} font-['Poppins',sans-serif] text-[11px]`}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(displayStatus)}
                        {getStatusLabel(displayStatus)}
                      </span>
                    </Badge>
                  );
                })()}
                
                {/* Three Dots Menu - Hide when Cancelled or Cancellation Pending */}
                {order.status !== "Cancelled" && order.status !== "Cancellation Pending" &&
                 (order.deliveryStatus === "pending" || order.deliveryStatus === "active") &&
                 (!((order as any).cancellationRequest?.status === "pending" || order.metadata?.cancellationRequest?.status === "pending") || (order.deliveryFiles && order.deliveryFiles.length > 0)) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreVertical className="w-5 h-5 text-[#6b6b6b]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {order.deliveryFiles && order.deliveryFiles.length > 0 ? (
                        <DropdownMenuItem
                          onClick={() => openModal('dispute')}
                          className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 cursor-pointer"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Open Dispute
                        </DropdownMenuItem>
                      ) : order.status !== "Cancellation Pending" ? (
                        <DropdownMenuItem
                          onClick={() => openModal('cancel')}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Order
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Main Layout - Left Content + Right Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side - Main Content (Tabs) */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl">
                  <Tabs value={orderDetailTab} onValueChange={setOrderDetailTab}>
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory touch-pan-x">
                      <TabsList className="bg-transparent p-0 h-auto w-full md:w-auto inline-flex min-w-full md:min-w-0 justify-start gap-1">
                        <TabsTrigger
                          value="timeline"
                          className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0 snap-start"
                        >
                          Timeline
                        </TabsTrigger>
                        <TabsTrigger
                          value="details"
                          className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0 snap-start"
                        >
                          Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="additional-info"
                          className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0 snap-start"
                        >
                          Additional Info
                        </TabsTrigger>
                        <TabsTrigger
                          value="delivery"
                          className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0 snap-start"
                        >
                          Delivery
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Timeline Tab */}
                    <TabsContent value="timeline" className="mt-4 md:mt-6 space-y-4 md:space-y-6 px-4 md:px-6">
                      {/* Order Cancellation Initiated – client sent cancel request (pending) or already cancelled */}
                      {(((order.status === "Cancellation Pending" || (order as any).cancellationRequest?.status === "pending") &&
                        order.cancellationRequest?.requestedBy &&
                        order.cancellationRequest.requestedBy.toString() === userInfo?.id?.toString()) ||
                        order.status === "Cancelled") && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 shadow-md mb-4 md:mb-6">
                          <h3 className="font-['Poppins',sans-serif] text-[18px] sm:text-[20px] text-[#2c353f] font-semibold mb-2">
                            Order Cancellation Initiated
                          </h3>
                          <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b] break-words mb-4">
                            {order.status === "Cancelled"
                              ? (order.cancellationRequest?.requestedBy?.toString() === userInfo?.id?.toString()
                                  ? "You have initiated the cancellation of your order. The order has been cancelled."
                                  : order.professional
                                    ? `The order has been cancelled.${order.cancellationRequest?.reason ? ` Reason: ${order.cancellationRequest.reason}` : ""}`
                                    : "The order has been cancelled.")
                              : `You have initiated the cancellation of your order. ${order.professional ? `Please wait for ${order.professional} to respond.` : "Please wait for the professional to respond."}${order.cancellationRequest?.responseDeadline ? " If they fail to respond before the deadline, the order will be automatically canceled." : ""}`}
                          </p>
                        </div>
                      )}

                      {/* Completion Message for Completed Orders */}
                      {order.status === "Completed" && (
                        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
                          <h3 className="font-['Poppins',sans-serif] text-[18px] sm:text-[20px] text-[#2c353f] font-semibold mb-2">
                            Your order has been completed!
                          </h3>
                          <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b] mb-4 break-words">
                            Your order has been completed. Please assist other users on our platform by sharing your experience working with the seller in the feedback form.
                          </p>
                          <Button
                            onClick={() => openModal('rating')}
                            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-6 w-full sm:w-auto"
                          >
                            View review
                          </Button>
                        </div>
                      )}

                      {/* Timeline Events */}
                      <div className="space-y-0">
                        {timelineEvents.length === 0 && (
                          <div className="text-center py-6 text-[#6b6b6b] text-[13px] font-['Poppins',sans-serif]">
                            No timeline events yet.
                          </div>
                        )}
                        {(() => {
                          // Get all "Work Delivered" events sorted chronologically (oldest first)
                          const deliveryEvents = timelineEvents
                            .filter(e => e.title === "Work Delivered")
                            .sort((a, b) => {
                              const aTime = a.at ? new Date(a.at).getTime() : 0;
                              const bTime = b.at ? new Date(b.at).getTime() : 0;
                              return aTime - bTime;
                            });
                          
                          // Create a map of delivery event timestamps to their number
                          const deliveryNumberMap = new Map();
                          deliveryEvents.forEach((event, idx) => {
                            const key = event.at || 'no-date';
                            deliveryNumberMap.set(key, idx + 1);
                          });

                          return timelineEvents.map((event, index) => {
                            // Get delivery number if this is a "Work Delivered" event
                            const deliveryNumber = event.title === "Work Delivered" 
                              ? deliveryNumberMap.get(event.at || 'no-date')
                              : null;

                            return (
                              <div key={`${event.id}-${event.at || "na"}-${index}`} className="flex gap-3 sm:gap-5 mb-6 sm:mb-8 relative">
                                <div className="flex flex-col items-center pt-1 relative">
                                  {/* Icon with enhanced modern styling */}
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#3D78CB] flex items-center justify-center flex-shrink-0 shadow-lg ring-2 sm:ring-4 ring-white transition-all duration-300 hover:scale-110 hover:shadow-xl relative z-10">
                                    {event.icon}
                                  </div>
                                  {/* Bold blue dashed connecting line */}
                                  {index < timelineEvents.length - 1 && (
                                    <div className="relative mt-2 sm:mt-3 flex-1" style={{ minHeight: "30px" }}>
                                      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0 border-l-[2px] sm:border-l-[3px] border-dashed border-[#3D78CB]" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 pb-2 min-w-0">
                                  <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#2c353f] mb-1 break-words">
                                    {deliveryNumber ? `#${deliveryNumber} ${event.title}` : event.title}
                                  </p>
                                  {event.at && (
                                    <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mb-2 break-words">
                                      {formatDateTime(event.at)}
                                    </p>
                                  )}
                                  {event.description && (
                                    <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b] mb-2 break-words">
                                      {event.description}
                                    </p>
                                  )}
                                  {event.message && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-3 mt-2 shadow-sm">
                                      <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f] break-words">
                                        {event.message}
                                      </p>
                                    </div>
                                  )}
                                  {event.files && event.files.length > 0 && (
                                    <div className="mt-3">
                                      <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mb-2">
                                        📎 Attachments ({event.files.length})
                                      </p>
                                      <div className="space-y-3">
                                        {event.files.map((file: any, fileIndex: number) => {
                                          const fileUrl = file.url || "";
                                          const fileName = file.fileName || "attachment";
                                          const isImage =
                                            file.fileType === "image" ||
                                            /\.(png|jpe?g|gif|webp)$/i.test(fileUrl) ||
                                            /\.(png|jpe?g|gif|webp)$/i.test(fileName);
                                          const resolvedUrl = resolveFileUrl(fileUrl);
                                          return (
                                            <div key={fileIndex} className="relative group">
                                              {isImage ? (
                                                <img
                                                  src={resolvedUrl}
                                                  alt={fileName}
                                                  className="max-w-full max-h-48 w-auto h-auto object-contain rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                                                  onClick={() => window.open(resolvedUrl, "_blank")}
                                                />
                                              ) : (
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  className="font-['Poppins',sans-serif] text-[12px] text-left justify-start truncate max-w-full"
                                                  onClick={() => window.open(resolvedUrl, "_blank")}
                                                >
                                                  <Paperclip className="w-3 h-3 flex-shrink-0 mr-1.5" />
                                                  <span className="truncate">{fileName}</span>
                                                </Button>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </TabsContent>

                    {/* Details Tab */}
                    <TabsContent value="details" className="mt-4 md:mt-6 px-4 md:px-6">
                      <div className="bg-white rounded-xl p-8 shadow-md">
                        {/* Service Title */}
                        <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-4">
                          {order.service || primaryItem?.title || "Service"}
                        </h2>

                        {/* Service Category */}
                        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            {order.category || "Professional Service"}
                          </p>
                        </div>

                        {/* Offer Includes Section */}
                        <div className="mb-6">
                          <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                            Offer Includes
                          </h3>
                          <ul className="space-y-2 list-disc list-inside">
                            <li className="font-['Poppins',sans-serif] text-[14px] text-blue-600 hover:underline cursor-pointer">
                              Professional service delivery
                            </li>
                            <li className="font-['Poppins',sans-serif] text-[14px] text-blue-600 hover:underline cursor-pointer">
                              Quality assured work
                            </li>
                            {order.description && (
                              <li className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                {order.description}
                              </li>
                            )}
                          </ul>
                        </div>

                        {/* Price Breakdown Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <tbody>
                              {primaryItem && (
                                <>
                                  <tr className="bg-gray-50">
                                    <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                      Unit Price
                                    </td>
                                    <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                      £{formatMoney(primaryItem.price)}
                                    </td>
                                  </tr>
                                  <tr className="border-t border-gray-200">
                                    <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                      Quantity
                                    </td>
                                    <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                      {primaryItem.quantity || 1}
                                    </td>
                                  </tr>
                                </>
                              )}
                              <tr className="border-t border-gray-200">
                                <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                  Delivered by
                                </td>
                                <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                  {order.scheduledDate ? formatDate(order.scheduledDate) : "TBD"}
                                </td>
                              </tr>
                              {(order.booking?.date || order.booking?.time) && (
                                <tr className="border-t border-gray-200">
                                  <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                    Delivery Date & Time
                                  </td>
                                  <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                    {order.booking?.date ? formatDate(order.booking.date) : "TBD"}
                                    {order.booking?.time && ` at ${order.booking.time}`}
                                    {order.booking?.timeSlot && ` (${order.booking.timeSlot})`}
                                  </td>
                                </tr>
                              )}
                              {order.discount > 0 && (
                                <tr className="bg-gray-50 border-t border-gray-200">
                                  <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                    Discount
                                  </td>
                                  <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-green-600">
                                    -£{formatMoney(order.discount)}
                                  </td>
                                </tr>
                              )}
                              <tr className={`${order.discount && order.discount > 0 ? '' : 'bg-gray-50'} border-t border-gray-200`}>
                                <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                  Sub Total
                                </td>
                                <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                  £{formatMoney(order.subtotal ?? order.amountValue ?? 0)}
                                </td>
                              </tr>
                              {order.serviceFee > 0 && (
                                <tr className="border-t border-gray-200">
                                  <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                    Service Fee
                                  </td>
                                  <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                    £{formatMoney(order.serviceFee)}
                                  </td>
                                </tr>
                              )}
                              <tr className="bg-gray-50 border-t-2 border-gray-300">
                                <td className="px-4 py-3 font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                                  Total
                                </td>
                                <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                                  £{formatMoney(order.amountValue ?? order.amount ?? 0)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Additional Info Tab */}
                    <TabsContent value="additional-info" className="mt-4 md:mt-6 space-y-4 md:space-y-6 px-4 md:px-6">
                      {/* Additional Information Section */}
                      <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                            Additional Information
                          </h3>
                          {!order?.additionalInformation?.submittedAt && order && (
                            <Button
                              type="button"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-['Poppins',sans-serif] text-[13px] relative z-10"
                              onClick={() => openModal('addInfo')}
                            >
                              + Add now
                            </Button>
                          )}
                        </div>

                        {order.additionalInformation?.submittedAt ? (
                          <div className="space-y-4">
                            {/* Submitted Message */}
                            {order.additionalInformation.message && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                  Your message:
                                </p>
                                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                  {order.additionalInformation.message}
                                </p>
                              </div>
                            )}

                            {/* Submitted Files */}
                            {order.additionalInformation.files && order.additionalInformation.files.length > 0 && (
                              <div>
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                                  Attachments ({order.additionalInformation.files.length}):
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {order.additionalInformation.files.map((file: any, index: number) => (
                                    <div 
                                      key={index} 
                                      className="relative rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-colors border border-gray-200"
                                      onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                                    >
                                      {file.fileType === 'image' ? (
                                        <img 
                                          src={resolveFileUrl(file.url)}
                                          alt={file.fileName}
                                          className="w-full h-24 object-cover"
                                        />
                                      ) : file.fileType === 'video' ? (
                                        <div className="w-full h-24 bg-gray-200 flex items-center justify-center">
                                          <PlayCircle className="w-8 h-8 text-gray-600" />
                                        </div>
                                      ) : (
                                        <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                                          <FileText className="w-8 h-8 text-gray-600" />
                                        </div>
                                      )}
                                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] p-2 truncate">
                                        {file.fileName}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="font-['Poppins',sans-serif] text-[12px] text-green-600">
                              ✓ Submitted on {new Date(order.additionalInformation.submittedAt).toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        ) : (
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            No additional information has been submitted yet. Click "Add now" to provide special requirements or attachments for the professional.
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    {/* Delivery Tab */}
                    <TabsContent value="delivery" className="mt-4 md:mt-6 px-4 md:px-6">
                      <div className="bg-white rounded-xl p-6 shadow-md">
                        {(() => {
                          // Get all "Work Delivered" timeline events
                          const deliveryEvents = timelineEvents.filter(event => event.title === "Work Delivered");
                          
                          // Sort chronologically (oldest first for proper #1, #2, #3 numbering)
                          const sortedDeliveries = [...deliveryEvents].sort((a, b) => {
                            const aTime = a.at ? new Date(a.at).getTime() : 0;
                            const bTime = b.at ? new Date(b.at).getTime() : 0;
                            return aTime - bTime;
                          });

                          if (sortedDeliveries.length > 0) {
                            return (
                              <div className="space-y-6">
                                {sortedDeliveries.map((delivery, index) => (
                                  <div key={index} className="flex gap-4">
                                    <div className="flex flex-col items-center pt-1">
                                      <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                                        <Truck className="w-5 h-5 text-white" />
                                      </div>
                                      {index < sortedDeliveries.length - 1 && (
                                        <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "40px" }} />
                                      )}
                                    </div>
                                    <div className="flex-1 pb-6">
                                      <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                                        #{index + 1} Work Delivered
                                      </h4>
                                      <p className="font-['Poppins',sans-serif] text-[13px] mb-3">
                                        <span className="text-purple-600 hover:underline cursor-pointer">{order.professional}</span>{" "}
                                        <span className="text-[#6b6b6b]">delivered the work</span>{" "}
                                        <span className="text-[#6b6b6b] italic">
                                          {delivery.at ? formatDate(delivery.at) : formatDate(new Date().toISOString())}
                                        </span>
                                      </p>

                                      {/* Delivery Content Box - Show delivery message and files */}
                                      {(delivery.message || (delivery.files && delivery.files.length > 0)) && (
                                        <div className="border border-purple-200 rounded-lg p-4 mb-4 bg-purple-50/30">
                                          {delivery.message && (
                                            <div className="mb-3">
                                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                                Delivery message:
                                              </p>
                                              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                                {delivery.message}
                                              </p>
                                            </div>
                                          )}
                                          
                                          {/* Delivery Attachments */}
                                          {delivery.files && delivery.files.length > 0 && (
                                            <div>
                                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                                📎 Attachments ({delivery.files.length})
                                              </p>
                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {delivery.files.map((file: any, fileIndex: number) => (
                                                  <div key={fileIndex} className="relative group">
                                                    {file.fileType === 'image' ? (
                                                      <img
                                                        src={resolveFileUrl(file.url)}
                                                        alt={file.fileName}
                                                        className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                                                      />
                                                    ) : (
                                                      <div
                                                        className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                                                        onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                                                      >
                                                        <PlayCircle className="w-8 h-8 text-gray-600" />
                                                        <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded truncate">
                                                          {file.fileName}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Approval Message - Show only for the latest delivery if order is not completed and no active revision request */}
                                      {index === sortedDeliveries.length - 1 &&
                                       order.status !== "Completed" && 
                                       order.deliveryStatus !== "completed" &&
                                       (!order.revisionRequest || 
                                        (order.revisionRequest.status !== 'pending' && 
                                         order.revisionRequest.status !== 'in_progress')) && (
                                        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mt-4">
                                          <div className="flex gap-2 mb-4">
                                            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <p className="font-['Poppins',sans-serif] text-[14px] text-blue-900">
                                              Your work has been delivered. Please approve the delivery or request a revision. {delivery.at && (() => {
                                                const deliveryDate = new Date(delivery.at);
                                                const deadlineDate = new Date(deliveryDate);
                                                deadlineDate.setDate(deadlineDate.getDate() + 1);
                                                return `You have until ${formatDate(deadlineDate.toISOString())} to respond.`;
                                              })()} If no action is taken by then, the order will be automatically completed.
                                            </p>
                                          </div>
                                          <div className="flex gap-3 justify-center">
                                            <Button
                                              onClick={handleAcceptDelivery}
                                              className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[14px] px-6"
                                            >
                                              Approve
                                            </Button>
                                            <Button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openModal('revisionRequest');
                                              }}
                                              variant="outline"
                                              className="font-['Poppins',sans-serif] text-[14px] border-blue-600 text-blue-600 hover:bg-blue-50 px-6"
                                            >
                                              Request Modification
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          // No deliveries yet - show status message
                          if (order.deliveryStatus === "active" || order.status === "In Progress") {
                            return (
                              <div className="text-center py-8">
                                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                                  Work In Progress
                                </p>
                                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                  The professional is currently working on your order.
                                </p>
                              </div>
                            );
                          }

                          // Order is pending or waiting to start
                          return (
                            <div className="text-center py-8">
                              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                                Awaiting Professional
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                Your order is waiting for the professional to start work.
                              </p>
                            </div>
                          );
                        })()}

                        {order.deliveryStatus === "completed" && (
                          <div className="space-y-4">
                            <div className="text-center py-8">
                              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                              </div>
                              <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                                Order Completed
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                                This order has been completed and accepted.
                              </p>
                            </div>

                            {order.rating && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                                    Your Rating
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 fill-[#FE8A0F] text-[#FE8A0F]" />
                                    <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                                      {order.rating} / 5
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Task Address Section */}
                      {order.address && (
                        <div className="bg-white rounded-xl p-6 mt-4 md:mt-6 shadow-md">
                          <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-3">
                            Task Address
                          </h3>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-red-600">
                            {order.address.addressLine1}
                            {order.address.addressLine2 && `, ${order.address.addressLine2}`}
                            {order.address.city && `, ${order.address.city}`}
                            {order.address.postcode && `-${order.address.postcode}`}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Right Side - Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl p-6 sticky top-6 shadow-md">
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-6">
                    Order Details
                  </h3>

                  {/* Service Preview */}
                  <div className="mb-6">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
                      Service
                    </p>
                    <div className="flex gap-3 items-start">
                      {(() => {
                        // First try to use fetched service thumbnail
                        const fetchedThumbnail = serviceThumbnails[order.id];
                        
                        if (fetchedThumbnail) {
                          if (fetchedThumbnail.type === 'video') {
                            return (
                              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
                                <VideoThumbnail
                                  videoUrl={resolveFileUrl(fetchedThumbnail.url)}
                                  thumbnail={fetchedThumbnail.thumbnail ? resolveFileUrl(fetchedThumbnail.thumbnail) : undefined}
                                  className="w-full h-full"
                                />
                              </div>
                            );
                          } else {
                            return (
                              <img 
                                src={resolveFileUrl(fetchedThumbnail.url)}
                                alt="Service thumbnail"
                                className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = serviceVector;
                                }}
                              />
                            );
                          }
                        }
                        
                        // Fallback to order item image
                        const serviceImage = order.items && order.items.length > 0 && order.items[0]?.image 
                          ? order.items[0].image 
                          : order.serviceImage || serviceVector;
                        
                        const imageUrl = serviceImage !== serviceVector ? resolveFileUrl(serviceImage) : serviceVector;
                        const isVideo = isVideoFile(serviceImage);
                        
                        if (isVideo && serviceImage !== serviceVector) {
                          return (
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
                              <VideoThumbnail
                                videoUrl={imageUrl}
                                className="w-full h-full"
                              />
                            </div>
                          );
                        } else {
                          return (
                            <img 
                              src={imageUrl}
                              alt="Service thumbnail"
                              className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = serviceVector;
                              }}
                            />
                          );
                        }
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {order.service}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="mb-6" />

                  {/* Professional */}
                  <div className="mb-6">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
                      Ordered From
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={resolveAvatarUrl(order.professionalAvatar)} />
                        <AvatarFallback>{order.professional?.charAt(0) || "P"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {order.professional}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                            Online
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={handleStartConversation}
                        variant="outline"
                        size="sm"
                        className="flex-1 font-['Poppins',sans-serif] text-[12px] h-8"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>

                  <Separator className="mb-6" />

                  {/* Delivery Date and Time */}
                  {(order.booking?.date || order.booking?.time || order.scheduledDate) && (
                    <div className="mb-6">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                        Delivery Date & Time
                      </p>
                      {(order.booking?.date || order.scheduledDate) && (
                        <div className="flex items-center gap-2 text-[#2c353f]">
                          <Calendar className="w-4 h-4 text-[#6b6b6b]" />
                          <span className="font-['Poppins',sans-serif] text-[13px]">
                            {order.booking?.date ? formatDate(order.booking.date) : (order.scheduledDate ? formatDate(order.scheduledDate) : "TBD")}
                          </span>
                        </div>
                      )}
                      {(order.booking?.time || order.booking?.timeSlot) && (
                        <div className="flex items-center gap-2 text-[#2c353f] mt-2">
                          <Clock className="w-4 h-4 text-[#6b6b6b]" />
                          <span className="font-['Poppins',sans-serif] text-[13px]">
                            {order.booking.time ? order.booking.time : order.booking.timeSlot}
                            {order.booking.timeSlot && order.booking.time && ` (${order.booking.timeSlot})`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator className="mb-6" />

                  {/* Total Price */}
                  <div className="mb-6">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      Total Price
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[24px] text-[#FE8A0F]">
                      {order.amount}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {(order.deliveryStatus === "delivered" || order.deliveryStatus === "completed") && (
                    <>
                      <Separator className="mb-6" />
                      <div className="space-y-2">
                        <Button
                          onClick={() => openModal('dispute')}
                          variant="outline"
                          className="w-full font-['Poppins',sans-serif] text-[13px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Open Dispute
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Dispute Section - To be implemented later if needed */}
        {showDisputeSection && (
          <div className="text-center py-12">
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Dispute section - To be implemented if needed
            </p>
          </div>
        )}

        {/* Dialogs */}
        {/* Rating Dialog */}
        <Dialog open={isRatingDialogOpen} onOpenChange={(open) => {
          if (open) {
            openModal('rating');
          } else {
            closeAllModals();
          }
        }}>
          <DialogContent className="w-[95vw] !max-w-[1400px] sm:!max-w-[1400px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Rate Your Service</DialogTitle>
              <DialogDescription>Provide your rating and review for the service</DialogDescription>
            </DialogHeader>

            {order.rating ? (
              <>
                {/* Already Reviewed - Show Submitted Review */}
                <div className="bg-blue-50 border-b border-blue-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-['Poppins',sans-serif] text-[16px] text-blue-800 font-semibold">
                        Your Review
                      </h3>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-blue-600">
                        Thank you for sharing your experience!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row">
                  {/* Left Side - Submitted Review Display */}
                  <div className="flex-1 p-6 lg:p-8">
                    <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#3D5A80] font-medium mb-4">
                      Your Public Review
                    </h2>
                    
                    {/* Overall Rating */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                        Overall Rating
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-6 h-6 ${
                                star <= (order.rating || 0)
                                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-semibold ml-2">
                          {order.rating}/5
                        </span>
                      </div>
                    </div>

                    {/* Review Text */}
                    {order.review && (
                      <div className="mb-6">
                        <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold mb-2">
                          Your Review
                        </h4>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] whitespace-pre-wrap">
                            {order.review}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Professional's Review of Client */}
                    {order.professionalReview && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-['Poppins',sans-serif] text-[15px] text-green-700 font-semibold mb-3">
                          Professional's Review
                        </h4>
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {order.professional?.charAt(0) || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mb-1">
                              {order.professional || "Professional"}
                            </p>
                            <div className="flex gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= (order.professionalReview?.rating || 0)
                                      ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            {order.professionalReview?.comment && (
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                                "{order.professionalReview.comment}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] italic">
                      Reviews can only be submitted once and cannot be edited.
                    </p>
                  </div>

                  {/* Right Side - Order Summary */}
                  <div className="lg:w-[320px] bg-gray-50 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200">
                    {order?.serviceImage && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={resolveFileUrl(order.serviceImage)}
                          alt={order.service}
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-medium mb-4 italic">
                      {order?.service || "Service"}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Status</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-['Poppins',sans-serif] text-[12px]">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Order</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          #{order?.id?.substring(0, 15) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Success Banner */}
                <div className="bg-green-50 border-b border-green-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-['Poppins',sans-serif] text-[16px] text-green-800 font-semibold">
                        Congratulation for completing your order
                      </h3>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-green-600">
                        Share your experience with other users
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row">
                  {/* Left Side - Review Form */}
                  <div className="flex-1 p-6 lg:p-8">
                    <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#3D5A80] font-medium mb-2">
                      Leave a public review
                    </h2>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-6">
                      Share your experience of what is it like working with {order?.professional || "this professional"}.
                    </p>

                    {/* Rating Categories */}
                    <div className="space-y-6 mb-8">
                      {/* Communication With Seller */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold">
                            Communication With Seller
                          </h4>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            How responsive was the seller during the process?
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setCommunicationRating(star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  star <= communicationRating
                                    ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Service as Described */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold">
                            Service as Described
                          </h4>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Did the result match the service's description?
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setServiceAsDescribedRating(star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  star <= serviceAsDescribedRating
                                    ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Buy Again or Recommended */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold">
                            Buy Again or Recommended
                          </h4>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Would you recommend buying this service?
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setBuyAgainRating(star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  star <= buyAgainRating
                                    ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Review Text */}
                    <div className="mb-6">
                      <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold mb-2">
                        What was it like working with this Seller?
                      </h4>
                      <Textarea
                        placeholder="Your review..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={5}
                        className="font-['Poppins',sans-serif] text-[14px] border-gray-300 focus:border-[#3D78CB] resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmitRating}
                      disabled={isSubmittingReview}
                      className="bg-[#FE8A0F] hover:bg-[#e07a0d] text-white font-['Poppins',sans-serif] text-[14px] px-8 py-3 rounded-lg"
                    >
                      {isSubmittingReview ? "Submitting..." : "Submit"}
                    </Button>
                  </div>

                  {/* Right Side - Order Summary */}
                  <div className="lg:w-[320px] bg-gray-50 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200">
                    {order?.serviceImage && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={resolveFileUrl(order.serviceImage)}
                          alt={order.service}
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-medium mb-4 italic">
                      {order?.service || "Service"}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Status</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-['Poppins',sans-serif] text-[12px]">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Order</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          #{order?.id?.substring(0, 15) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Order Date</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {order?.date ? new Date(order.date).toLocaleString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Quantity</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {order?.quantity || 1}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Price</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {order?.amount || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Task Address */}
                    {order?.address && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-semibold mb-2">
                          Task Address
                        </h4>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          {typeof order.address === 'string' 
                            ? order.address 
                            : (
                              <>
                                {order.address.name && <>{order.address.name}<br /></>}
                                {order.address.addressLine1}
                                {order.address.addressLine2 && <>, {order.address.addressLine2}</>}
                                <br />
                                {order.address.city && <>{order.address.city}, </>}
                                {order.address.postcode}
                                {order.address.phone && (
                                  <>
                                    <br />
                                    Tel: {order.address.phone}
                                  </>
                                )}
                              </>
                            )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={(open) => {
          if (open) {
            openModal('cancel');
          } else {
            closeAllModals();
          }
        }}>
          <DialogContent className="w-[70vw]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
                Cancel Order
              </DialogTitle>
              <DialogDescription className="sr-only">
                Cancel this order and provide a reason
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                  ⚠️ Are you sure you want to cancel this order? This action cannot be undone.
                </p>
              </div>

              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Reason for Cancellation *
                </Label>
                <Textarea
                  placeholder="Please provide a reason for cancelling this order..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  className="font-['Poppins',sans-serif] text-[13px]"
                />
              </div>

              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Attachments (optional)
                </Label>
                <input
                  ref={cancelFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.txt"
                  onChange={handleCancelFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cancelFileInputRef.current?.click()}
                  className="font-['Poppins',sans-serif] text-[13px]"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Add files
                </Button>
                {cancelFiles.length > 0 && (
                  <ul className="mt-2 space-y-1 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                    {cancelFiles.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="truncate flex-1">{f.name}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCancelFiles((p) => p.filter((_, j) => j !== i))}>
                          <X className="w-3 h-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={closeAllModals}
                  variant="outline"
                  className="flex-1 font-['Poppins',sans-serif]"
                >
                  Keep Order
                </Button>
                <Button
                  onClick={handleCancelOrder}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif]"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dispute Dialog */}
        <DisputeDialog
          open={isDisputeDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('dispute');
            } else {
              closeAllModals();
            }
          }}
          disputeRequirements={disputeRequirements}
          onDisputeRequirementsChange={setDisputeRequirements}
          disputeUnmetRequirements={disputeUnmetRequirements}
          onDisputeUnmetRequirementsChange={setDisputeUnmetRequirements}
          disputeEvidenceFiles={disputeEvidenceFiles}
          onDisputeEvidenceFilesChange={setDisputeEvidenceFiles}
          disputeOfferAmount={disputeOfferAmount}
          onDisputeOfferAmountChange={setDisputeOfferAmount}
          currentOrder={order}
          onSubmit={handleCreateDispute}
          onCancel={() => {
            closeAllModals();
            setDisputeRequirements("");
            setDisputeUnmetRequirements("");
            setDisputeEvidenceFiles([]);
            setDisputeOfferAmount("");
          }}
        />

        {/* Revision Request Dialog */}
        <Dialog 
          open={isRevisionRequestDialogOpen} 
          onOpenChange={(open) => {
            if (open) {
              openModal('revisionRequest');
            } else {
              closeAllModals();
            }
          }}
        >
          <DialogContent className="w-[90vw] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
                Request Revision
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Please provide a detailed reason for the revision request. This will be sent to the professional.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="revision-reason" className="font-['Poppins',sans-serif] text-[14px] mb-2 block">
                  Revision Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="revision-reason"
                  placeholder="Describe what needs to be modified or improved..."
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  className="font-['Poppins',sans-serif] min-h-[120px]"
                  rows={5}
                />
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-2">
                  Be as specific as possible to help the professional understand what changes you need.
                </p>
              </div>
              <div>
                <Label htmlFor="revision-message" className="font-['Poppins',sans-serif] text-[14px] mb-2 block">
                  Additional Details (Optional)
                </Label>
                <Textarea
                  id="revision-message"
                  placeholder="Add any extra notes or context..."
                  value={revisionMessage}
                  onChange={(e) => setRevisionMessage(e.target.value)}
                  className="font-['Poppins',sans-serif] min-h-[100px]"
                  rows={4}
                />
              </div>
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] mb-2 block">
                  Attachments (Optional)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#3D78CB] transition-colors">
                  <input
                    type="file"
                    id="revision-files"
                    accept="image/*,video/*,.pdf,.txt"
                    multiple
                    onChange={handleRevisionFileChange}
                    className="hidden"
                  />
                  <label htmlFor="revision-files" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1">
                      Click to upload files
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                      Images, videos, PDFs or text files (max 10)
                    </p>
                  </label>
                </div>
                {revisionFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {revisionFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] truncate">
                            {file.name}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRevisionFile(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                onClick={closeAllModals}
                variant="outline"
                className="font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestRevision}
                disabled={!revisionReason.trim()}
                className="bg-[#3D78CB] hover:bg-[#2D5FA3] text-white font-['Poppins',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Revision Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Info Dialog */}
        <AddInfoDialog
          open={isAddInfoDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('addInfo');
            } else {
              closeAllModals();
            }
          }}
          order={order}
          onSubmit={async (orderId, message, files) => {
            try {
              await addAdditionalInfo(orderId, message, files);
              toast.success("Additional information submitted successfully.");
              closeAllModals();
              setAddInfoMessage("");
              setAddInfoFiles([]);
              await refreshOrders();
            } catch (error: any) {
              toast.error(error.message || "Failed to submit additional information");
            }
          }}
        />

        {/* Dispute Response Dialog */}
        <DisputeResponseDialog
          open={isDisputeResponseDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('disputeResponse');
            } else {
              closeAllModals();
            }
          }}
          disputeResponseMessage={disputeResponseMessage}
          onDisputeResponseMessageChange={setDisputeResponseMessage}
          onSubmit={handleRespondToDispute}
          onCancel={() => {
            closeAllModals();
            setDisputeResponseMessage("");
          }}
        />
      </div>
    </div>
  );
}

function ProfessionalOrderDetailView({ order, onBack }: { order: any; onBack: () => void }) {
  const navigate = useNavigate();
  const { orders, deliverWork, professionalComplete, getOrderDisputeById, requestExtension, requestCancellation, respondToCancellation, respondToRevision, completeRevision, respondToDispute, requestArbitration, cancelDispute, refreshOrders } = useOrders();
  const { userInfo } = useAccount();
  const { startConversation } = useMessenger();

  // State management
  const [orderDetailTab, setOrderDetailTab] = useState("timeline");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [isDisputeResponseDialogOpen, setIsDisputeResponseDialogOpen] = useState(false);
  const [disputeResponseMessage, setDisputeResponseMessage] = useState("");
  const [showDisputeSection, setShowDisputeSection] = useState(false);
  const [disputeRequirements, setDisputeRequirements] = useState("");
  const [disputeUnmetRequirements, setDisputeUnmetRequirements] = useState("");
  const [disputeEvidenceFiles, setDisputeEvidenceFiles] = useState<File[]>([]);
  const [disputeOfferAmount, setDisputeOfferAmount] = useState("");
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false);
  const [extensionNewDate, setExtensionNewDate] = useState("");
  const [extensionNewTime, setExtensionNewTime] = useState("09:00");
  const [shownServiceTimeToasts, setShownServiceTimeToasts] = useState<Set<string>>(new Set());
  const [extensionReason, setExtensionReason] = useState("");
  const [isCancellationRequestDialogOpen, setIsCancellationRequestDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isWithdrawCancellationDialogOpen, setIsWithdrawCancellationDialogOpen] = useState(false);
  const [withdrawCancellationReason, setWithdrawCancellationReason] = useState("");
  const [isRevisionResponseDialogOpen, setIsRevisionResponseDialogOpen] = useState(false);
  const [revisionResponseAction, setRevisionResponseAction] = useState<'accept' | 'reject'>('accept');
  const [revisionAdditionalNotes, setRevisionAdditionalNotes] = useState("");
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [isProfessionalReviewDialogOpen, setIsProfessionalReviewDialogOpen] = useState(false);
  const [buyerRating, setBuyerRating] = useState(0);
  const [buyerReview, setBuyerReview] = useState("");
  const [isSubmittingBuyerReview, setIsSubmittingBuyerReview] = useState(false);
  const [hasSubmittedBuyerReview, setHasSubmittedBuyerReview] = useState(false);
  const [clientReviewData, setClientReviewData] = useState<any>(null);
  const [serviceThumbnails, setServiceThumbnails] = useState<{[orderId: string]: { type: 'image' | 'video', url: string, thumbnail?: string }}>({});
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);

  // Function to close all modals
  const closeAllModals = () => {
    setIsDeliveryDialogOpen(false);
    setIsDisputeResponseDialogOpen(false);
    setIsExtensionDialogOpen(false);
    setIsCancellationRequestDialogOpen(false);
    setIsWithdrawCancellationDialogOpen(false);
    setIsRevisionResponseDialogOpen(false);
    setIsCompletionDialogOpen(false);
    setIsProfessionalReviewDialogOpen(false);
    setIsDisputeDialogOpen(false);
    setCancellationReason("");
    setWithdrawCancellationReason("");
    setExtensionReason("");
    setExtensionNewDate("");
    setExtensionNewTime("09:00");
    setDeliveryMessage("");
    setDeliveryFiles([]);
    setCompletionMessage("");
    setCompletionFiles([]);
    setRevisionAdditionalNotes("");
    setDisputeResponseMessage("");
  };

  // Function to open a specific modal
  const openModal = (modalName: 'dispute' | 'delivery' | 'disputeResponse' | 'extension' | 'cancellationRequest' | 'withdrawCancellation' | 'revisionResponse' | 'completion' | 'professionalReview') => {
    closeAllModals();
    switch (modalName) {
      case 'dispute':
        setIsDisputeDialogOpen(true);
        break;
      case 'delivery':
        setIsDeliveryDialogOpen(true);
        break;
      case 'disputeResponse':
        setIsDisputeResponseDialogOpen(true);
        break;
      case 'extension':
        setIsExtensionDialogOpen(true);
        break;
      case 'cancellationRequest':
        setIsCancellationRequestDialogOpen(true);
        break;
      case 'withdrawCancellation':
        setIsWithdrawCancellationDialogOpen(true);
        break;
      case 'revisionResponse':
        setIsRevisionResponseDialogOpen(true);
        break;
      case 'completion':
        setIsCompletionDialogOpen(true);
        break;
      case 'professionalReview':
        setIsProfessionalReviewDialogOpen(true);
        break;
    }
  };

  // Fetch service thumbnail
  useEffect(() => {
    const fetchServiceThumbnail = async () => {
      if (!order || !order.items || order.items.length === 0) return;
      
      const serviceId = (order.items[0] as any)?.serviceId || order.items[0]?.id;
      if (!serviceId || serviceThumbnails[order.id]) return;
      
      try {
        const response = await fetch(resolveApiUrl(`/api/services/${serviceId}`), {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const service = data.service;
          
          if (service) {
            let thumbnail: { type: 'image' | 'video', url: string, thumbnail?: string } | null = null;
            
            if (service.gallery && Array.isArray(service.gallery) && service.gallery.length > 0) {
              const firstItem = service.gallery[0];
              if (firstItem.type === 'video' && firstItem.url) {
                thumbnail = { type: 'video', url: firstItem.url, thumbnail: firstItem.thumbnail };
              } else if (firstItem.type === 'image' && firstItem.url) {
                thumbnail = { type: 'image', url: firstItem.url };
              }
            }
            
            if (!thumbnail) {
              if (service.videos && Array.isArray(service.videos) && service.videos.length > 0) {
                const firstVideo = service.videos[0];
                thumbnail = { type: 'video', url: firstVideo.url || firstVideo, thumbnail: firstVideo.thumbnail };
              } else if (service.images && Array.isArray(service.images) && service.images.length > 0) {
                thumbnail = { type: 'image', url: service.images[0] };
              } else if (service.image) {
                thumbnail = { type: 'image', url: service.image };
              }
            }
            
            if (thumbnail) {
              setServiceThumbnails(prev => ({ ...prev, [order.id]: thumbnail! }));
            }
          }
        }
      } catch (error) {
        // Silently fail
      }
    };
    
    fetchServiceThumbnail();
  }, [order?.id, (order?.items?.[0] as any)?.serviceId || order?.items?.[0]?.id, serviceThumbnails]);

  // Timeline events
  const timelineEvents = useMemo(
    () => (order ? buildProfessionalTimeline(order as any) : []),
    [order]
  );

  // Calculate appointment deadline
  const appointmentDeadline = useMemo(() => {
    if (!order) return null;
    
    const bookingDate = order.booking?.date;
    const bookingTime = order.booking?.time || order.booking?.timeSlot || "09:00";
    
    if (bookingDate) {
      const [hours, minutes] = bookingTime.split(':').map(Number);
      const deadline = new Date(bookingDate);
      if (!isNaN(hours)) deadline.setHours(hours);
      if (!isNaN(minutes)) deadline.setMinutes(minutes);
      return deadline;
    }
    
    if (order.scheduledDate) {
      return new Date(order.scheduledDate);
    }
    
    if (order.expectedDelivery) {
      return new Date(order.expectedDelivery);
    }
    
    return null;
  }, [order]);

  const appointmentCountdown = useCountdown(appointmentDeadline);

  // Work elapsed time
  const workStartTime = useMemo(() => {
    if (!order) return null;
    if (order.status === "Completed" || order.status === "Cancelled" || order.status === "Cancellation Pending") return null;
    if (order.deliveryStatus === "delivered" || order.deliveryStatus === "completed" || order.deliveryStatus === "cancelled") {
      return null;
    }

    if (order.revisionRequest?.status === "in_progress" && order.revisionRequest.respondedAt) {
      return new Date(order.revisionRequest.respondedAt);
    }

    const bookingDate = order.booking?.date;
    const bookingTime = order.booking?.time || order.booking?.timeSlot || "09:00";
    if (bookingDate) {
      const [hours, minutes] = bookingTime.split(":").map(Number);
      const start = new Date(bookingDate);
      if (!isNaN(hours)) start.setHours(hours);
      if (!isNaN(minutes)) start.setMinutes(minutes);
      if (Date.now() >= start.getTime()) return start;
    }

    if (order.scheduledDate) {
      const start = new Date(order.scheduledDate);
      if (Date.now() >= start.getTime()) return start;
    }

    return null;
  }, [order]);

  const workElapsedTime = useElapsedTime(workStartTime);

  // Show toast when service time arrives
  useEffect(() => {
    if (order && appointmentDeadline && appointmentCountdown.expired) {
      const orderId = order.id;
      const isPendingOrAccepted = order.deliveryStatus === "pending";
      
      if (isPendingOrAccepted && !shownServiceTimeToasts.has(orderId)) {
        toast.success("Service Time Has Arrived!", {
          description: "The scheduled appointment time has arrived. You can now start working on the service.",
          duration: 8000,
        });
        setShownServiceTimeToasts(prev => new Set(prev).add(orderId));
      }
    }
  }, [order, appointmentDeadline, appointmentCountdown.expired, shownServiceTimeToasts]);

  // Timeline timer component
  const timelineTimer = (
    <>
      {/* Countdown Timer */}
      {!workElapsedTime.started &&
       appointmentDeadline &&
       !appointmentCountdown.expired &&
       order.status !== "Completed" &&
       order.status !== "Cancelled" &&
       order.status !== "Cancellation Pending" &&
       order.deliveryStatus !== "delivered" && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FE8A0F]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#FE8A0F]" />
            </div>
            <div>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] uppercase tracking-wider">
                Expected Delivery Time
              </p>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                {order.booking?.date
                  ? `${formatDate(order.booking.date)} ${order.booking?.time || order.booking?.timeSlot || ''}`
                  : order.scheduledDate
                    ? formatDate(order.scheduledDate)
                    : "TBD"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                {String(appointmentCountdown.days).padStart(2, '0')}
              </div>
              <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                Days
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                {String(appointmentCountdown.hours).padStart(2, '0')}
              </div>
              <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                Hours
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                {String(appointmentCountdown.minutes).padStart(2, '0')}
              </div>
              <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                Minutes
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                {String(appointmentCountdown.seconds).padStart(2, '0')}
              </div>
              <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                Seconds
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FE8A0F] to-[#FFB347] rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, Math.max(0, 100 - (appointmentCountdown.total / (24 * 60 * 60 * 1000) * 100)))}%`
                }}
              />
            </div>
            <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
              {appointmentCountdown.days > 0 ? `${appointmentCountdown.days}d remaining` : 'Today'}
            </span>
          </div>
        </div>
      )}

      {/* Work In Progress Timer */}
      {workElapsedTime.started &&
       order.status !== "Completed" &&
       order.status !== "Cancelled" &&
       order.status !== "Cancellation Pending" &&
       order.deliveryStatus !== "delivered" && (
        <div className="bg-[#EAF2FF] rounded-2xl p-6 shadow-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-['Poppins',sans-serif] text-[12px] text-blue-600 uppercase tracking-wider">
                Work In Progress
              </p>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                Started: {workStartTime
                  ? workStartTime.toLocaleString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
              <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                {String(workElapsedTime.days).padStart(2, '0')}
              </div>
              <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                Days
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
              <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                {String(workElapsedTime.hours).padStart(2, '0')}
              </div>
              <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                Hours
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
              <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                {String(workElapsedTime.minutes).padStart(2, '0')}
              </div>
              <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                Minutes
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
              <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                {String(workElapsedTime.seconds).padStart(2, '0')}
              </div>
              <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                Seconds
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="font-['Poppins',sans-serif] text-[12px] text-blue-600">
              Timer running until you complete the order
            </span>
          </div>
        </div>
      )}
    </>
  );

  // Handler functions
  const handleMarkAsDelivered = async () => {
    if (!deliveryMessage.trim() && (!deliveryFiles || deliveryFiles.length === 0)) {
      toast.error("Please add a delivery message or upload files");
      return;
    }
    if (order.revisionRequest && order.revisionRequest.status === 'in_progress') {
      try {
        await completeRevision(order.id, deliveryMessage, deliveryFiles.length > 0 ? deliveryFiles : undefined);
        toast.success("Revision completed and delivered successfully!");
        closeAllModals();
        setDeliveryMessage("");
        setDeliveryFiles([]);
      } catch (error: any) {
        toast.error(error.message || "Failed to complete revision");
      }
    } else {
      try {
        await deliverWork(order.id, deliveryMessage, deliveryFiles.length > 0 ? deliveryFiles : undefined);
        toast.success("Order marked as delivered! Client will be notified.");
        closeAllModals();
        setDeliveryMessage("");
        setDeliveryFiles([]);
      } catch (error: any) {
        toast.error(error.message || "Failed to mark order as delivered");
      }
    }
  };

  const handleRequestExtension = async () => {
    if (!extensionNewDate) {
      toast.error("Please select a new delivery date");
      return;
    }
    try {
      const newDeliveryDateTime = `${extensionNewDate}T${extensionNewTime}`;
      await requestExtension(order.id, newDeliveryDateTime, extensionReason || undefined);
      toast.success("Extension request submitted. The client will be notified.");
      closeAllModals();
      setExtensionNewDate("");
      setExtensionNewTime("09:00");
      setExtensionReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to request extension");
    }
  };

  const handleProfessionalComplete = async () => {
    if (!completionMessage.trim() && completionFiles.length === 0) {
      toast.error("Please add a completion message or upload verification files");
      return;
    }
    try {
      await professionalComplete(order.id, completionMessage || undefined, completionFiles.length > 0 ? completionFiles : undefined);
      toast.success("Completion request submitted. Waiting for client approval.");
      closeAllModals();
      setCompletionMessage("");
      setCompletionFiles([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit completion request");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        const type = file.type;
        return type.startsWith('image/') || type.startsWith('video/');
      });
      
      if (validFiles.length !== newFiles.length) {
        toast.error("Only images and videos are allowed");
      }
      
      const filesToAdd = validFiles.slice(0, 10 - deliveryFiles.length);
      if (filesToAdd.length < validFiles.length) {
        toast.error("Maximum 10 files allowed");
      }
      
      setDeliveryFiles(prev => [...prev, ...filesToAdd]);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setDeliveryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateDispute = async () => {
    if (!disputeRequirements.trim()) {
      toast.error("Please describe what the requirements were for the order");
      return;
    }
    if (!disputeUnmetRequirements.trim()) {
      toast.error("Please describe which requirements were not completed");
      return;
    }
    
    const offerAmount = parseFloat(disputeOfferAmount);
    const orderAmount = order.amountValue || 0;
    
    if (disputeOfferAmount === '' || isNaN(offerAmount)) {
      toast.error("Please enter a valid offer amount");
      return;
    }
    if (offerAmount < 0) {
      toast.error("Offer amount cannot be negative");
      return;
    }
    if (offerAmount > orderAmount) {
      toast.error(`Offer amount cannot exceed the order amount (£${orderAmount.toFixed(2)})`);
      return;
    }
    
    if (order.deliveryStatus !== 'delivered' && order.status !== 'In Progress') {
      toast.error("Disputes can only be opened for delivered orders");
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('requirements', disputeRequirements);
      formData.append('unmetRequirements', disputeUnmetRequirements);
      formData.append('offerAmount', disputeOfferAmount);
      
      disputeEvidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });
      
      const response = await fetch(resolveApiUrl(`/api/orders/${order.id}/dispute`), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create dispute');
      }
      
      toast.success("Dispute created successfully. The client will be notified.");
      closeAllModals();
      setDisputeRequirements("");
      setDisputeUnmetRequirements("");
      setDisputeEvidenceFiles([]);
      setDisputeOfferAmount("");
      refreshOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to create dispute");
    }
  };

  const handleRespondToDispute = async () => {
    if (!disputeResponseMessage.trim()) {
      toast.error("Please provide a response message");
      return;
    }
    try {
      await respondToDispute(order.id, disputeResponseMessage);
      toast.success("Dispute response submitted successfully");
      closeAllModals();
      setDisputeResponseMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to respond to dispute");
    }
  };

  const handleRequestCancellation = async (files?: File[]) => {
    try {
      await requestCancellation(order.id, cancellationReason, files);
      toast.success("Cancellation request submitted. Waiting for response.");
      closeAllModals();
      setCancellationReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to request cancellation");
    }
  };

  const handleRespondToCancellation = async (action: 'approve' | 'reject', reason?: string) => {
    try {
      await respondToCancellation(order.id, action, reason);
      toast.success(`Cancellation request ${action}d successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} cancellation request`);
    }
  };

  const handleWithdrawCancellation = async () => {
    if (!withdrawCancellationReason.trim()) {
      toast.error("Please provide a reason for withdrawing the cancellation request");
      return;
    }
    try {
      await respondToCancellation(order.id, 'reject', withdrawCancellationReason.trim());
      toast.success("Cancellation request withdrawn. Your reason has been sent to the client.");
      closeAllModals();
      setWithdrawCancellationReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to withdraw cancellation request");
    }
  };

  const handleRequestArbitration = async () => {
    try {
      await requestArbitration(order.id);
      toast.success("Arbitration requested successfully. Admin will review the case.");
    } catch (error: any) {
      toast.error(error.message || "Failed to request arbitration");
    }
  };

  const handleCancelDispute = async () => {
    try {
      await cancelDispute(order.id);
      toast.success("Dispute cancelled successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel dispute");
    }
  };

  const handleRespondToRevision = async () => {
    try {
      await respondToRevision(order.id, revisionResponseAction, revisionAdditionalNotes || undefined);
      toast.success(`Revision request ${revisionResponseAction}ed successfully`);
      closeAllModals();
      setRevisionAdditionalNotes("");
    } catch (error: any) {
      toast.error(error.message || `Failed to ${revisionResponseAction} revision request`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!showDisputeSection && (
          <>
            <ProfessionalOrderDetailHeader
              order={order}
              onBack={onBack}
              onOpenDispute={() => openModal('dispute')}
            />

            {/* Main Layout - Left Content + Right Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side - Main Content (Tabs) */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl">
                  <Tabs value={orderDetailTab} onValueChange={setOrderDetailTab}>
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory touch-pan-x">
                      <TabsList className="bg-transparent p-0 h-auto w-full md:w-auto inline-flex min-w-full md:min-w-0 justify-start gap-1">
                        <TabsTrigger
                          value="timeline"
                          className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0 snap-start"
                        >
                          Timeline
                        </TabsTrigger>
                        <TabsTrigger
                          value="details"
                          className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0 snap-start"
                        >
                          Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="additional-info"
                          className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0 snap-start"
                        >
                          Additional Info
                        </TabsTrigger>
                        <TabsTrigger
                          value="delivery"
                          className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0 snap-start"
                        >
                          Delivery
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Timeline Tab */}
                    <TabsContent value="timeline" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
                      <ProfessionalOrderTimelineTab
                        order={order}
                        userInfo={userInfo}
                        timelineEvents={timelineEvents}
                        workElapsedTime={workElapsedTime}
                        timelineTimer={timelineTimer}
                        appointmentCountdown={appointmentCountdown}
                        appointmentDeadline={appointmentDeadline}
                        showDisputeSection={showDisputeSection}
                        getOrderDisputeById={getOrderDisputeById}
                        onOpenModal={openModal}
                        onStartConversation={startConversation}
                        onRespondToCancellation={handleRespondToCancellation}
                        onRespondToRevision={async (action) => {
                          try {
                            await respondToRevision(order.id, action);
                            toast.success(action === 'accept' ? "Revision accepted. Work resumed." : "Revision rejected.");
                          } catch (error: any) {
                            toast.error(error.message || "Failed to respond to revision");
                          }
                        }}
                        onRequestArbitration={handleRequestArbitration}
                        onCancelDispute={handleCancelDispute}
                        onSetExtensionNewDate={setExtensionNewDate}
                        onSetExtensionNewTime={setExtensionNewTime}
                        onSetExtensionReason={setExtensionReason}
                        onSetDeliveryMessage={setDeliveryMessage}
                        onSetDeliveryFiles={setDeliveryFiles}
                        onSetRevisionResponseAction={setRevisionResponseAction}
                        onSetRevisionAdditionalNotes={setRevisionAdditionalNotes}
                        onSetDisputeResponseMessage={setDisputeResponseMessage}
                        onSetBuyerRating={setBuyerRating}
                        onSetBuyerReview={setBuyerReview}
                        navigate={navigate}
                      />
                    </TabsContent>

                    {/* Details Tab */}
                    <TabsContent value="details" className="mt-4 md:mt-6 px-4 md:px-6">
                      <ProfessionalOrderDetailsTab order={order} />
                    </TabsContent>

                    {/* Additional Info Tab */}
                    <TabsContent value="additional-info" className="mt-4 md:mt-6 space-y-4 md:space-y-6 px-4 md:px-6">
                      <ProfessionalOrderAdditionalInfoTab order={order} />
                    </TabsContent>

                    {/* Delivery Tab */}
                    <TabsContent value="delivery" className="mt-4 md:mt-6 px-4 md:px-6">
                      <ProfessionalOrderDeliveryTab
                        order={order}
                        onOpenReviewModal={() => {
                          openModal('professionalReview');
                          setBuyerRating(0);
                          setBuyerReview("");
                          setHasSubmittedBuyerReview(false);
                          setClientReviewData(null);
                        }}
                        onStartConversation={startConversation}
                      />
                      {order.address && (
                        <ProfessionalOrderServiceAddressSection order={order} />
                      )}
                      {order.deliveryStatus === "completed" && (
                        <ProfessionalOrderDeliveryCompletionSection
                          order={order}
                          onOpenReviewModal={() => {
                            openModal('professionalReview');
                            setBuyerRating(0);
                            setBuyerReview("");
                            setHasSubmittedBuyerReview(false);
                            setClientReviewData(null);
                          }}
                          onStartConversation={startConversation}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Right Side - Order Summary Sidebar */}
              <ProfessionalOrderDetailSidebar
                order={order}
                serviceThumbnail={serviceThumbnails[order.id]}
                onStartConversation={startConversation}
                onOpenDeliveryModal={() => openModal('delivery')}
                onOpenDisputeModal={() => openModal('dispute')}
              />
            </div>
          </>
        )}

        {/* Dispute Detail Section */}
        {showDisputeSection && order.disputeId && (() => {
          const dispute = getOrderDisputeById(order.disputeId);
          if (!dispute) return null;
          
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Button
                  onClick={() => setShowDisputeSection(false)}
                  variant="ghost"
                  className="mb-4 font-['Poppins',sans-serif] text-[13px] hover:text-[#FE8A0F]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Order Details
                </Button>
                <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
                  Order payment dispute
                </h2>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                        Dispute ID:
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        {dispute.id.replace("DISP-", "")}
                      </p>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                        Case status:
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                        Decided in:
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        {dispute.claimantName} favour
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {dispute.messages.map((msg: any, index: number) => {
                      const isMsgClaimant = msg.userId === dispute.claimantId;
                      const showDeadline = index === dispute.messages.length - 1 && isMsgClaimant;
                      return (
                        <div key={msg.id} className={`border rounded-lg p-4 ${showDeadline ? 'bg-orange-50 border-orange-200' : 'border-gray-200'}`}>
                          <div className="flex gap-3">
                            <Avatar className="w-12 h-12 flex-shrink-0">
                              <AvatarImage src={msg.userAvatar} />
                              <AvatarFallback className="bg-[#3D78CB] text-white">
                                {msg.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  {isMsgClaimant && (
                                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                                      Claimant:
                                    </p>
                                  )}
                                  <p className="font-['Poppins',sans-serif] text-[15px] text-[#3D78CB]">
                                    {msg.userName}
                                  </p>
                                  {showDeadline && (
                                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#d97706] mt-1">
                                      Deadline: No reply
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
                                {msg.message}
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] text-right">
                                {new Date(msg.timestamp).toLocaleString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).replace(',', '')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 text-center">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                    Total disputed milestone<br />amount: <span className="text-[32px] text-[#2c353f]">£ {dispute.amount}</span>
                  </p>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                        Professional (you)<br />want to receive:
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f]">
                        £{dispute.respondentOffer?.amount.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                        Client ({dispute.claimantName})<br />wants to pay:
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f]">
                        £{dispute.claimantOffer?.amount.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="text-center">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                      Agreed: <span className="text-[18px] text-[#2c353f]">£ 0.00</span>
                    </p>
                    {dispute.status === "closed" && (
                      <p className="font-['Poppins',sans-serif] text-[16px] text-red-600 mt-2">
                        RESOLVED, DISPUTE CLOSED
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Dialogs */}
        <DeliveryDialog
          open={isDeliveryDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('delivery');
            } else {
              closeAllModals();
            }
          }}
          deliveryMessage={deliveryMessage}
          onDeliveryMessageChange={setDeliveryMessage}
          deliveryFiles={deliveryFiles}
          onDeliveryFilesChange={setDeliveryFiles}
          onSubmit={handleMarkAsDelivered}
          isRevisionCompletion={order?.revisionRequest?.status === 'in_progress'}
        />

        <ExtensionDialog
          open={isExtensionDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('extension');
            } else {
              closeAllModals();
            }
          }}
          extensionNewDate={extensionNewDate}
          onExtensionNewDateChange={setExtensionNewDate}
          extensionNewTime={extensionNewTime}
          onExtensionNewTimeChange={setExtensionNewTime}
          extensionReason={extensionReason}
          onExtensionReasonChange={setExtensionReason}
          currentOrder={order}
          onSubmit={handleRequestExtension}
          onCancel={() => {
            closeAllModals();
            setExtensionNewDate("");
            setExtensionNewTime("09:00");
            setExtensionReason("");
          }}
        />

        <CompletionDialog
          open={isCompletionDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('completion');
            } else {
              closeAllModals();
            }
          }}
          completionMessage={completionMessage}
          onCompletionMessageChange={setCompletionMessage}
          completionFiles={completionFiles}
          onCompletionFilesChange={setCompletionFiles}
          onSubmit={handleProfessionalComplete}
          onCancel={() => {
            closeAllModals();
            setCompletionMessage("");
            setCompletionFiles([]);
          }}
        />

        <DisputeDialog
          open={isDisputeDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('dispute');
            } else {
              closeAllModals();
            }
          }}
          disputeRequirements={disputeRequirements}
          onDisputeRequirementsChange={setDisputeRequirements}
          disputeUnmetRequirements={disputeUnmetRequirements}
          onDisputeUnmetRequirementsChange={setDisputeUnmetRequirements}
          disputeEvidenceFiles={disputeEvidenceFiles}
          onDisputeEvidenceFilesChange={setDisputeEvidenceFiles}
          disputeOfferAmount={disputeOfferAmount}
          onDisputeOfferAmountChange={setDisputeOfferAmount}
          currentOrder={order}
          onSubmit={handleCreateDispute}
          onCancel={() => {
            closeAllModals();
            setDisputeRequirements("");
            setDisputeUnmetRequirements("");
            setDisputeEvidenceFiles([]);
            setDisputeOfferAmount("");
          }}
        />

        <CancellationRequestDialog
          open={isCancellationRequestDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('cancellationRequest');
            } else {
              closeAllModals();
            }
          }}
          cancellationReason={cancellationReason}
          onCancellationReasonChange={setCancellationReason}
          onSubmit={handleRequestCancellation}
          onCancel={() => {
            closeAllModals();
            setCancellationReason("");
          }}
        />

        <WithdrawCancellationDialog
          open={isWithdrawCancellationDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('withdrawCancellation');
            } else {
              closeAllModals();
            }
          }}
          withdrawCancellationReason={withdrawCancellationReason}
          onWithdrawCancellationReasonChange={setWithdrawCancellationReason}
          onSubmit={handleWithdrawCancellation}
          onCancel={() => {
            closeAllModals();
            setWithdrawCancellationReason("");
          }}
        />

        <RevisionResponseDialog
          open={isRevisionResponseDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('revisionResponse');
            } else {
              closeAllModals();
            }
          }}
          revisionResponseAction={revisionResponseAction}
          revisionAdditionalNotes={revisionAdditionalNotes}
          onRevisionAdditionalNotesChange={setRevisionAdditionalNotes}
          currentOrder={order}
          onSubmit={handleRespondToRevision}
          onCancel={() => {
            closeAllModals();
            setRevisionAdditionalNotes("");
          }}
        />

        <DisputeResponseDialog
          open={isDisputeResponseDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openModal('disputeResponse');
            } else {
              closeAllModals();
            }
          }}
          disputeResponseMessage={disputeResponseMessage}
          onDisputeResponseMessageChange={setDisputeResponseMessage}
          onSubmit={handleRespondToDispute}
          onCancel={() => {
            closeAllModals();
            setDisputeResponseMessage("");
          }}
        />

        {/* Professional Review Dialog */}
        <Dialog open={isProfessionalReviewDialogOpen} onOpenChange={(open) => {
          if (open) {
            openModal('professionalReview');
          } else {
            closeAllModals();
          }
        }}>
          <DialogContent className="w-[95vw] !max-w-[1400px] sm:!max-w-[1400px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Leave Public Review</DialogTitle>
              <DialogDescription>Review your experience with this buyer</DialogDescription>
            </DialogHeader>

            {order.professionalReview || hasSubmittedBuyerReview ? (
              <>
                <div className="bg-blue-50 border-b border-blue-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-['Poppins',sans-serif] text-[16px] text-blue-800 font-semibold">
                        Your Review
                      </h3>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-blue-600">
                        Thank you for sharing your feedback!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1 p-6 lg:p-8">
                    <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#3D5A80] font-medium mb-4">
                      Your Review of the Buyer
                    </h2>
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                        Rating
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-6 h-6 ${
                                star <= (order.professionalReview?.rating || buyerRating || 0)
                                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-semibold ml-2">
                          {order.professionalReview?.rating || buyerRating || 0}/5
                        </span>
                      </div>
                    </div>
                    {(order.professionalReview?.comment || buyerReview) && (
                      <div className="mb-6">
                        <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold mb-2">
                          Your Review
                        </h4>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] whitespace-pre-wrap">
                            {order.professionalReview?.comment || buyerReview}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="lg:w-[320px] bg-gray-50 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200">
                    {order?.serviceImage && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={resolveFileUrl(order.serviceImage)}
                          alt={order.service}
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-medium mb-4 italic">
                      {order?.service || "Service"}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Status</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-['Poppins',sans-serif] text-[12px]">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Order</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          #{order?.id?.substring(0, 15) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1 p-6 lg:p-8">
                    <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#3D5A80] font-medium mb-4">
                      Leave Public Review
                    </h2>
                    {order?.rating ? (
                      <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={resolveAvatarUrl(order.clientAvatar)} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {order.client?.charAt(0) || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            <span className="font-semibold">{order.client}</span> has left you a feedback. To see their review, please leave your own feedback.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="font-['Poppins',sans-serif] text-[13px] text-yellow-700">
                          The client hasn't left a review yet. You can still leave your feedback about working with this buyer.
                        </p>
                      </div>
                    )}
                    <Collapsible defaultOpen className="border border-gray-200 rounded-lg overflow-hidden">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-[#FE8A0F]" />
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                            Review your experience with this buyer
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] italic ml-2">
                            {order?.completedDate ? formatDateTime(order.completedDate) : ""}
                          </span>
                        </div>
                        <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 border-t border-gray-200">
                        <div className="bg-[#3D5A80] text-white py-2 px-4 -mx-4 -mt-4 mb-4">
                          <p className="font-['Poppins',sans-serif] text-[13px] font-medium">
                            OVERVIEW EXPERIENCE
                          </p>
                        </div>
                        <div className="mb-6">
                          <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-semibold mb-1">
                            Rate your experience
                          </h4>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                            How would you rate your overall experience with this buyer?
                          </p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setBuyerRating(star)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-8 h-8 ${
                                    star <= buyerRating
                                      ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-6">
                          <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-semibold mb-1">
                            Share some more about your experience by words (public)
                          </h4>
                          <Textarea
                            placeholder="Your review..."
                            value={buyerReview}
                            onChange={(e) => setBuyerReview(e.target.value)}
                            rows={5}
                            className="font-['Poppins',sans-serif] text-[14px] border-gray-300 focus:border-[#3D78CB] resize-none"
                          />
                        </div>
                        <div className="flex justify-center">
                          <Button
                            onClick={async () => {
                              if (buyerRating === 0) {
                                toast.error("Please select a rating");
                                return;
                              }
                              setIsSubmittingBuyerReview(true);
                              try {
                                const response = await fetch(resolveApiUrl(`/api/orders/${order.id}/buyer-review`), {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    rating: buyerRating,
                                    comment: buyerReview,
                                  }),
                                });
                                if (!response.ok) {
                                  const error = await response.json();
                                  throw new Error(error.error || 'Failed to submit review');
                                }
                                toast.success("Review submitted successfully!");
                                setHasSubmittedBuyerReview(true);
                                const reviewResponse = await fetch(resolveApiUrl(`/api/orders/${order.id}/review`), {
                                  credentials: 'include',
                                });
                                if (reviewResponse.ok) {
                                  const reviewData = await reviewResponse.json();
                                  setClientReviewData(reviewData.review);
                                }
                              } catch (error: any) {
                                toast.error(error.message || "Failed to submit review");
                              } finally {
                                setIsSubmittingBuyerReview(false);
                              }
                            }}
                            disabled={isSubmittingBuyerReview || buyerRating === 0}
                            className="bg-[#FE8A0F] hover:bg-[#e07a0d] text-white font-['Poppins',sans-serif] text-[14px] px-8 py-3 rounded-lg"
                          >
                            {isSubmittingBuyerReview ? "Submitting..." : "Submit"}
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  <div className="lg:w-[320px] bg-gray-50 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200">
                    {order?.serviceImage && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={resolveFileUrl(order.serviceImage)}
                          alt={order.service}
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-medium mb-4 italic">
                      {order?.service || "Service"}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Status</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-['Poppins',sans-serif] text-[12px]">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Order</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          #{order?.id?.substring(0, 15) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
