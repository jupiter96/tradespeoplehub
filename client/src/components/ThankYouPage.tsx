import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Calendar, Package, MapPin, Clock, Upload, X, Image, FileText, Film, ChevronDown, ChevronUp } from "lucide-react";
import SEOHead from "./SEOHead";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useOrders } from "./OrdersContext";
import { toast } from "sonner";

interface OrderAdditionalInfo {
  message: string;
  files: File[];
  isSubmitting: boolean;
  isSubmitted: boolean;
  isExpanded: boolean;
}

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orders, addAdditionalInfo } = useOrders();
  
  // Support for both single orderId and multiple orderIds
  const orderId = searchParams.get("orderId");
  const orderIdsParam = searchParams.get("orderIds");
  
  // Parse order IDs
  const orderIds = orderIdsParam 
    ? orderIdsParam.split(',').filter(id => id.trim())
    : orderId 
      ? [orderId]
      : [];
  
  const [currentOrders, setCurrentOrders] = useState<any[]>([]);
  const [orderAdditionalInfo, setOrderAdditionalInfo] = useState<{[key: string]: OrderAdditionalInfo}>({});
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  useEffect(() => {
    if (orderIds.length > 0 && orders.length > 0) {
      const foundOrders = orders.filter((o) => orderIds.includes(o.id));
      setCurrentOrders(foundOrders);
      
      // Initialize additional info state for each order
      const initialState: {[key: string]: OrderAdditionalInfo} = {};
      foundOrders.forEach(order => {
        initialState[order.id] = {
          message: '',
          files: [],
          isSubmitting: false,
          isSubmitted: !!order.additionalInformation?.submittedAt,
          isExpanded: foundOrders.length === 1, // Auto-expand if single order
        };
      });
      setOrderAdditionalInfo(initialState);
    }
  }, [orderIds.join(','), orders]);

  const handleFileSelect = (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

      setOrderAdditionalInfo(prev => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          files: [...(prev[orderId]?.files || []), ...validFiles].slice(0, 10)
        }
      }));
    }
  };

  const handleRemoveFile = (orderId: string, index: number) => {
    setOrderAdditionalInfo(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        files: prev[orderId]?.files.filter((_, i) => i !== index) || []
      }
    }));
  };

  const handleMessageChange = (orderId: string, message: string) => {
    setOrderAdditionalInfo(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        message
      }
    }));
  };

  const toggleExpand = (orderId: string) => {
    setOrderAdditionalInfo(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        isExpanded: !prev[orderId]?.isExpanded
      }
    }));
  };

  const handleSubmitAdditionalInfo = async (orderId: string) => {
    const info = orderAdditionalInfo[orderId];
    if (!info?.message?.trim() && (!info?.files || info.files.length === 0)) {
      toast.error("Please add a message or upload files");
      return;
    }

    setOrderAdditionalInfo(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], isSubmitting: true }
    }));

    try {
      await addAdditionalInfo(orderId, info.message, info.files.length > 0 ? info.files : undefined);
      setOrderAdditionalInfo(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], isSubmitting: false, isSubmitted: true }
      }));
      toast.success(`Additional information saved for order ${orderId}!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit additional information");
      setOrderAdditionalInfo(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], isSubmitting: false }
      }));
    }
  };

  const handleSkipAdditionalInfo = (orderId: string) => {
    setOrderAdditionalInfo(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], isSubmitted: true }
    }));
    toast.info("You can add additional information later from your order details page.");
  };

  const handleViewOrders = () => {
    if (orderIds.length === 1) {
      navigate(`/account?tab=orders&orderId=${orderIds[0]}`);
    } else {
      navigate('/account?tab=orders');
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Render single order card
  const renderOrderCard = (order: any) => {
    const info = orderAdditionalInfo[order.id] || { message: '', files: [], isSubmitting: false, isSubmitted: false, isExpanded: false };
    
    return (
      <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Order Header - Clickable to expand/collapse */}
        <button
          onClick={() => toggleExpand(order.id)}
          className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-semibold">
                {order.service}
              </p>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                Order: {order.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-['Poppins',sans-serif] text-[16px] text-[#66BB6A] font-semibold">
              {order.amount}
            </span>
            {info.isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {info.isExpanded && (
          <div className="border-t border-gray-200 p-4 md:p-6">
            {/* Order Details */}
            <div className="space-y-3 mb-6">
              {/* Appointment Date and Time */}
              {(order.booking?.date || order.scheduledDate) && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#66BB6A]" />
                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {formatDate(order.booking?.date || order.scheduledDate)}
                    {order.booking?.time && ` at ${order.booking.time}`}
                  </span>
                </div>
              )}
              {order.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#66BB6A]" />
                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {order.address.address || order.address.addressLine1}, {order.address.city}
                  </span>
                </div>
              )}
            </div>

            {/* Additional Information Section */}
            {!info.isSubmitted ? (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] font-semibold mb-3">
                  Add Additional Information
                </h3>
                
                {/* Message Input */}
                <Textarea
                  placeholder="Enter any special requirements..."
                  value={info.message}
                  onChange={(e) => handleMessageChange(order.id, e.target.value)}
                  rows={3}
                  className="font-['Poppins',sans-serif] text-[13px] mb-3 bg-white"
                />

                {/* File Upload */}
                <div 
                  className="border-2 border-dashed border-[#3D78CB] rounded-lg p-4 text-center hover:bg-white transition-colors cursor-pointer mb-3"
                  onClick={() => fileInputRefs.current[order.id]?.click()}
                >
                  <input
                    ref={el => fileInputRefs.current[order.id] = el}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    multiple
                    onChange={(e) => handleFileSelect(order.id, e)}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <Image className="w-5 h-5 text-[#3D78CB]" />
                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#3D78CB]">
                      Upload Files ({info.files.length}/10)
                    </span>
                  </div>
                </div>

                {/* Selected Files */}
                {info.files.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {info.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                        {getFileIcon(file)}
                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] flex-1 truncate">
                          {file.name}
                        </span>
                        <button onClick={() => handleRemoveFile(order.id, index)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleSkipAdditionalInfo(order.id)}
                    className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] hover:text-[#2c353f] underline"
                  >
                    Skip
                  </button>
                  <Button
                    onClick={() => handleSubmitAdditionalInfo(order.id)}
                    disabled={info.isSubmitting || (!info.message?.trim() && info.files.length === 0)}
                    className="bg-[#3D78CB] hover:bg-[#2D5CA3] text-white font-['Poppins',sans-serif] text-[12px] px-4 py-2 rounded-lg"
                  >
                    {info.isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 rounded-lg p-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-['Poppins',sans-serif] text-[13px] text-green-700">
                  Additional information submitted
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <SEOHead
        title="Thank You for Your Purchase"
        description="Your order has been placed successfully. A receipt has been sent to your email address."
        robots="noindex,nofollow"
      />
      <div className="min-h-screen bg-gradient-to-br from-[#29fa2b] to-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <div className="pt-[120px] md:pt-[140px] pb-12 md:pb-20">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              {/* Thank You Banner */}
              <div className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 max-w-[700px] w-full shadow-lg border border-gray-200 mt-8 md:mt-12">
                <div className="flex items-start gap-4 md:gap-6">
                  {/* Checkmark Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-600" strokeWidth={2.5} />
                    </div>
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1 pt-1">
                    <h1 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] lg:text-[28px] text-green-600 font-semibold mb-2">
                      Thank You for your Purchase
                    </h1>
                    <p className="font-['Poppins',sans-serif] text-[14px] md:text-[16px] text-[#6b6b6b]">
                      {currentOrders.length > 1 
                        ? `${currentOrders.length} orders have been placed. Receipts were sent to your email.`
                        : 'A receipt was sent to your email address'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              {currentOrders.length > 0 && (
                <div className="mt-8 md:mt-12 w-full max-w-[700px] space-y-4">
                  <h2 className="font-['Poppins',sans-serif] text-[18px] md:text-[20px] text-[#2c353f] font-semibold mb-4">
                    Your Orders ({currentOrders.length})
                  </h2>
                  {currentOrders.map(order => renderOrderCard(order))}
                </div>
              )}

              {/* No Orders Found */}
              {currentOrders.length === 0 && orderIds.length > 0 && (
                <div className="mt-8 md:mt-12 w-full max-w-[600px] bg-yellow-50 rounded-xl border border-yellow-200 p-6 text-center">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-yellow-700">
                    Loading order details... Please wait or check your account page.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-[700px]">
                <Button
                  onClick={handleViewOrders}
                  className="w-full sm:w-auto bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white py-6 px-8 rounded-full transition-all duration-300 font-['Poppins',sans-serif] text-[16px]"
                >
                  View Orders
                </Button>
                <Button
                  onClick={() => navigate("/services")}
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-gray-300 text-[#6b6b6b] hover:bg-gray-50 py-6 px-8 rounded-full transition-all duration-300 font-['Poppins',sans-serif] text-[16px]"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
