import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrders } from "./OrdersContext";
import { useMessenger } from "./MessengerContext";
import { useAccount } from "./AccountContext";
import DeliveryCountdown from "./DeliveryCountdown";
import { useCountdown } from "../hooks/useCountdown";
import { useElapsedTime } from "../hooks/useElapsedTime";
import { resolveApiUrl } from "../config/api";
import {
  ShoppingBag,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Eye,
  MessageCircle,
  Star,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  FileText,
  Send,
  Download,
  ChevronDown,
  Info,
  Truck,
  Check,
  MoreVertical,
  ChevronUp,
  Edit,
  PlayCircle,
  Upload,
  Image,
  Film,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import serviceVector from "../assets/service_vector.jpg";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner@2.0.3";

export default function ClientOrdersSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, cancelOrder, acceptDelivery, createOrderDispute, getOrderDisputeById, rateOrder, respondToExtension, requestCancellation, respondToCancellation, withdrawCancellation, requestRevision, respondToDispute, requestArbitration, cancelDispute, addAdditionalInfo, refreshOrders } = useOrders();
  const { startConversation } = useMessenger();
  const { userInfo } = useAccount();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [orderDetailTab, setOrderDetailTab] = useState("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [rating, setRating] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [review, setReview] = useState("");
  // Detailed rating categories
  const [communicationRating, setCommunicationRating] = useState(5);
  const [serviceAsDescribedRating, setServiceAsDescribedRating] = useState(5);
  const [buyAgainRating, setBuyAgainRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [showDisputeSection, setShowDisputeSection] = useState(false);
  const [isCancellationRequestDialogOpen, setIsCancellationRequestDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isRevisionRequestDialogOpen, setIsRevisionRequestDialogOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [revisionFiles, setRevisionFiles] = useState<File[]>([]);
  const [isDisputeResponseDialogOpen, setIsDisputeResponseDialogOpen] = useState(false);
  const [disputeResponseMessage, setDisputeResponseMessage] = useState("");
  const [isAddInfoDialogOpen, setIsAddInfoDialogOpen] = useState(false);
  const [addInfoMessage, setAddInfoMessage] = useState("");
  const [addInfoFiles, setAddInfoFiles] = useState<File[]>([]);
  const [isSubmittingAddInfo, setIsSubmittingAddInfo] = useState(false);

  // Check for orderId in URL params and auto-select that order
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    if (orderId && orders.find(o => o.id === orderId)) {
      setSelectedOrder(orderId);
      // Clear the orderId from URL after opening
      const newUrl = window.location.pathname + "?tab=orders";
      window.history.replaceState({}, "", newUrl);
    }
  }, [location.search, orders]);

  // Filter orders for client view (orders where professional is NOT "Current User")
  const clientOrders = orders.filter(
    (order) => order.professional !== "Current User"
  );

  // Get orders by order status (not deliveryStatus)
  const getOrdersByStatus = (status: string) => {
    if (status === "all") return clientOrders;
    return clientOrders.filter(
      (order) => order.status === status
    );
  };

  // Filter and sort orders by order status
  const getFilteredOrdersByStatus = (status: string) => {
    let filtered = getOrdersByStatus(status);

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.professional?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort
    if (sortBy === "date") {
      filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } else if (sortBy === "amount") {
      filtered.sort((a, b) => b.amountValue - a.amountValue);
    }

    return filtered;
  };
  
  // Get filtered orders by status
  const allOrders = getFilteredOrdersByStatus("all");
  const inProgressOrders = getFilteredOrdersByStatus("In Progress");
  const completedOrders = getFilteredOrdersByStatus("Completed");
  const cancelledOrders = getFilteredOrdersByStatus("Cancelled");
  const disputedOrders = getFilteredOrdersByStatus("disputed");

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "delivered":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "completed":
      case "Completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "disputed":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "dispute":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "active":
        return <Package className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle2 className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "dispute":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (value?: number | string, fallback = "0.00") => {
    const num = typeof value === "string" ? Number(value) : value;
    if (num === undefined || num === null || Number.isNaN(num)) {
      return fallback;
    }
    return Number(num).toFixed(2);
  };

  const resolveFileUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return resolveApiUrl(url);
  };

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

    if (order.deliveryStatus === "active") {
      push(
        {
          at: order.expectedDelivery || order.scheduledDate,
          title: "Service In Progress",
          description:
            "The professional is currently working on your service.",
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

  const handleViewOrder = (orderId: string) => {
    setSelectedOrder(orderId);
    setOrderDetailTab("timeline");
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    if (selectedOrder) {
      const order = orders.find(o => o.id === selectedOrder);
      // If order is "In Progress", use cancellation request (requires professional approval)
      if (order && order.status === "In Progress") {
        try {
          await requestCancellation(selectedOrder, cancelReason);
          toast.success("Cancellation request submitted. Waiting for professional approval.");
          setIsCancelDialogOpen(false);
          setCancelReason("");
        } catch (error: any) {
          toast.error(error.message || "Failed to request cancellation");
        }
      } else {
        // For other statuses, cancel immediately
        cancelOrder(selectedOrder);
        toast.success("Order has been cancelled");
        setIsCancelDialogOpen(false);
        setCancelReason("");
        setSelectedOrder(null);
      }
    }
  };

  const handleRequestCancellation = async () => {
    if (!selectedOrder) return;
    try {
      await requestCancellation(selectedOrder, cancellationReason);
      toast.success("Cancellation request submitted. Waiting for response.");
      setIsCancellationRequestDialogOpen(false);
      setCancellationReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to request cancellation");
    }
  };

  const handleRespondToCancellation = async (action: 'approve' | 'reject') => {
    if (!selectedOrder) return;
    try {
      await respondToCancellation(selectedOrder, action);
      toast.success(`Cancellation request ${action}d successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} cancellation request`);
    }
  };

  const handleWithdrawCancellation = async () => {
    if (!selectedOrder) return;
    try {
      await withdrawCancellation(selectedOrder);
      toast.success("Cancellation request withdrawn. Order status restored.");
    } catch (error: any) {
      toast.error(error.message || "Failed to withdraw cancellation request");
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedOrder || !revisionReason.trim()) {
      toast.error("Please provide a reason for the revision request");
      return;
    }
    try {
      await requestRevision(
        selectedOrder,
        revisionReason,
        revisionMessage.trim() ? revisionMessage : undefined,
        revisionFiles.length > 0 ? revisionFiles : undefined
      );
      toast.success("Revision request submitted. The professional will review your request.");
      setIsRevisionRequestDialogOpen(false);
      setSelectedOrder(null);
      setRevisionReason("");
      setRevisionMessage("");
      setRevisionFiles([]);
      // Refresh orders to update timeline
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
    if (!selectedOrder) return;
    try {
      await respondToDispute(selectedOrder, disputeResponseMessage || undefined);
      toast.success("Dispute response submitted successfully. Negotiation period has started.");
      setIsDisputeResponseDialogOpen(false);
      setDisputeResponseMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to respond to dispute");
    }
  };

  const handleRequestArbitration = async () => {
    if (!selectedOrder) return;
    try {
      await requestArbitration(selectedOrder);
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
    if (!selectedOrder) return;
    try {
      await cancelDispute(selectedOrder);
      toast.success("Dispute cancelled successfully. Order restored to delivered status.");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel dispute");
    }
  };

  const handleAcceptDelivery = async (orderId: string) => {
    try {
      await acceptDelivery(orderId);
      toast.success("Order completed! Funds have been released to the professional. You can now rate the service.");
      setSelectedOrder(orderId);
      setIsRatingDialogOpen(true);
      // Refresh orders to update status
      await refreshOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete order");
    }
  };

  // Additional Info File Handlers
  const handleAddInfoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        const type = file.type;
        return type.startsWith('image/') || 
               type.startsWith('video/') || 
               type === 'application/pdf' ||
               type === 'application/msword' ||
               type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               type === 'text/plain';
      });

      if (validFiles.length !== newFiles.length) {
        toast.error("Some files were not added. Only images, videos, and documents are allowed.");
      }

      setAddInfoFiles(prev => [...prev, ...validFiles].slice(0, 10));
    }
  };

  const handleRemoveAddInfoFile = (index: number) => {
    setAddInfoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAdditionalInfo = async () => {
    if (!addInfoMessage.trim() && addInfoFiles.length === 0) {
      toast.error("Please add a message or upload files");
      return;
    }

    if (!selectedOrder) return;

    setIsSubmittingAddInfo(true);
    try {
      await addAdditionalInfo(selectedOrder, addInfoMessage, addInfoFiles.length > 0 ? addInfoFiles : undefined);
      toast.success("Additional information submitted successfully!");
      setIsAddInfoDialogOpen(false);
      setAddInfoMessage("");
      setAddInfoFiles([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit additional information");
    } finally {
      setIsSubmittingAddInfo(false);
    }
  };

  const getAddInfoFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const handleCreateDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }
    if (selectedOrder) {
      const order = orders.find(o => o.id === selectedOrder);
      // Check if order is delivered
      if (order?.deliveryStatus !== 'delivered' && order?.status !== 'In Progress') {
        toast.error("Disputes can only be opened for delivered orders");
        return;
      }
      try {
        const disputeId = await createOrderDispute(selectedOrder, disputeReason, disputeEvidence);
        toast.success("Dispute has been created");
        setIsDisputeDialogOpen(false);
        setDisputeReason("");
        setDisputeEvidence("");
        // Navigate to dispute discussion page
        navigate(`/dispute/${disputeId}`);
      } catch (error: any) {
        toast.error(error.message || "Failed to create dispute");
      }
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
      if (selectedOrder) {
        await rateOrder(selectedOrder, averageRating, review);
      }
      toast.success("Thank you for your feedback! Your review has been submitted.");
      setIsRatingDialogOpen(false);
      setRating(0);
      setReview("");
      setCommunicationRating(5);
      setServiceAsDescribedRating(5);
      setBuyAgainRating(5);
      // Refresh orders to update review status
      await refreshOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleStartConversation = (professionalName: string, professionalAvatar?: string) => {
    if (professionalName && selectedOrder) {
      const order = orders.find(o => o.id === selectedOrder);
      const participantId = order?.professionalId || `prof-${selectedOrder}`;
      startConversation({
        id: participantId,
        name: professionalName,
        avatar: professionalAvatar || "",
        online: true,
        jobId: order?.id,
        jobTitle: order?.service
      });
    }
  };

  const renderOrderCard = (order: any) => (
    <div
      key={order.id}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
              {order.service}
            </h3>
            <Badge
              className={`${getStatusBadge(
                order.status
              )} font-['Poppins',sans-serif] text-[11px]`}
            >
              <span className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                {order.status?.toUpperCase()}
              </span>
            </Badge>
          </div>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
            Order ID: {order.id}
          </p>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Placed: {formatDate(order.date)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-['Poppins',sans-serif] text-[20px] text-[#FE8A0F] mb-1">
            {order.amount}
          </p>
          {order.rating && (
            <div className="flex items-center gap-1 justify-end">
              <Star className="w-4 h-4 fill-[#FE8A0F] text-[#FE8A0F]" />
              <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                {order.rating}
              </span>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Professional Info */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={order.professionalAvatar} />
          <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[14px]">
            {order.professional
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase() || "P"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            {order.professional}
          </p>
          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
            Professional
          </p>
        </div>
      </div>

      {/* Appointment Date and Time */}
      {(order.booking?.date || order.scheduledDate) && (
        <div className="flex items-center gap-2 mb-3 text-[#6b6b6b]">
          <Calendar className="w-4 h-4" />
          <span className="font-['Poppins',sans-serif] text-[13px]">
            Appointment: {formatDate(order.booking?.date || order.scheduledDate)}
            {(order.booking?.time || order.booking?.timeSlot) && ` - ${order.booking.time || order.booking.timeSlot}${order.booking?.timeSlot && order.booking?.time ? ` (${order.booking.timeSlot})` : ''}`}
          </span>
        </div>
      )}

      {/* Description */}
      {order.description && (
        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4 line-clamp-2">
          {order.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleViewOrder(order.id)}
          variant="outline"
          className="flex-1 font-['Poppins',sans-serif] text-[13px]"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
        <Button
          onClick={() => {
            if (order.professional) {
              startConversation({
                id: order.professionalId || `prof-${order.id}`,
                name: order.professional,
                avatar: order.professionalAvatar,
                online: true,
                jobId: order.id,
                jobTitle: order.service
              });
            }
          }}
          variant="outline"
          className="font-['Poppins',sans-serif] text-[13px]"
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Get current order details
  const currentOrder = selectedOrder
    ? orders.find((o) => o.id === selectedOrder)
    : null;

  const primaryItem = currentOrder?.items?.[0];

  const timelineEvents = useMemo(
    () => (currentOrder ? buildClientTimeline(currentOrder) : []),
    [currentOrder]
  );

  // Calculate appointment deadline for countdown
  const appointmentDeadline = useMemo(() => {
    if (!currentOrder) return null;
    
    // Use booking date/time or scheduled date + time
    const bookingDate = currentOrder.booking?.date;
    const bookingTime = currentOrder.booking?.time || currentOrder.booking?.timeSlot || "09:00";
    
    if (bookingDate) {
      // Combine date and time
      const [hours, minutes] = bookingTime.split(':').map(Number);
      const deadline = new Date(bookingDate);
      if (!isNaN(hours)) deadline.setHours(hours);
      if (!isNaN(minutes)) deadline.setMinutes(minutes);
      return deadline;
    }
    
    // Fallback to scheduled date
    if (currentOrder.scheduledDate) {
      return new Date(currentOrder.scheduledDate);
    }
    
    // Fallback to expected delivery
    if (currentOrder.expectedDelivery) {
      return new Date(currentOrder.expectedDelivery);
    }
    
    return null;
  }, [currentOrder]);

  // Use countdown hook for appointment time
  const appointmentCountdown = useCountdown(appointmentDeadline);

  // Elapsed time since booking time arrives (work in progress timer)
  const workStartTime = useMemo(() => {
    if (!currentOrder) return null;
    // Stop timer for completed or cancelled orders
    if (currentOrder.status === "Completed" || currentOrder.status === "Cancelled") return null;
    if (currentOrder.deliveryStatus === "delivered" || currentOrder.deliveryStatus === "completed" || currentOrder.deliveryStatus === "cancelled") {
      return null;
    }

    // Auto-start work timer when scheduled booking time arrives
    const bookingDate = currentOrder.booking?.date;
    const bookingTime = currentOrder.booking?.time || currentOrder.booking?.timeSlot || "09:00";
    if (bookingDate) {
      const [hours, minutes] = bookingTime.split(":").map(Number);
      const start = new Date(bookingDate);
      if (!isNaN(hours)) start.setHours(hours);
      if (!isNaN(minutes)) start.setMinutes(minutes);
      if (Date.now() >= start.getTime()) return start;
    }

    if (currentOrder.scheduledDate) {
      const start = new Date(currentOrder.scheduledDate);
      if (Date.now() >= start.getTime()) return start;
    }

    return null;
  }, [currentOrder]);

  const workElapsedTime = useElapsedTime(workStartTime);

  // Poll for latest order updates while viewing details
  useEffect(() => {
    if (!selectedOrder) return;
    const interval = setInterval(() => {
      refreshOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedOrder, refreshOrders]);

  // If an order is selected, show the detail view
  if (selectedOrder && currentOrder) {
    const timelineTimer = (
      <>
        {/* Countdown Timer - Until booked time */}
        {!workElapsedTime.started &&
         appointmentDeadline &&
         !appointmentCountdown.expired &&
         currentOrder.status !== "Completed" &&
         currentOrder.status !== "Cancelled" &&
         currentOrder.deliveryStatus !== "delivered" && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FE8A0F]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#FE8A0F]" />
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] uppercase tracking-wider">
                  Expected Delivery Time
                </p>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                  {currentOrder.booking?.date
                    ? `${formatDate(currentOrder.booking.date)} ${currentOrder.booking?.time || currentOrder.booking?.timeSlot || ''}`
                    : currentOrder.scheduledDate
                      ? formatDate(currentOrder.scheduledDate)
                      : "TBD"}
                </p>
              </div>
            </div>

            {/* Countdown Display */}
            <div className="grid grid-cols-4 gap-3">
              {/* Days */}
              <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                  {String(appointmentCountdown.days).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                  {String(appointmentCountdown.hours).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                  {String(appointmentCountdown.minutes).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                  Minutes
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                  {String(appointmentCountdown.seconds).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                  Seconds
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
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

        {/* Work In Progress Timer - Auto starts at booking time */}
        {workElapsedTime.started &&
         currentOrder.status !== "Completed" &&
         currentOrder.status !== "Cancelled" &&
         currentOrder.deliveryStatus !== "delivered" && (
          <div className="bg-[#EAF2FF] rounded-2xl p-6 shadow-lg border border-blue-200">
            {/* Header */}
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

            {/* Elapsed Time Display */}
            <div className="grid grid-cols-4 gap-3">
              {/* Days */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.days).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-blue-600 uppercase tracking-wider mt-1">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.hours).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-blue-600 uppercase tracking-wider mt-1">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.minutes).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-blue-600 uppercase tracking-wider mt-1">
                  Minutes
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.seconds).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-blue-600 uppercase tracking-wider mt-1">
                  Seconds
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="font-['Poppins',sans-serif] text-[12px] text-blue-600">
                Professional is working on your order
              </span>
            </div>
          </div>
        )}
      </>
    );
    return (
      <div>
          {!showDisputeSection && (
            <>
          <Button
            onClick={handleBackToList}
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
                {currentOrder.service}
              </h2>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Order ID: {currentOrder.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={`${getStatusBadge(
                  currentOrder.status
                )} font-['Poppins',sans-serif] text-[11px]`}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(currentOrder.status)}
                  {currentOrder.status?.toUpperCase()}
                </span>
              </Badge>
              
              {/* Three Dots Menu - Show on all screens */}
              {(currentOrder.deliveryStatus === "pending" || currentOrder.deliveryStatus === "active") && (
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
                    <DropdownMenuItem
                      onClick={() => setIsCancelDialogOpen(true)}
                      className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Order
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Main Layout - Left Content + Right Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Main Content (Tabs) */}
            <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex-1">
            <Tabs value={orderDetailTab} onValueChange={setOrderDetailTab}>
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide border-b border-gray-200">
                <TabsList className="bg-transparent p-0 h-auto w-full md:w-auto inline-flex min-w-full md:min-w-0 justify-start">
                  <TabsTrigger
                    value="timeline"
                    className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="additional-info"
                    className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0"
                  >
                    Additional Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="delivery"
                    className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0"
                  >
                    Delivery
                  </TabsTrigger>
                </TabsList>
              </div>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-6 space-y-6">
            {/* Cancellation Request - Pending (Client can respond) */}
            {currentOrder.cancellationRequest && 
             currentOrder.cancellationRequest.status === 'pending' && 
             currentOrder.cancellationRequest.requestedBy !== userInfo?.id && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                      Cancellation Request Received
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                      {currentOrder.professional || "The professional"} has requested to cancel this order.
                    </p>
                    {currentOrder.cancellationRequest.reason && (
                      <div className="mb-3 p-3 bg-white border border-gray-200 rounded">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                          Reason:
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {currentOrder.cancellationRequest.reason}
                        </p>
                      </div>
                    )}
                    {currentOrder.cancellationRequest.responseDeadline && (
                      <p className="font-['Poppins',sans-serif] text-[12px] text-orange-700 mb-4">
                        ⚠️ Response deadline: {new Date(currentOrder.cancellationRequest.responseDeadline).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        onClick={async () => {
                          try {
                            if (selectedOrder) {
                              await respondToCancellation(selectedOrder, 'approve');
                              toast.success("Cancellation approved. Order has been cancelled.");
                            }
                          } catch (error: any) {
                            toast.error(error.message || "Failed to approve cancellation");
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif]"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve Cancellation
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            if (selectedOrder) {
                              await respondToCancellation(selectedOrder, 'reject');
                              toast.success("Cancellation rejected. Order will continue.");
                            }
                          } catch (error: any) {
                            toast.error(error.message || "Failed to reject cancellation");
                          }
                        }}
                        variant="outline"
                        className="font-['Poppins',sans-serif] border-red-500 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Cancellation
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Alert Box */}
            {currentOrder.deliveryStatus === "pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  Waiting for Professional to Start
                </h4>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                  Your payment has been processed successfully. The professional will start working on your service soon. {(currentOrder.booking?.date || currentOrder.scheduledDate) && (
                    <span className="text-[#2c353f]">Appointment: {formatDate(currentOrder.booking?.date || currentOrder.scheduledDate)}{(currentOrder.booking?.time || currentOrder.booking?.timeSlot) && ` at ${currentOrder.booking.time || currentOrder.booking.timeSlot}${currentOrder.booking?.timeSlot && currentOrder.booking?.time ? ` (${currentOrder.booking.timeSlot})` : ''}`}</span>
                  )}
                </p>
              </div>
            )}

            {currentOrder.deliveryStatus === "active" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  Service In Progress
                </h4>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                  {currentOrder.professional} is currently working on your service. {(currentOrder.booking?.date || currentOrder.scheduledDate) && (
                    <span className="text-[#2c353f]">Appointment: {formatDate(currentOrder.booking?.date || currentOrder.scheduledDate)}{(currentOrder.booking?.time || currentOrder.booking?.timeSlot) && ` at ${currentOrder.booking.time || currentOrder.booking.timeSlot}${currentOrder.booking?.timeSlot && currentOrder.booking?.time ? ` (${currentOrder.booking.timeSlot})` : ''}`}</span>
                  )}. Feel free to reach out if you have any questions.
                </p>

                {/* Extension Request Alert */}
                {currentOrder.extensionRequest && currentOrder.extensionRequest.status === 'pending' && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-yellow-700 mb-1">
                          Extension Request Pending
                        </h5>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                          {currentOrder.professional} has requested an extension for the delivery deadline.
                        </p>
                        <div className="space-y-1 mb-3">
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                            <span className="font-medium">Current delivery date:</span> {currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : 'N/A'}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                            <span className="font-medium">Requested new date & time:</span>{" "}
                            {currentOrder.extensionRequest.newDeliveryDate 
                              ? (() => {
                                  const d = new Date(currentOrder.extensionRequest.newDeliveryDate);
                                  const dateStr = d.toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  });
                                  const timeStr = d.toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  });
                                  return `${dateStr} at ${timeStr}`;
                                })()
                              : 'N/A'}
                          </p>
                          {currentOrder.extensionRequest.reason && (
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-2">
                              <span className="font-medium">Reason:</span> {currentOrder.extensionRequest.reason}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3 mt-3">
                          <Button
                            onClick={async () => {
                              try {
                                if (selectedOrder) {
                                  await respondToExtension(selectedOrder, 'approve');
                                  toast.success("Extension request approved");
                                }
                              } catch (error: any) {
                                toast.error(error.message || "Failed to approve extension");
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif] text-[13px]"
                          >
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={async () => {
                              try {
                                if (selectedOrder) {
                                  await respondToExtension(selectedOrder, 'reject');
                                  toast.success("Extension request rejected");
                                }
                              } catch (error: any) {
                                toast.error(error.message || "Failed to reject extension");
                              }
                            }}
                            variant="outline"
                            className="border-red-500 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif] text-[13px]"
                          >
                            <ThumbsDown className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extension Request Status (approved/rejected) - Only show if order is in progress */}
                {currentOrder.extensionRequest && 
                 currentOrder.extensionRequest.status !== 'pending' && 
                 currentOrder.status === 'In Progress' && 
                 (currentOrder.extensionRequest.status === 'approved' || currentOrder.extensionRequest.status === 'rejected') && (
                  <div className={`mb-4 p-4 rounded-lg border ${
                    currentOrder.extensionRequest.status === 'approved' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {currentOrder.extensionRequest.status === 'approved' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {currentOrder.extensionRequest.status === 'rejected' && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <h5 className={`font-['Poppins',sans-serif] text-[14px] font-medium ${
                        currentOrder.extensionRequest.status === 'approved' 
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        Extension Request {currentOrder.extensionRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                      </h5>
                    </div>
                    {currentOrder.extensionRequest.status === 'approved' && currentOrder.extensionRequest.newDeliveryDate && (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                        New delivery date & time:{" "}
                        {(() => {
                          const d = new Date(currentOrder.extensionRequest.newDeliveryDate);
                          const dateStr = d.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });
                          const timeStr = d.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          return `${dateStr} at ${timeStr}`;
                        })()}
                      </p>
                    )}
                  </div>
                )}

                {/* Professional Completion Request - Show in "In Progress" status */}
                {currentOrder.metadata?.professionalCompleteRequest && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-blue-700 mb-2">
                          Completion Request Submitted
                        </h5>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                          The professional has submitted a completion request with verification data. Please review and complete the order to release funds to their wallet.
                        </p>
                        {currentOrder.metadata.professionalCompleteRequest.completionMessage && (
                          <div className="mb-3 p-3 bg-white border border-gray-200 rounded">
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Professional's message:
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                              {currentOrder.metadata.professionalCompleteRequest.completionMessage}
                            </p>
                          </div>
                        )}
                        {currentOrder.metadata.professionalCompleteRequest.completionFiles && currentOrder.metadata.professionalCompleteRequest.completionFiles.length > 0 && (
                          <div className="mb-3">
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                              Verification Files:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {currentOrder.metadata.professionalCompleteRequest.completionFiles.map((file: any, index: number) => (
                                <div key={index} className="border border-gray-200 rounded p-2">
                                  {file.fileType === 'image' ? (
                                    <img src={resolveFileUrl(file.url)} alt={file.fileName} className="w-full h-24 object-cover rounded" />
                                  ) : (
                                    <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                                      <PlayCircle className="w-8 h-8 text-gray-600" />
                                    </div>
                                  )}
                                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-1 truncate">
                                    {file.fileName}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-4">
                          <Button
                            onClick={async () => {
                              try {
                                await handleAcceptDelivery(currentOrder.id);
                              } catch (error: any) {
                                toast.error(error.message || "Failed to complete order");
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif]"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Complete Order & Release Funds
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Countdown - Show for active and pending orders */}
            {(currentOrder.deliveryStatus === "active" || currentOrder.deliveryStatus === "pending") && currentOrder.expectedDelivery && (
              <DeliveryCountdown expectedDelivery={currentOrder.expectedDelivery} />
            )}

            {currentOrder.deliveryStatus === "delivered" && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  Service Delivered - Review Required
                </h4>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                  Your work has been delivered on <span className="text-[#2c353f]">{currentOrder.deliveredDate ? formatDate(currentOrder.deliveredDate) : "today"}</span>. {currentOrder.metadata?.professionalCompleteRequest ? "The professional has submitted a completion request with verification data. Please review and complete the order to release funds." : "Kindly approve the delivery or request any modifications. If no response is received, the order will be automatically completed and funds released to the seller."}
                </p>

                {/* Professional Completion Request */}
                {currentOrder.metadata?.professionalCompleteRequest && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-blue-700 mb-2">
                          Completion Request Submitted
                        </h5>
                        {currentOrder.metadata.professionalCompleteRequest.completionMessage && (
                          <div className="mb-3 p-3 bg-white border border-gray-200 rounded">
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Professional's message:
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                              {currentOrder.metadata.professionalCompleteRequest.completionMessage}
                            </p>
                          </div>
                        )}
                        {currentOrder.metadata.professionalCompleteRequest.completionFiles && currentOrder.metadata.professionalCompleteRequest.completionFiles.length > 0 && (
                          <div className="mb-3">
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                              Verification Files:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {currentOrder.metadata.professionalCompleteRequest.completionFiles.map((file: any, index: number) => {
                                return (
                                  <div key={index} className="border border-gray-200 rounded p-2">
                                    {file.fileType === 'image' ? (
                                      <img src={resolveFileUrl(file.url)} alt={file.fileName} className="w-full h-24 object-cover rounded" />
                                    ) : (
                                      <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                                        <PlayCircle className="w-8 h-8 text-gray-600" />
                                      </div>
                                    )}
                                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-1 truncate">
                                      {file.fileName}
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
                )}
                
                {/* Delivery Message */}
                {currentOrder.deliveryMessage && (
                  <div className="bg-white border border-purple-200 rounded-lg p-4 mb-4">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                      Remarks:
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      {currentOrder.deliveryMessage}
                    </p>
                  </div>
                )}

                {/* Delivery Files */}
                {currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0 && (
                  <div className="mb-4">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                      Attachments ({currentOrder.deliveryFiles.length}):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {currentOrder.deliveryFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          {file.fileType === 'image' ? (
                            <img
                              src={resolveFileUrl(file.url)}
                              alt={file.fileName}
                              className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                            />
                          ) : (
                            <div
                              className="w-full h-32 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                              onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                            >
                              <PlayCircle className="w-12 h-12 text-gray-600" />
                              <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded truncate">
                                {file.fileName}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show buttons only if order is not completed and no active revision request */}
                {currentOrder.status !== "Completed" && 
                 currentOrder.deliveryStatus !== "completed" &&
                 (!currentOrder.revisionRequest || 
                  (currentOrder.revisionRequest.status !== 'pending' && 
                   currentOrder.revisionRequest.status !== 'in_progress')) && (
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      onClick={() => handleAcceptDelivery(currentOrder.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif]"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Completed
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedOrder(currentOrder.id);
                        setIsRevisionRequestDialogOpen(true);
                        setRevisionReason("");
                      }}
                      variant="outline"
                      className="font-['Poppins',sans-serif] border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Request Revision
                    </Button>
                  </div>
                )}
                  
                  {/* Show revision request status if pending or in progress */}
                  {currentOrder.revisionRequest && (currentOrder.revisionRequest.status === 'pending' || currentOrder.revisionRequest.status === 'in_progress') && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-orange-700 mb-1">
                            Revision Request {currentOrder.revisionRequest.status === 'pending' ? 'Pending' : 'In Progress'}
                          </h5>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            {currentOrder.revisionRequest.status === 'pending' 
                              ? 'Your revision request has been submitted. The professional will review it shortly.'
                              : 'The professional is working on your revision request.'}
                          </p>
                          {currentOrder.revisionRequest.reason && (
                            <div className="mt-2 p-2 bg-white border border-orange-200 rounded">
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                Your request:
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                {currentOrder.revisionRequest.reason}
                              </p>
                            </div>
                          )}
                          {currentOrder.revisionRequest.status === 'in_progress' && currentOrder.revisionRequest.additionalNotes && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                Professional's notes:
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                {currentOrder.revisionRequest.additionalNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show completed revision status */}
                  {currentOrder.revisionRequest && currentOrder.revisionRequest.status === 'completed' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-green-700">
                          Revision Completed
                        </h5>
                      </div>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                        The professional has completed your revision request. Please review the updated work above.
                      </p>
                    </div>
                  )}

                  {/* Show Open Dispute button only for delivered orders and if no dispute exists */}
                  {!currentOrder.disputeInfo && (
                    <Button
                      onClick={() => {
                        setIsDisputeDialogOpen(true);
                        setDisputeReason("");
                        setDisputeEvidence("");
                      }}
                      variant="outline"
                      className="font-['Poppins',sans-serif] border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Open Dispute
                    </Button>
                  )}

                  {/* Show dispute status if dispute exists */}
                  {currentOrder.disputeInfo && (
                    <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-red-700 mb-1">
                            Dispute {currentOrder.disputeInfo.status === 'open' ? 'Open' : currentOrder.disputeInfo.status === 'responded' ? 'Responded' : 'Closed'}
                          </h5>
                          {currentOrder.disputeInfo.status === 'open' && currentOrder.disputeInfo.responseDeadline && (
                            <div className="mb-2">
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                Response deadline: {new Date(currentOrder.disputeInfo.responseDeadline).toLocaleString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {currentOrder.disputeInfo.respondentId && userInfo?.id === currentOrder.disputeInfo.respondentId && (
                                <div className="mt-3">
                                  <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 mb-2">
                                    ⚠️ You need to respond by the deadline, or the dispute will automatically close in favor of the other party.
                                  </p>
                                  <div className="flex gap-2 flex-wrap">
                                    <Button
                                      onClick={() => {
                                        setIsDisputeResponseDialogOpen(true);
                                        setDisputeResponseMessage("");
                                      }}
                                      className="bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif]"
                                    >
                                      Respond to Dispute
                                    </Button>
                                    <Button
                                      onClick={handleCancelDispute}
                                      variant="outline"
                                      className="font-['Poppins',sans-serif] border-gray-500 text-gray-600 hover:bg-gray-50"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Cancel Dispute
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {(!currentOrder.disputeInfo.respondentId || userInfo?.id !== currentOrder.disputeInfo.respondentId) && (
                                <div className="mt-2">
                                  <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 mb-2">
                                    ⚠️ The other party needs to respond by the deadline, or the dispute will automatically close in your favor.
                                  </p>
                                  <Button
                                    onClick={handleCancelDispute}
                                    variant="outline"
                                    className="font-['Poppins',sans-serif] border-gray-500 text-gray-600 hover:bg-gray-50"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Dispute
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                          {currentOrder.disputeInfo.status === 'negotiation' && currentOrder.disputeInfo.negotiationDeadline && (
                            <div className="mb-2">
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                Negotiation deadline: {new Date(currentOrder.disputeInfo.negotiationDeadline).toLocaleString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <div className="mt-2 space-y-2">
                                {!currentOrder.disputeInfo.arbitrationRequested && (
                                  <div>
                                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                      If you can't reach an agreement, you can request admin arbitration by paying an administration fee of £{currentOrder.disputeInfo.arbitrationFeeAmount || 50}. The loser will lose both the arbitration fee and the order amount.
                                    </p>
                                    <Button
                                      onClick={handleRequestArbitration}
                                      className="bg-orange-600 hover:bg-orange-700 text-white font-['Poppins',sans-serif] mr-2"
                                    >
                                      <AlertTriangle className="w-4 h-4 mr-2" />
                                      Request Admin Arbitration
                                    </Button>
                                  </div>
                                )}
                                <Button
                                  onClick={handleCancelDispute}
                                  variant="outline"
                                  className="font-['Poppins',sans-serif] border-gray-500 text-gray-600 hover:bg-gray-50"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel Dispute
                                </Button>
                              </div>
                            </div>
                          )}
                          {currentOrder.disputeInfo.status === 'admin_arbitration' && (
                            <div className="mb-2">
                              <p className="font-['Poppins',sans-serif] text-[12px] text-blue-600 mb-2">
                                ⚖️ Admin is reviewing this dispute. A decision will be made soon.
                              </p>
                              {currentOrder.disputeInfo.arbitrationRequestedBy && (
                                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mb-2">
                                  Arbitration requested by: {currentOrder.disputeInfo.arbitrationRequestedBy === currentOrder.disputeInfo.claimantId ? 'Claimant' : 'Respondent'}
                                </p>
                              )}
                              <Button
                                onClick={handleCancelDispute}
                                variant="outline"
                                className="font-['Poppins',sans-serif] border-gray-500 text-gray-600 hover:bg-gray-50"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Dispute
                              </Button>
                            </div>
                          )}
                          {currentOrder.disputeInfo.status === 'closed' && currentOrder.disputeInfo.autoClosed && (
                            <p className="font-['Poppins',sans-serif] text-[12px] text-green-600 mb-2">
                              Dispute automatically closed in your favor (no response received)
                            </p>
                          )}
                          {currentOrder.disputeInfo.reason && (
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mt-2">
                              <span className="font-medium">Reason:</span> {currentOrder.disputeInfo.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleStartConversation(currentOrder.professional, currentOrder.professionalAvatar)}
                    variant="outline"
                    className="font-['Poppins',sans-serif]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
            )}

            {timelineTimer}

            {currentOrder.deliveryStatus === "completed" && !currentOrder.rating && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  ✅ Service Completed
                </h4>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                  This service has been completed on <span className="text-[#2c353f]">{currentOrder.completedDate ? formatDate(currentOrder.completedDate) : "today"}</span>. Please take a moment to rate your experience with {currentOrder.professional}.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => setIsRatingDialogOpen(true)}
                    className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Rate & Review
                  </Button>
                </div>
              </div>
            )}

            {currentOrder.deliveryStatus === "completed" && currentOrder.rating && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  ✅ Service Completed
                </h4>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                  Thank you for your review! You rated this service {currentOrder.rating}/5 stars.
                </p>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= (currentOrder.rating || 0) ? "fill-[#FE8A0F] text-[#FE8A0F]" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                {currentOrder.review && (
                  <div className="bg-white border border-green-200 rounded-lg p-4 mt-3">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] italic">
                      "{currentOrder.review}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentOrder.deliveryStatus === "dispute" && (
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <h4 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-3">
                  Your order is being disputed!
                </h4>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                  {currentOrder.professional} is disputing the work you have delivered. They are currently waiting for your response. Please respond before the deadline. Click "View Dispute" to reply, add additional information, make, reject, or accept an offer.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDisputeSection(!showDisputeSection)}
                    className="bg-white hover:bg-gray-50 text-[#2c353f] border-2 border-[#FE8A0F] font-['Poppins',sans-serif]"
                  >
                    {showDisputeSection ? "Hide Dispute" : "View Dispute"}
                  </Button>
                </div>
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
                    <div key={`${event.id}-${event.at || "na"}-${index}`} className="flex gap-4 mb-6">
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-10 h-10 rounded-lg ${event.colorClass} flex items-center justify-center flex-shrink-0`}>
                          {event.icon}
                        </div>
                        <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                          {deliveryNumber ? `#${deliveryNumber} ${event.title}` : event.title}
                        </p>
                    {event.at && (
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                        {formatDateTime(event.at)}
                      </p>
                    )}
                    {event.description && (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                        {event.description}
                      </p>
                    )}
                    {event.message && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {event.message}
                        </p>
                      </div>
                    )}
                    {event.files && event.files.length > 0 && (
                      <div className="mt-3">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                          📎 Attachments ({event.files.length})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {event.files.map((file: any, index: number) => {
                            const fileUrl = file.url || "";
                            const fileName = file.fileName || "attachment";
                            const isImage =
                              file.fileType === "image" ||
                              /\.(png|jpe?g|gif|webp)$/i.test(fileUrl) ||
                              /\.(png|jpe?g|gif|webp)$/i.test(fileName);
                            const resolvedUrl = resolveFileUrl(fileUrl);
                            return (
                            <div key={index} className="relative group">
                              {isImage ? (
                                <img
                                  src={resolvedUrl}
                                  alt={fileName}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(resolvedUrl, "_blank")}
                                />
                              ) : (
                                <div
                                  className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                                  onClick={() => window.open(resolvedUrl, "_blank")}
                                >
                                  <PlayCircle className="w-8 h-8 text-gray-600" />
                                  <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded truncate">
                                    {fileName}
                                  </div>
                                </div>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {event.id === "delivered" && 
                     currentOrder.status !== "Completed" && 
                     currentOrder.deliveryStatus !== "completed" &&
                     (!currentOrder.revisionRequest || 
                      (currentOrder.revisionRequest.status !== 'pending' && 
                       currentOrder.revisionRequest.status !== 'in_progress')) && (
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mt-4">
                        <div className="flex gap-2 mb-4">
                          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="font-['Poppins',sans-serif] text-[14px] text-blue-900">
                            Your work has been delivered. Please approve the delivery or request a revision. {currentOrder.deliveredDate && (() => {
                              const deliveryDate = new Date(currentOrder.deliveredDate);
                              const deadlineDate = new Date(deliveryDate);
                              deadlineDate.setDate(deadlineDate.getDate() + 1);
                              return `You have until ${formatDate(deadlineDate.toISOString())} to respond.`;
                            })()} If no action is taken by then, the order will be automatically completed.
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={() => handleAcceptDelivery(currentOrder.id)}
                            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[14px] px-6"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedOrder(currentOrder.id);
                              setIsRevisionRequestDialogOpen(true);
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
                  );
                });
              })()}
            </div>
            <div className="hidden">
              {/* Additional Information Submitted Timeline */}
              {currentOrder.additionalInformation?.submittedAt && (
                <div className="flex gap-4 mb-6">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                      Additional Information Submitted
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                      You submitted additional information on{" "}
                      <span className="text-[#2c353f]">
                        {formatDateTime(currentOrder.additionalInformation.submittedAt)}
                      </span>
                    </p>
                    {currentOrder.additionalInformation.message && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {currentOrder.additionalInformation.message}
                        </p>
                      </div>
                    )}
                    {currentOrder.additionalInformation.files && currentOrder.additionalInformation.files.length > 0 && (
                      <p className="font-['Poppins',sans-serif] text-[12px] text-blue-600 mt-2">
                        📎 {currentOrder.additionalInformation.files.length} file(s) attached
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation Timeline */}
              {currentOrder.cancellationRequest && currentOrder.cancellationRequest.status === 'approved' && currentOrder.status === 'Cancelled' && (
                <div className="flex gap-4 mb-6">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                      Order Cancelled
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                      {currentOrder.cancellationRequest.respondedAt 
                        ? `Order was cancelled on ${formatDateTime(currentOrder.cancellationRequest.respondedAt)}`
                        : "Order has been cancelled."}
                    </p>
                    {currentOrder.cancellationRequest.reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                          Cancellation reason:
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {currentOrder.cancellationRequest.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extension Request Timeline */}
              {currentOrder.extensionRequest && currentOrder.extensionRequest.status && (
                <div className="flex gap-4 mb-6">
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      currentOrder.extensionRequest.status === 'pending' 
                        ? 'bg-yellow-500' 
                        : currentOrder.extensionRequest.status === 'approved' 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                    }`}>
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                      Extension Request {currentOrder.extensionRequest.status === 'pending' ? 'Pending' : currentOrder.extensionRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                      Professional requested new delivery date:{" "}
                      <span className="text-[#2c353f]">
                        {currentOrder.extensionRequest.newDeliveryDate 
                          ? (() => {
                              const d = new Date(currentOrder.extensionRequest.newDeliveryDate);
                              const dateStr = d.toLocaleDateString("en-GB", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              });
                              const timeStr = d.toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                              return `${dateStr} at ${timeStr}`;
                            })()
                          : 'N/A'}
                      </span>
                    </p>
                    {currentOrder.extensionRequest.reason && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                          Reason:
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {currentOrder.extensionRequest.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dispute Timeline */}
              {currentOrder.deliveryStatus === "dispute" && (
                <>
                  {/* You made an offer */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Edit className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "40px" }} />
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                        You made an offer.{" "}
                        <span className="text-[#6b6b6b] italic">Thu 11th September, 2025 17:21</span>
                      </p>
                      
                      {/* Orange Alert Box */}
                      <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mt-3">
                        <div className="flex gap-2">
                          <Info className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <p className="font-['Poppins',sans-serif] text-[13px] text-orange-800">
                            You have responded to the case. You have until 12th September 2025 to negotiate and reach a settlement directly with them. If you are unable to reach an agreement, you may request our team to arbitrate the case by paying the required arbitration fee.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* You got a response */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        You got a response.{" "}
                        <span className="text-[#6b6b6b] italic">Thu 11th September, 2025 17:20</span>
                      </p>
                    </div>
                  </div>

                  {/* Dispute Initiated */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3">
                        <span className="text-blue-600">{currentOrder.professional}</span>{" "}
                        initiated a dispute against your order on{" "}
                        <span className="text-[#6b6b6b] italic">Thu 11th September, 2025 16:18</span>
                      </p>
                      
                      {/* Dispute Reason Box */}
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          Define the terms of your offer and what it includes.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Dispute Section - Show when View Dispute is clicked */}
              {currentOrder.deliveryStatus === "dispute" && showDisputeSection && currentOrder.disputeId && (() => {
                const dispute = getOrderDisputeById(currentOrder.disputeId);
                if (!dispute) return null;
                
                return (
                  <div className="mb-8 border-t-4 border-orange-400 pt-6">
                    <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-4">
                      Dispute Details
                    </h3>
                    
                    {/* Dispute Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
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

                      {/* Messages */}
                      <div className="space-y-4">
                        {dispute.messages.map((msg, index) => {
                          const isClaimant = msg.userId === dispute.claimantId;
                          const showDeadline = index === dispute.messages.length - 1 && isClaimant;

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
                                      {isClaimant && (
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
                );
              })()}

              {/* Delivery Event */}
              {currentOrder.deliveryStatus === "delivered" && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "40px" }} />
                  </div>
                  <div className="flex-1 pb-6">
                    <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                      Delivery #1
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] mb-3">
                      <span className="text-blue-600">{currentOrder.professional}</span>{" "}
                      <span className="text-[#6b6b6b]">delivered your order</span>{" "}
                      <span className="text-[#6b6b6b] italic">
                        {currentOrder.deliveredDate ? formatDate(currentOrder.deliveredDate) : formatDate(new Date().toISOString())}
                      </span>
                    </p>

                    {/* Delivery Content Box - Show delivery message and files */}
                    {(currentOrder.deliveryMessage || (currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0)) && (
                      <div className="border border-gray-200 rounded-lg p-4 mb-4">
                        {currentOrder.deliveryMessage && (
                          <div className="mb-3">
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Delivery message:
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              {currentOrder.deliveryMessage}
                            </p>
                          </div>
                        )}
                        
                        {/* Delivery Attachments */}
                        {currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0 && (
                          <div>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                              📎 Attachments ({currentOrder.deliveryFiles.length})
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {currentOrder.deliveryFiles.map((file: any, index: number) => (
                                <div key={index} className="relative group">
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

                    {/* Approval Message - Show only if order is not completed and no active revision request */}
                    {currentOrder.status !== "Completed" && 
                     currentOrder.deliveryStatus !== "completed" &&
                     (!currentOrder.revisionRequest || 
                      (currentOrder.revisionRequest.status !== 'pending' && 
                       currentOrder.revisionRequest.status !== 'in_progress')) && (
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                        <div className="flex gap-2 mb-4">
                          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="font-['Poppins',sans-serif] text-[14px] text-blue-900">
                            Your work has been delivered. Please approve the delivery or request a revision. {currentOrder.deliveredDate && (() => {
                              const deliveryDate = new Date(currentOrder.deliveredDate);
                              const deadlineDate = new Date(deliveryDate);
                              deadlineDate.setDate(deadlineDate.getDate() + 1);
                              return `You have until ${formatDate(deadlineDate.toISOString())} to respond.`;
                            })()} If no action is taken by then, the order will be automatically completed.
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={() => handleAcceptDelivery(currentOrder.id)}
                            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[14px] px-6"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedOrder(currentOrder.id);
                              setIsRevisionRequestDialogOpen(true);
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
              )}


              {/* Order Started */}
              {(currentOrder.deliveryStatus === "active" || currentOrder.deliveryStatus === "delivered") && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                      <Send className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Order Started
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Information - Collapsible */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                </div>
                <div className="flex-1 pb-6">
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full group">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        Additional Information
                      </p>
                      <ChevronDown className="w-4 h-4 text-[#6b6b6b] transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        {currentOrder.address && (
                          <div>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Service Address
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                              {currentOrder.address.addressLine1}
                              {currentOrder.address.addressLine2 && `, ${currentOrder.address.addressLine2}`}
                              <br />
                              {currentOrder.address.city}, {currentOrder.address.postcode}
                            </p>
                          </div>
                        )}
                        {currentOrder.description && (
                          <div>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Requirements
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                              {currentOrder.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>

              {/* Order Created - Collapsible */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 pb-6">
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full group">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        Order Created
                      </p>
                      <ChevronDown className="w-4 h-4 text-[#6b6b6b] transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Order Date
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                            {formatDate(currentOrder.date)}
                          </p>
                        </div>
                        {/* Appointment Date and Time - Priority display */}
                        {(currentOrder.booking?.date || currentOrder.scheduledDate) && (
                          <div>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Appointment Date
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                              {formatDate(currentOrder.booking?.date || currentOrder.scheduledDate)}
                            </p>
                          </div>
                        )}
                        {(currentOrder.booking?.time || currentOrder.booking?.timeSlot) && (
                          <div>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Appointment Time
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                              {currentOrder.booking?.time || currentOrder.booking?.timeSlot || 'TBD'}
                              {currentOrder.booking?.timeSlot && currentOrder.booking?.time && ` (${currentOrder.booking.timeSlot})`}
                            </p>
                          </div>
                        )}
                        {/* Fallback to scheduledDate if no booking info */}
                        {!currentOrder.booking?.date && currentOrder.scheduledDate && (
                          <div>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Expected Delivery
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                              {formatDate(currentOrder.scheduledDate)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Order Amount
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F]">
                            {currentOrder.amount}
                          </p>
                        </div>
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Professional
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                            {currentOrder.professional}
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              {/* Service Title */}
              <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-4">
                {currentOrder.service || primaryItem?.title || "Service"}
              </h2>

              {/* Service Category */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  {currentOrder.category || "Professional Service"}
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
                  {currentOrder.description && (
                    <li className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      {currentOrder.description}
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
                        {currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : "TBD"}
                      </td>
                    </tr>
                    {(currentOrder.booking?.date || currentOrder.booking?.time) && (
                      <tr className="border-t border-gray-200">
                        <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          Delivery Date & Time
                        </td>
                        <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {currentOrder.booking?.date ? formatDate(currentOrder.booking.date) : "TBD"}
                          {currentOrder.booking?.time && ` at ${currentOrder.booking.time}`}
                          {currentOrder.booking?.timeSlot && ` (${currentOrder.booking.timeSlot})`}
                        </td>
                      </tr>
                    )}
                    {currentOrder.discount && currentOrder.discount > 0 && (
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          Discount
                        </td>
                        <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-green-600">
                          -£{formatMoney(currentOrder.discount)}
                        </td>
                      </tr>
                    )}
                    <tr className={`${currentOrder.discount && currentOrder.discount > 0 ? '' : 'bg-gray-50'} border-t border-gray-200`}>
                      <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        Sub Total
                      </td>
                      <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        £{formatMoney(currentOrder.subtotal ?? currentOrder.amountValue ?? 0)}
                      </td>
                    </tr>
                    {currentOrder.serviceFee && currentOrder.serviceFee > 0 && (
                      <tr className="border-t border-gray-200">
                        <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          Service Fee
                        </td>
                        <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          £{formatMoney(currentOrder.serviceFee)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gray-50 border-t-2 border-gray-300">
                      <td className="px-4 py-3 font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        £{formatMoney(currentOrder.amountValue ?? currentOrder.amount ?? 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Additional Info Tab */}
          <TabsContent value="additional-info" className="mt-6 space-y-6">
            {/* Additional Information Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                  Additional Information
                </h3>
                {!currentOrder.additionalInformation?.submittedAt && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-['Poppins',sans-serif] text-[13px]"
                    onClick={() => setIsAddInfoDialogOpen(true)}
                  >
                    + Add now
                  </Button>
                )}
              </div>

              {currentOrder.additionalInformation?.submittedAt ? (
                <div className="space-y-4">
                  {/* Submitted Message */}
                  {currentOrder.additionalInformation.message && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                        Your message:
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        {currentOrder.additionalInformation.message}
                      </p>
                    </div>
                  )}

                  {/* Submitted Files */}
                  {currentOrder.additionalInformation.files && currentOrder.additionalInformation.files.length > 0 && (
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                        Attachments ({currentOrder.additionalInformation.files.length}):
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {currentOrder.additionalInformation.files.map((file, index) => (
                          <div 
                            key={index} 
                            className="relative border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
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
                    ✓ Submitted on {new Date(currentOrder.additionalInformation.submittedAt).toLocaleString('en-GB', {
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

            {/* Task Address Section */}
            {currentOrder.address && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-3">
                  Task Address
                </h3>
                <p className="font-['Poppins',sans-serif] text-[14px] text-red-600">
                  {currentOrder.address.addressLine1}
                  {currentOrder.address.addressLine2 && `, ${currentOrder.address.addressLine2}`}
                  {currentOrder.address.city && `, ${currentOrder.address.city}`}
                  {currentOrder.address.postcode && `-${currentOrder.address.postcode}`}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery" className="mt-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              {(() => {
                // Get all "Work Delivered" timeline events
                const timeline = buildClientTimeline(currentOrder);
                const deliveryEvents = timeline.filter(event => event.title === "Work Delivered");
                
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
                              <span className="text-purple-600 hover:underline cursor-pointer">{currentOrder.professional}</span>{" "}
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
                             currentOrder.status !== "Completed" && 
                             currentOrder.deliveryStatus !== "completed" &&
                             (!currentOrder.revisionRequest || 
                              (currentOrder.revisionRequest.status !== 'pending' && 
                               currentOrder.revisionRequest.status !== 'in_progress')) && (
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
                                    onClick={() => handleAcceptDelivery(currentOrder.id)}
                                    className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[14px] px-6"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedOrder(currentOrder.id);
                                      setIsRevisionRequestDialogOpen(true);
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
                if (currentOrder.deliveryStatus === "active" || currentOrder.status === "In Progress") {
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

              {currentOrder.deliveryStatus === "completed" && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                      Order Completed
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                      This order has been completed and accepted.
                    </p>
                  </div>

                  {currentOrder.rating && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                          Your Rating
                        </h4>
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 fill-[#FE8A0F] text-[#FE8A0F]" />
                          <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                            {currentOrder.rating} / 5
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
          </div>
        </div>
            </div>

            {/* Right Side - Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
                <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-6">
                  Order Details
                </h3>

                {/* Service Preview */}
                <div className="mb-6">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
                    Service
                  </p>
                  <div className="flex gap-3 items-start">
                    <img 
                      src={currentOrder.items && currentOrder.items.length > 0 && currentOrder.items[0]?.image 
                        ? resolveFileUrl(currentOrder.items[0].image) 
                        : serviceVector}
                      alt="Service thumbnail"
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = serviceVector;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        {currentOrder.service}
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
                      <AvatarImage src={currentOrder.professionalAvatar} />
                      <AvatarFallback>{currentOrder.professional?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        {currentOrder.professional}
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
                      onClick={() => handleStartConversation(currentOrder.professional, currentOrder.professionalAvatar)}
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
                {(currentOrder.booking?.date || currentOrder.booking?.time || currentOrder.scheduledDate) && (
                  <div className="mb-6">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      Delivery Date & Time
                    </p>
                    {(currentOrder.booking?.date || currentOrder.scheduledDate) && (
                      <div className="flex items-center gap-2 text-[#2c353f]">
                        <Calendar className="w-4 h-4 text-[#6b6b6b]" />
                        <span className="font-['Poppins',sans-serif] text-[13px]">
                          {currentOrder.booking?.date ? formatDate(currentOrder.booking.date) : (currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : "TBD")}
                        </span>
                      </div>
                    )}
                    {(currentOrder.booking?.time || currentOrder.booking?.timeSlot) && (
                      <div className="flex items-center gap-2 text-[#2c353f] mt-2">
                        <Clock className="w-4 h-4 text-[#6b6b6b]" />
                        <span className="font-['Poppins',sans-serif] text-[13px]">
                          {currentOrder.booking.time ? currentOrder.booking.time : currentOrder.booking.timeSlot}
                          {currentOrder.booking.timeSlot && currentOrder.booking.time && ` (${currentOrder.booking.timeSlot})`}
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
                    {currentOrder.amount}
                  </p>
                </div>

                {/* Action Buttons - Cancel Order moved to three dots menu in header */}

                {(currentOrder.deliveryStatus === "delivered" || currentOrder.deliveryStatus === "completed") && (
                  <>
                    <Separator className="mb-6" />
                    <div className="space-y-2">
                      <Button
                        onClick={() => setIsDisputeDialogOpen(true)}
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

          {/* Dispute Detail Section */}
          {showDisputeSection && currentOrder.disputeId && (() => {
            const dispute = getOrderDisputeById(currentOrder.disputeId);
            if (!dispute) return null;
            
            const isClient = true; // Current user is client viewing order
            const isClaimant = dispute.claimantId === "client-user";

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Dispute Details (2/3) */}
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

                  {/* Dispute Info Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
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

                    {/* Messages */}
                    <div className="space-y-4">
                      {dispute.messages.map((msg, index) => {
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

                {/* Right Column - Sidebar (1/3) */}
                <div className="space-y-4">
                  {/* Amount Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                      Total disputed milestone<br />amount: <span className="text-[32px] text-[#2c353f]">£ {dispute.amount}</span>
                    </p>
                    <Separator className="my-4" />
                    <button className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] hover:underline mb-4">
                      Show Milestones
                    </button>
                    
                    {/* Offers Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                          Professional ({dispute.respondentName})<br />want to receive:
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

                    {/* Agreed Amount */}
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

        {/* Rating Dialog - Full Page Style */}
        <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[1100px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Rate Your Service</DialogTitle>
              <DialogDescription>Provide your rating and review for the service</DialogDescription>
            </DialogHeader>

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
                  Share your experience of what is it like working with {currentOrder?.professional || "this professional"}.
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
                {/* Service Image */}
                {currentOrder?.serviceImage && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={resolveFileUrl(currentOrder.serviceImage)}
                      alt={currentOrder.service}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}

                {/* Service Title */}
                <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-medium mb-4 italic">
                  {currentOrder?.service || "Service"}
                </h3>

                {/* Order Details */}
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
                      #{currentOrder?.id?.substring(0, 15) || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Order Date</span>
                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      {currentOrder?.date ? new Date(currentOrder.date).toLocaleString('en-GB', {
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
                      {currentOrder?.quantity || 1}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Price</span>
                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      {currentOrder?.amount || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Task Address */}
                {currentOrder?.address && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-semibold mb-2">
                      Task Address
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                      {currentOrder.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
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
                  Reason for Cancellation
                </Label>
                <Textarea
                  placeholder="Please provide a reason for cancelling this order..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  className="font-['Poppins',sans-serif] text-[13px]"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setIsCancelDialogOpen(false);
                    setCancelReason("");
                  }}
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
        <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
          <DialogContent className="w-[70vw]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                Open a Dispute
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                If you're not satisfied with the delivery, you can open a dispute. Our team will review the case and help resolve the issue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dispute-reason" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Reason for Dispute *
                </Label>
                <Textarea
                  id="dispute-reason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Please describe the issue with the order..."
                  rows={4}
                  className="font-['Poppins',sans-serif] text-[14px]"
                />
              </div>
              <div>
                <Label htmlFor="dispute-evidence" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Additional Evidence (Optional)
                </Label>
                <Textarea
                  id="dispute-evidence"
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  placeholder="Provide any additional details, timestamps, or descriptions that support your case..."
                  rows={3}
                  className="font-['Poppins',sans-serif] text-[14px]"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2">
                      What happens next?
                    </p>
                    <ul className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] space-y-1 list-disc list-inside">
                      <li>The other party will have a set time (configured by admin) to respond</li>
                      <li>If they don't respond within the deadline, the dispute will automatically close in your favor</li>
                      <li>You can make settlement offers during this time</li>
                      <li>If no resolution is reached, our team will step in to review the case</li>
                      <li>The order funds will be held until the dispute is resolved</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  onClick={() => {
                    setIsDisputeDialogOpen(false);
                    setDisputeReason("");
                    setDisputeEvidence("");
                  }}
                  variant="outline"
                  className="font-['Poppins',sans-serif]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDispute}
                  className="bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif]"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Open Dispute
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Revision Request Dialog */}
        <Dialog 
          open={isRevisionRequestDialogOpen} 
          onOpenChange={(open) => {
            setIsRevisionRequestDialogOpen(open);
            if (!open) {
              setSelectedOrder(null);
              setRevisionReason("");
              setRevisionMessage("");
              setRevisionFiles([]);
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
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
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
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRevisionRequestDialogOpen(false);
                  setSelectedOrder(null);
                  setRevisionReason("");
                  setRevisionMessage("");
                  setRevisionFiles([]);
                }}
                className="font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestRevision}
                disabled={!revisionReason.trim() || !selectedOrder}
                className="font-['Poppins',sans-serif] bg-[#3D78CB] hover:bg-[#2D5FA3] text-white"
              >
                Submit Revision Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Otherwise show the order list
  return (
    <div>
      <div className="flex flex-col gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
            My Orders
          </h2>
          <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
            Track and manage your service orders
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full font-['Poppins',sans-serif] text-[13px]"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 font-['Poppins',sans-serif] text-[13px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="amount">Sort by Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="flex lg:grid lg:grid-cols-3 gap-3 md:gap-4 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0">
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-1 md:mb-2">
            Total Orders
          </p>
          <p className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#2c353f]">
            {orders.length}
          </p>
        </div>

        {/* Confirmed */}
        <div className="bg-[#DBEAFE] border border-[#BFDBFE] rounded-xl p-4 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0">
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#1E40AF] mb-1 md:mb-2">
            In Progress
          </p>
          <p className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#1E40AF]">
            {inProgressOrders.length}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl p-4 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0">
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#065F46] mb-1 md:mb-2">
            Completed
          </p>
          <p className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#065F46]">
            {completedOrders.length}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full justify-start gap-1">
            <TabsTrigger
              value="all"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              All ({allOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="In Progress"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <Package className="w-4 h-4 mr-2" />
              In Progress ({inProgressOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="Completed"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completed ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="Cancelled"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelled ({cancelledOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="disputed"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Disputed ({disputedOrders.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          {allOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No active orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Poppins',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Status</TableHead>
                    <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(order.status)} font-['Poppins',sans-serif] text-[11px]`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status?.toUpperCase()}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              if (order.professional) {
                                startConversation({
                                  id: order.professionalId || `prof-${order.id}`,
                                  name: order.professional,
                                  avatar: order.professionalAvatar,
                                  online: true,
                                  jobId: order.id,
                                  jobTitle: order.service
                                });
                              }
                            }}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="In Progress" className="space-y-4">
          {inProgressOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No in progress orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Poppins',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Status</TableHead>
                    <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inProgressOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(order.status)} font-['Poppins',sans-serif] text-[11px]`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status?.toUpperCase()}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              if (order.professional) {
                                startConversation({
                                  id: order.professionalId || `prof-${order.id}`,
                                  name: order.professional,
                                  avatar: order.professionalAvatar,
                                  online: true,
                                  jobId: order.id,
                                  jobTitle: order.service
                                });
                              }
                            }}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="Completed" className="space-y-4">
          {completedOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No completed orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Poppins',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Rating</TableHead>
                    <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        {order.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-[#FE8A0F] text-[#FE8A0F]" />
                            <span className="font-['Poppins',sans-serif] text-[13px]">{order.rating}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              if (order.professional) {
                                startConversation({
                                  id: order.professionalId || `prof-${order.id}`,
                                  name: order.professional,
                                  avatar: order.professionalAvatar,
                                  online: true,
                                  jobId: order.id,
                                  jobTitle: order.service
                                });
                              }
                            }}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="Cancelled" className="space-y-4">
          {cancelledOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No cancelled orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Poppins',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Status</TableHead>
                    <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancelledOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(order.status)} font-['Poppins',sans-serif] text-[11px]`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status?.toUpperCase()}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="disputed" className="space-y-4">
          {disputedOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No disputed orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Poppins',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Status</TableHead>
                    <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(order.status)} font-['Poppins',sans-serif] text-[11px]`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status?.toUpperCase()}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              if (order.professional) {
                                startConversation({
                                  id: order.professionalId || `prof-${order.id}`,
                                  name: order.professional,
                                  avatar: order.professionalAvatar,
                                  online: true,
                                  jobId: order.id,
                                  jobTitle: order.service
                                });
                              }
                            }}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Revision Request Dialog */}
      <Dialog 
        open={isRevisionRequestDialogOpen} 
        onOpenChange={(open) => {
          setIsRevisionRequestDialogOpen(open);
          if (!open) {
            setSelectedOrder(null);
            setRevisionReason("");
            setRevisionMessage("");
            setRevisionFiles([]);
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
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRevisionRequestDialogOpen(false);
                setSelectedOrder(null);
                setRevisionReason("");
                setRevisionMessage("");
                setRevisionFiles([]);
              }}
              className="font-['Poppins',sans-serif]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={!revisionReason.trim() || !selectedOrder}
              className="font-['Poppins',sans-serif] bg-orange-600 hover:bg-orange-700 text-white"
            >
              Submit Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Info Dialog */}
      <Dialog open={isAddInfoDialogOpen} onOpenChange={setIsAddInfoDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Add additional information
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              If you have any additional information or special requirements that you need the PRO to submit it now or click skip it below if you do not have one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Message Input */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                What do you need to add?
              </Label>
              <Textarea
                placeholder="Enter any special requirements or additional information..."
                value={addInfoMessage}
                onChange={(e) => setAddInfoMessage(e.target.value)}
                rows={4}
                className="font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            {/* File Upload Area */}
            <div>
              <div 
                className="border-2 border-dashed border-[#3D78CB] rounded-lg p-6 text-center hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('add-info-files')?.click()}
              >
                <input
                  id="add-info-files"
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleAddInfoFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] font-medium mb-1">
                    Attachments
                  </p>
                  <Image className="w-6 h-6 text-[#3D78CB] mb-2" />
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#3D78CB]">
                    Drag & drop Photo or Browser
                  </p>
                </div>
              </div>

              {/* Selected Files Preview */}
              {addInfoFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    Selected Files ({addInfoFiles.length}/10):
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {addInfoFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        {getAddInfoFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] truncate">
                            {file.name}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAddInfoFile(index);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddInfoDialogOpen(false);
                  setAddInfoMessage("");
                  setAddInfoFiles([]);
                }}
                className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] hover:text-[#2c5ba0] underline transition-colors"
              >
                Skip Additional Information
              </button>
              <Button
                onClick={handleSubmitAdditionalInfo}
                disabled={isSubmittingAddInfo || (!addInfoMessage.trim() && addInfoFiles.length === 0)}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-['Poppins',sans-serif] text-[14px] px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingAddInfo ? "Submitting..." : "Add Additional Information"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Response Dialog */}
      <Dialog open={isDisputeResponseDialogOpen} onOpenChange={setIsDisputeResponseDialogOpen}>
        <DialogContent className="w-[90vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
              Respond to Dispute
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              {currentOrder?.disputeInfo?.responseDeadline && (
                <p className="text-red-600 mb-2">
                  ⚠️ Response deadline: {new Date(currentOrder.disputeInfo.responseDeadline).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              Provide your response to the dispute. This is your only chance to respond.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentOrder?.disputeInfo?.reason && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                  Dispute Reason:
                </p>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                  {currentOrder.disputeInfo.reason}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="dispute-response" className="font-['Poppins',sans-serif] text-[14px] mb-2 block">
                Your Response (Optional)
              </Label>
              <Textarea
                id="dispute-response"
                placeholder="Provide your side of the story, evidence, or any relevant information..."
                value={disputeResponseMessage}
                onChange={(e) => setDisputeResponseMessage(e.target.value)}
                className="font-['Poppins',sans-serif] min-h-[120px]"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDisputeResponseDialogOpen(false);
                setDisputeResponseMessage("");
              }}
              className="font-['Poppins',sans-serif]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRespondToDispute}
              className="font-['Poppins',sans-serif] bg-red-600 hover:bg-red-700 text-white"
            >
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
