import { useState, useEffect, useCallback, useMemo } from "react";
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
  ArrowLeft,
  FileText,
  Send,
  Truck,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Upload,
  PlayCircle,
  ThumbsUp,
  ThumbsDown,
  Edit,
  MoreVertical,
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
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { toast } from "sonner";

function ProfessionalOrdersSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, cancelOrder, deliverWork, professionalComplete, createOrderDispute, getOrderDisputeById, requestExtension, requestCancellation, respondToCancellation, withdrawCancellation, respondToRevision, completeRevision, respondToDispute, requestArbitration, cancelDispute, refreshOrders } = useOrders();
  const { userInfo } = useAccount();
  const { startConversation } = useMessenger();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [orderDetailTab, setOrderDetailTab] = useState("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [isDisputeResponseDialogOpen, setIsDisputeResponseDialogOpen] = useState(false);
  const [disputeResponseMessage, setDisputeResponseMessage] = useState("");
  const [showDisputeSection, setShowDisputeSection] = useState(false);
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false);
  const [extensionNewDate, setExtensionNewDate] = useState("");
  const [extensionNewTime, setExtensionNewTime] = useState("09:00");
  const [shownServiceTimeToasts, setShownServiceTimeToasts] = useState<Set<string>>(new Set());
  const [extensionReason, setExtensionReason] = useState("");
  const [isCancellationRequestDialogOpen, setIsCancellationRequestDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isRevisionResponseDialogOpen, setIsRevisionResponseDialogOpen] = useState(false);
  const [revisionResponseAction, setRevisionResponseAction] = useState<'accept' | 'reject'>('accept');
  const [revisionAdditionalNotes, setRevisionAdditionalNotes] = useState("");
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  
  // Review states for professional
  const [isProfessionalReviewDialogOpen, setIsProfessionalReviewDialogOpen] = useState(false);
  const [buyerRating, setBuyerRating] = useState(0);
  const [buyerReview, setBuyerReview] = useState("");
  const [isSubmittingBuyerReview, setIsSubmittingBuyerReview] = useState(false);
  const [hasSubmittedBuyerReview, setHasSubmittedBuyerReview] = useState(false);
  const [clientReviewData, setClientReviewData] = useState<any>(null);

  // Helper function to format dates
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

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

  // Filter orders for professional view
  // API already filters orders by professional role when userRole === 'professional'
  // So we can use all orders directly, but for safety we filter by professionalId if available
  const professionalOrders = userInfo?.id && userInfo.role === 'professional'
    ? orders.filter((order) => {
        // If professionalId is available, use it for comparison
        if (order.professionalId) {
          return order.professionalId === userInfo.id;
        }
        // Otherwise, include all orders (API already filtered by professional role)
        return true;
      })
    : orders;

  // Get orders by order status (not deliveryStatus)
  const getOrdersByStatus = (status: string) => {
    if (status === "all") return professionalOrders;
    return professionalOrders.filter(
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
          order.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const currentOrder = selectedOrder
    ? orders.find((o) => o.id === selectedOrder)
    : null;

  const timelineEvents = useMemo(
    () => (currentOrder ? buildProfessionalTimeline(currentOrder) : []),
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

  // Countdown hook for appointment time (before order is accepted)
  const appointmentCountdown = useCountdown(appointmentDeadline);

  // Elapsed time since order was accepted (work in progress timer)
  const workStartTime = useMemo(() => {
    if (!currentOrder) return null;
    // Stop timer for completed or cancelled orders
    if (currentOrder.status === "Completed" || currentOrder.status === "Cancelled") return null;
    if (currentOrder.deliveryStatus === "delivered" || currentOrder.deliveryStatus === "completed" || currentOrder.deliveryStatus === "cancelled") {
      return null;
    }

    // If a revision is in progress, restart from respondedAt
    if (currentOrder.revisionRequest?.status === "in_progress" && currentOrder.revisionRequest.respondedAt) {
      return new Date(currentOrder.revisionRequest.respondedAt);
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

  // Show toast notification when service time has arrived
  useEffect(() => {
    if (currentOrder && appointmentDeadline && appointmentCountdown.expired) {
      const orderId = currentOrder.id;
      const isPendingOrAccepted = currentOrder.deliveryStatus === "pending";
      
      if (isPendingOrAccepted && !shownServiceTimeToasts.has(orderId)) {
        toast.success("Service Time Has Arrived!", {
          description: "The scheduled appointment time has arrived. You can now start working on the service.",
          duration: 8000,
        });
        setShownServiceTimeToasts(prev => new Set(prev).add(orderId));
      }
    }
  }, [currentOrder, appointmentDeadline, appointmentCountdown.expired, shownServiceTimeToasts]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
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
      case "Completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "cancelled":
      case "Cancelled":
        return <XCircle className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      case "dispute":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
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

  const resolveFileUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return resolveApiUrl(url);
  };

  type TimelineEvent = {
    id: string;
    at?: string;
    label: string;
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

  function buildProfessionalTimeline(order: any): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    const push = (event: Omit<TimelineEvent, "id">, id: string) => {
      events.push({ ...event, id });
    };

    // Order placed
    if (order.date) {
      push(
        {
          at: order.createdAt || order.date,
          label: "Order Placed",
          description: `${order.client || "Client"} placed this order.`,
          colorClass: "bg-gray-800",
          icon: <ShoppingBag className="w-5 h-5 text-white" />,
        },
        "placed"
      );
    }

    // Order accepted by professional
    if (order.acceptedByProfessional && order.acceptedAt) {
      push(
        {
          at: order.acceptedAt,
          label: "Order Accepted",
          description: "You accepted this order.",
          colorClass: "bg-green-600",
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        },
        "accepted"
      );
    }

    // Service delivery pending
    if (order.deliveryStatus === "pending") {
      push(
        {
          at: order.scheduledDate || order.expectedDelivery,
          label: "Service Delivery Pending",
          description:
            "Client has completed payment and is awaiting your service delivery.",
          colorClass: "bg-orange-500",
          icon: <Clock className="w-5 h-5 text-white" />,
        },
        "pending-delivery"
      );
    }

    // Service in progress
    if (order.deliveryStatus === "active") {
      push(
        {
          at: order.expectedDelivery || order.scheduledDate,
          label: "Service In Progress",
          description:
            "You are currently working on this service. Make sure to deliver on time.",
          colorClass: "bg-blue-500",
          icon: <PlayCircle className="w-5 h-5 text-white" />,
        },
        "in-progress"
      );
    }

    // Additional information received
    if (order.additionalInformation?.submittedAt) {
      push(
        {
          at: order.additionalInformation.submittedAt,
          label: "Additional Information Received",
          description: "Client submitted additional information.",
          message: order.additionalInformation.message,
          files: order.additionalInformation.files,
          colorClass: "bg-blue-500",
          icon: <FileText className="w-5 h-5 text-white" />,
        },
        "additional-info"
      );
    }

    // Extension request events
    const ext = order.extensionRequest;
    if (ext?.requestedAt) {
      // Format new delivery date/time
      const newDeliveryFormatted = ext.newDeliveryDate
        ? (() => {
            const d = new Date(ext.newDeliveryDate);
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
        : null;

      push(
        {
          at: ext.requestedAt,
          label: "Extension Requested",
          description: ext.reason
            ? `You requested an extension to ${newDeliveryFormatted || "a new date"}. Reason: ${ext.reason}`
            : newDeliveryFormatted
              ? `You requested an extension to ${newDeliveryFormatted}.`
              : "You requested an extension to the delivery time.",
          colorClass: "bg-indigo-500",
          icon: <Clock className="w-5 h-5 text-white" />,
        },
        "extension-requested"
      );
    }
    if (ext?.respondedAt && (ext.status === "approved" || ext.status === "rejected")) {
      // Format new delivery date/time for response
      const newDeliveryFormatted = ext.newDeliveryDate
        ? (() => {
            const d = new Date(ext.newDeliveryDate);
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
        : null;

      push(
        {
          at: ext.respondedAt,
          label:
            ext.status === "approved"
              ? "Extension Approved"
              : "Extension Rejected",
          description:
            ext.status === "approved"
              ? newDeliveryFormatted
                ? `New delivery date & time: ${newDeliveryFormatted}`
                : "Extension approved."
              : "Client rejected the extension request.",
          colorClass: ext.status === "approved" ? "bg-green-600" : "bg-red-600",
          icon:
            ext.status === "approved" ? (
              <ThumbsUp className="w-5 h-5 text-white" />
            ) : (
              <ThumbsDown className="w-5 h-5 text-white" />
            ),
        },
        "extension-responded"
      );
    }

    // Work delivered
    if (
      order.deliveryStatus === "delivered" ||
      order.deliveryMessage ||
      (order.deliveryFiles && order.deliveryFiles.length > 0)
    ) {
      push(
        {
          at: order.deliveredDate || order.deliveryFiles?.[0]?.uploadedAt,
          label: "Work Delivered",
          description: "You delivered the work to the client.",
          message: order.deliveryMessage,
          files: order.deliveryFiles,
          colorClass: "bg-purple-500",
          icon: <Truck className="w-5 h-5 text-white" />,
        },
        "delivered"
      );
    }

    if (order.revisionRequest?.status) {
      push(
        {
          at: order.revisionRequest.requestedAt,
          label: "Modification Requested",
          description: "Client has requested modifications to the delivered work.",
          message: order.revisionRequest.clientMessage || order.revisionRequest.reason,
          files: order.revisionRequest.clientFiles,
          colorClass: "bg-orange-500",
          icon: <Edit className="w-5 h-5 text-white" />,
        },
        "revision-requested"
      );
    }

    // Cancellation request events
    const canc = order.cancellationRequest;
    if (canc?.requestedAt && canc.status) {
      push(
        {
          at: canc.requestedAt,
          label: "Cancellation Requested",
          description: canc.reason
            ? `Cancellation reason: ${canc.reason}`
            : "A cancellation was requested for this order.",
          colorClass: "bg-red-500",
          icon: <AlertTriangle className="w-5 h-5 text-white" />,
        },
        "cancellation-requested"
      );
    }
    if (canc?.respondedAt && canc.status && canc.status !== "pending") {
      push(
        {
          at: canc.respondedAt,
          label:
            canc.status === "approved"
              ? "Cancellation Approved"
              : canc.status === "rejected"
              ? "Cancellation Rejected"
              : "Cancellation Withdrawn",
          description:
            canc.status === "approved"
              ? "Order was cancelled."
              : canc.status === "rejected"
              ? "Cancellation request was rejected."
              : "Cancellation request was withdrawn.",
          colorClass:
            canc.status === "approved"
              ? "bg-red-600"
              : canc.status === "rejected"
              ? "bg-green-600"
              : "bg-gray-500",
          icon:
            canc.status === "approved" ? (
              <XCircle className="w-5 h-5 text-white" />
            ) : (
              <Check className="w-5 h-5 text-white" />
            ),
        },
        "cancellation-responded"
      );
    }

    // Revision events
    const rev = order.revisionRequest;
    if (rev?.requestedAt) {
      push(
        {
          at: rev.requestedAt,
          label: "Revision Requested",
          description: rev.reason
            ? `Client requested a revision. Reason: ${rev.reason}`
            : "Client requested a revision.",
          colorClass: "bg-purple-500",
          icon: <Edit className="w-5 h-5 text-white" />,
        },
        "revision-requested"
      );
    }
    if (rev?.respondedAt && rev.status) {
      push(
        {
          at: rev.respondedAt,
          label:
            rev.status === "in_progress"
              ? "Revision Accepted"
              : rev.status === "completed"
              ? "Revision Completed"
              : rev.status === "rejected"
              ? "Revision Rejected"
              : "Revision Updated",
          description: rev.additionalNotes || undefined,
          colorClass:
            rev.status === "completed"
              ? "bg-green-600"
              : rev.status === "rejected"
              ? "bg-red-600"
              : "bg-purple-500",
          icon:
            rev.status === "completed" ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <FileText className="w-5 h-5 text-white" />
            ),
        },
        "revision-responded"
      );
    }

    // Additional Information event
    const addInfo = order.additionalInformation;
    if (addInfo?.submittedAt) {
      push(
        {
          at: addInfo.submittedAt,
          label: "Additional Information Received",
          description: addInfo.message 
            ? `Client submitted additional information: ${addInfo.message.substring(0, 100)}${addInfo.message.length > 100 ? '...' : ''}`
            : `Client submitted ${addInfo.files?.length || 0} file(s) as additional information.`,
          colorClass: "bg-blue-500",
          icon: <FileText className="w-5 h-5 text-white" />,
        },
        "additional-info"
      );
    }

    // Delivery event
    if (order.deliveredDate) {
      push(
        {
          at: order.deliveredDate,
          label: "Work Delivered",
          description: order.deliveryMessage || "You delivered the work to the client.",
          colorClass: "bg-blue-500",
          icon: <Truck className="w-5 h-5 text-white" />,
        },
        "delivered"
      );
    }

    // Completion event
    if (order.completedDate || order.status === "Completed") {
      push(
        {
          at: order.completedDate,
          label: "Order Completed",
          description:
            "Order has been completed and funds have been released to your wallet.",
          colorClass: "bg-green-700",
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        },
        "completed"
      );
    }

    // Order cancelled event
    if (order.status === "Cancelled" && canc?.respondedAt && canc.status === "approved") {
      push(
        {
          at: canc.respondedAt,
          label: "Order Cancelled",
          description: canc.reason
            ? `Order was cancelled. Reason: ${canc.reason}`
            : "Order has been cancelled.",
          colorClass: "bg-red-700",
          icon: <XCircle className="w-5 h-5 text-white" />,
        },
        "order-cancelled"
      );
    }

    // Dispute events
    const disp = order.disputeInfo;
    if (disp?.createdAt || order.deliveryStatus === "dispute") {
      push(
        {
          at: disp?.createdAt,
          label: "Dispute Opened",
          description:
            disp?.reason ||
            "A dispute was opened for this order. Please review and respond.",
          colorClass: "bg-red-700",
          icon: <AlertTriangle className="w-5 h-5 text-white" />,
        },
        "dispute-opened"
      );
    }
    if (disp?.closedAt) {
      push(
        {
          at: disp.closedAt,
          label: "Dispute Closed",
          description: disp.decisionNotes || "Dispute has been resolved.",
          colorClass: "bg-gray-700",
          icon: <FileText className="w-5 h-5 text-white" />,
        },
        "dispute-closed"
      );
    }

    // Sort by time
    return events.sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0;
      const tb = b.at ? new Date(b.at).getTime() : 0;
      return tb - ta;
    });
  }

  const handleViewOrder = (orderId: string) => {
    setSelectedOrder(orderId);
    setOrderDetailTab("timeline");
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
  };

  const handleMarkAsDelivered = async () => {
    if (!deliveryMessage.trim() && (!deliveryFiles || deliveryFiles.length === 0)) {
      toast.error("Please add a delivery message or upload files");
      return;
    }
    if (selectedOrder) {
      const currentOrder = orders.find(o => o.id === selectedOrder);
      // Check if this is a revision completion
      if (currentOrder?.revisionRequest && currentOrder.revisionRequest.status === 'in_progress') {
        try {
          await completeRevision(selectedOrder, deliveryMessage, deliveryFiles.length > 0 ? deliveryFiles : undefined);
          toast.success("Revision completed and delivered successfully!");
          setIsDeliveryDialogOpen(false);
          setDeliveryMessage("");
          setDeliveryFiles([]);
        } catch (error: any) {
          toast.error(error.message || "Failed to complete revision");
        }
      } else {
        try {
          await deliverWork(selectedOrder, deliveryMessage, deliveryFiles.length > 0 ? deliveryFiles : undefined);
          toast.success("Order marked as delivered! Client will be notified.");
          setIsDeliveryDialogOpen(false);
          setDeliveryMessage("");
          setDeliveryFiles([]);
        } catch (error: any) {
          toast.error(error.message || "Failed to mark order as delivered");
        }
      }
    }
  };

  const handleRequestExtension = async () => {
    if (!selectedOrder) return;

    if (!extensionNewDate) {
      toast.error("Please select a new delivery date");
      return;
    }

    try {
      // Combine date and time for the new delivery datetime
      const newDeliveryDateTime = `${extensionNewDate}T${extensionNewTime}`;
      await requestExtension(selectedOrder, newDeliveryDateTime, extensionReason || undefined);
      toast.success("Extension request submitted. The client will be notified.");
      setIsExtensionDialogOpen(false);
      setExtensionNewDate("");
      setExtensionNewTime("09:00");
      setExtensionReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to request extension");
    }
  };

  const handleProfessionalComplete = async () => {
    if (!selectedOrder) return;
    if (!completionMessage.trim() && completionFiles.length === 0) {
      toast.error("Please add a completion message or upload verification files");
      return;
    }
    try {
      await professionalComplete(selectedOrder, completionMessage || undefined, completionFiles.length > 0 ? completionFiles : undefined);
      toast.success("Completion request submitted. Waiting for client approval.");
      setIsCompletionDialogOpen(false);
      setCompletionMessage("");
      setCompletionFiles([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit completion request");
    }
  };

  const handleCompletionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setCompletionFiles(prev => [...prev, ...newFiles].slice(0, 10));
    }
  };

  const handleRemoveCompletionFile = (index: number) => {
    setCompletionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRespondToRevision = async () => {
    if (!selectedOrder) return;
    try {
      await respondToRevision(selectedOrder, revisionResponseAction, revisionAdditionalNotes || undefined);
      toast.success(`Revision request ${revisionResponseAction}ed successfully`);
      setIsRevisionResponseDialogOpen(false);
      setRevisionAdditionalNotes("");
    } catch (error: any) {
      toast.error(error.message || `Failed to ${revisionResponseAction} revision request`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Filter only images and videos
      const validFiles = newFiles.filter(file => {
        const type = file.type;
        return type.startsWith('image/') || type.startsWith('video/');
      });
      
      if (validFiles.length !== newFiles.length) {
        toast.error("Only images and videos are allowed");
      }
      
      // Limit to 10 files
      const filesToAdd = validFiles.slice(0, 10 - deliveryFiles.length);
      if (filesToAdd.length < validFiles.length) {
        toast.error("Maximum 10 files allowed");
      }
      
      setDeliveryFiles(prev => [...prev, ...filesToAdd]);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setDeliveryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    if (selectedOrder) {
      cancelOrder(selectedOrder);
      toast.success("Order has been cancelled");
      setIsCancelDialogOpen(false);
      setCancelReason("");
      setSelectedOrder(null);
    }
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

  const handleRespondToDispute = async () => {
    if (!selectedOrder) return;
    try {
      await respondToDispute(selectedOrder, disputeResponseMessage || undefined);
      toast.success("Dispute response submitted successfully");
      setIsDisputeResponseDialogOpen(false);
      setDisputeResponseMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to respond to dispute");
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
                order.deliveryStatus
              )} font-['Poppins',sans-serif] text-[11px]`}
            >
              <span className="flex items-center gap-1">
                {getStatusIcon(order.deliveryStatus)}
                {order.deliveryStatus?.toUpperCase()}
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

      {/* Client Info */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={order.clientAvatar} />
          <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[14px]">
            {order.client
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase() || "C"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            {order.client}
          </p>
          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
            {order.address?.city}, {order.address?.postcode}
          </p>
        </div>
      </div>

      {/* Scheduled Date */}
      {order.scheduledDate && (
        <div className="flex items-center gap-2 mb-3 text-[#6b6b6b]">
          <Calendar className="w-4 h-4" />
          <span className="font-['Poppins',sans-serif] text-[13px]">
            Scheduled: {formatDate(order.scheduledDate)}
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
            if (order.client && order.clientId) {
              startConversation({
                id: order.clientId,
                name: order.client,
                avatar: order.clientAvatar,
                online: true,
                jobId: order.id,
                jobTitle: order.service
              });
            } else {
              toast.error("Unable to start chat - client information not available");
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
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                  {String(appointmentCountdown.hours).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                  {String(appointmentCountdown.minutes).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                  Minutes
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                  {String(appointmentCountdown.seconds).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
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
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.hours).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.minutes).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                  Minutes
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.seconds).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                  Seconds
                </div>
              </div>
            </div>

            {/* Status Indicator */}
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

          {/* Header Section with Title and Status */}
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
                  currentOrder.deliveryStatus
                )} font-['Poppins',sans-serif] text-[11px]`}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(currentOrder.deliveryStatus)}
                  {currentOrder.deliveryStatus?.toUpperCase()}
                </span>
              </Badge>
            </div>
          </div>

          {/* Main Layout - Left Content + Right Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Main Content (Tabs) */}
            <div className="lg:col-span-2">
        <div className="hidden"></div>

        {/* Tabs Section */}
        <div className="bg-white border border-gray-200 rounded-xl">
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
                <div className="space-y-6 px-2 md:px-4">
                {/* Revision Resume Action */}
                {currentOrder.revisionRequest?.status === "pending" && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                          Client requested a modification. Resume work to continue and update the delivery.
                        </p>
                        <Button
                          onClick={async () => {
                            try {
                              await respondToRevision(currentOrder.id, "accept");
                              toast.success("Revision accepted. Work resumed.");
                            } catch (error: any) {
                              toast.error(error.message || "Failed to resume work");
                            }
                          }}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-['Poppins',sans-serif]"
                        >
                          Resume Work
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation Request - Pending (Professional can respond) */}
                {currentOrder.cancellationRequest && 
                 currentOrder.cancellationRequest.status === 'pending' && 
                 currentOrder.cancellationRequest.requestedBy && 
                 currentOrder.cancellationRequest.requestedBy.toString() !== userInfo?.id?.toString() && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                          Cancellation Request Received
                        </h4>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                          {currentOrder.client || "The client"} has requested to cancel this order.
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
                                await handleRespondToCancellation('approve');
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
                                await handleRespondToCancellation('reject');
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

                {/* Cancellation Request - Pending (Professional can respond) - Show at top of page */}
                {currentOrder.cancellationRequest && 
                 currentOrder.cancellationRequest.status === 'pending' && 
                 currentOrder.cancellationRequest.requestedBy && 
                 currentOrder.cancellationRequest.requestedBy.toString() !== userInfo?.id?.toString() && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                          Cancellation Request Received
                        </h4>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                          {currentOrder.client || "The client"} has requested to cancel this order.
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
                                await handleRespondToCancellation('approve');
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
                                await handleRespondToCancellation('reject');
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

                {/* Order Placed - No acceptance required */}


                {/* Status Alert Box - Service Delivery Pending (before work starts) */}
                {currentOrder.deliveryStatus === "pending" &&
                  !workElapsedTime.started &&
                  currentOrder.status !== "Cancelled" &&
                  currentOrder.status !== "Completed" &&
                  currentOrder.deliveryStatus !== "delivered" && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                      Service Delivery Pending
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                      Your client has completed payment and is awaiting your service delivery.
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                      Expected delivery: <span className="text-orange-600 font-medium">
                        {currentOrder.booking?.date 
                          ? `${formatDate(currentOrder.booking.date)} ${currentOrder.booking?.time || currentOrder.booking?.timeSlot || ''}`
                          : currentOrder.scheduledDate 
                            ? formatDate(currentOrder.scheduledDate) 
                            : "TBD"}
                      </span> Feel free to reach out if you have any questions using the chat button.
                    </p>
                    {currentOrder.deliveryStatus !== "delivered" && (
                      <div className="flex gap-3 flex-wrap">
                        <Button
                          onClick={() => setIsDeliveryDialogOpen(true)}
                          className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Deliver Work
                        </Button>
                      <Button
                        onClick={() => {
                          if (currentOrder.client && currentOrder.clientId) {
                            startConversation({
                              id: currentOrder.clientId,
                              name: currentOrder.client,
                              avatar: currentOrder.clientAvatar || "",
                            });
                          } else {
                            toast.error("Unable to start chat - client information not available");
                          }
                        }}
                        variant="outline"
                        className="border-gray-300 text-[#2c353f] hover:bg-gray-50 font-['Poppins',sans-serif]"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                        <Button
                          onClick={() => setIsExtensionDialogOpen(true)}
                          variant="outline"
                          className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-orange-50 font-['Poppins',sans-serif]"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Extend Delivery Time
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {(currentOrder.deliveryStatus === "active" || workElapsedTime.started) &&
                  currentOrder.status !== "Cancelled" &&
                  currentOrder.status !== "Completed" &&
                  currentOrder.deliveryStatus !== "delivered" &&
                  currentOrder.deliveryStatus !== "pending" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                      Service In Progress
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                      You are currently working on this service. Expected delivery: <span className="text-[#2c353f]">{currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : "TBD"}</span>. Make sure to deliver the work on time or request an extension if needed.
                    </p>
                    
                    {/* Extension Request Status */}
                    {currentOrder.extensionRequest && 
                     currentOrder.extensionRequest.status && 
                     ['pending', 'approved', 'rejected'].includes(currentOrder.extensionRequest.status) && (
                      <div className={`mb-4 p-4 rounded-lg border ${
                        currentOrder.extensionRequest.status === 'pending' 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : currentOrder.extensionRequest.status === 'approved'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {currentOrder.extensionRequest.status === 'pending' && (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          )}
                          {currentOrder.extensionRequest.status === 'approved' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          {currentOrder.extensionRequest.status === 'rejected' && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <h5 className={`font-['Poppins',sans-serif] text-[14px] font-medium ${
                            currentOrder.extensionRequest.status === 'pending' 
                              ? 'text-yellow-700' 
                              : currentOrder.extensionRequest.status === 'approved'
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}>
                            Extension Request {currentOrder.extensionRequest.status === 'pending' ? 'Pending' : currentOrder.extensionRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                          </h5>
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                          New delivery date & time:{" "}
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
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                            Reason: {currentOrder.extensionRequest.reason}
                          </p>
                        )}
                      </div>
                    )}

                    {currentOrder.deliveryStatus !== "delivered" && (
                      <div className="flex gap-3 flex-wrap">
                        {/* Deliver Work Button */}
                        <Button
                          onClick={() => {
                            setIsDeliveryDialogOpen(true);
                            setDeliveryMessage("");
                            setDeliveryFiles([]);
                          }}
                          className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif]"
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Deliver Work
                        </Button>
                        
                        {/* Request Extension Button */}
                        {(!currentOrder.extensionRequest || currentOrder.extensionRequest.status !== 'pending') && (
                          <Button
                            onClick={() => {
                              const currentDate = currentOrder.scheduledDate 
                                ? new Date(currentOrder.scheduledDate) 
                                : new Date();
                              currentDate.setDate(currentDate.getDate() + 7);
                              setExtensionNewDate(currentDate.toISOString().split('T')[0]);
                              setExtensionNewTime("09:00");
                              setExtensionReason("");
                              setIsExtensionDialogOpen(true);
                            }}
                            variant="outline"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50 font-['Poppins',sans-serif]"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Request Time Extension
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {timelineTimer}

                {false && currentOrder.deliveryStatus === "delivered" && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-3">
                      Your work has been delivered!
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-6">
                      You have delivered your work. Submit completion request with verification data to allow the client to complete the order and release funds to your wallet.
                    </p>

                    {/* Professional Complete Request Status */}
                    {currentOrder.metadata?.professionalCompleteRequest && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-blue-700">
                            Completion Request Submitted
                          </h5>
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          Waiting for client approval. Once approved, funds will be released to your wallet.
                        </p>
                      </div>
                    )}

                    {/* Complete Button - Show if not already submitted */}
                    {!currentOrder.metadata?.professionalCompleteRequest && (
                      <div className="mb-6">
                        <Button
                          onClick={() => {
                            setIsCompletionDialogOpen(true);
                            setCompletionMessage("");
                            setCompletionFiles([]);
                          }}
                          className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif]"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Submit Completion Request
                        </Button>
                      </div>
                    )}

                    {/* Modification Request Section */}
                    {currentOrder.revisionRequest && (
                      <div className={`mb-6 p-4 rounded-lg border ${
                        currentOrder.revisionRequest.status === 'pending' 
                          ? 'bg-orange-50 border-orange-200' 
                          : currentOrder.revisionRequest.status === 'in_progress'
                          ? 'bg-blue-50 border-blue-200'
                          : currentOrder.revisionRequest.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start gap-3 mb-4">
                          {currentOrder.revisionRequest.status === 'pending' && (
                            <Edit className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          )}
                          {currentOrder.revisionRequest.status === 'in_progress' && (
                            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          )}
                          {currentOrder.revisionRequest.status === 'completed' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          )}
                          {currentOrder.revisionRequest.status === 'rejected' && (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h5 className={`font-['Poppins',sans-serif] text-[14px] font-medium mb-2 ${
                              currentOrder.revisionRequest.status === 'pending' 
                                ? 'text-orange-700' 
                                : currentOrder.revisionRequest.status === 'in_progress'
                                ? 'text-blue-700'
                                : currentOrder.revisionRequest.status === 'completed'
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}>
                              Modification Request - {currentOrder.revisionRequest.status === 'pending' ? 'Pending Review' : currentOrder.revisionRequest.status === 'in_progress' ? 'In Progress' : currentOrder.revisionRequest.status === 'completed' ? 'Completed' : 'Rejected'}
                            </h5>
                            
                            {currentOrder.revisionRequest.reason && (
                              <div className="mb-3 p-3 bg-white border border-gray-200 rounded">
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  📝 What needs to be modified:
                                </p>
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                  {currentOrder.revisionRequest.reason}
                                </p>
                              </div>
                            )}
                            {currentOrder.revisionRequest.clientMessage && (
                              <div className="mb-3 p-3 bg-white border border-gray-200 rounded">
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  💬 Additional notes from client:
                                </p>
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                  {currentOrder.revisionRequest.clientMessage}
                                </p>
                              </div>
                            )}
                            {currentOrder.revisionRequest.clientFiles && currentOrder.revisionRequest.clientFiles.length > 0 && (
                              <div className="mb-3">
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                  📎 Reference files ({currentOrder.revisionRequest.clientFiles.length})
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {currentOrder.revisionRequest.clientFiles.map((file: any, index: number) => (
                                    <div key={index} className="relative group">
                                      {file.fileType === 'image' ? (
                                        <img
                                          src={resolveFileUrl(file.url)}
                                          alt={file.fileName}
                                          className="w-full h-20 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                                        />
                                      ) : file.fileType === 'video' ? (
                                        <div
                                          className="w-full h-20 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                                          onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                                        >
                                          <PlayCircle className="w-6 h-6 text-gray-600" />
                                          <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded truncate">
                                            {file.fileName}
                                          </div>
                                        </div>
                                      ) : (
                                        <div
                                          className="w-full h-20 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                                          onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                                        >
                                          <FileText className="w-6 h-6 text-gray-600" />
                                          <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded truncate">
                                            {file.fileName}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {currentOrder.revisionRequest.status === 'pending' && (
                              <div className="flex gap-3 mt-4">
                                <Button
                                  onClick={() => {
                                    setRevisionResponseAction('accept');
                                    setRevisionAdditionalNotes("");
                                    setIsRevisionResponseDialogOpen(true);
                                  }}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif]"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Accept & Start Work
                                </Button>
                                <Button
                                  onClick={() => {
                                    setRevisionResponseAction('reject');
                                    setRevisionAdditionalNotes("");
                                    setIsRevisionResponseDialogOpen(true);
                                  }}
                                  variant="outline"
                                  className="flex-1 font-['Poppins',sans-serif] border-red-500 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject Request
                                </Button>
                              </div>
                            )}

                            {currentOrder.revisionRequest.status === 'in_progress' && (
                              <div className="mt-4">
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                                  You are working on the revision. Complete the modifications and deliver again.
                                </p>
                                <Button
                                  onClick={() => {
                                    setIsDeliveryDialogOpen(true);
                                    setDeliveryMessage("");
                                    setDeliveryFiles([]);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-['Poppins',sans-serif]"
                                >
                                  <Truck className="w-4 h-4 mr-2" />
                                  Deliver Revision
                                </Button>
                              </div>
                            )}

                            {currentOrder.revisionRequest.additionalNotes && (
                              <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Your notes:
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

                    {/* Show dispute status if dispute exists */}
                    {currentOrder.disputeInfo && (
                      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-['Poppins',sans-serif] text-[14px] font-medium text-red-700 mb-1">
                              Dispute {
                                currentOrder.disputeInfo.status === 'open' ? 'Open - Action Required'
                                : currentOrder.disputeInfo.status === 'negotiation' ? 'In Negotiation'
                                : currentOrder.disputeInfo.status === 'admin_arbitration' ? 'Under Admin Review'
                                : 'Closed'
                              }
                            </h5>
                            {currentOrder.disputeInfo.status === 'open' && currentOrder.disputeInfo.responseDeadline && (
                              <div className="mb-3">
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                  <span className="font-medium text-red-700">Response deadline:</span> {new Date(currentOrder.disputeInfo.responseDeadline).toLocaleString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 mb-3">
                                  ⚠️ If you don't respond by the deadline, the dispute will automatically close in favor of the client.
                                </p>
                                <Button
                                  onClick={() => {
                                    setIsDisputeResponseDialogOpen(true);
                                    setDisputeResponseMessage("");
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif]"
                                >
                                  Respond to Dispute
                                </Button>
                              </div>
                            )}
                            {currentOrder.disputeInfo.status === 'negotiation' && currentOrder.disputeInfo.negotiationDeadline && (
                              <div className="mb-3">
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                  Negotiation deadline: {new Date(currentOrder.disputeInfo.negotiationDeadline).toLocaleString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                <div className="mt-3 space-y-2">
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
                              <div className="mb-3">
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
                            {currentOrder.disputeInfo.status === 'closed' && currentOrder.disputeInfo.adminDecision && (
                              <div className="mb-3">
                                <p className="font-['Poppins',sans-serif] text-[12px] font-medium text-[#2c353f] mb-1">
                                  Admin Decision: {currentOrder.disputeInfo.winnerId === currentOrder.disputeInfo.claimantId ? 'Claimant Won' : 'Respondent Won'}
                                </p>
                                {currentOrder.disputeInfo.decisionNotes && (
                                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mb-2">
                                    {currentOrder.disputeInfo.decisionNotes}
                                  </p>
                                )}
                                {currentOrder.disputeInfo.loserId && (
                                  <p className="font-['Poppins',sans-serif] text-[11px] text-red-600">
                                    The loser has forfeited the arbitration fee (£{currentOrder.disputeInfo.arbitrationFeeAmount || 50}) and the order amount.
                                  </p>
                                )}
                              </div>
                            )}
                            {currentOrder.disputeInfo.status === 'closed' && currentOrder.disputeInfo.autoClosed && (
                              <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 mb-2">
                                Dispute automatically closed in favor of the client (no response received)
                              </p>
                            )}
                            {currentOrder.disputeInfo.reason && (
                              <div className="mt-3 p-3 bg-white border border-red-200 rounded">
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Dispute reason:
                                </p>
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                  {currentOrder.disputeInfo.reason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show Open Dispute button only for delivered orders and if no dispute exists */}
                    {!currentOrder.disputeInfo && (
                      <div className="mb-6">
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
                      {currentOrder.client || "The client"} is disputing the work you have delivered. They are currently waiting for your response. Please respond before the deadline. Click "View Dispute" to reply, add additional information, make, reject, or accept an offer.
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

                {/* Delivery Countdown - Show for active and pending orders */}
                {(currentOrder.deliveryStatus === "active" || currentOrder.deliveryStatus === "pending") && currentOrder.expectedDelivery && (
                  <DeliveryCountdown expectedDelivery={currentOrder.expectedDelivery} />
                )}

                </div>

                {/* Timeline Events */}
                <div className="space-y-0">
                  {timelineEvents.length === 0 && (
                    <div className="text-center py-6 text-[#6b6b6b] text-[13px] font-['Poppins',sans-serif]">
                      No timeline events yet.
                    </div>
                  )}
                  {timelineEvents.map((event, index) => (
                    <div key={`${event.id}-${event.at || "na"}-${index}`} className="flex gap-4 mb-6">
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-10 h-10 rounded-lg ${event.colorClass} flex items-center justify-center flex-shrink-0`}>
                          {event.icon}
                        </div>
                        <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                          {event.label}
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
                      </div>
                    </div>
                  ))}
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
                          Additional Information Received
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                          Client submitted additional information on{" "}
                          <span className="text-[#2c353f]">
                            {(() => {
                              const d = new Date(currentOrder.additionalInformation.submittedAt);
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
                            })()}
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

                  {/* Work Delivered Timeline */}
                  {currentOrder.deliveryStatus === "delivered" && (
                    <div className="flex gap-4 mb-6">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                          Work Delivered
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                          You delivered your work on{" "}
                          <span className="text-[#2c353f]">
                            {currentOrder.deliveredDate ? formatDateTime(currentOrder.deliveredDate) : "today"}
                          </span>
                        </p>
                        
                        {/* Delivery Message and Attachments */}
                        {(currentOrder.deliveryMessage || (currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0)) && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
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
                            
                            {currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0 && (
                              <div>
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                  📎 Attachments ({currentOrder.deliveryFiles.length})
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {currentOrder.deliveryFiles.map((file, index) => (
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

                        {/* Status Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                          <p className="font-['Poppins',sans-serif] text-[13px] text-blue-800">
                            Waiting for client to approve the delivery or request modifications.
                          </p>
                        </div>
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
                            ? `Order was cancelled on ${(() => {
                                const d = new Date(currentOrder.cancellationRequest.respondedAt);
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
                              })()}`
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
                          Requested new delivery date:{" "}
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
                </div>

                {/* Dispute Timeline */}
                {currentOrder.deliveryStatus === "dispute" && (
                  <div className="space-y-0 mt-6">
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
                          <span className="text-blue-600">{currentOrder.client || "Client"}</span>{" "}
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
                  </div>
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

                {/* Order Timeline for Delivered Status */}
                {currentOrder.deliveryStatus === "delivered" && (
                  <div className="space-y-0 mt-6">
                    {/* Work Delivered */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                          Work Delivered
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                          You delivered your work on{" "}
                          <span className="italic">
                            {currentOrder.deliveredDate ? formatDateTime(currentOrder.deliveredDate) : "today"}
                          </span>
                        </p>
                        
                        {/* Delivery Message and Attachments */}
                        {(currentOrder.deliveryMessage || (currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0)) && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            {currentOrder.deliveryMessage && (
                              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3">
                                {currentOrder.deliveryMessage}
                              </p>
                            )}
                            
                            {currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0 && (
                              <div>
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">
                                  Attachments ({currentOrder.deliveryFiles.length})
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {currentOrder.deliveryFiles.map((file, index) => (
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
                      </div>
                    </div>

                    {/* Delivery Date Updated */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          Your delivery data was updated to Sun 12th October, 2025 17:00.
                        </p>
                      </div>
                    </div>

                    {/* Order Started */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Send className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          Order Started
                        </p>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 pb-6">
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center justify-between w-full group hover:bg-gray-50 -mx-2 px-2 py-2 rounded">
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              Additional Information
                            </p>
                            <ChevronDown className="w-4 h-4 text-[#6b6b6b] transition-transform group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                              <div>
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Client
                                </p>
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                  {currentOrder.client}
                                </p>
                              </div>
                              <div>
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Order Amount
                                </p>
                                <p className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                                  {currentOrder.amount}
                                </p>
                              </div>
                              {currentOrder.location && (
                                <div>
                                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                    Location
                                  </p>
                                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                    {currentOrder.location}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  </div>
                )}

                {currentOrder.deliveryStatus === "completed" && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-semibold mb-2">
                      Your order has been completed!
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                      Congratulations on completing your order! Please assist other users on our platform by sharing your experience of working with the buyer in the form of feedback.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setIsProfessionalReviewDialogOpen(true);
                          setBuyerRating(0);
                          setBuyerReview("");
                        }}
                        className="bg-[#FE8A0F] hover:bg-[#e07a0d] text-white font-['Poppins',sans-serif] text-[13px]"
                      >
                        View Review
                      </Button>
                      <Button
                        onClick={() => {
                          if (currentOrder.client && currentOrder.clientId) {
                            startConversation({
                              id: currentOrder.clientId,
                              name: currentOrder.client,
                              avatar: currentOrder.clientAvatar || "",
                            });
                          } else {
                            toast.error("Unable to start chat - client information not available");
                          }
                        }}
                        variant="outline"
                        className="font-['Poppins',sans-serif] text-[13px] border-gray-300"
                      >
                        Chat
                      </Button>
                    </div>
                  </div>
                )}

                {/* Timeline similar to Client view */}
                <div className="space-y-0">
                  {/* Order Created */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
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
                            <div>
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                Client
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                {currentOrder.client}
                              </p>
                            </div>
                            <div>
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                Order Amount
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F]">
                                {currentOrder.amount}
                              </p>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>

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
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                          You accepted this order
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="mt-6">
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                  <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-4">
                    {currentOrder.service}
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
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            Price
                          </td>
                          <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            £10.00/Hours
                          </td>
                        </tr>
                        <tr className="border-t border-gray-200">
                          <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            Delivered by
                          </td>
                          <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            {currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : "10-12-2025"}
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
                        <tr className="bg-gray-50 border-t border-gray-200">
                          <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            Total no. of Hours
                          </td>
                          <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            2
                          </td>
                        </tr>
                        <tr className="border-t border-gray-200">
                          <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            Price
                          </td>
                          <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            £10.00
                          </td>
                        </tr>
                        <tr className="bg-gray-50 border-t border-gray-200">
                          <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            Sub Total
                          </td>
                          <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            £20.00
                          </td>
                        </tr>
                        <tr className="border-t border-gray-200">
                          <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            Service Fee
                          </td>
                          <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            £5.00
                          </td>
                        </tr>
                        <tr className="bg-gray-50 border-t-2 border-gray-300">
                          <td className="px-4 py-3 font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                            Total
                          </td>
                          <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                            {currentOrder.amount}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* Additional Info Tab */}
              <TabsContent value="additional-info" className="mt-6 space-y-6">
                {/* Client's Additional Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
                    Additional Information from Client
                  </h3>

                  {currentOrder.additionalInformation?.submittedAt ? (
                    <div className="space-y-4">
                      {/* Submitted Message */}
                      {currentOrder.additionalInformation.message && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                            Client's message:
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
                            {currentOrder.additionalInformation.files.map((file: any, index: number) => (
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

                      <p className="font-['Poppins',sans-serif] text-[12px] text-blue-600">
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
                      No additional information has been submitted by the client yet.
                    </p>
                  )}
                </div>

                {currentOrder.address && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-3">
                      Service Address
                    </h3>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      {currentOrder.address.addressLine1}
                      {currentOrder.address.addressLine2 && `, ${currentOrder.address.addressLine2}`}
                      <br />
                      {currentOrder.address.city}, {currentOrder.address.postcode}
                    </p>
                  </div>
                )}

                {currentOrder.description && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-3">
                      Client Requirements
                    </h3>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      {currentOrder.description}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Delivery Tab */}
              <TabsContent value="delivery" className="mt-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  {currentOrder.deliveryStatus === "active" && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                      <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                        In Progress
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                        Complete your work and deliver to the client
                      </p>
                    </div>
                  )}

                  {currentOrder.deliveryStatus === "delivered" && (
                    <div className="text-center py-8">
                      <Truck className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                      <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                        Delivered
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                        Waiting for client approval
                      </p>
                    </div>
                  )}

                  {currentOrder.deliveryStatus === "completed" && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                        Order Completed
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                        This order has been successfully completed
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => {
                            setIsProfessionalReviewDialogOpen(true);
                            setBuyerRating(0);
                            setBuyerReview("");
                            setHasSubmittedBuyerReview(false);
                            setClientReviewData(null);
                          }}
                          className="bg-[#FE8A0F] hover:bg-[#e07a0d] text-white font-['Poppins',sans-serif] text-[13px]"
                        >
                          View Review
                        </Button>
                        <Button
                          onClick={() => {
                            if (currentOrder.client && currentOrder.clientId) {
                              startConversation({
                                id: currentOrder.clientId,
                                name: currentOrder.client,
                                avatar: currentOrder.clientAvatar || "",
                              });
                            } else {
                              toast.error("Unable to start chat - client information not available");
                            }
                          }}
                          variant="outline"
                          className="font-['Poppins',sans-serif] text-[13px] border-gray-300"
                        >
                          Chat
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
                      src={serviceVector}
                      alt="Service thumbnail"
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        {currentOrder.service}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Client */}
                <div className="mb-6">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
                    Client
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentOrder.clientAvatar} />
                      <AvatarFallback className="bg-[#3D78CB] text-white">
                        {currentOrder.client?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        {currentOrder.client}
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
                      onClick={() => {
                        if (currentOrder.client && currentOrder.clientId) {
                          startConversation({
                            id: currentOrder.clientId,
                            name: currentOrder.client,
                            avatar: currentOrder.clientAvatar,
                            online: true,
                            jobId: currentOrder.id,
                            jobTitle: currentOrder.service
                          });
                        } else {
                          toast.error("Unable to start chat - client information not available");
                        }
                      }}
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

                {/* Order Date */}
                <div className="mb-6">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                    Order Date
                  </p>
                  <div className="flex items-center gap-2 text-[#2c353f]">
                    <Calendar className="w-4 h-4 text-[#6b6b6b]" />
                    <span className="font-['Poppins',sans-serif] text-[13px]">
                      {formatDate(currentOrder.date)}
                    </span>
                  </div>
                </div>

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

                {/* Total Amount */}
                <div className="mb-6">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                    Total Amount
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[24px] text-[#FE8A0F]">
                    {currentOrder.amount}
                  </p>
                </div>

                {/* Action Buttons */}
                {currentOrder.deliveryStatus === "active" && (
                  <>
                    <Separator className="mb-6" />
                    <div className="space-y-2">
                      <Button
                        onClick={() => setIsDeliveryDialogOpen(true)}
                        className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif] text-[13px]"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Deliver Order
                      </Button>
                      {/* Cancel Order button removed - now in three dots menu in header */}
                    </div>
                  </>
                )}

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
            
            const isProfessional = true; // Current user is professional viewing order
            const isClaimant = dispute.claimantId === "professional-user";

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

        {/* Delivery Dialog */}
        <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
          <DialogContent className="w-[70vw]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
                Deliver Order
              </DialogTitle>
              <DialogDescription className="sr-only">
                Submit your completed work to the client
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Delivery Message
                </Label>
                <Textarea
                  placeholder="Describe what you've completed and any important details..."
                  value={deliveryMessage}
                  onChange={(e) => setDeliveryMessage(e.target.value)}
                  rows={4}
                  className="font-['Poppins',sans-serif] text-[13px]"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
                  💡 You can also attach files by uploading them in the messenger
                </p>
              </div>

              <Button
                onClick={handleMarkAsDelivered}
                className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Submit Delivery
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Extension Request Dialog */}
        <Dialog open={isExtensionDialogOpen} onOpenChange={setIsExtensionDialogOpen}>
          <DialogContent className="w-[90vw] max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                Request Extension
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                Request an extension for the delivery deadline. The client will be notified and can approve or reject your request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* New Delivery Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    New Delivery Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={extensionNewDate}
                      onChange={(e) => setExtensionNewDate(e.target.value)}
                      min={currentOrder?.scheduledDate ? new Date(new Date(currentOrder.scheduledDate).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="font-['Poppins',sans-serif] text-[14px] pr-10"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    New Delivery Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={extensionNewTime}
                      onChange={(e) => setExtensionNewTime(e.target.value)}
                      className="font-['Poppins',sans-serif] text-[14px] pr-10"
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* Current schedule info */}
              {(currentOrder?.scheduledDate || currentOrder?.booking?.date) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                    <span className="font-medium">Current scheduled:</span>{" "}
                    {currentOrder?.booking?.date 
                      ? `${formatDate(currentOrder.booking.date)} ${currentOrder.booking?.time || currentOrder.booking?.timeSlot || ''}`
                      : currentOrder?.scheduledDate 
                        ? formatDate(currentOrder.scheduledDate) 
                        : "TBD"}
                  </p>
                </div>
              )}

              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Reason (Optional)
                </Label>
                <Textarea
                  placeholder="Explain why you need an extension..."
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  rows={4}
                  className="font-['Poppins',sans-serif] text-[13px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsExtensionDialogOpen(false);
                    setExtensionNewDate("");
                    setExtensionNewTime("09:00");
                    setExtensionReason("");
                  }}
                  className="font-['Poppins',sans-serif] text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestExtension}
                  disabled={!extensionNewDate}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-['Poppins',sans-serif] text-[13px] disabled:opacity-50"
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Completion Request Dialog */}
        <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
          <DialogContent className="w-[90vw] max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                Submit Completion Request
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                Upload verification data (images/videos) and add a message to request order completion. The client will review and approve to release funds to your wallet.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Upload Verification Files (Images/Videos) <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#3D78CB] transition-colors">
                  <input
                    type="file"
                    id="completion-files"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleCompletionFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="completion-files"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                      Images (PNG, JPG, GIF, WEBP) or Videos (MP4, MPEG, MOV, AVI, WEBM) - Max 100MB each
                    </p>
                  </label>
                </div>
                
                {/* Selected Files Preview */}
                {completionFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      Selected Files ({completionFiles.length}/10):
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {completionFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <PlayCircle className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
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
                            onClick={() => handleRemoveCompletionFile(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Completion Message */}
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Completion Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Add a message about the completed work and verification data..."
                  value={completionMessage}
                  onChange={(e) => setCompletionMessage(e.target.value)}
                  rows={4}
                  className="font-['Poppins',sans-serif] text-[13px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCompletionDialogOpen(false);
                    setCompletionMessage("");
                    setCompletionFiles([]);
                  }}
                  className="font-['Poppins',sans-serif] text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProfessionalComplete}
                  disabled={(!completionMessage.trim() && completionFiles.length === 0)}
                  className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit Completion Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Professional Review Dialog - Review Buyer */}
        <Dialog open={isProfessionalReviewDialogOpen} onOpenChange={setIsProfessionalReviewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[1100px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Leave Public Review</DialogTitle>
              <DialogDescription>Review your experience with this buyer</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col lg:flex-row">
              {/* Left Side - Review Form */}
              <div className="flex-1 p-6 lg:p-8">
                <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#3D5A80] font-medium mb-4">
                  Leave Public Review
                </h2>

                {/* Client Review Info */}
                {currentOrder?.rating ? (
                  <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={currentOrder.clientAvatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {currentOrder.client?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        <span className="font-semibold">{currentOrder.client}</span> has left you a feedback. To see their review, please leave your own feedback.
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

                {/* Review Section */}
                <Collapsible defaultOpen className="border border-gray-200 rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-[#FE8A0F]" />
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                        Review your experience with this buyer
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] italic ml-2">
                        {currentOrder?.completedDate ? formatDateTime(currentOrder.completedDate) : ""}
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

                    {/* Rate Experience */}
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

                    {/* Written Review */}
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

                    {/* Submit Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={async () => {
                          if (buyerRating === 0) {
                            toast.error("Please select a rating");
                            return;
                          }
                          setIsSubmittingBuyerReview(true);
                          try {
                            const response = await fetch(resolveApiUrl(`/api/orders/${selectedOrder}/buyer-review`), {
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
                            // Fetch client review data
                            const reviewResponse = await fetch(resolveApiUrl(`/api/orders/${selectedOrder}/review`), {
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

                {/* Client's Review (shown after professional submits their review) */}
                {hasSubmittedBuyerReview && clientReviewData && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-['Poppins',sans-serif] text-[15px] text-green-700 font-semibold mb-3">
                      Client's Review
                    </h4>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={clientReviewData.reviewer?.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {clientReviewData.reviewer?.name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mb-1">
                          {clientReviewData.reviewer?.name || "Client"}
                        </p>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (clientReviewData.rating || 0)
                                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {clientReviewData.comment && (
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            "{clientReviewData.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {hasSubmittedBuyerReview && !clientReviewData && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-blue-700">
                      Thank you for your review! The client hasn't submitted their review yet.
                    </p>
                  </div>
                )}
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

        {/* Delivery Dialog */}
        <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
          <DialogContent className="w-[90vw] max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                Deliver Work
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                Upload images or videos of your completed work along with remarks to deliver this order.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Upload Files (Images/Videos) <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#3D78CB] transition-colors">
                  <input
                    type="file"
                    id="delivery-files"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="delivery-files"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                      Images (PNG, JPG, GIF, WEBP) or Videos (MP4, MPEG, MOV, AVI, WEBM) - Max 100MB each
                    </p>
                  </label>
                </div>
                
                {/* Selected Files Preview */}
                {deliveryFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      Selected Files ({deliveryFiles.length}/10):
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {deliveryFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <PlayCircle className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
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
                            onClick={() => handleRemoveFile(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Message */}
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Remarks <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Add remarks about the completed work..."
                  value={deliveryMessage}
                  onChange={(e) => setDeliveryMessage(e.target.value)}
                  rows={4}
                  className="font-['Poppins',sans-serif] text-[13px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeliveryDialogOpen(false);
                    setDeliveryMessage("");
                    setDeliveryFiles([]);
                  }}
                  className="font-['Poppins',sans-serif] text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkAsDelivered}
                  disabled={(!deliveryMessage.trim() && deliveryFiles.length === 0)}
                  className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Deliver Work
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
                      <li>Both parties will have 24 hours to discuss and resolve the issue</li>
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
            Manage orders received from clients
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
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Poppins',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Poppins',sans-serif]">Client</TableHead>
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
                            <AvatarImage src={order.clientAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.client?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.client}</span>
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
                              if (order.client && order.clientId) {
                                startConversation({
                                  id: order.clientId,
                                  name: order.client,
                                  avatar: order.clientAvatar,
                                  online: true,
                                  jobId: order.id,
                                  jobTitle: order.service
                                });
                              } else {
                                toast.error("Unable to start chat - client information not available");
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
                    <TableHead className="font-['Poppins',sans-serif]">Client</TableHead>
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
                            <AvatarImage src={order.clientAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.client?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.client}</span>
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
                              if (order.client && order.clientId) {
                                startConversation({
                                  id: order.clientId,
                                  name: order.client,
                                  avatar: order.clientAvatar,
                                  online: true,
                                  jobId: order.id,
                                  jobTitle: order.service
                                });
                              } else {
                                toast.error("Unable to start chat - client information not available");
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
                    <TableHead className="font-['Poppins',sans-serif]">Client</TableHead>
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
                            <AvatarImage src={order.clientAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.client?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.client}</span>
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
                              if (order.client && order.clientId) {
                                startConversation({
                                  id: order.clientId,
                                  name: order.client,
                                  avatar: order.clientAvatar,
                                  online: true,
                                  jobId: order.id,
                                  jobTitle: order.service
                                });
                              } else {
                                toast.error("Unable to start chat - client information not available");
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
                    <TableHead className="font-['Poppins',sans-serif]">Client</TableHead>
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
                            <AvatarImage src={order.clientAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.client?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.client}</span>
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
                    <TableHead className="font-['Poppins',sans-serif]">Client</TableHead>
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
                            <AvatarImage src={order.clientAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                              {order.client?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[13px]">{order.client}</span>
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
                              if (order.client && order.clientId) {
                                startConversation({
                                  id: order.clientId,
                                  name: order.client,
                                  avatar: order.clientAvatar,
                                  online: true,
                                  jobId: order.id,
                                  jobTitle: order.service
                                });
                              } else {
                                toast.error("Unable to start chat - client information not available");
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

      {/* Dispute Response Dialog */}
      <Dialog open={isDisputeResponseDialogOpen} onOpenChange={setIsDisputeResponseDialogOpen}>
        <DialogContent className="w-[90vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
              Respond to Dispute
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Send a response to the dispute. This will be visible to the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dispute-response" className="font-['Poppins',sans-serif] text-[14px] mb-2 block">
                Response
              </Label>
              <Textarea
                id="dispute-response"
                placeholder="Write your response..."
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
              className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif]"
            >
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Response Dialog */}
      <Dialog open={isRevisionResponseDialogOpen} onOpenChange={setIsRevisionResponseDialogOpen}>
        <DialogContent className="w-[90vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
              {revisionResponseAction === 'accept' ? 'Accept Revision Request' : 'Reject Revision Request'}
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              {revisionResponseAction === 'accept' 
                ? 'You are accepting the revision request. You can add notes about how you will proceed with the modifications.'
                : 'You are rejecting the revision request. Please provide a reason (optional).'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrder && (() => {
              const order = orders.find(o => o.id === selectedOrder);
              return order?.revisionRequest?.reason && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                    Client's Request:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                    {order.revisionRequest.reason}
                  </p>
                </div>
              );
            })()}
            <div>
              <Label htmlFor="revision-notes" className="font-['Poppins',sans-serif] text-[14px] mb-2 block">
                {revisionResponseAction === 'accept' ? 'Additional Notes (Optional)' : 'Reason for Rejection (Optional)'}
              </Label>
              <Textarea
                id="revision-notes"
                placeholder={revisionResponseAction === 'accept' 
                  ? "Describe how you will proceed with the revision..."
                  : "Explain why you are rejecting this revision request..."}
                value={revisionAdditionalNotes}
                onChange={(e) => setRevisionAdditionalNotes(e.target.value)}
                className="font-['Poppins',sans-serif] min-h-[120px]"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRevisionResponseDialogOpen(false);
                setRevisionAdditionalNotes("");
              }}
              className="font-['Poppins',sans-serif]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRespondToRevision}
              className={`font-['Poppins',sans-serif] ${
                revisionResponseAction === 'accept'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {revisionResponseAction === 'accept' ? 'Accept Revision' : 'Reject Revision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfessionalOrdersSection;
