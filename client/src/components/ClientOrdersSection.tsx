import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrders } from "./OrdersContext";
import { useMessenger } from "./MessengerContext";
import DeliveryCountdown from "./DeliveryCountdown";
import {
  ShoppingBag,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Phone,
  Mail,
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
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
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
  const { orders, cancelOrder, acceptDelivery, createOrderDispute, getOrderDisputeById, rateOrder } = useOrders();
  const { startConversation } = useMessenger();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [orderDetailTab, setOrderDetailTab] = useState("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [rating, setRating] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [review, setReview] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [showDisputeSection, setShowDisputeSection] = useState(false);

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

  // Get orders by delivery status
  const getOrdersByStatus = (status: string) => {
    if (status === "all") return clientOrders;
    return clientOrders.filter(
      (order) => order.deliveryStatus === status
    );
  };

  // Filter and sort orders
  const getFilteredOrders = (status: string) => {
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

  // Active orders include both pending and active deliveryStatus
  const activeOrders = (() => {
    let filtered = clientOrders.filter(
      (order) => order.deliveryStatus === "active" || order.deliveryStatus === "pending"
    );
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.professional?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sortBy === "date") {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === "amount") {
      filtered.sort((a, b) => b.amountValue - a.amountValue);
    }
    return filtered;
  })();
  
  const deliveredOrders = getFilteredOrders("delivered");
  const completedOrders = getFilteredOrders("completed");
  const cancelledOrders = getFilteredOrders("cancelled");
  const disputeOrders = getFilteredOrders("dispute");

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "delivered":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
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

  const handleViewOrder = (orderId: string) => {
    setSelectedOrder(orderId);
    setOrderDetailTab("timeline");
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
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

  const handleAcceptDelivery = (orderId: string) => {
    acceptDelivery(orderId);
    toast.success("Delivery accepted! You can now rate the service.");
    setIsRatingDialogOpen(true);
  };

  const handleRequestRevision = (orderId: string) => {
    toast.info("Revision request sent to professional");
  };

  const handleCreateDispute = () => {
    if (!disputeReason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }
    if (selectedOrder) {
      const disputeId = createOrderDispute(selectedOrder, disputeReason, disputeEvidence);
      toast.success("Dispute has been created");
      setIsDisputeDialogOpen(false);
      setDisputeReason("");
      setDisputeEvidence("");
      // Navigate to dispute discussion page
      navigate(`/dispute/${disputeId}`);
    }
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (selectedOrder) {
      rateOrder(selectedOrder, rating, review);
    }
    toast.success("Thank you for your feedback!");
    setIsRatingDialogOpen(false);
    setRating(0);
    setReview("");
  };

  const handleStartConversation = (professionalName: string, professionalAvatar?: string) => {
    if (professionalName && selectedOrder) {
      const order = orders.find(o => o.id === selectedOrder);
      startConversation({
        id: `prof-${selectedOrder}`,
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
            <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
              {order.service}
            </h3>
            <Badge
              className={`${getStatusBadge(
                order.deliveryStatus
              )} font-['Roboto',sans-serif] text-[11px]`}
            >
              <span className="flex items-center gap-1">
                {getStatusIcon(order.deliveryStatus)}
                {order.deliveryStatus?.toUpperCase()}
              </span>
            </Badge>
          </div>
          <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
            Order ID: {order.id}
          </p>
          <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
            Placed: {formatDate(order.date)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-['Roboto',sans-serif] text-[20px] text-[#FE8A0F] mb-1">
            {order.amount}
          </p>
          {order.rating && (
            <div className="flex items-center gap-1 justify-end">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
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
          <AvatarFallback className="bg-[#3D78CB] text-white font-['Roboto',sans-serif] text-[14px]">
            {order.professional
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase() || "P"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
            {order.professional}
          </p>
          <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">
            Professional
          </p>
        </div>
      </div>

      {/* Scheduled Date */}
      {order.scheduledDate && (
        <div className="flex items-center gap-2 mb-3 text-[#6b6b6b]">
          <Calendar className="w-4 h-4" />
          <span className="font-['Roboto',sans-serif] text-[13px]">
            Scheduled: {formatDate(order.scheduledDate)}
            {order.booking?.timeSlot && ` - ${order.booking.timeSlot}`}
          </span>
        </div>
      )}

      {/* Description */}
      {order.description && (
        <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b] mb-4 line-clamp-2">
          {order.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleViewOrder(order.id)}
          variant="outline"
          className="flex-1 font-['Roboto',sans-serif] text-[13px]"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
        <Button
          onClick={() => {
            if (order.professional) {
              startConversation({
                id: `prof-${order.id}`,
                name: order.professional,
                avatar: order.professionalAvatar,
                online: true,
                jobId: order.id,
                jobTitle: order.service
              });
            }
          }}
          variant="outline"
          className="font-['Roboto',sans-serif] text-[13px]"
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

  // If an order is selected, show the detail view
  if (selectedOrder && currentOrder) {
    return (
      <div>
          {!showDisputeSection && (
            <>
          <Button
            onClick={handleBackToList}
            variant="ghost"
            className="mb-4 font-['Roboto',sans-serif] text-[13px] hover:text-[#FE8A0F]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>

          {/* Header with Title and Status */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-['Roboto',sans-serif] text-[24px] text-[#2c353f] mb-2">
                {currentOrder.service}
              </h2>
              <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                Order ID: {currentOrder.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={`${getStatusBadge(
                  currentOrder.deliveryStatus
                )} font-['Roboto',sans-serif] text-[11px]`}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(currentOrder.deliveryStatus)}
                  {currentOrder.deliveryStatus?.toUpperCase()}
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
                    className="font-['Roboto',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="font-['Roboto',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="additional-info"
                    className="font-['Roboto',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0"
                  >
                    Additional Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="delivery"
                    className="font-['Roboto',sans-serif] text-[13px] md:text-[14px] rounded-none border-b-2 border-transparent data-[state=active]:border-[#FE8A0F] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent px-4 md:px-6 py-3 whitespace-nowrap flex-shrink-0"
                  >
                    Delivery
                  </TabsTrigger>
                </TabsList>
              </div>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-6 space-y-6">
            {/* Status Alert Box */}
            {currentOrder.deliveryStatus === "pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  Waiting for Professional to Start
                </h4>
                <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                  Your payment has been processed successfully. The professional will start working on your service soon. Expected delivery: <span className="text-[#2c353f]">{currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : "TBD"}</span>.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => handleStartConversation(currentOrder.professional, currentOrder.professionalAvatar)}
                    variant="outline"
                    className="font-['Roboto',sans-serif]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </div>
            )}

            {currentOrder.deliveryStatus === "active" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  Service In Progress
                </h4>
                <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                  {currentOrder.professional} is currently working on your service. Expected delivery: <span className="text-[#2c353f]">{currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : "TBD"}</span>. Feel free to reach out if you have any questions.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => handleStartConversation(currentOrder.professional, currentOrder.professionalAvatar)}
                    variant="outline"
                    className="font-['Roboto',sans-serif]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </div>
            )}

            {/* Delivery Countdown - Show for active and pending orders */}
            {(currentOrder.deliveryStatus === "active" || currentOrder.deliveryStatus === "pending") && currentOrder.expectedDelivery && (
              <DeliveryCountdown expectedDelivery={currentOrder.expectedDelivery} />
            )}

            {currentOrder.deliveryStatus === "delivered" && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  Service Delivered - Review Required
                </h4>
                <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                  Your work has been delivered on <span className="text-[#2c353f]">{currentOrder.deliveredDate ? formatDate(currentOrder.deliveredDate) : "today"}</span>. Kindly approve the delivery or request any modifications. If no response is received, the order will be automatically completed and funds released to the seller.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => handleAcceptDelivery(currentOrder.id)}
                    className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Roboto',sans-serif]"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Accept Delivery
                  </Button>
                  <Button
                    onClick={() => handleStartConversation(currentOrder.professional, currentOrder.professionalAvatar)}
                    variant="outline"
                    className="font-['Roboto',sans-serif]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Request Revision
                  </Button>
                  <Button
                    onClick={() => handleStartConversation(currentOrder.professional, currentOrder.professionalAvatar)}
                    variant="outline"
                    className="font-['Roboto',sans-serif]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </div>
            )}

            {currentOrder.deliveryStatus === "completed" && !currentOrder.rating && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  ✅ Service Completed
                </h4>
                <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                  This service has been completed on <span className="text-[#2c353f]">{currentOrder.completedDate ? formatDate(currentOrder.completedDate) : "today"}</span>. Please take a moment to rate your experience with {currentOrder.professional}.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => setIsRatingDialogOpen(true)}
                    className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Roboto',sans-serif]"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Rate & Review
                  </Button>
                </div>
              </div>
            )}

            {currentOrder.deliveryStatus === "completed" && currentOrder.rating && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  ✅ Service Completed
                </h4>
                <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
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
                    <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] italic">
                      "{currentOrder.review}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentOrder.deliveryStatus === "dispute" && (
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <h4 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f] mb-3">
                  Your order is being disputed!
                </h4>
                <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                  {currentOrder.professional} is disputing the work you have delivered. They are currently waiting for your response. Please respond before the deadline. Click "View Dispute" to reply, add additional information, make, reject, or accept an offer.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDisputeSection(!showDisputeSection)}
                    className="bg-white hover:bg-gray-50 text-[#2c353f] border-2 border-[#FE8A0F] font-['Roboto',sans-serif]"
                  >
                    {showDisputeSection ? "Hide Dispute" : "View Dispute"}
                  </Button>
                  <Button
                    onClick={() => handleStartConversation(currentOrder.professional, currentOrder.professionalAvatar)}
                    variant="outline"
                    className="font-['Roboto',sans-serif]"
                  >
                    Chat
                  </Button>
                </div>
              </div>
            )}

            {/* Timeline Events */}
            <div className="space-y-0">
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
                      <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-1">
                        You made an offer.{" "}
                        <span className="text-[#6b6b6b] italic">Thu 11th September, 2025 17:21</span>
                      </p>
                      
                      {/* Orange Alert Box */}
                      <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mt-3">
                        <div className="flex gap-2">
                          <Info className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <p className="font-['Roboto',sans-serif] text-[13px] text-orange-800">
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
                      <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
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
                      <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-3">
                        <span className="text-blue-600">{currentOrder.professional}</span>{" "}
                        initiated a dispute against your order on{" "}
                        <span className="text-[#6b6b6b] italic">Thu 11th September, 2025 16:18</span>
                      </p>
                      
                      {/* Dispute Reason Box */}
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
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
                    <h3 className="font-['Roboto',sans-serif] text-[20px] text-[#2c353f] mb-4">
                      Dispute Details
                    </h3>
                    
                    {/* Dispute Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                            Dispute ID:
                          </p>
                          <p className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
                            {dispute.id.replace("DISP-", "")}
                          </p>
                        </div>
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                            Case status:
                          </p>
                          <p className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
                            {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                          </p>
                        </div>
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                            Decided in:
                          </p>
                          <p className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
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
                                        <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                                          Claimant:
                                        </p>
                                      )}
                                      <p className="font-['Roboto',sans-serif] text-[15px] text-[#3D78CB]">
                                        {msg.userName}
                                      </p>
                                      {showDeadline && (
                                        <p className="font-['Roboto',sans-serif] text-[13px] text-[#d97706] mt-1">
                                          Deadline: No reply
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2">
                                    {msg.message}
                                  </p>
                                  <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] text-right">
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
                    <h4 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-1">
                      Delivery #1
                    </h4>
                    <p className="font-['Roboto',sans-serif] text-[13px] mb-3">
                      <span className="text-blue-600">{currentOrder.professional}</span>{" "}
                      <span className="text-[#6b6b6b]">delivered your order</span>{" "}
                      <span className="text-[#6b6b6b] italic">Thu 13th November, 2025 15:39</span>
                    </p>

                    {/* Delivery Content Box */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-3">
                        hghghgh
                      </p>
                      
                      {/* Attachments */}
                      <div>
                        <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2">
                          Attachments
                        </p>
                        <div className="bg-white border border-gray-200 rounded-lg p-2 inline-block">
                          <img 
                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwY2hhcnQlMjBzcHJlYWRzaGVldHxlbnwxfHx8fDE3NjMxNDk0Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                            alt="Delivery attachment"
                            className="w-48 h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Approval Message */}
                    <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                      <div className="flex gap-2 mb-4">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="font-['Roboto',sans-serif] text-[14px] text-blue-900">
                          Your work has been delivered. Please approve the delivery or request a revision. You have until 14th November 2025 to respond. If no action is taken by then, the order will be automatically completed.
                        </p>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => handleAcceptDelivery(currentOrder.id)}
                          className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Roboto',sans-serif] text-[14px] px-6"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRequestRevision(currentOrder.id)}
                          variant="outline"
                          className="font-['Roboto',sans-serif] text-[14px] border-blue-600 text-blue-600 hover:bg-blue-50 px-6"
                        >
                          Request Modification
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Data Updated */}
              {currentOrder.deliveryStatus === "delivered" && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: "20px" }} />
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                      Your delivery data was updated to Sun 12th October, 2025 17:00-
                    </p>
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
                    <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
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
                      <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                        Additional Information
                      </p>
                      <ChevronDown className="w-4 h-4 text-[#6b6b6b] transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        {currentOrder.address && (
                          <div>
                            <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Service Address
                            </p>
                            <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
                              {currentOrder.address.addressLine1}
                              {currentOrder.address.addressLine2 && `, ${currentOrder.address.addressLine2}`}
                              <br />
                              {currentOrder.address.city}, {currentOrder.address.postcode}
                            </p>
                          </div>
                        )}
                        {currentOrder.description && (
                          <div>
                            <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Requirements
                            </p>
                            <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
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
                      <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                        Order Created
                      </p>
                      <ChevronDown className="w-4 h-4 text-[#6b6b6b] transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Order Date
                          </p>
                          <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
                            {formatDate(currentOrder.date)}
                          </p>
                        </div>
                        {currentOrder.scheduledDate && (
                          <div>
                            <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Scheduled Date
                            </p>
                            <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
                              {formatDate(currentOrder.scheduledDate)}
                              {currentOrder.booking?.timeSlot && ` - ${currentOrder.booking.timeSlot}`}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Order Amount
                          </p>
                          <p className="font-['Roboto',sans-serif] text-[16px] text-[#FE8A0F]">
                            {currentOrder.amount}
                          </p>
                        </div>
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Professional
                          </p>
                          <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
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
              <h2 className="font-['Roboto',sans-serif] text-[24px] text-[#2c353f] mb-4">
                {currentOrder.service}
              </h2>

              {/* Service Category */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6">
                <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                  {currentOrder.category || "Professional Service"}
                </p>
              </div>

              {/* Offer Includes Section */}
              <div className="mb-6">
                <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
                  Offer Includes
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li className="font-['Roboto',sans-serif] text-[14px] text-blue-600 hover:underline cursor-pointer">
                    Professional service delivery
                  </li>
                  <li className="font-['Roboto',sans-serif] text-[14px] text-blue-600 hover:underline cursor-pointer">
                    Quality assured work
                  </li>
                  {currentOrder.description && (
                    <li className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
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
                      <td className="px-4 py-3 font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                        Price
                      </td>
                      <td className="px-4 py-3 text-right font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                        £10.00/Hours
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                        Delivered by
                      </td>
                      <td className="px-4 py-3 text-right font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                        {currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : "10-12-2025"}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-4 py-3 font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                        Total no. of Hours
                      </td>
                      <td className="px-4 py-3 text-right font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                        2
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                        Price
                      </td>
                      <td className="px-4 py-3 text-right font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                        £10.00
                      </td>
                    </tr>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-4 py-3 font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                        Sub Total
                      </td>
                      <td className="px-4 py-3 text-right font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                        £20.00
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                        Service Fee
                      </td>
                      <td className="px-4 py-3 text-right font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                        £5.00
                      </td>
                    </tr>
                    <tr className="bg-gray-50 border-t-2 border-gray-300">
                      <td className="px-4 py-3 font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
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
            {/* Additional Information Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f] mb-2">
                    Additional Information
                  </h3>
                  <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                    {currentOrder.description || "No additional information"}
                  </p>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-['Roboto',sans-serif] text-[13px] ml-4"
                  onClick={() => toast.info("Add additional information feature coming soon")}
                >
                  + Add now
                </Button>
              </div>
            </div>

            {/* Task Address Section */}
            {currentOrder.address && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f] mb-3">
                  Task Address
                </h3>
                <p className="font-['Roboto',sans-serif] text-[14px] text-red-600">
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
              {currentOrder.deliveryStatus === "delivered" && (
                <div className="space-y-4">
                  {/* Delivery Header with Icon */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f] mb-1">
                        Delivery #1
                      </h3>
                      <p className="font-['Roboto',sans-serif] text-[13px]">
                        <span className="text-blue-600 hover:underline cursor-pointer">{currentOrder.professional}</span>
                        <span className="text-[#6b6b6b]"> delivered your order </span>
                        <span className="text-[#6b6b6b] italic">Thu 13th November, 2025 15:39</span>
                      </p>
                    </div>
                  </div>

                  {/* Delivery Message */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-3">
                      hghghgh
                    </p>
                    
                    {/* Attachments */}
                    <div>
                      <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] mb-2">
                        Attachments
                      </p>
                      <div className="bg-white border border-gray-200 rounded-lg p-2">
                        <img 
                          src="figma:asset/ceb5b6720e3269befdddcc705386f48bb0ee26a5.png" 
                          alt="Delivery attachment"
                          className="w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Approval Message */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-2 mb-3">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
                        Your work has been delivered. Please approve the delivery or request a revision. You have until 14th November 2025 to respond. If no action is taken by then, the order will be automatically completed.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptDelivery(currentOrder.id)}
                        className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Roboto',sans-serif] text-[13px]"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRequestRevision(currentOrder.id)}
                        variant="outline"
                        className="font-['Roboto',sans-serif] text-[13px]"
                      >
                        Request Modification
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {currentOrder.deliveryStatus === "active" && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                    Your order is currently being processed by the professional.
                  </p>
                </div>
              )}

              {currentOrder.deliveryStatus === "completed" && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-1">
                      Order Completed
                    </p>
                    <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                      This order has been completed and accepted.
                    </p>
                  </div>

                  {currentOrder.rating && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
                          Your Rating
                        </h4>
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
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
                <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-6">
                  Order Details
                </h3>

                {/* Service Preview */}
                <div className="mb-6">
                  <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
                    Service
                  </p>
                  <div className="flex gap-3 items-start">
                    <img 
                      src="https://images.unsplash.com/photo-1678924133506-7508daa13c7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGluc3RhbGxhdGlvbiUyMHdvcmt8ZW58MXx8fHwxNzYzMTQ5NDI3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Service thumbnail"
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
                        {currentOrder.service}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Professional */}
                <div className="mb-6">
                  <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-3">
                    Ordered From
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentOrder.professionalAvatar} />
                      <AvatarFallback>{currentOrder.professional?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
                        {currentOrder.professional}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-['Roboto',sans-serif] text-[11px] text-[#6b6b6b]">
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
                      className="flex-1 font-['Roboto',sans-serif] text-[12px] h-8"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Delivery Date */}
                <div className="mb-6">
                  <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                    Delivery Date
                  </p>
                  <div className="flex items-center gap-2 text-[#2c353f]">
                    <Calendar className="w-4 h-4 text-[#6b6b6b]" />
                    <span className="font-['Roboto',sans-serif] text-[13px]">
                      {currentOrder.scheduledDate ? formatDate(currentOrder.scheduledDate) : "14 Nov 2024"}
                    </span>
                  </div>
                  {currentOrder.booking?.timeSlot && (
                    <div className="flex items-center gap-2 text-[#2c353f] mt-2">
                      <Clock className="w-4 h-4 text-[#6b6b6b]" />
                      <span className="font-['Roboto',sans-serif] text-[13px]">
                        {currentOrder.booking.timeSlot}
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="mb-6" />

                {/* Total Price */}
                <div className="mb-6">
                  <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                    Total Price
                  </p>
                  <p className="font-['Roboto',sans-serif] text-[24px] text-[#FE8A0F]">
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
                        className="w-full font-['Roboto',sans-serif] text-[13px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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
                    className="mb-4 font-['Roboto',sans-serif] text-[13px] hover:text-[#FE8A0F]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Order Details
                  </Button>

                  <h2 className="font-['Roboto',sans-serif] text-[24px] text-[#2c353f] mb-6">
                    Order payment dispute
                  </h2>

                  {/* Dispute Info Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                          Dispute ID:
                        </p>
                        <p className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
                          {dispute.id.replace("DISP-", "")}
                        </p>
                      </div>
                      <div>
                        <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                          Case status:
                        </p>
                        <p className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
                          {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                          Decided in:
                        </p>
                        <p className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
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
                                      <p className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                                        Claimant:
                                      </p>
                                    )}
                                    <p className="font-['Roboto',sans-serif] text-[15px] text-[#3D78CB]">
                                      {msg.userName}
                                    </p>
                                    {showDeadline && (
                                      <p className="font-['Roboto',sans-serif] text-[13px] text-[#d97706] mt-1">
                                        Deadline: No reply
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2">
                                  {msg.message}
                                </p>
                                <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] text-right">
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
                    <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                      Total disputed milestone<br />amount: <span className="text-[32px] text-[#2c353f]">£ {dispute.amount}</span>
                    </p>
                    <Separator className="my-4" />
                    <button className="font-['Roboto',sans-serif] text-[14px] text-[#3D78CB] hover:underline mb-4">
                      Show Milestones
                    </button>
                    
                    {/* Offers Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                          Professional ({dispute.respondentName})<br />want to receive:
                        </p>
                        <p className="font-['Roboto',sans-serif] text-[26px] text-[#2c353f]">
                          £{dispute.respondentOffer?.amount.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                          Client ({dispute.claimantName})<br />wants to pay:
                        </p>
                        <p className="font-['Roboto',sans-serif] text-[26px] text-[#2c353f]">
                          £{dispute.claimantOffer?.amount.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Agreed Amount */}
                    <div className="text-center">
                      <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                        Agreed: <span className="text-[18px] text-[#2c353f]">£ 0.00</span>
                      </p>
                      {dispute.status === "closed" && (
                        <p className="font-['Roboto',sans-serif] text-[16px] text-red-600 mt-2">
                          RESOLVED, DISPUTE CLOSED
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Rating Dialog */}
        <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
          <DialogContent className="w-[70vw]">
            <DialogHeader>
              <DialogTitle className="font-['Roboto',sans-serif] text-[20px]">
                Rate Your Service
              </DialogTitle>
              <DialogDescription className="sr-only">
                Provide your rating and review for the service
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Star Rating */}
              <div>
                <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-3">
                  How would you rate this service?
                </p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Review Text */}
              <div>
                <Label className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Write a review (optional)
                </Label>
                <Textarea
                  placeholder="Share your experience with this professional..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  className="font-['Roboto',sans-serif] text-[13px]"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitRating}
                className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] font-['Roboto',sans-serif]"
              >
                Submit Rating
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="w-[70vw]">
            <DialogHeader>
              <DialogTitle className="font-['Roboto',sans-serif] text-[20px]">
                Cancel Order
              </DialogTitle>
              <DialogDescription className="sr-only">
                Cancel this order and provide a reason
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
                  ⚠️ Are you sure you want to cancel this order? This action cannot be undone.
                </p>
              </div>

              <div>
                <Label className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Reason for Cancellation
                </Label>
                <Textarea
                  placeholder="Please provide a reason for cancelling this order..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  className="font-['Roboto',sans-serif] text-[13px]"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setIsCancelDialogOpen(false);
                    setCancelReason("");
                  }}
                  variant="outline"
                  className="flex-1 font-['Roboto',sans-serif]"
                >
                  Keep Order
                </Button>
                <Button
                  onClick={handleCancelOrder}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-['Roboto',sans-serif]"
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
              <DialogTitle className="font-['Roboto',sans-serif] text-[20px] text-[#2c353f]">
                Open a Dispute
              </DialogTitle>
              <DialogDescription className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                If you're not satisfied with the delivery, you can open a dispute. Our team will review the case and help resolve the issue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dispute-reason" className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Reason for Dispute *
                </Label>
                <Textarea
                  id="dispute-reason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Please describe the issue with the order..."
                  rows={4}
                  className="font-['Roboto',sans-serif] text-[14px]"
                />
              </div>
              <div>
                <Label htmlFor="dispute-evidence" className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Additional Evidence (Optional)
                </Label>
                <Textarea
                  id="dispute-evidence"
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  placeholder="Provide any additional details, timestamps, or descriptions that support your case..."
                  rows={3}
                  className="font-['Roboto',sans-serif] text-[14px]"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] mb-2">
                      What happens next?
                    </p>
                    <ul className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] space-y-1 list-disc list-inside">
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
                  className="font-['Roboto',sans-serif]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDispute}
                  className="bg-red-600 hover:bg-red-700 text-white font-['Roboto',sans-serif]"
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
          <h2 className="font-['Roboto',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
            My Orders
          </h2>
          <p className="font-['Roboto',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
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
              className="pl-9 w-full font-['Roboto',sans-serif] text-[13px]"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 font-['Roboto',sans-serif] text-[13px]">
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
      <div className="flex lg:grid lg:grid-cols-4 gap-3 md:gap-4 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0">
          <p className="font-['Roboto',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-1 md:mb-2">
            Total Orders
          </p>
          <p className="font-['Roboto',sans-serif] text-[26px] md:text-[32px] text-[#2c353f]">
            {orders.length}
          </p>
        </div>

        {/* Pending */}
        <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-4 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0">
          <p className="font-['Roboto',sans-serif] text-[13px] md:text-[14px] text-[#92400E] mb-1 md:mb-2">
            Pending
          </p>
          <p className="font-['Roboto',sans-serif] text-[26px] md:text-[32px] text-[#92400E]">
            {activeOrders.length}
          </p>
        </div>

        {/* Confirmed */}
        <div className="bg-[#DBEAFE] border border-[#BFDBFE] rounded-xl p-4 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0">
          <p className="font-['Roboto',sans-serif] text-[13px] md:text-[14px] text-[#1E40AF] mb-1 md:mb-2">
            Confirmed
          </p>
          <p className="font-['Roboto',sans-serif] text-[26px] md:text-[32px] text-[#1E40AF]">
            {deliveredOrders.length}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl p-4 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0">
          <p className="font-['Roboto',sans-serif] text-[13px] md:text-[14px] text-[#065F46] mb-1 md:mb-2">
            Completed
          </p>
          <p className="font-['Roboto',sans-serif] text-[26px] md:text-[32px] text-[#065F46]">
            {completedOrders.length}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full justify-start sm:grid sm:grid-cols-5 gap-1">
            <TabsTrigger
              value="active"
              className="font-['Roboto',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <Package className="w-4 h-4 mr-2" />
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="delivered"
              className="font-['Roboto',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Delivered ({deliveredOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="font-['Roboto',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completed ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="font-['Roboto',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelled ({cancelledOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="dispute"
              className="font-['Roboto',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Dispute ({disputeOrders.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                No active orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Roboto',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Status</TableHead>
                    <TableHead className="font-['Roboto',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Roboto',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Roboto',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(order.deliveryStatus)} font-['Roboto',sans-serif] text-[11px]`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.deliveryStatus)}
                            {order.deliveryStatus?.toUpperCase()}
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
                                  id: `prof-${order.id}`,
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

        <TabsContent value="delivered" className="space-y-4">
          {deliveredOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                No delivered orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Roboto',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Status</TableHead>
                    <TableHead className="font-['Roboto',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Roboto',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Roboto',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(order.deliveryStatus)} font-['Roboto',sans-serif] text-[11px]`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.deliveryStatus)}
                            {order.deliveryStatus?.toUpperCase()}
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
                                  id: `prof-${order.id}`,
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

        <TabsContent value="completed" className="space-y-4">
          {completedOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                No completed orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Roboto',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Rating</TableHead>
                    <TableHead className="font-['Roboto',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Roboto',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Roboto',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        {order.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-['Roboto',sans-serif] text-[13px]">{order.rating}</span>
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
                                  id: `prof-${order.id}`,
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

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                No cancelled orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Roboto',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Status</TableHead>
                    <TableHead className="font-['Roboto',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancelledOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Roboto',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Roboto',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(order.deliveryStatus)} font-['Roboto',sans-serif] text-[11px]`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.deliveryStatus)}
                            {order.deliveryStatus?.toUpperCase()}
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

        <TabsContent value="dispute" className="space-y-4">
          {disputeOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
                No disputed orders
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Roboto',sans-serif]">Service</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Professional</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Order Date</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Amount</TableHead>
                    <TableHead className="font-['Roboto',sans-serif]">Status</TableHead>
                    <TableHead className="font-['Roboto',sans-serif] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputeOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={order.professionalAvatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Roboto',sans-serif] text-[11px]">
                              {order.professional?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Roboto',sans-serif] text-[13px]">{order.professional}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[13px]">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="font-['Roboto',sans-serif] text-[14px] text-[#FE8A0F]">
                        {order.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(order.deliveryStatus)} font-['Roboto',sans-serif] text-[11px]`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.deliveryStatus)}
                            {order.deliveryStatus?.toUpperCase()}
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
                                  id: `prof-${order.id}`,
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

      {/* Rating Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent className="w-[70vw]">
          <DialogHeader>
            <DialogTitle className="font-['Roboto',sans-serif] text-[20px]">
              Rate Your Service
            </DialogTitle>
            <DialogDescription className="sr-only">
              Provide your rating and review for the service
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Star Rating */}
            <div>
              <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-3">
                How would you rate this service?
              </p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Review Text */}
            <div>
              <Label className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Write a review (optional)
              </Label>
              <Textarea
                placeholder="Share your experience with this professional..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                className="font-['Roboto',sans-serif] text-[13px]"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitRating}
              className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] font-['Roboto',sans-serif]"
            >
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
