import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Plus, Minus, Calendar as CalendarIcon, Clock, CheckCircle2, X, Package } from "lucide-react";
import { Separator } from "./ui/separator";
import { Calendar } from "./ui/calendar";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Addon {
  id: number;
  title: string;
  price: number;
}

interface Package {
  type: "basic" | "standard" | "premium";
  name: string;
  price: number;
  features: string[];
}

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    quantity: number;
    selectedAddons: number[];
    booking: { date: Date; time: string; timeSlot: string } | null;
    packageType?: string;
  }) => void;
  serviceTitle: string;
  sellerName: string;
  basePrice: number;
  addons?: Addon[];
  packages?: Package[];
  serviceImage: string;
  serviceType?: "in-person" | "online";
  onlineDeliveryDays?: string;
}

const timeSlots = [
  { slot: "Morning", times: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  { slot: "Afternoon", times: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"] },
  { slot: "Evening", times: ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30"] }
];

// Format date as local YYYY-MM-DD (avoids timezone shift from toISOString)
const formatLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function AddToCartModal({
  isOpen,
  onClose,
  onConfirm,
  serviceTitle,
  sellerName,
  basePrice,
  addons = [],
  packages = [],
  serviceImage,
  serviceType = "in-person",
  onlineDeliveryDays
}: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const hasPackages = packages.length > 0;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuantity(1);
      setSelectedAddons(new Set());
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedTimeSlot("");
      setSelectedPackage("");
      setActiveTab("details");
      setShowTimePicker(false);
    }
  }, [isOpen]);

  const handleAddonToggle = (addonId: number) => {
    setSelectedAddons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(addonId)) {
        newSet.delete(addonId);
      } else {
        newSet.add(addonId);
      }
      return newSet;
    });
  };

  const handleTimeClick = (time: string, slot: string) => {
    setSelectedTime(time);
    setSelectedTimeSlot(slot);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Fade out calendar and show time picker
      setTimeout(() => {
        setShowTimePicker(true);
      }, 300);
    }
  };

  const handleBackToCalendar = () => {
    setShowTimePicker(false);
    setSelectedTime("");
    setSelectedTimeSlot("");
  };

  const calculateTotal = () => {
    let price = basePrice || 0;
    
    // If package selected, use package price instead
    if (hasPackages && selectedPackage) {
      const pkg = packages.find(p => p.type === selectedPackage);
      if (pkg) {
        price = pkg.price;
      }
    }
    
    // Add addons
    const addonsTotal = addons
      .filter(addon => selectedAddons.has(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0);
    
    return (price + addonsTotal) * quantity;
  };

  const handleConfirm = () => {
    // For online services, no booking needed
    const booking = (serviceType === "online") ? null : (selectedDate && selectedTime && selectedTimeSlot
      ? { 
          date: formatLocalDateString(selectedDate),
          time: selectedTime, 
          timeSlot: selectedTimeSlot 
        }
      : null);
    onConfirm({
      quantity,
      selectedAddons: Array.from(selectedAddons),
      booking,
      packageType: selectedPackage || undefined
    });
    onClose();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // For online services, no booking needed, can proceed immediately
  // For in-person services, require date and time selection
  const canProceed = serviceType === "online" || (selectedDate && selectedTime);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[24px] md:text-[28px] text-[#2c353f]">
            Customize Your Order
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            {serviceType === "online" 
              ? "Configure service details and delivery time"
              : "Configure service details and select appointment time"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {/* Service Info */}
          <div className="flex gap-4 bg-gradient-to-r from-[#FFF5EB] to-[#FFE8CC] rounded-xl p-4 mb-6">
            <img 
              src={serviceImage} 
              alt={serviceTitle}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium mb-1">
                {serviceTitle}
              </h3>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                by {sellerName}
              </p>
              <p className="font-['Poppins',sans-serif] text-[18px] text-[#FE8A0F] font-medium mt-1">
                £{(basePrice || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${serviceType === "online" ? "grid-cols-2" : "grid-cols-3"} mb-6`}>
              <TabsTrigger value="details" className="font-['Poppins',sans-serif]">
                Service Details
              </TabsTrigger>
              {serviceType === "in-person" && (
                <TabsTrigger value="booking" className="font-['Poppins',sans-serif]">
                  Date & Time
                </TabsTrigger>
              )}
              <TabsTrigger value="summary" className="font-['Poppins',sans-serif]">
                Summary
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Service Details */}
            <TabsContent value="details" className="space-y-6">
              {/* Package Selection */}
              {hasPackages && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-[#FE8A0F]" />
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                      Select Package
                    </h3>
                  </div>
                  <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage}>
                    <div className="space-y-3">
                      {packages.map((pkg) => (
                        <div key={pkg.type} className={`
                          border-2 rounded-xl p-4 cursor-pointer transition-all
                          ${selectedPackage === pkg.type 
                            ? 'border-[#FE8A0F] bg-[#FFF5EB]' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}>
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={pkg.type} id={pkg.type} className="mt-1" />
                            <Label htmlFor={pkg.type} className="flex-1 cursor-pointer">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium capitalize">
                                    {pkg.name}
                                  </p>
                                </div>
                                <p className="font-['Poppins',sans-serif] text-[18px] text-[#FE8A0F] font-medium">
                                  £{pkg.price.toFixed(2)}
                                </p>
                              </div>
                              <ul className="space-y-1">
                                {pkg.features.map((feature, idx) => (
                                  <li key={idx} className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                  Quantity
                </h3>
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 border-2 border-gray-300 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5 text-[#2c353f]" />
                  </button>
                  <span className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-medium min-w-[40px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 border-2 border-gray-300 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-[#2c353f]" />
                  </button>
                </div>
              </div>

              {/* Service Extras */}
              {addons.length > 0 && (
                <div>
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                    Service Extras (Optional)
                  </h3>
                  <div className="space-y-2">
                    {addons.map((addon) => (
                      <label
                        key={addon.id}
                        className={`
                          flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all
                          ${selectedAddons.has(addon.id) 
                            ? 'border-[#3B82F6] bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAddons.has(addon.id)}
                            onChange={() => handleAddonToggle(addon.id)}
                            className="w-5 h-5 text-[#3B82F6] rounded"
                          />
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            {addon.title}
                          </span>
                        </div>
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F] font-medium">
                          +£{addon.price.toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Date & Time (only for in-person services) */}
            {serviceType === "in-person" && (
              <TabsContent value="booking" className="space-y-6">
              {/* Single Unified Picker Box */}
              <div className="border-2 border-gray-200 rounded-2xl p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 min-h-[400px] relative overflow-hidden">
                
                {/* Calendar View */}
                <div 
                  className={`absolute inset-0 p-4 md:p-6 transition-all duration-300 ${
                    showTimePicker 
                      ? 'opacity-0 pointer-events-none translate-x-[-20px]' 
                      : 'opacity-100 translate-x-0'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#FE8A0F] rounded-full flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium">
                      Select Date
                    </h3>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-2 md:p-4 shadow-sm flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < today}
                      className="font-['Poppins',sans-serif]"
                    />
                  </div>
                  {selectedDate && !showTimePicker && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-green-700 font-medium">
                          {formatDate(selectedDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Time Picker View */}
                <div 
                  className={`absolute inset-0 p-4 md:p-6 transition-all duration-300 ${
                    showTimePicker 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 pointer-events-none translate-x-[20px]'
                  }`}
                >
                  {/* Header with Back Button */}
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={handleBackToCalendar}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                      aria-label="Back to calendar"
                    >
                      <svg 
                        className="w-4 h-4 text-[#2c353f]" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium">
                          Select Time
                        </h3>
                        {selectedDate && (
                          <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b]">
                            {formatDate(selectedDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-4 max-h-[280px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {timeSlots.map((slotGroup) => (
                      <div key={slotGroup.slot}>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#6b6b6b] flex-shrink-0" />
                          <Badge 
                            variant="outline" 
                            className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] border-[#FE8A0F] text-[#FE8A0F]"
                          >
                            {slotGroup.slot}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {slotGroup.times.map((time) => (
                            <button
                              key={time}
                              onClick={() => handleTimeClick(time, slotGroup.slot)}
                              className={`
                                py-2 md:py-2.5 px-2 md:px-3 rounded-lg border-2 transition-all font-['Poppins',sans-serif] text-[12px] md:text-[13px]
                                ${selectedTime === time 
                                  ? "border-[#3B82F6] bg-blue-50 text-[#3B82F6] font-medium shadow-sm" 
                                  : "border-gray-200 bg-white hover:border-[#3B82F6] hover:bg-blue-50 text-[#2c353f]"
                                }
                              `}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Time Confirmation */}
                  {selectedTime && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-blue-700 font-medium">
                          Selected: {selectedTime} ({selectedTimeSlot})
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </TabsContent>
            )}

            {/* Tab 2/3: Delivery Time (for online services) */}
            {serviceType === "online" && (
              <TabsContent value="summary" className="space-y-6">
                <div className="border-2 border-gray-200 rounded-2xl p-4 md:p-6 bg-gradient-to-br from-white to-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium">
                      Delivery Time
                    </h3>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      This service will be delivered {onlineDeliveryDays || "within the specified time"} after order confirmation.
                    </p>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Tab 3: Summary */}
            <TabsContent value="summary">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
                  Order Summary
                </h3>
                
                <div className="space-y-3 mb-4">
                  {/* Base/Package Price */}
                  <div className="flex justify-between items-center">
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      {hasPackages && selectedPackage 
                        ? `${packages.find(p => p.type === selectedPackage)?.name} Package`
                        : 'Service Base Price'
                      }
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      £{((hasPackages && selectedPackage 
                        ? packages.find(p => p.type === selectedPackage)?.price || basePrice
                        : basePrice
                      ) || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Selected Addons */}
                  {Array.from(selectedAddons).map(addonId => {
                    const addon = addons.find(a => a.id === addonId);
                    if (!addon) return null;
                    return (
                      <div key={addonId} className="flex justify-between items-center">
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          + {addon.title}
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                          £{addon.price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}

                  {/* Quantity */}
                  <div className="flex justify-between items-center">
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      Quantity
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      x{quantity}
                    </span>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                      Total
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[24px] text-[#FE8A0F] font-medium">
                      £{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Appointment Info / Delivery Info */}
                {serviceType === "online" ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-2">
                      Delivery Information:
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-blue-700">
                      This service will be delivered {onlineDeliveryDays || "within the specified time"} after order confirmation.
                    </p>
                  </div>
                ) : selectedDate && selectedTime ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-2">
                      Appointment Scheduled:
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-green-700">
                      {selectedDate.toLocaleDateString('en-GB', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-green-700">
                      {selectedTime} ({selectedTimeSlot})
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-yellow-800">
                      ⚠️ Please select date and time in the "Date & Time" tab
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-200 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                Total Amount
              </p>
              <p className="font-['Poppins',sans-serif] text-[24px] text-[#FE8A0F] font-medium">
                £{calculateTotal().toFixed(2)}
              </p>
            </div>
            {serviceType === "in-person" && !canProceed && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                Select date & time
              </Badge>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={!canProceed}
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white py-6 rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 py-6 rounded-xl font-['Poppins',sans-serif] text-[15px] border-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}