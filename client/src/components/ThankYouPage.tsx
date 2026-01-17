import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Calendar, Package, MapPin, Clock } from "lucide-react";
import SEOHead from "./SEOHead";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { Button } from "./ui/button";
import { useOrders } from "./OrdersContext";

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orders } = useOrders();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setCurrentOrder(order);
      }
    }
  }, [orderId, orders]);

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

              {/* Action Buttons */}
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-[600px]">
                <Button
                  onClick={() => navigate("/account?tab=orders")}
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
