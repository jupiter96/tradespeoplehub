import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Calendar, Package, MapPin, Clock, Upload, X, Image, FileText, Film } from "lucide-react";
import SEOHead from "./SEOHead";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useOrders } from "./OrdersContext";
import { toast } from "sonner";

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orders, addAdditionalInfo } = useOrders();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [additionalMessage, setAdditionalMessage] = useState("");
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setCurrentOrder(order);
        // Check if additional info already submitted
        if (order.additionalInformation?.submittedAt) {
          setIsSubmitted(true);
        }
      }
    }
  }, [orderId, orders]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setAdditionalFiles(prev => [...prev, ...validFiles].slice(0, 10));
    }
  };

  const handleRemoveFile = (index: number) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAdditionalInfo = async () => {
    if (!additionalMessage.trim() && additionalFiles.length === 0) {
      toast.error("Please add a message or upload files");
      return;
    }

    if (!orderId) return;

    setIsSubmitting(true);
    try {
      await addAdditionalInfo(orderId, additionalMessage, additionalFiles.length > 0 ? additionalFiles : undefined);
      toast.success("Additional information submitted successfully!");
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit additional information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipAdditionalInfo = () => {
    setIsSubmitted(true);
    toast.info("You can add additional information later from your order details page.");
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
              <div className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 max-w-[600px] w-full shadow-lg border border-gray-200 mt-8 md:mt-12">
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
                      A receipt was sent to your email address
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              {currentOrder && (
                <div className="mt-8 md:mt-12 w-full max-w-[600px] bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                  <h2 className="font-['Poppins',sans-serif] text-[18px] md:text-[20px] text-[#66BB6A] font-semibold mb-6">
                    Order Details
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Order ID */}
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                          Order ID
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#66BB6A]">
                          {currentOrder.id}
                        </p>
                      </div>
                    </div>

                    {/* Service */}
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                          Service
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#66BB6A]">
                          {currentOrder.service}
                        </p>
                      </div>
                    </div>

                    {/* Appointment Date and Time */}
                    {(currentOrder.booking?.date || currentOrder.scheduledDate) && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Appointment Date
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#66BB6A]">
                            {formatDate(currentOrder.booking?.date || currentOrder.scheduledDate)}
                          </p>
                        </div>
                      </div>
                    )}
                    {(currentOrder.booking?.time || currentOrder.booking?.timeSlot) && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Appointment Time
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#66BB6A]">
                            {currentOrder.booking?.time || currentOrder.booking?.timeSlot || 'TBD'}
                            {currentOrder.booking?.timeSlot && currentOrder.booking?.time && ` (${currentOrder.booking.timeSlot})`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Delivery Date */}
                    {currentOrder.scheduledDate && !currentOrder.booking?.date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Expected Delivery
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#66BB6A]">
                            {formatDate(currentOrder.scheduledDate)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Delivery Address */}
                    {currentOrder.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Delivery Address
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#66BB6A]">
                            {currentOrder.address.addressLine1}
                            {currentOrder.address.addressLine2 && `, ${currentOrder.address.addressLine2}`}
                            <br />
                            {currentOrder.address.city}{currentOrder.address.postcode && `, ${currentOrder.address.postcode}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                      <Package className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                          Total Amount
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[18px] text-[#66BB6A] font-semibold">
                          {currentOrder.amount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information Section */}
              {currentOrder && !isSubmitted && (
                <div className="mt-8 md:mt-12 w-full max-w-[600px] bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                  <h2 className="font-['Poppins',sans-serif] text-[18px] md:text-[20px] text-[#3D78CB] font-semibold mb-4">
                    Add additional information
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-6">
                    If you have any additional information or special requirements that you need the PRO to submit it now or click skip it below if you do not have one.
                  </p>

                  {/* Message Input */}
                  <div className="mb-4">
                    <label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      What do you need to add?
                    </label>
                    <Textarea
                      placeholder="Enter any special requirements or additional information..."
                      value={additionalMessage}
                      onChange={(e) => setAdditionalMessage(e.target.value)}
                      rows={4}
                      className="font-['Poppins',sans-serif] text-[14px] border-[#3D78CB] focus:border-[#3D78CB] focus:ring-[#3D78CB]"
                    />
                  </div>

                  {/* File Upload Area */}
                  <div className="mb-6">
                    <div 
                      className="border-2 border-dashed border-[#3D78CB] rounded-lg p-6 text-center hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        multiple
                        onChange={handleFileSelect}
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
                    {additionalFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                          Selected Files ({additionalFiles.length}/10):
                        </p>
                        <div className="space-y-2">
                          {additionalFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              {getFileIcon(file)}
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
                                  handleRemoveFile(index);
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

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleSkipAdditionalInfo}
                      className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] hover:text-[#2c5ba0] underline transition-colors"
                    >
                      Skip Additional Information
                    </button>
                    <Button
                      onClick={handleSubmitAdditionalInfo}
                      disabled={isSubmitting || (!additionalMessage.trim() && additionalFiles.length === 0)}
                      className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-['Poppins',sans-serif] text-[14px] px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Submitting..." : "Add Additional Information"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Success Message after submission */}
              {currentOrder && isSubmitted && currentOrder.additionalInformation?.submittedAt && (
                <div className="mt-8 md:mt-12 w-full max-w-[600px] bg-green-50 rounded-xl border border-green-200 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <h2 className="font-['Poppins',sans-serif] text-[16px] text-green-700 font-semibold">
                      Additional Information Submitted
                    </h2>
                  </div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-green-600">
                    Your additional information has been sent to the professional.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-[600px]">
                <Button
                  onClick={() => navigate(`/account?tab=orders${orderId ? `&orderId=${orderId}` : ''}`)}
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
