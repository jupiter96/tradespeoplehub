import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  PoundSterling,
  Paperclip,
  X,
  Play,
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
import {
  VideoThumbnail,
  buildProfessionalTimeline,
  ProfessionalOrderList,
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
  RejectCancellationDialog,
  CancellationRequestDialog,
  formatDate,
  formatDateTime,
  getStatusBadge,
  getStatusIcon,
  resolveFileUrl,
  resolveAvatarUrl,
  isVideoFile,
} from "./orders";

function ProfessionalOrdersSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, cancelOrder, deliverWork, professionalComplete, createOrderDispute, getOrderDisputeById, requestExtension, requestCancellation, respondToCancellation, withdrawCancellation, respondToRevision, completeRevision, respondToDispute, requestArbitration, cancelDispute, respondToClientReview, refreshOrders } = useOrders();
  const { userInfo } = useAccount();
  const { startConversation, refreshMessages } = useMessenger();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const getTwoLetterInitials = (name?: string, fallback = "C") => {
    if (!name || !name.trim()) return fallback;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };
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
  const [isAcceptCancellationDialogOpen, setIsAcceptCancellationDialogOpen] = useState(false);
  const [isRejectCancellationDialogOpen, setIsRejectCancellationDialogOpen] = useState(false);
  const [isRevisionResponseDialogOpen, setIsRevisionResponseDialogOpen] = useState(false);
  const [revisionResponseAction, setRevisionResponseAction] = useState<'accept' | 'reject'>('accept');
  const [revisionAdditionalNotes, setRevisionAdditionalNotes] = useState("");
  const [isWithdrawOfferConfirmOpen, setIsWithdrawOfferConfirmOpen] = useState(false);
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
  const [reviewResponse, setReviewResponse] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Function to close all modals and reset related states
  const closeAllModals = () => {
    setIsViewDialogOpen(false);
    setIsCancelDialogOpen(false);
    setIsDisputeDialogOpen(false);
    setIsDeliveryDialogOpen(false);
    setIsDisputeResponseDialogOpen(false);
    setIsExtensionDialogOpen(false);
    setIsCancellationRequestDialogOpen(false);
    setIsWithdrawCancellationDialogOpen(false);
    setIsAcceptCancellationDialogOpen(false);
    setIsRejectCancellationDialogOpen(false);
    setIsRevisionResponseDialogOpen(false);
    setIsWithdrawOfferConfirmOpen(false);
    setIsCompletionDialogOpen(false);
    setIsProfessionalReviewDialogOpen(false);
    // Reset form states when closing modals
    setCancelReason("");
    setCancellationReason("");
    setExtensionReason("");
    setExtensionNewDate("");
    setExtensionNewTime("09:00");
    setDeliveryMessage("");
    setDeliveryFiles([]);
    setCompletionMessage("");
    setCompletionFiles([]);
    setRevisionAdditionalNotes("");
    setDisputeResponseMessage("");
    setReviewResponse("");
  };

  // Handle submit response to client review
  const handleSubmitReviewResponse = () => {
    if (!reviewResponse.trim() || !currentOrder) return;
    const resp = reviewResponse.trim();
    setReviewResponse("");
    toast.promise(
      respondToClientReview(currentOrder.id, resp).then(() => { refreshOrders(); }),
      { loading: "Processing...", success: "Response submitted successfully", error: (e: any) => e.message || "Failed to submit response" }
    );
  };

  // Function to open a specific modal and close all others
  const openModal = (modalName: 'view' | 'cancel' | 'dispute' | 'delivery' | 'disputeResponse' | 'extension' | 'cancellationRequest' | 'withdrawCancellation' | 'acceptCancellation' | 'rejectCancellation' | 'revisionResponse' | 'completion' | 'professionalReview') => {
    closeAllModals();
    switch (modalName) {
      case 'view':
        setIsViewDialogOpen(true);
        break;
      case 'cancel':
        setIsCancelDialogOpen(true);
        break;
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
      case 'acceptCancellation':
        setIsAcceptCancellationDialogOpen(true);
        break;
      case 'rejectCancellation':
        setIsRejectCancellationDialogOpen(true);
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
  const [serviceThumbnails, setServiceThumbnails] = useState<{[orderId: string]: { type: 'image' | 'video', url: string, thumbnail?: string }}>({});


  // Check for orderId in URL params and auto-select that order
  // Keep the orderId in state so we can retry once orders load
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10; // Maximum number of retries (10 * 500ms = 5 seconds)
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    
    if (orderId) {
      // Store the orderId we're looking for
      setPendingOrderId(orderId);
      setRetryCount(0);
      
      // Try to find and select the order
      const foundOrder = orders.find(o => o.id === orderId);
      if (foundOrder) {
        setSelectedOrder(orderId);
        setPendingOrderId(null);
        // Clear the orderId from URL after opening
        const newUrl = window.location.pathname + "?tab=orders";
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [location.search]);

  // Retry selecting order when orders change (for when orders load after initial mount)
  useEffect(() => {
    if (pendingOrderId && orders.length > 0) {
      const foundOrder = orders.find(o => o.id === pendingOrderId);
      if (foundOrder) {
        setSelectedOrder(pendingOrderId);
        setPendingOrderId(null);
        setRetryCount(0);
        // Clear the orderId from URL after opening
        const newUrl = window.location.pathname + "?tab=orders";
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [orders, pendingOrderId]);

  // If order not found and we have a pending order ID, keep retrying with refreshOrders
  useEffect(() => {
    if (pendingOrderId && retryCount < maxRetries) {
      const foundOrder = orders.find(o => o.id === pendingOrderId);
      if (!foundOrder) {
        // Order not found yet, retry after a delay
        const timer = setTimeout(async () => {
          setRetryCount(prev => prev + 1);
          // Refresh orders to get the latest data
          if (refreshOrders) {
            await refreshOrders();
          }
        }, 500); // Retry every 500ms
        
        return () => clearTimeout(timer);
      }
    }
  }, [pendingOrderId, retryCount, orders, refreshOrders]);

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
  // "Cancelled" tab shows both Cancelled and Cancellation Pending (same treatment)
  const getOrdersByStatus = (status: string) => {
    if (status === "all") return professionalOrders;
    if (status === "Cancelled") {
      return professionalOrders.filter(
        (o) => o.status === "Cancelled" || o.status === "Cancellation Pending"
      );
    }
    return professionalOrders.filter((order) => order.status === status);
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

  // Console log currentOrder for debugging
  useEffect(() => {
    if (currentOrder) {
      console.log('Current Order (Professional):', currentOrder);
    }
  }, [currentOrder]);

  // Fetch service thumbnail for current order
  useEffect(() => {
    const fetchServiceThumbnail = async () => {
      if (!currentOrder || !currentOrder.items || currentOrder.items.length === 0) return;
      
      const serviceId = (currentOrder.items[0] as any)?.serviceId || currentOrder.items[0]?.id;
      if (!serviceId || serviceThumbnails[currentOrder.id]) return; // Already fetched
      
      try {
        const response = await fetch(resolveApiUrl(`/api/services/${serviceId}`), {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const service = data.service;
          
          if (service) {
            // Check gallery first (new format)
            let thumbnail: { type: 'image' | 'video', url: string, thumbnail?: string } | null = null;
            
            if (service.gallery && Array.isArray(service.gallery) && service.gallery.length > 0) {
              const firstItem = service.gallery[0];
              if (firstItem.type === 'video' && firstItem.url) {
                thumbnail = {
                  type: 'video',
                  url: firstItem.url,
                  thumbnail: firstItem.thumbnail
                };
              } else if (firstItem.type === 'image' && firstItem.url) {
                thumbnail = {
                  type: 'image',
                  url: firstItem.url
                };
              }
            }
            
            // Fallback to legacy format
            if (!thumbnail) {
              if (service.videos && Array.isArray(service.videos) && service.videos.length > 0) {
                const firstVideo = service.videos[0];
                thumbnail = {
                  type: 'video',
                  url: firstVideo.url || firstVideo,
                  thumbnail: firstVideo.thumbnail
                };
              } else if (service.images && Array.isArray(service.images) && service.images.length > 0) {
                thumbnail = {
                  type: 'image',
                  url: service.images[0]
                };
              } else if (service.image) {
                thumbnail = {
                  type: 'image',
                  url: service.image
                };
              }
            }
            
            if (thumbnail) {
              setServiceThumbnails(prev => ({
                ...prev,
                [currentOrder.id]: thumbnail!
              }));
            }
          }
        }
      } catch (error) {
        // Silently fail - will use fallback image
      }
    };
    
    fetchServiceThumbnail();
  }, [currentOrder?.id, (currentOrder?.items?.[0] as any)?.serviceId || currentOrder?.items?.[0]?.id]);

  const timelineEvents = useMemo(
    () => (currentOrder ? buildProfessionalTimeline(currentOrder as any) : []),
    [currentOrder]
  );

  // Effective expected delivery: use extended date when extension was approved
  const effectiveExpectedDelivery = useMemo(() => {
    if (!currentOrder) return undefined;
    if ((currentOrder as any).extensionRequest?.status === 'approved' && (currentOrder as any).extensionRequest?.newDeliveryDate) {
      const d = (currentOrder as any).extensionRequest.newDeliveryDate;
      return typeof d === 'string' ? d : new Date(d).toISOString();
    }
    return currentOrder.expectedDelivery;
  }, [currentOrder]);

  // Calculate appointment deadline for countdown
  // Priority: effective expected delivery > booking date/time > scheduled date
  const appointmentDeadline = useMemo(() => {
    if (!currentOrder) return null;
    
    // First priority: effective expected delivery (includes extended date when extension approved)
    if (effectiveExpectedDelivery) {
      return new Date(effectiveExpectedDelivery);
    }
    
    // Second priority: booking date/time
    const bookingDate = currentOrder.booking?.date;
    const bookingTime = currentOrder.booking?.starttime || currentOrder.booking?.timeSlot || "09:00";
    
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
    
    return null;
  }, [currentOrder, effectiveExpectedDelivery]);

  // Countdown hook for appointment time (before order is accepted)
  const appointmentCountdown = useCountdown(appointmentDeadline);

  // Offer response deadline (for "offer created" status - custom offer awaiting client response)
  const offerResponseDeadline = useMemo(() => {
    if (!currentOrder || currentOrder.status !== 'offer created') return null;
    const rd = (currentOrder as any).metadata?.responseDeadline;
    return rd ? new Date(rd) : null;
  }, [currentOrder]);
  const offerResponseCountdown = useCountdown(offerResponseDeadline);

  // Extension request: countdown to new delivery date (when extension is pending)
  const extensionDeadline = useMemo(() => {
    if (!currentOrder?.extensionRequest?.newDeliveryDate) return null;
    if ((currentOrder as any).extensionRequest?.status !== 'pending') return null;
    return new Date((currentOrder as any).extensionRequest.newDeliveryDate);
  }, [currentOrder]);
  const extensionCountdown = useCountdown(extensionDeadline);

  // Elapsed time since order was accepted (work in progress timer)
  // Priority: expectedDelivery (selected at order time) > booking date/time > scheduled date
  const workStartTime = useMemo(() => {
    if (!currentOrder) return null;
    // Stop timer for completed or cancelled orders
    if (currentOrder.status === "Completed" || currentOrder.status === "Cancelled" || currentOrder.status === "Cancellation Pending") return null;

    // If a revision is in progress, restart from respondedAt
    const revisionRequests = currentOrder.revisionRequest 
      ? (Array.isArray(currentOrder.revisionRequest) ? currentOrder.revisionRequest : [currentOrder.revisionRequest])
      : [];
    const inProgressRevision = revisionRequests.find(rr => rr && rr.status === "in_progress");
    if (inProgressRevision && inProgressRevision.respondedAt) {
      return new Date(inProgressRevision.respondedAt);
    }

    // First priority: effective expected delivery (includes extended date when extension approved)
    if (effectiveExpectedDelivery) {
      const start = new Date(effectiveExpectedDelivery);
      if (Date.now() >= start.getTime()) return start;
    }

    // Second priority: Auto-start work timer when scheduled booking time arrives
    const bookingDate = currentOrder.booking?.date;
    const bookingTime = currentOrder.booking?.starttime || currentOrder.booking?.timeSlot || "09:00";
    if (bookingDate) {
      const [hours, minutes] = bookingTime.split(":").map(Number);
      const start = new Date(bookingDate);
      if (!isNaN(hours)) start.setHours(hours);
      if (!isNaN(minutes)) start.setMinutes(minutes);
      if (Date.now() >= start.getTime()) return start;
    }

    // Fallback: scheduled date
    if (currentOrder.scheduledDate) {
      const start = new Date(currentOrder.scheduledDate);
      if (Date.now() >= start.getTime()) return start;
    }

    return null;
  }, [currentOrder, effectiveExpectedDelivery]);

  // Calculate pause time (when work was delivered)
  const pauseTime = useMemo(() => {
    if (!currentOrder) return null;
    // Pause when work is delivered (but not if revision is in progress)
    const revisionRequests = currentOrder.revisionRequest 
      ? (Array.isArray(currentOrder.revisionRequest) ? currentOrder.revisionRequest : [currentOrder.revisionRequest])
      : [];
    const hasInProgressRevision = revisionRequests.some(rr => rr && rr.status === "in_progress");
    if ((currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0) && 
        !hasInProgressRevision &&
        currentOrder.deliveredDate) {
      return new Date(currentOrder.deliveredDate);
    }
    return null;
  }, [currentOrder]);

  // Calculate resume time (when revision was accepted)
  const resumeTime = useMemo(() => {
    if (!currentOrder) return null;
    // Resume when revision is accepted (in_progress)
    const revisionRequests = currentOrder.revisionRequest 
      ? (Array.isArray(currentOrder.revisionRequest) ? currentOrder.revisionRequest : [currentOrder.revisionRequest])
      : [];
    const inProgressRevision = revisionRequests.find(rr => rr && rr.status === "in_progress");
    if (inProgressRevision && inProgressRevision.respondedAt) {
      return new Date(inProgressRevision.respondedAt);
    }
    return null;
  }, [currentOrder]);

  const workElapsedTime = useElapsedTime(workStartTime, pauseTime, resumeTime);

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
      const isPendingOrAccepted = currentOrder.status === "In Progress" && (!currentOrder.deliveryFiles || currentOrder.deliveryFiles.length === 0);
      
      if (isPendingOrAccepted && !shownServiceTimeToasts.has(orderId)) {
        toast.success("Service Time Has Arrived!", {
          description: "The scheduled appointment time has arrived. You can now start working on the service.",
          duration: 8000,
        });
        setShownServiceTimeToasts(prev => new Set(prev).add(orderId));
      }
    }
  }, [currentOrder, appointmentDeadline, appointmentCountdown.expired, shownServiceTimeToasts]);

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
      const revisionRequests = currentOrder?.revisionRequest 
        ? (Array.isArray(currentOrder.revisionRequest) ? currentOrder.revisionRequest : [currentOrder.revisionRequest])
        : [];
      const hasInProgressRevision = revisionRequests.some(rr => rr && rr.status === 'in_progress');
      if (hasInProgressRevision) {
        closeAllModals();
        setDeliveryMessage("");
        setDeliveryFiles([]);
        toast.promise(
          completeRevision(selectedOrder, deliveryMessage, deliveryFiles.length > 0 ? deliveryFiles : undefined),
          { loading: "Processing...", success: "Revision completed and delivered successfully!", error: (e: any) => e.message || "Failed to complete revision" }
        );
      } else {
        closeAllModals();
        setDeliveryMessage("");
        setDeliveryFiles([]);
        toast.promise(
          deliverWork(selectedOrder, deliveryMessage, deliveryFiles.length > 0 ? deliveryFiles : undefined),
          { loading: "Processing...", success: "Order marked as delivered! Client will be notified.", error: (e: any) => e.message || "Failed to mark order as delivered" }
        );
      }
    }
  };

  const handleRequestExtension = async () => {
    if (!selectedOrder) return;

    if (!extensionNewDate) {
      toast.error("Please select a new delivery date");
      return;
    }

    const newDeliveryDateTime = `${extensionNewDate}T${extensionNewTime}`;
    closeAllModals();
    setExtensionNewDate("");
    setExtensionNewTime("09:00");
    setExtensionReason("");
    toast.promise(
      requestExtension(selectedOrder, newDeliveryDateTime, extensionReason || undefined),
      { loading: "Processing...", success: "Extension request submitted. The client will be notified.", error: (e: any) => e.message || "Failed to request extension" }
    );
  };

  const handleProfessionalComplete = async () => {
    if (!selectedOrder) return;
    if (!completionMessage.trim() && completionFiles.length === 0) {
      toast.error("Please add a completion message or upload verification files");
      return;
    }
    closeAllModals();
    setCompletionMessage("");
    setCompletionFiles([]);
    toast.promise(
      professionalComplete(selectedOrder, completionMessage || undefined, completionFiles.length > 0 ? completionFiles : undefined),
      { loading: "Processing...", success: "Completion request submitted. Waiting for client approval.", error: (e: any) => e.message || "Failed to submit completion request" }
    );
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

  const handleRespondToRevision = () => {
    if (!selectedOrder) return;
    closeAllModals();
    setRevisionAdditionalNotes("");
    toast.promise(
      respondToRevision(selectedOrder, revisionResponseAction, revisionAdditionalNotes || undefined),
      { loading: "Processing...", success: `Revision request ${revisionResponseAction}ed successfully`, error: (e: any) => e.message || `Failed to ${revisionResponseAction} revision request` }
    );
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
      const orderId = selectedOrder;
      closeAllModals();
      setCancelReason("");
      setSelectedOrder(null);
      cancelOrder(orderId);
      toast.success("Order has been cancelled");
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
    const orderAmount = selectedOrder ? (orders.find(o => o.id === selectedOrder)?.amountValue || 0) : 0;
    
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
    
    if (selectedOrder) {
      const order = orders.find(o => o.id === selectedOrder);
      // Check if order is delivered
      if (order?.status !== 'In Progress' && (!order?.deliveryFiles || order.deliveryFiles.length === 0)) {
        toast.error("Disputes can only be opened for delivered orders");
        return;
      }
      
      const reqs = disputeRequirements;
      const unmet = disputeUnmetRequirements;
      const offer = disputeOfferAmount;
      const files = disputeEvidenceFiles;
      closeAllModals();
      setDisputeRequirements("");
      setDisputeUnmetRequirements("");
      setDisputeEvidenceFiles([]);
      setDisputeOfferAmount("");
      toast.promise(
        (async () => {
          const formData = new FormData();
          formData.append('requirements', reqs);
          formData.append('unmetRequirements', unmet);
          formData.append('offerAmount', offer);
          files.forEach((file) => formData.append('evidenceFiles', file));

          const response = await fetch(resolveApiUrl(`/api/orders/${selectedOrder}/dispute`), {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create dispute');
          }

          const data = await response.json();
          refreshOrders();
          navigate(`/dispute/${data.disputeId}`);
          return data;
        })(),
        { loading: "Processing...", success: "Dispute has been created", error: (e: any) => e.message || "Failed to create dispute" }
      );
    }
  };

  const handleRespondToDispute = () => {
    if (!selectedOrder) return;
    closeAllModals();
    setDisputeResponseMessage("");
    toast.promise(
      respondToDispute(selectedOrder, disputeResponseMessage || undefined),
      { loading: "Processing...", success: "Dispute response submitted successfully", error: (e: any) => e.message || "Failed to respond to dispute" }
    );
  };

  const handleRequestCancellation = (files?: File[]) => {
    if (!selectedOrder) return;
    closeAllModals();
    setCancellationReason("");
    toast.promise(
      requestCancellation(selectedOrder, cancellationReason, files),
      { loading: "Processing...", success: "Cancellation request submitted. Waiting for response.", error: (e: any) => e.message || "Failed to request cancellation" }
    );
  };

  const handleRespondToCancellation = (action: 'approve' | 'reject', reason?: string) => {
    if (!selectedOrder) return;
    closeAllModals();
    toast.promise(
      respondToCancellation(selectedOrder, action, reason),
      { loading: "Processing...", success: `Cancellation request ${action}d successfully`, error: (e: any) => e.message || `Failed to ${action} cancellation request` }
    );
  };

  const handleAcceptCancellation = () => {
    if (!selectedOrder) return;
    closeAllModals();
    toast.promise(
      respondToCancellation(selectedOrder, 'approve'),
      { loading: "Processing...", success: "Cancellation request approved. Order has been cancelled.", error: (e: any) => e.message || "Failed to accept cancellation request" }
    );
  };

  const handleWithdrawCancellation = () => {
    if (!selectedOrder) return;
    closeAllModals();
    toast.promise(
      withdrawCancellation(selectedOrder),
      { loading: "Processing...", success: "Cancellation request withdrawn. The order will continue as normal.", error: (e: any) => e.message || "Failed to withdraw cancellation request" }
    );
  };

  const handleRejectCancellation = () => {
    if (!selectedOrder) return;
    closeAllModals();
    toast.promise(
      respondToCancellation(selectedOrder, 'reject'),
      { loading: "Processing...", success: "Cancellation request rejected. Order will continue.", error: (e: any) => e.message || "Failed to reject cancellation request" }
    );
  };

  const handleRequestArbitration = () => {
    if (!selectedOrder) return;
    toast.promise(
      requestArbitration(selectedOrder),
      { loading: "Processing...", success: "Arbitration requested successfully. Admin will review the case.", error: (e: any) => e.message || "Failed to request arbitration" }
    );
  };

  const handleCancelDispute = () => {
    if (!selectedOrder) return;
    toast.promise(
      cancelDispute(selectedOrder),
      { loading: "Processing...", success: "Dispute cancelled successfully", error: (e: any) => e.message || "Failed to cancel dispute" }
    );
  };

  const handleWithdrawOffer = () => {
    const offerId = (currentOrder as any)?.metadata?.customOfferId;
    if (!offerId) {
      toast.error("Offer not found");
      return;
    }
    closeAllModals();
    toast.promise(
      fetch(resolveApiUrl(`/api/custom-offers/${offerId}/withdraw`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to withdraw offer');
        }
        refreshOrders();
        const clientId = (currentOrder as any)?.clientId;
        if (clientId) refreshMessages(clientId);
      }),
      { loading: "Processing...", success: "Offer withdrawn successfully", error: (e: any) => e.message || "Failed to withdraw offer" }
    );
  };

  const renderOrderCard = (order: any) => (
    <div
      key={order.id}
      className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow"
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

      {/* Client Info */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-10 h-10">
          {resolveAvatarUrl(order.clientAvatar) && (
            <AvatarImage src={resolveAvatarUrl(order.clientAvatar)} />
          )}
          <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[14px]">
            {getTwoLetterInitials(order.client, "C")}
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
            {(order.booking?.starttime || order.booking?.timeSlot) && ` - ${order.booking.starttime || order.booking.timeSlot}${order.booking?.endtime && order.booking.endtime !== order.booking.starttime ? ` - ${order.booking.endtime}` : ''}${order.booking?.timeSlot && order.booking.starttime ? ` (${order.booking.timeSlot})` : ''}`}
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
        {/* Timer - Show when status is "In Progress" and no delivery files exist yet */}
        {currentOrder.status === "In Progress" && (!currentOrder.deliveryFiles || currentOrder.deliveryFiles.length === 0) && (
          <>
            {/* Countdown Timer - Until booked time */}
            {!workElapsedTime.started && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
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
                      {effectiveExpectedDelivery
                        ? (() => {
                            const d = new Date(effectiveExpectedDelivery);
                            const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                            const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                            return `${dateStr} ${timeStr}`;
                          })()
                        : currentOrder.booking?.date
                          ? `${formatDate(currentOrder.booking.date)} ${currentOrder.booking?.starttime || currentOrder.booking?.timeSlot || ''}`
                          : currentOrder.scheduledDate
                            ? formatDate(currentOrder.scheduledDate)
                            : appointmentDeadline
                              ? formatDate(appointmentDeadline.toISOString())
                              : "TBD"}
                    </p>
                  </div>
                </div>

                {/* Countdown Display */}
                <div className="grid grid-cols-4 gap-3">
                  {/* Days */}
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                      {String(appointmentCountdown.days).padStart(2, '0')}
                    </div>
                    <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                      Days
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                      {String(appointmentCountdown.hours).padStart(2, '0')}
                    </div>
                    <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                      Hours
                    </div>
                  </div>

                  {/* Minutes */}
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                      {String(appointmentCountdown.minutes).padStart(2, '0')}
                    </div>
                    <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                      Minutes
                    </div>
                  </div>

                  {/* Seconds */}
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
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
            {workElapsedTime.started && (
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
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.days).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.hours).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.minutes).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 uppercase tracking-wider mt-1">
                  Minutes
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
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
        )}
      </>
    );
    return (
      <div>
          {!showDisputeSection && (
            <>
          <ProfessionalOrderDetailHeader
            order={currentOrder}
            onBack={handleBackToList}
          />

          {/* Main Layout - Left Content + Right Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Main Content (Tabs) */}
            <div className="lg:col-span-2">
        <div className="hidden"></div>

        {/* Tabs Section */}
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
                  order={currentOrder}
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
                  onRespondToRevision={(action) => {
                    closeAllModals();
                    toast.promise(
                      respondToRevision(currentOrder.id, action),
                      { loading: "Processing...", success: action === 'accept' ? "Revision accepted. Work resumed." : "Revision rejected.", error: (e: any) => e.message || "Failed to respond to revision" }
                    );
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
                  offerResponseDeadline={offerResponseDeadline}
                  offerResponseCountdown={offerResponseCountdown}
                  onWithdrawOffer={() => setIsWithdrawOfferConfirmOpen(true)}
                  extensionCountdown={extensionCountdown}
                  effectiveExpectedDelivery={effectiveExpectedDelivery}
                />
              </TabsContent>

              {/* Old Timeline Tab Content - REMOVED - All content moved to ProfessionalOrderTimelineTab component */}

              {/* Details Tab */}
              <TabsContent value="details" className="mt-4 md:mt-6 px-4 md:px-6">
                <ProfessionalOrderDetailsTab order={currentOrder} />
              </TabsContent>

              {/* Additional Info Tab */}
              <TabsContent value="additional-info" className="mt-4 md:mt-6 space-y-4 md:space-y-6 px-4 md:px-6">
                <ProfessionalOrderAdditionalInfoTab order={currentOrder} />
              </TabsContent>

              {/* Delivery Tab */}
              <TabsContent value="delivery" className="mt-4 md:mt-6 px-4 md:px-6">
                <ProfessionalOrderDeliveryTab
                  order={currentOrder}
                  onOpenReviewModal={() => {
                    openModal('professionalReview');
                    setBuyerRating(0);
                    setBuyerReview("");
                    setHasSubmittedBuyerReview(false);
                    setClientReviewData(null);
                  }}
                  onStartConversation={startConversation}
                />
                {currentOrder.address && (
                  <ProfessionalOrderServiceAddressSection order={currentOrder} />
                )}
                {currentOrder.status === "Completed" && (
                  <ProfessionalOrderDeliveryCompletionSection
                    order={currentOrder}
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
              order={currentOrder}
              serviceThumbnail={serviceThumbnails[currentOrder.id]}
              onStartConversation={startConversation}
              onOpenDeliveryModal={() => openModal('delivery')}
              onOpenDisputeModal={() => openModal('dispute')}
              onOpenCancellationRequest={() => {
                setCancellationReason("");
                openModal('cancellationRequest');
              }}
            />
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

                    {/* Messages */}
                    <div className="space-y-4">
                      {dispute.messages.map((msg, index) => {
                        const isMsgClaimant = msg.userId === dispute.claimantId;
                        const showDeadline = index === dispute.messages.length - 1 && isMsgClaimant;

                        return (
                          <div key={msg.id} className={`border rounded-lg p-4 ${showDeadline ? 'bg-orange-50 border-orange-200' : 'border-gray-200'}`}>
                            <div className="flex gap-3">
                              <Avatar className="w-12 h-12 flex-shrink-0">
                                {resolveAvatarUrl(msg.userAvatar) && (
                                  <AvatarImage src={resolveAvatarUrl(msg.userAvatar)} />
                                )}
                                <AvatarFallback className="bg-[#3D78CB] text-white">
                                  {getTwoLetterInitials(msg.userName, "U")}
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
                  <div className="bg-white rounded-lg p-6 text-center">
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
        <DeliveryDialog
          open={isDeliveryDialogOpen}
          onOpenChange={(open) => {
	          // Avoid openModal() here (it calls closeAllModals()) because Radix calls
	          // onOpenChange(true) when we programmatically open the dialog.
	          // Opening is controlled via openModal('delivery') from buttons.
	          if (!open) closeAllModals();
          }}
          deliveryMessage={deliveryMessage}
          onDeliveryMessageChange={setDeliveryMessage}
          deliveryFiles={deliveryFiles}
          onDeliveryFilesChange={setDeliveryFiles}
          onSubmit={handleMarkAsDelivered}
          isRevisionCompletion={(() => {
            const revisionRequests = currentOrder?.revisionRequest 
              ? (Array.isArray(currentOrder.revisionRequest) ? currentOrder.revisionRequest : [currentOrder.revisionRequest])
              : [];
            return revisionRequests.some(rr => rr && rr.status === 'in_progress');
          })()}
        />

        {/* Extension Request Dialog */}
        <ExtensionDialog
          open={isExtensionDialogOpen}
          onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('extension')
	          if (!open) closeAllModals();
          }}
          extensionNewDate={extensionNewDate}
          onExtensionNewDateChange={setExtensionNewDate}
          extensionNewTime={extensionNewTime}
          onExtensionNewTimeChange={setExtensionNewTime}
          extensionReason={extensionReason}
          onExtensionReasonChange={setExtensionReason}
          currentOrder={currentOrder}
          onSubmit={handleRequestExtension}
          onCancel={() => {
            closeAllModals();
            setExtensionNewDate("");
            setExtensionNewTime("09:00");
            setExtensionReason("");
          }}
        />

        {/* Completion Request Dialog */}
        <CompletionDialog
          open={isCompletionDialogOpen}
          onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('completion')
	          if (!open) closeAllModals();
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

	      {/* Professional Review Dialog - Review Buyer */}
	      <Dialog
	        open={isProfessionalReviewDialogOpen}
	        onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('professionalReview')
	          if (!open) closeAllModals();
	        }}
	      >
          <DialogContent className="w-[48vw] min-w-[280px] sm:max-w-[280px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="sr-only shrink-0">
              <DialogTitle>Leave Public Review</DialogTitle>
              <DialogDescription>Review your experience with this buyer</DialogDescription>
            </DialogHeader>

            {!currentOrder ? (
              <div className="p-8 text-center">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Loading order details...
                </p>
              </div>
            ) : currentOrder.professionalReview || hasSubmittedBuyerReview ? (
              <div className="flex flex-col overflow-y-auto overscroll-contain min-h-0">
            <div className="bg-blue-50 border-b border-blue-200 p-4 shrink-0">
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
            <div className="flex flex-col p-4 sm:p-6 space-y-6">
                <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[24px] text-[#3D5A80] font-medium">
                  Your Review of the Buyer
                </h2>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">Rating</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= (currentOrder.professionalReview?.rating || buyerRating || 0)
                              ? "fill-[#FE8A0F] text-[#FE8A0F]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-semibold ml-2">
                      {currentOrder.professionalReview?.rating || buyerRating || 0}/5
                    </span>
                  </div>
                </div>

                {(currentOrder.professionalReview?.comment || buyerReview) && (
                  <div>
                    <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold mb-2">Your Review</h4>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        {resolveAvatarUrl(currentOrder.professionalAvatar) && (
                          <AvatarImage src={resolveAvatarUrl(currentOrder.professionalAvatar)} />
                        )}
                        <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[14px]">
                          {getTwoLetterInitials(currentOrder.professional, "P")}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] whitespace-pre-wrap flex-1 min-w-0 mt-2">
                        {currentOrder.professionalReview?.comment || buyerReview}
                      </p>
                    </div>
                  </div>
                )}

                {(clientReviewData || currentOrder.rating) && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-['Poppins',sans-serif] text-[15px] text-green-700 font-semibold mb-3">Client&apos;s Review</h4>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        {resolveAvatarUrl(clientReviewData?.reviewer?.avatar || currentOrder.clientAvatar) && (
                          <AvatarImage src={resolveAvatarUrl(clientReviewData?.reviewer?.avatar || currentOrder.clientAvatar)} />
                        )}
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getTwoLetterInitials(clientReviewData?.reviewer?.name || currentOrder.client, "C")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mb-1">
                          {clientReviewData?.reviewer?.name || currentOrder.client || "Client"}
                        </p>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (clientReviewData?.rating || currentOrder.rating || 0)
                                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {(clientReviewData?.comment || currentOrder.review) && (
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            &quot;{clientReviewData?.comment || currentOrder.review}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Professional's Response Section */}
                    <div className="mt-4 pt-4 border-t border-green-300">
                      {currentOrder.professionalResponse ? (
                        <div>
                          <h5 className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-semibold mb-2">
                            {currentOrder.professional || "MatJohn LTD"}&apos;s Response
                          </h5>
                          <div className="bg-white border border-green-200 rounded-lg p-3">
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] whitespace-pre-wrap">
                              {currentOrder.professionalResponse}
                            </p>
                            {currentOrder.professionalResponseDate && (
                              <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-2">
                                {new Date(currentOrder.professionalResponseDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-2 block">
                            Respond to the Feedback (Public)
                          </label>
                          <textarea
                            value={reviewResponse}
                            onChange={(e) => setReviewResponse(e.target.value)}
                            placeholder="Your respond..."
                            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg font-['Poppins',sans-serif] text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={4}
                          />
                          <Button
                            onClick={handleSubmitReviewResponse}
                            disabled={!reviewResponse.trim() || isSubmittingResponse}
                            className="mt-3 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[13px]"
                          >
                            {isSubmittingResponse ? "Submitting..." : "Submit Response"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] italic">
                  Reviews can only be submitted once and cannot be edited.
                </p>

                <div className="mt-4 pt-6 border-t border-gray-200 space-y-4">
                  {currentOrder?.serviceImage && (
                    <div className="rounded-lg overflow-hidden bg-gray-900">
                      {isVideoFile(currentOrder.serviceImage) ? (
                        <video
                          src={resolveFileUrl(currentOrder.serviceImage)}
                          className="w-full h-36 object-cover"
                          controls
                          playsInline
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img src={resolveFileUrl(currentOrder.serviceImage)} alt={currentOrder.service} className="w-full h-36 object-cover" />
                      )}
                    </div>
                  )}
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium italic">{currentOrder?.service || "Service"}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Status</span>
                      <Badge className="bg-green-100 text-green-700 border-green-200 font-['Poppins',sans-serif] text-[12px]">Completed</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Order</span>
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">#{currentOrder?.id?.substring(0, 15) || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ) : (
            <div className="flex flex-col overflow-y-auto overscroll-contain min-h-0">
            <div className="flex flex-col p-4 sm:p-6 space-y-6">
                <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[24px] text-[#3D5A80] font-medium">
                  Leave Public Review
                </h2>

                {/* Client Review Info */}
                {currentOrder?.rating ? (
                  <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <Avatar className="w-10 h-10">
                      {resolveAvatarUrl(currentOrder.clientAvatar) && (
                        <AvatarImage src={resolveAvatarUrl(currentOrder.clientAvatar)} />
                      )}
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getTwoLetterInitials(currentOrder.client, "C")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mt-2">
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
                        maxLength={100}
                        className="font-['Poppins',sans-serif] text-[14px] border-gray-300 focus:border-[#3D78CB] resize-none"
                      />
                      <p className="text-xs text-gray-500 text-right mt-2">
                        {buyerReview.length}/100 characters
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          if (buyerRating === 0) {
                            toast.error("Please select a rating");
                            return;
                          }
                          closeAllModals();
                          setHasSubmittedBuyerReview(true);
                          toast.promise(
                            (async () => {
                              const response = await fetch(resolveApiUrl(`/api/orders/${selectedOrder}/buyer-review`), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ rating: buyerRating, comment: buyerReview }),
                              });
                              if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || 'Failed to submit review');
                              }
                              refreshOrders(); // fire-and-forget – don't block toast
                              fetch(resolveApiUrl(`/api/orders/${selectedOrder}/review`), { credentials: 'include' })
                                .then(res => res.ok ? res.json() : null)
                                .then(data => data?.review && setClientReviewData(data.review));
                            })(),
                            { loading: "Processing...", success: "Review submitted successfully!", error: (e: any) => e.message || "Failed to submit review" }
                          );
                        }}
                        disabled={buyerRating === 0}
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
                        {resolveAvatarUrl(clientReviewData.reviewer?.avatar) && (
                          <AvatarImage src={resolveAvatarUrl(clientReviewData.reviewer?.avatar)} />
                        )}
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getTwoLetterInitials(clientReviewData.reviewer?.name, "C")}
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
                      Thank you for your review! The client hasn&apos;t submitted their review yet.
                    </p>
                  </div>
                )}

                {/* Order Summary - single column */}
                <div className="mt-4 pt-6 border-t border-gray-200 space-y-4">
                  <div className="flex gap-4 items-center">
                    {currentOrder?.items?.[0]?.image && (
                      <div className="rounded-lg overflow-hidden w-[50px] h-[50px] flex-shrink-0 bg-gray-900">
                        {isVideoFile(currentOrder.items[0].image) ? (
                          <video
                            src={resolveFileUrl(currentOrder.items[0].image)}
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <img src={resolveFileUrl(currentOrder.items[0].image)} alt={currentOrder.service} className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                    <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium italic">{currentOrder?.service || "Service"}</h3>
                  </div>

                  
                  <div className="flex gap-6 w-full">

                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Status</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-['Poppins',sans-serif] text-[12px]">Completed</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Order</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">#{currentOrder?.id?.substring(0, 15) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Order Date</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          {currentOrder?.date ? new Date(currentOrder.date).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Quantity</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">{currentOrder?.quantity || 1}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Price</span>
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">{currentOrder?.amount || "N/A"}</span>
                      </div>
                    </div>
                    {currentOrder?.address && (
                      <div className="border-gray-200 flex-2">
                        <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-semibold mb-2">Task Address</h4>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          {typeof currentOrder.address === 'string' 
                            ? currentOrder.address 
                            : (
                              <>
                                {currentOrder.address.name && <>{currentOrder.address.name}<br /></>}
                                {currentOrder.address.addressLine1}
                                {currentOrder.address.addressLine2 && <>, {currentOrder.address.addressLine2}</>}
                                <br />
                                {currentOrder.address.city && <>{currentOrder.address.city}, </>}
                                {currentOrder.address.postcode}
                                {currentOrder.address.phone && (<> <br /> Tel: {currentOrder.address.phone} </>)}
                              </>
                            )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}
          </DialogContent>
        </Dialog>

	      {/* Delivery Dialog */}
	      <Dialog
	        open={isDeliveryDialogOpen}
	        onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('delivery')
	          if (!open) closeAllModals();
	        }}
	      >
          <DialogContent className="w-[45vw] min-w-[280px] max-w-[320px]">
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
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
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
                    closeAllModals();
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
        <DisputeDialog
          open={isDisputeDialogOpen}
          onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('dispute')
	          if (!open) closeAllModals();
          }}
          disputeRequirements={disputeRequirements}
          onDisputeRequirementsChange={setDisputeRequirements}
          disputeUnmetRequirements={disputeUnmetRequirements}
          onDisputeUnmetRequirementsChange={setDisputeUnmetRequirements}
          disputeEvidenceFiles={disputeEvidenceFiles}
          onDisputeEvidenceFilesChange={setDisputeEvidenceFiles}
          disputeOfferAmount={disputeOfferAmount}
          onDisputeOfferAmountChange={setDisputeOfferAmount}
          currentOrder={currentOrder}
          onSubmit={handleCreateDispute}
          onCancel={() => {
            closeAllModals();
            setDisputeRequirements("");
            setDisputeUnmetRequirements("");
            setDisputeEvidenceFiles([]);
            setDisputeOfferAmount("");
          }}
        />

        {/* Cancellation Request Dialog */}
        <CancellationRequestDialog
          open={isCancellationRequestDialogOpen}
          onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('cancellationRequest')
	          if (!open) closeAllModals();
          }}
          cancellationReason={cancellationReason}
          onCancellationReasonChange={setCancellationReason}
          onSubmit={handleRequestCancellation}
          onCancel={() => {
            closeAllModals();
            setCancellationReason("");
          }}
        />

        {/* Dispute Response Dialog */}
        <DisputeResponseDialog
          open={isDisputeResponseDialogOpen}
          onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('disputeResponse')
	          if (!open) closeAllModals();
          }}
          disputeResponseMessage={disputeResponseMessage}
          onDisputeResponseMessageChange={setDisputeResponseMessage}
          onSubmit={handleRespondToDispute}
          onCancel={() => {
            closeAllModals();
            setDisputeResponseMessage("");
          }}
        />

        {/* Revision Response Dialog */}
        <RevisionResponseDialog
          open={isRevisionResponseDialogOpen}
          onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('revisionResponse')
	          if (!open) closeAllModals();
          }}
          revisionResponseAction={revisionResponseAction}
          revisionAdditionalNotes={revisionAdditionalNotes}
          onRevisionAdditionalNotesChange={setRevisionAdditionalNotes}
          currentOrder={currentOrder}
          onSubmit={handleRespondToRevision}
          onCancel={() => {
            closeAllModals();
            setRevisionAdditionalNotes("");
          }}
        />

        {/* Withdraw Cancellation Request Dialog – confirmation only */}
        <WithdrawCancellationDialog
          open={isWithdrawCancellationDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeAllModals();
          }}
          onSubmit={handleWithdrawCancellation}
          onCancel={closeAllModals}
        />

        {/* Accept Cancellation Request Confirmation Dialog */}
        <Dialog
          open={isAcceptCancellationDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeAllModals();
          }}
        >
          <DialogContent className="w-[400px] sm:max-w-[400px]">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-10 h-10 rounded-full border-4 border-[#16a34a] flex items-center justify-center mb-6">
                <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
              </div>
              <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] font-semibold mb-3">
                Accept Cancellation Request?
              </h2>
              <p className="font-['Poppins',sans-serif] text-[15px] text-[#6b6b6b] mb-6">
                This will cancel the order and refund the client.
              </p>
              <div className="flex gap-3 w-full justify-center">
                <Button
                  variant="outline"
                  onClick={() => closeAllModals()}
                  className="font-['Poppins',sans-serif] text-[14px] px-6 border-[#16a34a] text-[#16a34a] hover:bg-green-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAcceptCancellation}
                  className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif] text-[14px] px-6"
                >
                  Yes, Accept
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Cancellation Request Dialog – confirmation only */}
        <RejectCancellationDialog
          open={isRejectCancellationDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeAllModals();
          }}
          onSubmit={handleRejectCancellation}
          onCancel={closeAllModals}
        />

        {/* Withdraw Offer Confirmation Dialog */}
        <Dialog open={isWithdrawOfferConfirmOpen} onOpenChange={setIsWithdrawOfferConfirmOpen}>
          <DialogContent className="w-[400px] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
                Withdraw Offer
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Are you sure you want to withdraw this custom offer? The associated order will be removed. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setIsWithdrawOfferConfirmOpen(false)}
                className="font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsWithdrawOfferConfirmOpen(false);
                  handleWithdrawOffer();
                }}
                variant="destructive"
                className="font-['Poppins',sans-serif]"
              >
                Yes, Withdraw
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Otherwise show the order list
  return (
    <>
      <ProfessionalOrderList
        orders={orders}
        allOrders={allOrders}
        inProgressOrders={inProgressOrders}
        completedOrders={completedOrders}
        cancelledOrders={cancelledOrders}
        disputedOrders={disputedOrders}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        onViewOrder={handleViewOrder}
        onStartConversation={startConversation}
      />
    </>
  );
}

export default ProfessionalOrdersSection;
