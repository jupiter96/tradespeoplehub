import { useState, useEffect, useMemo, useRef } from "react";
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
  PoundSterling,
  Paperclip,
  Play,
} from "lucide-react";

// Import separated order components
import { AddInfoDialog, getStatusLabel, getStatusLabelForTable } from "./orders";
import { resolveAvatarUrl } from "./orders/utils";
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

// Video Thumbnail Component with Play Button
function VideoThumbnail({
  videoUrl,
  thumbnail,
  fallbackImage,
  className = "",
  style = {},
}: {
  videoUrl: string;
  thumbnail?: string;
  fallbackImage?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set video to middle frame when metadata loads
  useEffect(() => {
    if (!videoRef.current || isPlaying) return;
    
    const video = videoRef.current;
    
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        // Seek to middle of video for thumbnail
        video.currentTime = video.duration / 2;
      }
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isPlaying]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        setIsPlaying(true);
        videoRef.current.play();
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleVideoEnd = () => {
    if (videoRef.current) {
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        videoRef.current.currentTime = videoRef.current.duration / 2;
      }
      setIsPlaying(false);
    }
  };

  // Resolve URLs for video and thumbnail
  const resolvedVideoUrl = videoUrl.startsWith("http") || videoUrl.startsWith("blob:") ? videoUrl : resolveApiUrl(videoUrl);
  const resolvedPoster = thumbnail ? (thumbnail.startsWith("http") || thumbnail.startsWith("blob:") ? thumbnail : resolveApiUrl(thumbnail)) : 
                       fallbackImage ? (fallbackImage.startsWith("http") || fallbackImage.startsWith("blob:") ? fallbackImage : resolveApiUrl(fallbackImage)) : undefined;

  return (
    <div className={`relative ${className}`} style={style}>
      <video
        ref={videoRef}
        src={resolvedVideoUrl}
        poster={resolvedPoster}
        className="w-full h-full object-cover object-center"
        style={{ minWidth: '100%', minHeight: '100%' }}
        muted
        playsInline
        loop
        onEnded={handleVideoEnd}
        onClick={handleVideoClick}
        preload="metadata"
      />
      
      {!isPlaying && (
        <button
          onClick={handlePlayClick}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group z-10"
          aria-label="Play video"
        >
          <div className="bg-white/90 group-hover:bg-white rounded-full p-2 shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-4 h-4 text-[#FE8A0F] fill-[#FE8A0F]" />
          </div>
        </button>
      )}
    </div>
  );
}

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
  const [serviceThumbnails, setServiceThumbnails] = useState<{[orderId: string]: { type: 'image' | 'video', url: string, thumbnail?: string }}>({});
  const [rating, setRating] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFiles, setCancelFiles] = useState<File[]>([]);
  const [review, setReview] = useState("");
  // Detailed rating categories
  const [communicationRating, setCommunicationRating] = useState(5);
  const [serviceAsDescribedRating, setServiceAsDescribedRating] = useState(5);
  const [buyAgainRating, setBuyAgainRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [showDisputeSection, setShowDisputeSection] = useState(false);
  const [disputeRequirements, setDisputeRequirements] = useState("");
  const [disputeUnmetRequirements, setDisputeUnmetRequirements] = useState("");
  const [disputeEvidenceFiles, setDisputeEvidenceFiles] = useState<File[]>([]);
  const [disputeOfferAmount, setDisputeOfferAmount] = useState("");
  const [isCancellationRequestDialogOpen, setIsCancellationRequestDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isRevisionRequestDialogOpen, setIsRevisionRequestDialogOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [revisionFiles, setRevisionFiles] = useState<File[]>([]);
  const [isDisputeResponseDialogOpen, setIsDisputeResponseDialogOpen] = useState(false);
  const [disputeResponseMessage, setDisputeResponseMessage] = useState("");
  const [isAddInfoDialogOpen, setIsAddInfoDialogOpen] = useState(false);
  const [isApproveConfirmDialogOpen, setIsApproveConfirmDialogOpen] = useState(false);
  const [approveOrderId, setApproveOrderId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Function to close all modals and reset related states
  const closeAllModals = () => {
    setIsRatingDialogOpen(false);
    setIsCancelDialogOpen(false);
    setIsDisputeDialogOpen(false);
    setIsCancellationRequestDialogOpen(false);
    setIsRevisionRequestDialogOpen(false);
    setIsDisputeResponseDialogOpen(false);
    setIsAddInfoDialogOpen(false);
    setIsApproveConfirmDialogOpen(false);
    setApproveOrderId(null);
    // Reset form states when closing modals
    setCancelReason("");
    setCancelFiles([]);
    setCancellationReason("");
    setRevisionReason("");
    setRevisionMessage("");
    setRevisionFiles([]);
    setDisputeResponseMessage("");
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
  // "Cancelled" tab shows both Cancelled and Cancellation Pending (same treatment)
  const getOrdersByStatus = (status: string) => {
    if (status === "all") return clientOrders;
    if (status === "Cancelled") {
      return clientOrders.filter(
        (o) => o.status === "Cancelled" || o.status === "Cancellation Pending"
      );
    }
    return clientOrders.filter((order) => order.status === status);
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
      case "Cancellation Pending":
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
      case "Cancellation Pending":
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

  // Check if a file is a video based on extension or URL
  const isVideoFile = (url?: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
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

 
    // Handle revision requests as array
    if (order.revisionRequest) {
      const revisionRequests = Array.isArray(order.revisionRequest) 
        ? order.revisionRequest 
        : [order.revisionRequest];
      
      revisionRequests.forEach((rr, index) => {
        if (rr && rr.status) {
          push(
            {
              at: rr.requestedAt,
              title: "Revision Requested",
              description: "You requested a modification to the delivered work.",
              message: rr.clientMessage || rr.reason,
              files: rr.clientFiles,
              colorClass: "bg-orange-500",
              icon: <AlertTriangle className="w-5 h-5 text-white" />,
            },
            `revision-requested-${rr.index || index + 1}`
          );
        }
      });
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

    // Group delivery files by deliveryNumber to identify separate deliveries
    // Each delivery is independent - files are grouped by deliveryNumber
    if (order.deliveryFiles && order.deliveryFiles.length > 0) {
      // Group files by deliveryNumber
      const deliveryGroupsMap = new Map<number, any[]>();
      order.deliveryFiles.forEach((file: any) => {
        const deliveryNum = file.deliveryNumber || 1;
        if (!deliveryGroupsMap.has(deliveryNum)) {
          deliveryGroupsMap.set(deliveryNum, []);
        }
        deliveryGroupsMap.get(deliveryNum)!.push(file);
      });
      
      // Sort files within each group by upload time
      deliveryGroupsMap.forEach((files, deliveryNum) => {
        files.sort((a: any, b: any) => {
          const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
          const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
          return aTime - bTime;
        });
      });
      
      // Parse delivery messages by [Delivery #N] markers
      // Format: "[Delivery #1]\nmessage1\n\n[Delivery #2]\nmessage2\n\n[Delivery #3]\nmessage3"
      // Or: "message1\n\n[Delivery #2]\nmessage2" (first delivery without marker)
      const deliveryMessagesMap = new Map<number, string>();
      
      if (order.deliveryMessage) {
        // Find all [Delivery #N] markers and their positions
        const markerRegex = /\[Delivery #(\d+)\]\n/g;
        const markers: Array<{ number: number; index: number; markerLength: number }> = [];
        let match;
        
        while ((match = markerRegex.exec(order.deliveryMessage)) !== null) {
          markers.push({
            number: parseInt(match[1], 10),
            index: match.index,
            markerLength: match[0].length // Length of "[Delivery #N]\n"
          });
        }
        
        if (markers.length === 0) {
          // No markers - entire message is delivery #1
          deliveryMessagesMap.set(1, order.deliveryMessage.trim());
        } else {
          // Extract messages between markers
          for (let i = 0; i < markers.length; i++) {
            const marker = markers[i];
            const nextMarker = markers[i + 1];
            const startIndex = marker.index + marker.markerLength; // After the marker
            const endIndex = nextMarker ? nextMarker.index : order.deliveryMessage.length;
            const message = order.deliveryMessage.substring(startIndex, endIndex).trim();
            // Remove leading/trailing newlines and separators
            const cleanMessage = message.replace(/^\n+|\n+$/g, '').trim();
            if (cleanMessage) {
              deliveryMessagesMap.set(marker.number, cleanMessage);
            }
          }
          
          // If first marker is not at the start, text before it is delivery #1
          if (markers[0].index > 0) {
            const firstMessage = order.deliveryMessage.substring(0, markers[0].index).trim();
            if (firstMessage) {
              deliveryMessagesMap.set(1, firstMessage);
            }
          }
        }
      }
      
      // Get all unique delivery numbers (from files and messages)
      const allDeliveryNumbers = Array.from(new Set([
        ...Array.from(deliveryGroupsMap.keys()),
        ...Array.from(deliveryMessagesMap.keys()),
        ...(deliveryGroupsMap.size === 0 && deliveryMessagesMap.size === 0 ? [1] : [])
      ])).sort((a, b) => a - b);
      
      // Create timeline event for each delivery
      allDeliveryNumbers.forEach((deliveryNum) => {
        const files = deliveryGroupsMap.get(deliveryNum) || [];
        const deliveryMessage = deliveryMessagesMap.get(deliveryNum) || '';
        const deliveryDate = files.length > 0 
          ? (files[0]?.uploadedAt || order.deliveredDate)
          : order.deliveredDate;
        
        push(
          {
            at: deliveryDate || order.deliveryFiles?.[0]?.uploadedAt,
            title: "Work Delivered",
            description: `${order.professional || "Professional"} delivered the work.`,
            message: deliveryMessage || undefined,
            files: files,
            colorClass: "bg-purple-500",
            icon: <Truck className="w-5 h-5 text-white" />,
          },
          `delivered-${deliveryNum}`
        );
      });
    } else if (order.deliveryMessage || order.deliveredDate) {
      // No message but has files - single delivery
      push(
        {
          at: order.deliveryFiles[0]?.uploadedAt || order.deliveredDate,
          title: "Work Delivered",
          description: `${order.professional || "Professional"} delivered the work.`,
          files: order.deliveryFiles,
          colorClass: "bg-purple-500",
          icon: <Truck className="w-5 h-5 text-white" />,
        },
        "delivered-1"
      );
    } else if (order.deliveredDate) {
      // Fallback: if no files but has message or deliveredDate, show single delivery event
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
        "delivered-1"
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
      if (order && order.status === "In Progress") {
        try {
          await requestCancellation(selectedOrder, cancelReason, cancelFiles.length > 0 ? cancelFiles : undefined);
          toast.success("Cancellation request submitted. Waiting for professional approval.");
          closeAllModals();
          setCancelReason("");
          setCancelFiles([]);
        } catch (error: any) {
          toast.error(error.message || "Failed to request cancellation");
        }
      } else {
        cancelOrder(selectedOrder);
        toast.success("Order has been cancelled");
        setIsCancelDialogOpen(false);
        setCancelReason("");
        setCancelFiles([]);
        setSelectedOrder(null);
      }
    }
  };

  const cancelFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleRequestCancellation = async (files?: File[]) => {
    if (!selectedOrder) return;
    try {
      await requestCancellation(selectedOrder, cancellationReason, files);
      toast.success("Cancellation request submitted. Waiting for response.");
      closeAllModals();
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
      closeAllModals();
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
      closeAllModals();
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

  // Open approve confirmation dialog (keep consistent with other modal flows)
  // We intentionally route this through closeAllModals() like Revision Request,
  // because several dialogs use onOpenChange -> closeAllModals(), which can
  // otherwise immediately close a newly-opened dialog.
  const handleAcceptDelivery = (orderId: string) => {
    // Ensure we stay in the correct order context
    setSelectedOrder(orderId);
    // Close any other open dialogs first
    closeAllModals();
    // Then open approve confirm
    setApproveOrderId(orderId);
    setIsApproveConfirmDialogOpen(true);
  };

  // Confirm and execute the approval
  const confirmApproveDelivery = async () => {
    if (!approveOrderId) return;

    setIsApproving(true);
    try {
      await acceptDelivery(approveOrderId);
      toast.success("Order completed! Funds have been released to the professional. You can now rate the service.");
      setSelectedOrder(approveOrderId);
      setIsApproveConfirmDialogOpen(false);
      setApproveOrderId(null);
      openModal('rating');
      // Refresh orders to update status
      await refreshOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete order");
    } finally {
      setIsApproving(false);
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
      closeAllModals();
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
                {getStatusLabelForTable(order.status)}
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
          {resolveAvatarUrl(order.professionalAvatar) && (
            <AvatarImage src={resolveAvatarUrl(order.professionalAvatar)} />
          )}
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
            {(order.booking?.starttime || order.booking?.time || order.booking?.timeSlot) && ` - ${order.booking.starttime || order.booking.time || order.booking.timeSlot}${order.booking?.endtime && order.booking.endtime !== order.booking.starttime ? ` - ${order.booking.endtime}` : ''}${order.booking?.timeSlot && (order.booking.starttime || order.booking.time) ? ` (${order.booking.timeSlot})` : ''}`}
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

  // Console log currentOrder for debugging
  useEffect(() => {
    if (currentOrder) {
      // console.log('Current Order:', currentOrder);
    }
  }, [currentOrder]);

  const primaryItem = currentOrder?.items?.[0];

  const timelineEvents = useMemo(
    () => (currentOrder ? buildClientTimeline(currentOrder) : []),
    [currentOrder]
  );

  // Calculate appointment deadline for countdown
  // Priority: expectedDelivery (selected at order time) > booking date/time > scheduled date
  const appointmentDeadline = useMemo(() => {
    if (!currentOrder) return null;
    
    // First priority: expectedDelivery (selected at order time)
    if (currentOrder.expectedDelivery) {
      return new Date(currentOrder.expectedDelivery);
    }
    
    // Second priority: booking date/time
    const bookingDate = currentOrder.booking?.date;
    const bookingTime = currentOrder.booking?.starttime || currentOrder.booking?.time || currentOrder.booking?.timeSlot || "09:00";
    
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
  }, [currentOrder]);

  // Use countdown hook for appointment time
  const appointmentCountdown = useCountdown(appointmentDeadline);

  // Elapsed time since booking time arrives (work in progress timer)
  // Priority: expectedDelivery (selected at order time) > booking date/time > scheduled date
  const workStartTime = useMemo(() => {
    if (!currentOrder) return null;
    // Stop timer for completed, cancelled, or cancellation-pending orders
    if (currentOrder.status === "Completed" || currentOrder.status === "Cancelled" || currentOrder.status === "Cancellation Pending") return null;

    // First priority: expectedDelivery (selected at order time)
    if (currentOrder.expectedDelivery) {
      const start = new Date(currentOrder.expectedDelivery);
      if (Date.now() >= start.getTime()) return start;
    }

    // Second priority: Auto-start work timer when scheduled booking time arrives
    const bookingDate = currentOrder.booking?.date;
    const bookingTime = currentOrder.booking?.starttime || currentOrder.booking?.time || currentOrder.booking?.timeSlot || "09:00";
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
                      {currentOrder.booking?.date
                        ? `${formatDate(currentOrder.booking.date)} ${currentOrder.booking?.starttime || currentOrder.booking?.time || currentOrder.booking?.timeSlot || ''}${currentOrder.booking?.endtime && currentOrder.booking.endtime !== currentOrder.booking.starttime ? ` - ${currentOrder.booking.endtime}` : ''}`
                        : currentOrder.scheduledDate
                          ? formatDate(currentOrder.scheduledDate)
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
                    <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                      Days
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                      {String(appointmentCountdown.hours).padStart(2, '0')}
                    </div>
                    <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                      Hours
                    </div>
                  </div>

                  {/* Minutes */}
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-[#2c353f] leading-none">
                      {String(appointmentCountdown.minutes).padStart(2, '0')}
                    </div>
                    <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#6b6b6b] uppercase tracking-wider mt-1">
                      Minutes
                    </div>
                  </div>

                  {/* Seconds */}
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
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
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-blue-600 uppercase tracking-wider mt-1">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.hours).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-blue-600 uppercase tracking-wider mt-1">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
                <div className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] font-medium text-blue-700 leading-none">
                  {String(workElapsedTime.minutes).padStart(2, '0')}
                </div>
                <div className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-blue-600 uppercase tracking-wider mt-1">
                  Minutes
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-md">
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
              {(() => {
                const cr = (currentOrder as any).cancellationRequest ?? (currentOrder as any).metadata?.cancellationRequest;
                const displayStatus = cr?.status === "pending" ? "Cancellation Pending" : currentOrder.status;
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
            </div>
          </div>

          {/* Main Layout - Left Content + Right Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Main Content (Tabs) */}
            <div className="lg:col-span-2">
        <div className="bg-white rounded-xl">
          <div className="flex-1">
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
            {((currentOrder.status === "Cancellation Pending" || (currentOrder as any).cancellationRequest?.status === "pending") &&
              currentOrder.cancellationRequest?.requestedBy &&
              currentOrder.cancellationRequest.requestedBy.toString() === userInfo?.id?.toString()) ||
            currentOrder.status === "Cancelled" ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 shadow-md mb-4 md:mb-6">
                <h3 className="font-['Poppins',sans-serif] text-[18px] sm:text-[20px] text-[#2c353f] font-semibold mb-2">
                  Order Cancellation Initiated
                </h3>
                <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b] break-words mb-4">
                  {currentOrder.status === "Cancelled"
                    ? (currentOrder.cancellationRequest?.requestedBy?.toString() === userInfo?.id?.toString()
                        ? `You have initiated the cancellation of your order. The order has been cancelled.`
                        : currentOrder.professional
                          ? `The order has been cancelled. ${currentOrder.cancellationRequest?.reason ? `Reason: ${currentOrder.cancellationRequest.reason}` : ''}`
                          : 'The order has been cancelled.')
                    : `You have initiated the cancellation of your order. ${currentOrder.professional ? `Please wait for ${currentOrder.professional} to respond.` : 'Please wait for the professional to respond.'}${currentOrder.cancellationRequest?.responseDeadline ? ' If they fail to respond before the deadline, the order will be automatically canceled.' : ''}`}
                </p>
                {currentOrder.status !== "Cancelled" &&
                 (currentOrder as any).cancellationRequest?.status === "pending" && (
                  <Button
                    onClick={async () => {
                      try {
                        if (selectedOrder) {
                          await withdrawCancellation(selectedOrder);
                          toast.success("Cancellation request withdrawn. Order will continue.");
                        }
                      } catch (error: any) {
                        toast.error(error.message || "Failed to withdraw cancellation request");
                      }
                    }}
                    variant="outline"
                    className="font-['Poppins',sans-serif] border-red-500 text-red-600 hover:bg-red-100 text-[13px] sm:text-[14px]"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Withdraw
                  </Button>
                )}
              </div>
            ) : null}

            {/* Completion Message for Completed Orders */}
            {currentOrder.status === "Completed" && (
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

            {/* Cancellation Request - Pending (Client can respond to professional's request) */}
            {currentOrder.cancellationRequest && 
             currentOrder.cancellationRequest.status === 'pending' && 
             currentOrder.cancellationRequest.requestedBy && 
             currentOrder.cancellationRequest.requestedBy.toString() !== userInfo?.id?.toString() && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6 shadow-md">
                <div className="flex items-start gap-2 sm:gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-['Poppins',sans-serif] text-[14px] sm:text-[16px] text-[#2c353f] mb-2 break-words">
                      Cancellation Request Received
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b] mb-3 break-words">
                      {currentOrder.professional || "The professional"} has requested to cancel this order.
                    </p>
                    {currentOrder.cancellationRequest.reason && (
                      <div className="mb-3 p-2 sm:p-3 bg-white rounded">
                        <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mb-1">
                          Reason:
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f] break-words">
                          {currentOrder.cancellationRequest.reason}
                        </p>
                      </div>
                    )}
                    {(currentOrder.cancellationRequest.files || []).length > 0 && (
                      <div className="mb-3">
                        <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mb-2">📎 Attachments ({currentOrder.cancellationRequest.files.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {currentOrder.cancellationRequest.files.map((file: any, idx: number) => (
                            <Button
                              key={idx}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="font-['Poppins',sans-serif] text-[12px] text-left justify-start truncate max-w-full"
                              onClick={() => window.open(resolveFileUrl(file.url), "_blank")}
                            >
                              <Paperclip className="w-3 h-3 flex-shrink-0 mr-1.5" />
                              <span className="truncate">{file.fileName || "Attachment"}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentOrder.cancellationRequest.responseDeadline && (
                      <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-orange-700 mb-4 break-words">
                        ⚠️ Response deadline: {new Date(currentOrder.cancellationRequest.responseDeadline).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                        className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] w-full sm:w-auto"
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
                        className="font-['Poppins',sans-serif] border-red-500 text-red-600 hover:bg-red-50 text-[13px] sm:text-[14px] w-full sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Cancellation
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Alert Box - Service In Progress */}
            {currentOrder.status === "In Progress" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 shadow-md">
                <h4 className="font-['Poppins',sans-serif] text-[14px] sm:text-[16px] text-[#2c353f] mb-2 break-words">
                  Service In Progress
                </h4>
                <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b] mb-4 break-words">
                  The professional is currently working on your service.
                </p>
              </div>
            )}

            {/* Service In Progress / Work Delivered - Show based on status */}
            {currentOrder.status === "delivered" ? (
              <div className="border rounded-lg p-4 sm:p-6 shadow-md bg-white border-gray-200">
              
                  <h3 className="font-['Poppins',sans-serif] text-[18px] sm:text-[20px] text-[#2c353f] font-semibold mb-2 break-words">
                    Your work has been delivered!
                  </h3>
                  <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b] break-words">
                    {currentOrder.deliveredDate ? (() => {
                      const deliveryDate = new Date(currentOrder.deliveredDate);
                      const deadlineDate = new Date(deliveryDate);
                      deadlineDate.setDate(deadlineDate.getDate() + 1);
                      deadlineDate.setHours(7, 0, 0, 0);
                      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                      const day = deadlineDate.getDate();
                      const dayName = dayNames[deadlineDate.getDay()];
                      const month = monthNames[deadlineDate.getMonth()];
                      const year = deadlineDate.getFullYear();
                      const hours = deadlineDate.getHours().toString().padStart(2, "0");
                      const minutes = deadlineDate.getMinutes().toString().padStart(2, "0");
                      const daySuffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
                      const deadlineStr = `${dayName} ${day}${daySuffix} ${month}, ${year} ${hours}:${minutes}`;
                      return `Your work has been delivered. Kindly approve the delivery or request any modifications by ${deadlineStr}. If no response is received, the order will be automatically completed and funds released to the seller.`;
                    })() : "Your work has been delivered. Kindly approve the delivery or request any modifications. If no response is received, the order will be automatically completed and funds released to the seller."}
                  </p>

                {/* Extension Request Alert */}
                {currentOrder.extensionRequest && currentOrder.extensionRequest.status === 'pending' && (
                  <div className="mb-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] font-medium text-yellow-700 mb-1 break-words">
                          Extension Request Pending
                        </h5>
                        <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b] mb-2 break-words">
                          {currentOrder.professional} has requested an extension for the delivery deadline.
                        </p>
                        <div className="space-y-1 mb-3">
                          <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] break-words">
                            <span className="font-medium">Current delivery date:</span> {currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : 'N/A'}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] break-words">
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
                            <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mt-2 break-words">
                              <span className="font-medium">Reason:</span> {currentOrder.extensionRequest.reason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3">
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
                            className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif] text-[12px] sm:text-[13px] w-full sm:w-auto"
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
                            className="border-red-500 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif] text-[12px] sm:text-[13px] w-full sm:w-auto"
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
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-md">
                    <div className="flex items-start gap-2 sm:gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] font-medium text-blue-700 mb-2 break-words">
                          Completion Request Submitted
                        </h5>
                        <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b] mb-3 break-words">
                          The professional has submitted a completion request with verification data. Please review and complete the order to release funds to their wallet.
                        </p>
                        {currentOrder.metadata.professionalCompleteRequest.completionMessage && (
                          <div className="mb-3 p-2 sm:p-3 bg-white rounded">
                            <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mb-1">
                              Professional's message:
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f] break-words">
                              {currentOrder.metadata.professionalCompleteRequest.completionMessage}
                            </p>
                          </div>
                        )}
                        {currentOrder.metadata.professionalCompleteRequest.completionFiles && currentOrder.metadata.professionalCompleteRequest.completionFiles.length > 0 && (
                          <div className="mb-3">
                            <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mb-2">
                              Verification Files:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {currentOrder.metadata.professionalCompleteRequest.completionFiles.map((file: any, index: number) => (
                                <div key={index} className="border border-gray-200 rounded p-2">
                                  {file.fileType === 'image' ? (
                                    <img src={resolveFileUrl(file.url)} alt={file.fileName} className="w-full h-20 sm:h-24 object-cover rounded" />
                                  ) : (
                                    <div className="w-full h-20 sm:h-24 bg-gray-200 rounded flex items-center justify-center">
                                      <PlayCircle className="w-6 sm:w-8 h-6 sm:h-8 text-gray-600" />
                                    </div>
                                  )}
                                  <p className="font-['Poppins',sans-serif] text-[10px] sm:text-[11px] text-[#6b6b6b] mt-1 truncate">
                                    {file.fileName}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-4">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAcceptDelivery(currentOrder.id);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif] text-[12px] sm:text-[14px] w-full sm:w-auto"
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
              ) : null}

            {/* Delivery Countdown - Show for in progress orders */}
            {currentOrder.status === "In Progress" && currentOrder.expectedDelivery && (
              <DeliveryCountdown expectedDelivery={currentOrder.expectedDelivery} />
            )}


            {timelineTimer}


            {/* {currentOrder.status === "completed" && currentOrder.rating && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h4 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-semibold mb-3">
                  Your order has been completed!
                </h4>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                  Thank you for your review! You rated this service {currentOrder.rating}/5 stars.
                </p>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= (currentOrder.rating || 0) ? "fill-[#FE8A0F] text-[#FE8A0F]" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                {currentOrder.review && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-md">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] italic">
                      "{currentOrder.review}"
                    </p>
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => {
                      if (currentOrder.professionalId) {
                        startConversation(currentOrder.professionalId, currentOrder.professional);
                      }
                    }}
                    variant="outline"
                    className="font-['Poppins',sans-serif] px-6"
                  >
                    Chat
                  </Button>
                </div>
              </div>
            )} */}

            {(() => {
              return null;
            })()}
            
            {currentOrder.status === "disputed" && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 sm:p-6 shadow-md">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-red-700 font-semibold mb-2 break-words">
                      Your order is being disputed!
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b] mb-4 break-words">
                      {currentOrder.professional || "The professional"} is disputing your order. They are currently waiting for your response. Please respond before the deadline. Click "View Dispute" to reply, add additional information, or make, reject, or accept an offer.
                    </p>
                    <Button
                      onClick={() => navigate(`/dispute/${currentOrder.disputeId}`)}
                      className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] w-full sm:w-auto"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      View Dispute
                    </Button>
                  </div>
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
                // Get all "Work Delivered" events sorted chronologically (oldest first for numbering)
                const deliveryEvents = timelineEvents
                  .filter(e => e.title === "Work Delivered")
                  .sort((a, b) => {
                    const aTime = a.at ? new Date(a.at).getTime() : 0;
                    const bTime = b.at ? new Date(b.at).getTime() : 0;
                    return aTime - bTime; // Oldest first for numbering (#1, #2, #3...)
                  });
                
                // Create a map of delivery event timestamps to their number
                // Oldest delivery = #1, second oldest = #2, etc.
                const deliveryNumberMap = new Map();
                deliveryEvents.forEach((event, idx) => {
                  const key = event.at || 'no-date';
                  deliveryNumberMap.set(key, idx + 1);
                });

                // Sort timeline events by date (newest first for display)
                const sortedTimelineEvents = [...timelineEvents].sort((a, b) => {
                  const aTime = a.at ? new Date(a.at).getTime() : 0;
                  const bTime = b.at ? new Date(b.at).getTime() : 0;
                  return bTime - aTime; // Newest first
                });

                // Find the latest delivery event (newest first, so first "Work Delivered" event)
                const latestDeliveryEvent = sortedTimelineEvents.find(e => e.title === "Work Delivered");

                return sortedTimelineEvents.map((event, index) => {
                  // Get delivery number if this is a "Work Delivered" event
                  const deliveryNumber = event.title === "Work Delivered" 
                    ? deliveryNumberMap.get(event.at || 'no-date')
                    : null;
                  
                  // Check if this is the latest delivery event
                  const isLatestDelivery = latestDeliveryEvent && 
                    event.title === "Work Delivered" && 
                    event.at === latestDeliveryEvent.at;

                  return (
                    <div key={`${event.id}-${event.at || "na"}-${index}`} className="flex gap-3 sm:gap-5 mb-6 sm:mb-8 relative">
                      <div className="flex flex-col items-center pt-1 relative">
                        {/* Icon with enhanced modern styling */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#3D78CB] flex items-center justify-center flex-shrink-0 shadow-lg ring-2 sm:ring-4 ring-white transition-all duration-300 hover:scale-110 hover:shadow-xl relative z-10">
                          {event.icon}
                        </div>
                        {/* Bold blue dashed connecting line */}
                        <div className="relative mt-2 sm:mt-3 flex-1" style={{ minHeight: "30px" }}>
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0 border-l-[2px] sm:border-l-[3px] border-dashed border-[#3D78CB]" />
                        </div>
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
                    {event.files && event.files.length > 0 && (() => {
                      // For "Work Delivered" events, filter files by deliveryNumber
                      // For other events (like "Revision Requested"), show all files
                      let filesToShow = event.files;
                      
                      if (event.title === "Work Delivered" && event.id && event.id.startsWith('delivered-')) {
                        // Extract delivery number from event id (format: "delivered-1", "delivered-2", etc.)
                        const eventDeliveryNumber = parseInt(event.id.replace('delivered-', ''), 10);
                        
                        // Filter files by deliveryNumber
                        filesToShow = event.files.filter((file: any) => {
                          const fileDeliveryNumber = file.deliveryNumber || 1;
                          return fileDeliveryNumber === eventDeliveryNumber;
                        });
                      }
                      
                      if (filesToShow.length === 0) return null;
                      
                      return (
                        <div className="mt-3">
                          <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b] mb-2">
                            📎 Attachments ({filesToShow.length})
                          </p>
                          <div className="space-y-3">
                            {filesToShow.map((file: any, index: number) => {
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
                      );
                    })()}
                    {event.title === "Work Delivered" && 
                     isLatestDelivery &&
                     currentOrder.status === "delivered" && (
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4 shadow-sm">
                        <div className="flex gap-2 mb-3 sm:mb-4">
                          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[14px] text-blue-900 break-words">
                            Your work has been delivered. Please approve the delivery or request a revision. {event.at && (() => {
                              const deliveryDate = new Date(event.at);
                              const deadlineDate = new Date(deliveryDate);
                              deadlineDate.setDate(deadlineDate.getDate() + 1);
                              return `You have until ${formatDate(deadlineDate.toISOString())} to respond.`;
                            })()} If no action is taken by then, the order will be automatically completed.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-center">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAcceptDelivery(currentOrder.id);
                            }}
                            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-6 w-full sm:w-auto"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedOrder(currentOrder.id);
                              openModal('revisionRequest');
                            }}
                            variant="outline"
                            className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] border-blue-600 text-blue-600 hover:bg-blue-50 px-4 sm:px-6 w-full sm:w-auto"
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
                      <div className="bg-gray-50 rounded-lg p-3 mt-2">
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
              {currentOrder.status === "disputed" && (
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
                      <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mt-3 shadow-sm">
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
              {currentOrder.status === "disputed" && showDisputeSection && currentOrder.disputeId && (() => {
                const dispute = getOrderDisputeById(currentOrder.disputeId);
                if (!dispute) return null;
                
                return (
                  <div className="mb-8 border-t-4 border-orange-400 pt-6">
                    <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-4">
                      Dispute Details
                    </h3>
                    
                    {/* Dispute Info */}
                    <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
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
                                  {resolveAvatarUrl(msg.userAvatar) && (
                                    <AvatarImage src={resolveAvatarUrl(msg.userAvatar)} />
                                  )}
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
              {(currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0) && (
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
                    {/* {currentOrder.status !== "Completed" && 
                     (!currentOrder.revisionRequest || 
                      (currentOrder.revisionRequest.status !== 'pending' && 
                       currentOrder.revisionRequest.status !== 'in_progress')) && (
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 shadow-sm">
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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAcceptDelivery(currentOrder.id);
                            }}
                            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[14px] px-6"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedOrder(currentOrder.id);
                              openModal('revisionRequest');
                            }}
                            variant="outline"
                            className="font-['Poppins',sans-serif] text-[14px] border-blue-600 text-blue-600 hover:bg-blue-50 px-6"
                          >
                            Request Modification
                          </Button>
                        </div>
                      </div>
                    )} */}
                  </div>
                </div>
              )}


              {/* Order Started */}
              {(currentOrder.status === "In Progress" || (currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0)) && (
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
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3 shadow-sm">
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
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3 shadow-sm">
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
          <TabsContent value="details" className="mt-4 md:mt-6 px-4 md:px-6">
            <div className="bg-white rounded-xl p-8 shadow-md">
              {/* Service Title */}
              <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-4">
                {currentOrder.service || primaryItem?.title || "Service"}
              </h2>

              {/* Service Category */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
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
                          {(currentOrder.booking?.starttime || currentOrder.booking?.time) && ` at ${currentOrder.booking.starttime || currentOrder.booking.time}${currentOrder.booking?.endtime && currentOrder.booking.endtime !== currentOrder.booking.starttime ? ` - ${currentOrder.booking.endtime}` : ''}`}
                          {currentOrder.booking?.timeSlot && ` (${currentOrder.booking.timeSlot})`}
                        </td>
                      </tr>
                    )}
                    {currentOrder.discount > 0 && (
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
                    {currentOrder.serviceFee > 0 && (
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
          <TabsContent value="additional-info" className="mt-4 md:mt-6 space-y-4 md:space-y-6 px-4 md:px-6">
            {/* Additional Information Section */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                  Additional Information
                </h3>
                {!currentOrder?.additionalInformation?.submittedAt && currentOrder && (
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-['Poppins',sans-serif] text-[13px] relative z-10"
                    onClick={() => {
                      setSelectedOrder(currentOrder.id);
                      openModal('addInfo');
                    }}
                  >
                    + Add now
                  </Button>
                )}
              </div>

              {currentOrder.additionalInformation?.submittedAt ? (
                <div className="space-y-4">
                  {/* Submitted Message */}
                  {currentOrder.additionalInformation.message && (
                    <div className="bg-gray-50 rounded-lg p-4">
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
                            className="relative rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
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
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery" className="mt-4 md:mt-6 px-4 md:px-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              {(() => {
                // Get all "Work Delivered" timeline events
                const timeline = buildClientTimeline(currentOrder);
                const deliveryEvents = timeline.filter(event => event.title === "Work Delivered");
                
                // Sort chronologically (oldest first for proper #1, #2, #3 numbering)
                const sortedForNumbering = [...deliveryEvents].sort((a, b) => {
                  const aTime = a.at ? new Date(a.at).getTime() : 0;
                  const bTime = b.at ? new Date(b.at).getTime() : 0;
                  return aTime - bTime; // Oldest first for numbering
                });
                
                // Create delivery number map (oldest = #1, second = #2, etc.)
                const deliveryNumberMap = new Map();
                sortedForNumbering.forEach((event, idx) => {
                  const key = event.at || 'no-date';
                  deliveryNumberMap.set(key, idx + 1);
                });
                
                // Sort for display (newest first)
                const sortedDeliveries = [...deliveryEvents].sort((a, b) => {
                  const aTime = a.at ? new Date(a.at).getTime() : 0;
                  const bTime = b.at ? new Date(b.at).getTime() : 0;
                  return bTime - aTime; // Newest first
                });

                if (sortedDeliveries.length > 0) {
                  return (
                    <div className="space-y-6">
                      {sortedDeliveries.map((delivery, index) => {
                        const deliveryNumber = deliveryNumberMap.get(delivery.at || 'no-date') || (index + 1);
                        return (
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
                              #{deliveryNumber} Work Delivered
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
                                {delivery.files && delivery.files.length > 0 && (() => {
                                  // Filter files to only show those matching the delivery number
                                  const filteredFiles = delivery.files.filter((file: any) => {
                                    const fileDeliveryNumber = file.deliveryNumber || 1;
                                    return fileDeliveryNumber === deliveryNumber;
                                  });
                                  
                                  if (filteredFiles.length === 0) return null;
                                  
                                  return (
                                    <div>
                                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                                        📎 Attachments ({filteredFiles.length})
                                      </p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {filteredFiles.map((file: any, fileIndex: number) => (
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
                                  );
                                })()}
                              </div>
                            )}

                            {/* Approval Message - Show for latest delivery if order is not completed and no active revision request */}
                            {/* {index === sortedDeliveries.length - 1 &&
                             (currentOrder.status !== "Completed" && currentOrder.status !== "Cancelled") && 
                             (currentOrder.status === "delivered" || currentOrder.status === "In Progress") &&
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
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAcceptDelivery(currentOrder.id);
                                    }}
                                    className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[14px] px-6"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedOrder(currentOrder.id);
                                      openModal('revisionRequest');
                                    }}
                                    variant="outline"
                                    className="font-['Poppins',sans-serif] text-[14px] border-blue-600 text-blue-600 hover:bg-blue-50 px-6"
                                  >
                                    Request Modification
                                  </Button>
                                </div>
                              </div>
                            )} */}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  );
                }

                // No deliveries yet - show status message
                if (currentOrder.status === "In Progress") {
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

              {currentOrder.status === "Completed" && (
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

            {/* Task Address Section */}
            {currentOrder.address && (
              <div className="bg-white rounded-xl p-6 mt-4 md:mt-6 shadow-md">
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
            </div>
          </TabsContent>
        </Tabs>
          </div>
        </div>
            </div>

            {/* Right Side - Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 sticky top-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                    Order Details
                  </h3>
	                  {/* Three Dots Menu (actions) */}
	                  {(() => {
	                    const status = currentOrder.status;
	                    const statusNormalized = String(status || "").toLowerCase();
	
	                    const hasDeliveryFiles = !!(currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0);
	                    const hasDeliveredSignals =
	                      hasDeliveryFiles ||
	                      !!currentOrder.deliveredDate ||
	                      !!currentOrder.deliveryMessage;

	                    const isPendingCancellation =
	                      (currentOrder as any).cancellationRequest?.status === "pending" ||
	                      (currentOrder as any).metadata?.cancellationRequest?.status === "pending";
	
	                    const canCancel = (statusNormalized === "in progress" || statusNormalized === "active") && !isPendingCancellation;
	                    // Dispute is available once work is delivered (or after completion)
	                    const canDispute =
	                      hasDeliveredSignals ||
	                      statusNormalized === "delivered" ||
	                      statusNormalized === "completed";
	
	                    const isCancelled = statusNormalized === "cancelled";
	                    const isCancellationPending = statusNormalized === "cancellation pending";
	
	                    const showMenu = !isCancelled && !isCancellationPending && (canCancel || canDispute);
	
	                    if (!showMenu) return null;
	
	                    return (
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
	                        {canDispute ? (
                          <DropdownMenuItem
                            onClick={() => openModal('dispute')}
                            className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 cursor-pointer"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Open Dispute
                          </DropdownMenuItem>
	                        ) : canCancel ? (
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
	                    );
	                  })()}
                </div>

                {/* Service Preview */}
                <div className="mb-6">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
                    Service
                  </p>
                  <div className="flex gap-3 items-start">
                    {(() => {
                      // First try to use fetched service thumbnail
                      const fetchedThumbnail = serviceThumbnails[currentOrder.id];
                      
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
                      const serviceImage = currentOrder.items && currentOrder.items.length > 0 && currentOrder.items[0]?.image 
                        ? currentOrder.items[0].image 
                        : currentOrder.serviceImage || serviceVector;
                      
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
                      {resolveAvatarUrl(currentOrder.professionalAvatar) && (
                        <AvatarImage src={resolveAvatarUrl(currentOrder.professionalAvatar)} />
                      )}
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
                {(currentOrder.booking?.date || currentOrder.booking?.starttime || currentOrder.booking?.time || currentOrder.scheduledDate) && (
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
                    {(currentOrder.booking?.starttime || currentOrder.booking?.time || currentOrder.booking?.timeSlot) && (
                      <div className="flex items-center gap-2 text-[#2c353f] mt-2">
                        <Clock className="w-4 h-4 text-[#6b6b6b]" />
                        <span className="font-['Poppins',sans-serif] text-[13px]">
                          {currentOrder.booking.starttime || currentOrder.booking.time || currentOrder.booking.timeSlot}
                          {currentOrder.booking?.endtime && currentOrder.booking.endtime !== currentOrder.booking.starttime ? ` - ${currentOrder.booking.endtime}` : ''}
                          {currentOrder.booking?.timeSlot && (currentOrder.booking.starttime || currentOrder.booking.time) && ` (${currentOrder.booking.timeSlot})`}
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

                {((currentOrder.deliveryFiles && currentOrder.deliveryFiles.length > 0) || currentOrder.status === "Completed") && (
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
	      <Dialog
	        open={isRatingDialogOpen}
	        onOpenChange={(open) => {
	          // Avoid calling openModal() here (it calls closeAllModals()) because Radix
	          // invokes onOpenChange(true) when we programmatically open the dialog.
	          // That pattern can cause immediate-close/flicker.
	          if (!open) closeAllModals();
	        }}
	      >
          <DialogContent className="w-[48vw] min-w-[280px] sm:max-w-[280px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="sr-only shrink-0">
              <DialogTitle>Rate Your Service</DialogTitle>
              <DialogDescription>Provide your rating and review for the service</DialogDescription>
            </DialogHeader>

            {!currentOrder ? (
              <div className="p-8 text-center">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Loading order details...
                </p>
              </div>
            ) : currentOrder.rating ? (
              <div className="flex flex-col overflow-y-auto overscroll-contain min-h-0">
            {/* Already Reviewed - Show Submitted Review */}
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
                    Thank you for sharing your experience!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-4 sm:p-6 space-y-6">
                <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[24px] text-[#3D5A80] font-medium">
                  Your Public Review
                </h2>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">Overall Rating</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= (currentOrder.rating || 0)
                              ? "fill-[#FE8A0F] text-[#FE8A0F]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-semibold ml-2">
                      {currentOrder.rating}/5
                    </span>
                  </div>
                </div>

                {currentOrder.review && (
                  <div>
                    <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold mb-2">Your Review</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] whitespace-pre-wrap">
                        {currentOrder.review}
                      </p>
                    </div>
                  </div>
                )}

                {currentOrder.professionalReview && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-['Poppins',sans-serif] text-[15px] text-green-700 font-semibold mb-3">Professional&apos;s Review</h4>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        {resolveAvatarUrl(currentOrder.professionalAvatar) && (
                          <AvatarImage src={resolveAvatarUrl(currentOrder.professionalAvatar)} />
                        )}
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {currentOrder.professional?.charAt(0) || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mb-1">
                          {currentOrder.professional || "Professional"}
                        </p>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (currentOrder.professionalReview?.rating || 0)
                                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {currentOrder.professionalReview?.comment && (
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            &quot;{currentOrder.professionalReview.comment}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] italic">
                  Reviews can only be submitted once and cannot be edited.
                </p>

                {/* Order Summary - single column */}
                <div className="mt-4 pt-6 border-t border-gray-200 space-y-4">
                  {currentOrder?.serviceImage && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={resolveFileUrl(currentOrder.serviceImage)}
                        alt={currentOrder.service}
                        className="w-full h-36 object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium italic">
                    {currentOrder?.service || "Service"}
                  </h3>
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
            <div className="bg-green-50 border-b border-green-200 p-4 shrink-0">
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

            <div className="flex flex-col p-4 sm:p-6 space-y-6">
                <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[24px] text-[#3D5A80] font-medium">
                  Leave a public review
                </h2>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                  Share your experience of what is it like working with {currentOrder?.professional || "this professional"}.
                </p>

                <div className="space-y-6 mb-8">
                  <div>
                    <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold mb-1">Communication With Seller</h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">How responsive was the seller during the process?</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setCommunicationRating(star)} className="transition-transform hover:scale-110">
                          <Star className={`w-7 h-7 ${star <= communicationRating ? "fill-[#FE8A0F] text-[#FE8A0F]" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold mb-1">Service as Described</h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">Did the result match the service&apos;s description?</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setServiceAsDescribedRating(star)} className="transition-transform hover:scale-110">
                          <Star className={`w-7 h-7 ${star <= serviceAsDescribedRating ? "fill-[#FE8A0F] text-[#FE8A0F]" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#3D5A80] font-semibold mb-1">Buy Again or Recommended</h4>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">Would you recommend buying this service?</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setBuyAgainRating(star)} className="transition-transform hover:scale-110">
                          <Star className={`w-7 h-7 ${star <= buyAgainRating ? "fill-[#FE8A0F] text-[#FE8A0F]" : "text-gray-300"}`} />
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

                <Button
                  onClick={handleSubmitRating}
                  disabled={isSubmittingReview}
                  className="w-full sm:w-auto bg-[#FE8A0F] hover:bg-[#e07a0d] text-white font-['Poppins',sans-serif] text-[14px] px-8 py-3 rounded-lg"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit"}
                </Button>

                {/* Order Summary - single column */}
                <div className="mt-4 pt-6 border-t border-gray-200 space-y-4">
                  {currentOrder?.serviceImage && (
                    <div className="rounded-lg overflow-hidden">
                      <img src={resolveFileUrl(currentOrder.serviceImage)} alt={currentOrder.service} className="w-full h-36 object-cover" />
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
                    <div className="pt-4 border-t border-gray-200">
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
            )}
          </DialogContent>
        </Dialog>

	      {/* Cancel Order Dialog */}
	      <Dialog
	        open={isCancelDialogOpen}
	        onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('cancel')
	          if (!open) closeAllModals();
	        }}
	      >
          <DialogContent className="w-[35vw] min-w-[280px] max-w-[360px]">
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
                  onClick={() => {
                    closeAllModals();
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
	      <Dialog
	        open={isDisputeDialogOpen}
	        onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('dispute')
	          if (!open) closeAllModals();
	        }}
	      >
          <DialogContent className="w-[48vw] sm:w-[42vw] md:w-[38vw] lg:w-[35vw] min-w-[280px] max-w-[460px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                Open a Dispute
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              {/* Information Message Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ul className="font-['Poppins',sans-serif] text-[13px] text-yellow-800 space-y-2 list-disc list-inside">
                  <li>Most disputes are the result of a simple misunderstanding.</li>
                  <li>Our dispute resolution system is designed to allow both parties to resolve the issue amongst themselves.</li>
                  <li>Most disputes are resolved without arbitration.</li>
                  <li>If an agreement cannot be reached, either party may elect to pay an arbitration fee for our dispute team to resolve the matter.</li>
                </ul>
              </div>
              
              {/* Order Requirements Field */}
              <div>
                <Label htmlFor="dispute-requirements" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Please describe in detail what the requirements were for the order(s) you wish to dispute. *
                </Label>
                <Textarea
                  id="dispute-requirements"
                  value={disputeRequirements}
                  onChange={(e) => setDisputeRequirements(e.target.value)}
                  placeholder="Describe the original requirements and expectations for this order..."
                  rows={4}
                  className="font-['Poppins',sans-serif] text-[14px]"
                />
              </div>

              {/* Unmet Requirements Field */}
              <div>
                <Label htmlFor="dispute-unmet" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Please describe in detail which of these requirements were not completed. *
                </Label>
                <Textarea
                  id="dispute-unmet"
                  value={disputeUnmetRequirements}
                  onChange={(e) => setDisputeUnmetRequirements(e.target.value)}
                  placeholder="Explain specifically which requirements were not met or completed..."
                  rows={4}
                  className="font-['Poppins',sans-serif] text-[14px]"
                />
              </div>

              {/* Evidence File Upload */}
              <div>
                <Label htmlFor="dispute-evidence-files" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Please include evidence of how the order requirements we communicated, as well as any other evidence that supports your case.
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#3D5A80] transition-colors">
                  <input
                    id="dispute-evidence-files"
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setDisputeEvidenceFiles(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="dispute-evidence-files"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Paperclip className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                      Click to upload evidence files
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#999]">
                      Screenshots, documents, or any supporting materials
                    </p>
                  </label>
                </div>
                {disputeEvidenceFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {disputeEvidenceFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                            {file.name}
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[11px] text-[#999]">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setDisputeEvidenceFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Offer Amount Field */}
              <div>
                <Label htmlFor="dispute-offer" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Offer the amount you are prepared to pay *
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    <PoundSterling className="w-4 h-4 text-gray-500" />
                  </div>
                  <Input
                    id="dispute-offer"
                    type="number"
                    min="0"
                    max={currentOrder?.amountValue || undefined}
                    step="0.01"
                    value={disputeOfferAmount}
                    onChange={(e) => setDisputeOfferAmount(e.target.value)}
                    placeholder="0.00"
                    className="font-['Poppins',sans-serif] text-[14px] pl-10"
                  />
                </div>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
                  Must be between £0.00 and £{currentOrder?.amountValue?.toFixed(2) || '0.00'} (order amount)
                </p>
              </div>

              {/* Caution Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                  <span className="text-red-600 font-semibold">Caution!</span> You are entering the amount of the order that you are happy for the other party to receive. You may increase your offer in the future but you may not lower it.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  onClick={() => {
                    closeAllModals();
                    setDisputeRequirements("");
                    setDisputeUnmetRequirements("");
                    setDisputeEvidenceFiles([]);
                    setDisputeOfferAmount("");
                  }}
                  variant="outline"
                  className="font-['Poppins',sans-serif]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDispute}
                  disabled={!disputeRequirements.trim() || !disputeUnmetRequirements.trim() || !disputeOfferAmount}
                  className="bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed"
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
              // Keep selectedOrder to stay on detail page
              // setSelectedOrder(null); // Removed to keep order detail page open
              setRevisionReason("");
              setRevisionMessage("");
              setRevisionFiles([]);
            }
          }}
        >
          <DialogContent className="w-[45vw] min-w-[280px] max-w-xl">
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
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  closeAllModals();
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
	      
	      {/* Approve Confirmation Dialog */}
	      <Dialog
	        open={isApproveConfirmDialogOpen}
	        onOpenChange={(open) => {
	          setIsApproveConfirmDialogOpen(open);
	          if (!open) {
	            setApproveOrderId(null);
	          }
	        }}
	      >
	        <DialogContent className="w-[400px] sm:max-w-[400px]">
	          <div className="flex flex-col items-center text-center py-4">
	            <div className="w-10 h-10 rounded-full border-4 border-[#FE8A0F] flex items-center justify-center mb-6">
	              <span className="text-[#FE8A0F] text-4xl font-light">!</span>
	            </div>
	            <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] font-semibold mb-3">
	              Confirm?
	            </h2>
	            <p className="font-['Poppins',sans-serif] text-[15px] text-[#6b6b6b] mb-6">
	              Are you sure you want to approve this order?
	            </p>
	            <div className="flex gap-3 w-full justify-center">
	              <Button
	                variant="outline"
	                onClick={() => {
	                  setIsApproveConfirmDialogOpen(false);
	                  setApproveOrderId(null);
	                }}
	                disabled={isApproving}
	                className="font-['Poppins',sans-serif] text-[14px] px-6 border-[#3D78CB] text-[#3D78CB] hover:bg-blue-50"
	              >
	                Cancel
	              </Button>
	              <Button
	                onClick={confirmApproveDelivery}
	                disabled={isApproving}
	                className="bg-[#3D78CB] hover:bg-[#2D5CA3] text-white font-['Poppins',sans-serif] text-[14px] px-6"
	              >
	                {isApproving ? "Approving..." : "Yes, Approve"}
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
      <div className="flex lg:grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        {/* Total Orders */}
        <div 
          className="rounded-2xl p-5 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0 shadow-[0_8px_24px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.35)] transition-all duration-300 transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
        >
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-white/90 mb-2 md:mb-3 font-medium">
            Total Orders
          </p>
          <p className="font-['Poppins',sans-serif] text-[32px] md:text-[40px] text-white font-bold">
            {orders.length}
          </p>
        </div>

        {/* In Progress */}
        <div 
          className="rounded-2xl p-5 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0 shadow-[0_8px_24px_rgba(59,130,246,0.25)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.35)] transition-all duration-300 transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
        >
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-white/90 mb-2 md:mb-3 font-medium">
            In Progress
          </p>
          <p className="font-['Poppins',sans-serif] text-[32px] md:text-[40px] text-white font-bold">
            {inProgressOrders.length}
          </p>
        </div>

        {/* Completed */}
        <div 
          className="rounded-2xl p-5 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0 shadow-[0_8px_24px_rgba(16,185,129,0.25)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.35)] transition-all duration-300 transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
        >
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-white/90 mb-2 md:mb-3 font-medium">
            Completed
          </p>
          <p className="font-['Poppins',sans-serif] text-[32px] md:text-[40px] text-white font-bold">
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
            <div className="bg-white rounded-xl overflow-hidden shadow-md">
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
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]" title={order.service}>
                            {order.service && order.service.length > 30 
                              ? `${order.service.substring(0, 30)}...` 
                              : order.service}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            {resolveAvatarUrl(order.professionalAvatar) && (
                              <AvatarImage src={resolveAvatarUrl(order.professionalAvatar)} />
                            )}
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
                            {getStatusLabelForTable(order.status)}
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
            <div className="bg-white rounded-xl overflow-hidden shadow-md">
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
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]" title={order.service}>
                            {order.service && order.service.length > 30 
                              ? `${order.service.substring(0, 30)}...` 
                              : order.service}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            {resolveAvatarUrl(order.professionalAvatar) && (
                              <AvatarImage src={resolveAvatarUrl(order.professionalAvatar)} />
                            )}
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
                            {getStatusLabelForTable(order.status)}
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
            <div className="bg-white rounded-xl overflow-hidden shadow-md">
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
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]" title={order.service}>
                            {order.service && order.service.length > 30 
                              ? `${order.service.substring(0, 30)}...` 
                              : order.service}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            {resolveAvatarUrl(order.professionalAvatar) && (
                              <AvatarImage src={resolveAvatarUrl(order.professionalAvatar)} />
                            )}
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
            <div className="bg-white rounded-xl overflow-hidden shadow-md">
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
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]" title={order.service}>
                            {order.service && order.service.length > 30 
                              ? `${order.service.substring(0, 30)}...` 
                              : order.service}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            {resolveAvatarUrl(order.professionalAvatar) && (
                              <AvatarImage src={resolveAvatarUrl(order.professionalAvatar)} />
                            )}
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
                            {getStatusLabelForTable(order.status)}
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
            <div className="bg-white rounded-xl overflow-hidden shadow-md">
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
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]" title={order.service}>
                            {order.service && order.service.length > 30 
                              ? `${order.service.substring(0, 30)}...` 
                              : order.service}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            {resolveAvatarUrl(order.professionalAvatar) && (
                              <AvatarImage src={resolveAvatarUrl(order.professionalAvatar)} />
                            )}
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
                            {getStatusLabelForTable(order.status)}
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
            // Keep selectedOrder to stay on detail page
            // setSelectedOrder(null); // Removed to keep order detail page open
            setRevisionReason("");
            setRevisionMessage("");
            setRevisionFiles([]);
          }
        }}
      >
        <DialogContent className="w-[45vw] min-w-[280px] max-w-xl">
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                closeAllModals();
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
      <AddInfoDialog
        open={isAddInfoDialogOpen}
        onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('addInfo')
	          if (!open) closeAllModals();
        }}
        order={orders.find(o => o.id === selectedOrder) || null}
        onSubmit={async (orderId, message, files) => {
          await addAdditionalInfo(orderId, message, files);
          // Refresh orders to update Additional Info tab and Timeline
          await refreshOrders();
        }}
      />

	      {/* Approve Confirmation Dialog */}
	      <Dialog
	        open={isApproveConfirmDialogOpen}
	        onOpenChange={(open) => {
	          setIsApproveConfirmDialogOpen(open);
	          if (!open) {
	            setApproveOrderId(null);
	          }
	        }}
	      >
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center text-center py-4">
            {/* Warning Icon */}
            <div className="w-20 h-20 rounded-full border-4 border-[#FE8A0F] flex items-center justify-center mb-6">
              <span className="text-[#FE8A0F] text-4xl font-light">!</span>
            </div>

            {/* Title */}
            <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] font-semibold mb-3">
              Confirm?
            </h2>

            {/* Description */}
            <p className="font-['Poppins',sans-serif] text-[15px] text-[#6b6b6b] mb-6">
              Are you sure you want to approve this order?
            </p>

            {/* Buttons */}
            <div className="flex gap-3 w-full justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setIsApproveConfirmDialogOpen(false);
                  setApproveOrderId(null);
                }}
                disabled={isApproving}
                className="font-['Poppins',sans-serif] text-[14px] px-6 border-[#3D78CB] text-[#3D78CB] hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproveDelivery}
                disabled={isApproving}
                className="bg-[#3D78CB] hover:bg-[#2D5CA3] text-white font-['Poppins',sans-serif] text-[14px] px-6"
              >
                {isApproving ? "Approving..." : "Yes, Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

	      {/* Dispute Response Dialog */}
	      <Dialog
	        open={isDisputeResponseDialogOpen}
	        onOpenChange={(open) => {
	          // Close-only handler; opening is controlled via openModal('disputeResponse')
	          if (!open) closeAllModals();
	        }}
	      >
        <DialogContent className="w-[45vw] min-w-[280px] max-w-xl">
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
              <div className="p-4 bg-gray-50 rounded-lg">
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
                closeAllModals();
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
