import { useState } from "react";
import { X, Calendar, Clock, MapPin, Plus, Minus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useOrders } from "./OrdersContext";
import { useMessenger } from "./MessengerContext";
import { useAccount } from "./AccountContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner@2.0.3";

interface OrderServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  professionalName: string;
  serviceName: string;
  servicePrice: string;
}

export default function OrderServiceModal({
  isOpen,
  onClose,
  professionalId,
  professionalName,
  serviceName,
  servicePrice,
}: OrderServiceModalProps) {
  const navigate = useNavigate();
  const { addDirectOrder } = useOrders();
  const { addMessage } = useMessenger();
  const { userInfo } = useAccount();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");

  const basePrice = parseFloat((servicePrice || "£0").toString().replace(/[^0-9.]/g, "")) || 0;
  const totalPrice = basePrice * quantity;

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !address || !postcode) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!userInfo?.id) {
      toast.error("Please login to place an order");
      return;
    }

    const orderId = `ORD-${Date.now()}`;
    
    // Create the order
    addDirectOrder({
      id: orderId,
      service: serviceName,
      professional: professionalName,
      amount: `£${totalPrice.toFixed(2)}`,
      status: "Pending",
      scheduledDate: `${selectedDate} ${selectedTime}`,
      deliveryStatus: "active",
      address: {
        name: userInfo?.name || "Client",
        addressLine1: address,
        city: "London",
        postcode: postcode,
        phone: userInfo?.phone || "+44 7XXX XXXXXX"
      },
      description: notes || `Order for ${serviceName}`,
      booking: {
        date: selectedDate,
        time: selectedTime,
      },
    });

    // Add order message to conversation
    addMessage(professionalId, {
      senderId: userInfo.id,
      text: `Order placed: ${serviceName}`,
      read: false,
      type: "order",
      orderId: orderId,
      orderDetails: {
        service: serviceName,
        amount: `£${totalPrice.toFixed(2)}`,
        date: `${selectedDate} ${selectedTime}`,
        status: "pending",
      },
    });

    toast.success("Order placed successfully!");
    onClose();
    
    // Navigate to orders page
    setTimeout(() => {
      navigate("/account?tab=orders");
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">
              Order Service
            </h2>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mt-1">
              from {professionalName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6b6b6b] hover:text-[#2c353f] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Service Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
              {serviceName}
            </h3>
            <div className="flex items-center justify-between">
              <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Price per unit
              </span>
              <span className="font-['Poppins',sans-serif] text-[18px] text-[#FE8A0F]">
                {servicePrice}
              </span>
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Quantity
            </Label>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] w-12 text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <div className="ml-auto">
                <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Total: 
                </span>
                <span className="font-['Poppins',sans-serif] text-[20px] text-[#FE8A0F] ml-2">
                  £{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
                Date *
              </Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 font-['Poppins',sans-serif]"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
                Time *
              </Label>
              <div className="relative mt-2">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="pl-10 font-['Poppins',sans-serif]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-6">
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Service Address *
            </Label>
            <div className="relative mt-2">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#6b6b6b]" />
              <Input
                type="text"
                placeholder="Enter full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-10 font-['Poppins',sans-serif]"
                required
              />
            </div>
          </div>

          {/* Postcode */}
          <div className="mb-6">
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Postcode *
            </Label>
            <Input
              type="text"
              placeholder="e.g., SW1A 1AA"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              className="font-['Poppins',sans-serif]"
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Additional Notes (Optional)
            </Label>
            <Textarea
              placeholder="Any special requirements or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="font-['Poppins',sans-serif] min-h-[100px] mt-2"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 font-['Poppins',sans-serif]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
            >
              Place Order - £{totalPrice.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
