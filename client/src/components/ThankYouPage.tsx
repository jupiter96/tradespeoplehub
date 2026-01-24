import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Calendar, MapPin, Package, Clock } from "lucide-react";
import SEOHead from "./SEOHead";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { Button } from "./ui/button";
import { useOrders } from "./OrdersContext";


export default function ThankYouPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orders } = useOrders();
  
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

  useEffect(() => {
    if (orderIds.length > 0 && orders.length > 0) {
      const foundOrders = orders.filter((o) => orderIds.includes(o.id));
      setCurrentOrders(foundOrders);
      
      // Auto-navigate to order details after 2 seconds
      const timer = setTimeout(() => {
        if (orderIds.length === 1) {
          navigate(`/account?tab=orders&orderId=${orderIds[0]}`, { replace: true });
        } else {
          navigate('/account?tab=orders', { replace: true });
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [orderIds.join(','), orders, navigate]);


  const handleViewOrders = () => {
    if (orderIds.length === 1) {
      navigate(`/account?tab=orders&orderId=${orderIds[0]}`);
    } else {
      navigate('/account?tab=orders');
    }
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

  // Get time slot (Morning, Afternoon, Evening) for a time
  const getTimeSlot = (time: string): string => {
    const [hour] = time.split(':').map(Number);
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  // Format time with time slot (e.g., "12:30 (Afternoon)")
  const formatTime = (time?: string, timeSlot?: string): string => {
    if (!time) return "";
    const slot = timeSlot || getTimeSlot(time);
    return `${time} (${slot})`;
  };

  // Render single order card
  const renderOrderCard = (order: any) => {
    const appointmentDate = order.booking?.date || order.scheduledDate;
    const appointmentTime = order.booking?.time;
    const timeSlot = order.booking?.timeSlot;
    const formattedTime = appointmentTime ? formatTime(appointmentTime, timeSlot) : "";

    return (
      <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
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
        </div>
        
        {/* Order Details Section */}
        <div className="mt-6">
          <h3 className="font-['Poppins',sans-serif] text-[18px] md:text-[20px] text-[#2c353f] font-bold mb-4">
            Order Details
          </h3>
          
          <div className="space-y-4">
            {/* Order ID */}
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Order ID</p>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{order.id}</p>
              </div>
            </div>

            {/* Service */}
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Service</p>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
              </div>
            </div>

            {/* Appointment Date */}
            {appointmentDate && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Appointment Date</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{formatDate(appointmentDate)}</p>
                </div>
              </div>
            )}

            {/* Appointment Time */}
            {formattedTime && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Appointment Time</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{formattedTime}</p>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            {order.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Delivery Address</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                    {order.address.address || order.address.addressLine1}
                    {order.address.city && (
                      <>
                        <br />
                        {order.address.city}
                        {order.address.postcode && `, ${order.address.postcode}`}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Total Amount */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-[#66BB6A] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Total Amount</p>
                  <p className="font-['Poppins',sans-serif] text-[18px] md:text-[20px] text-[#2c353f] font-bold">
                    {order.amount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-6 md:gap-8 min-h-[60vh] mt-8 md:mt-12">
              {/* Thank You Banner - half width, centered */}
              <div className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 w-full max-w-[350px] md:max-w-[50%] md:min-w-[320px] md:flex-1 shadow-lg border border-gray-200">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-600" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex-1 pt-1 min-w-0">
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

              {/* Order Details - half width, centered */}
              {currentOrders.length > 0 && (
                <div className="w-full max-w-[350px] md:max-w-[50%] md:min-w-[320px] md:flex-1 space-y-4">
                  <h2 className="font-['Poppins',sans-serif] text-[18px] md:text-[20px] text-[#2c353f] font-semibold mb-4">
                    Your Orders ({currentOrders.length})
                  </h2>
                  {currentOrders.map(order => renderOrderCard(order))}
                </div>
              )}

              {/* No Orders Found */}
              {currentOrders.length === 0 && orderIds.length > 0 && (
                <div className="w-full max-w-[350px] md:max-w-[50%] md:min-w-[320px] bg-yellow-50 rounded-xl border border-yellow-200 p-6 text-center">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-yellow-700">
                    Loading order details... Please wait or check your account page.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons - centered */}
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
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
        <Footer />
      </div>
    </>
  );
}
