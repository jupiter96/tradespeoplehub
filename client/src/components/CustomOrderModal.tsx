import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { 
  ShoppingBag, 
  Check, 
  Calendar, 
  MapPin,
  Clock,
  X,
  CreditCard,
  Target,
  Plus,
  Trash2,
  ArrowRight
} from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import AddressAutocomplete from "./AddressAutocomplete";
import { useMessenger } from "./MessengerContext";
import { useAccount } from "./AccountContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner@2.0.3";

interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  professionalName: string;
}

// Mock service data for a professional
const mockProfessionalServices = {
  "pro-1": [
    { id: "plumbing-1", name: "Emergency Plumbing Repair", price: "£150", category: "Plumbing" },
    { id: "plumbing-2", name: "Pipe Installation", price: "£250", category: "Plumbing" },
    { id: "plumbing-3", name: "Bathroom Fitting", price: "£500", category: "Plumbing" },
    { id: "plumbing-4", name: "Boiler Service", price: "£120", category: "Plumbing" },
  ],
  "pro-2": [
    { id: "electrical-1", name: "Electrical Installation", price: "£320", category: "Electrical Work" },
    { id: "electrical-2", name: "Rewiring Service", price: "£450", category: "Electrical Work" },
    { id: "electrical-3", name: "Lighting Installation", price: "£180", category: "Electrical Work" },
    { id: "electrical-4", name: "Fuse Box Upgrade", price: "£280", category: "Electrical Work" },
  ],
  "pro-3": [
    { id: "painting-1", name: "Interior Painting", price: "£200", category: "Painting & Decorating" },
    { id: "painting-2", name: "Exterior Painting", price: "£350", category: "Painting & Decorating" },
    { id: "painting-3", name: "Wallpapering", price: "£180", category: "Painting & Decorating" },
    { id: "painting-4", name: "Decorating Consultation", price: "£80", category: "Painting & Decorating" },
  ],
  "pro-4": [
    { id: "carpentry-1", name: "Custom Shelving", price: "£275", category: "Carpentry" },
    { id: "carpentry-2", name: "Door Installation", price: "£200", category: "Carpentry" },
    { id: "carpentry-3", name: "Kitchen Cabinets", price: "£600", category: "Carpentry" },
    { id: "carpentry-4", name: "Flooring Installation", price: "£400", category: "Carpentry" },
  ],
  "pro-5": [
    { id: "gardening-1", name: "Lawn Mowing", price: "£95", category: "Gardening" },
    { id: "gardening-2", name: "Hedge Trimming", price: "£120", category: "Gardening" },
    { id: "gardening-3", name: "Garden Design", price: "£250", category: "Gardening" },
    { id: "gardening-4", name: "Tree Pruning", price: "£180", category: "Gardening" },
  ],
  "pro-6": [
    { id: "cleaning-1", name: "Deep Cleaning", price: "£85", category: "Cleaning" },
    { id: "cleaning-2", name: "End of Tenancy Clean", price: "£150", category: "Cleaning" },
    { id: "cleaning-3", name: "Carpet Cleaning", price: "£75", category: "Cleaning" },
    { id: "cleaning-4", name: "Window Cleaning", price: "£60", category: "Cleaning" },
  ],
  "pro-7": [
    { id: "locksmith-1", name: "Lock Change", price: "£120", category: "Locksmith" },
    { id: "locksmith-2", name: "Emergency Lockout", price: "£95", category: "Locksmith" },
    { id: "locksmith-3", name: "Security Upgrade", price: "£200", category: "Locksmith" },
    { id: "locksmith-4", name: "Key Cutting", price: "£35", category: "Locksmith" },
  ],
};

interface Milestone {
  id: string;
  name: string;
  description: string;
  amount: string;
  dueDate: string;
}

export default function CustomOrderModal({
  isOpen,
  onClose,
  professionalId,
  professionalName,
}: CustomOrderModalProps) {
  const { addMessage } = useMessenger();
  const { userInfo } = useAccount();
  const navigate = useNavigate();
  
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "payment" | "details">("select");
  const [paymentType, setPaymentType] = useState<"single" | "milestone">("single");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "1", name: "", description: "", amount: "", dueDate: "" }
  ]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [townCity, setTownCity] = useState("");
  const [county, setCounty] = useState("");
  const [notes, setNotes] = useState("");

  const services = mockProfessionalServices[professionalId as keyof typeof mockProfessionalServices] || [];
  const selectedServiceData = services.find(s => s.id === selectedService);

  const handleClose = () => {
    setStep("select");
    setSelectedService(null);
    setPaymentType("single");
    setMilestones([{ id: "1", name: "", description: "", amount: "", dueDate: "" }]);
    setScheduledDate("");
    setScheduledTime("");
    setAddress("");
    setPostcode("");
    setTownCity("");
    setCounty("");
    setNotes("");
    onClose();
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep("payment");
  };

  const handlePaymentTypeSelect = () => {
    if (paymentType === "milestone" && milestones.length === 0) {
      toast.error("Please add at least one milestone");
      return;
    }

    if (paymentType === "milestone") {
      // Validate milestones
      const hasEmptyFields = milestones.some(
        m => !m.name || !m.description || !m.amount || !m.dueDate
      );
      
      if (hasEmptyFields) {
        toast.error("Please fill in all milestone fields");
        return;
      }

      // Validate total amount
      const totalMilestoneAmount = milestones.reduce((sum, m) => sum + parseFloat(m.amount || "0"), 0);
      const servicePrice = parseFloat(selectedServiceData?.price.replace("£", "") || "0");
      
      if (totalMilestoneAmount !== servicePrice) {
        toast.error(`Total milestone amount (£${totalMilestoneAmount}) must equal service price (${selectedServiceData?.price})`);
        return;
      }
    }

    setStep("details");
  };

  const addMilestone = () => {
    const newId = (milestones.length + 1).toString();
    setMilestones([...milestones, { id: newId, name: "", description: "", amount: "", dueDate: "" }]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 1) {
      toast.error("You must have at least one milestone");
      return;
    }
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handlePlaceOrder = () => {
    if (!selectedServiceData || !userInfo?.id) return;

    // Generate order ID
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    // Add order message to conversation
    addMessage(professionalId, {
      senderId: userInfo.id,
      text: `Order placed: ${selectedServiceData.name}`,
      read: false,
      type: "order",
      orderId: orderId,
      orderDetails: {
        service: selectedServiceData.name,
        amount: selectedServiceData.price,
        date: `${scheduledDate} ${scheduledTime}`,
        status: "pending",
        paymentType: paymentType,
        milestones: paymentType === "milestone" ? milestones : undefined,
      },
    });

    toast.success("Order placed successfully!");
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[70vw] h-[85vh] p-0 flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="font-['Roboto',sans-serif] text-[24px] text-[#2c353f] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#FE8A0F]" />
            Custom Order
          </DialogTitle>
          <DialogDescription className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
            {step === "select" 
              ? `Select a service from ${professionalName}`
              : step === "payment"
              ? "Choose your payment method"
              : "Provide details for your order"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <ScrollArea className="flex-1 overflow-auto px-6">
            <div className="space-y-3 py-4">
              {services.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-['Roboto',sans-serif] text-[14px] text-[#8d8d8d]">
                    No services available for this professional
                  </p>
                </div>
              ) : (
                services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className="w-full p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-[#FE8A0F] hover:bg-[#FFF5EB]/30 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] group-hover:text-[#FE8A0F] transition-colors">
                            {service.name}
                          </h3>
                          <Badge className="bg-[#EFF6FF] text-[#3D78CB] border-[#3D78CB]/20 font-['Roboto',sans-serif] text-[11px]">
                            {service.category}
                          </Badge>
                        </div>
                        <p className="font-['Roboto',sans-serif] text-[13px] text-[#8d8d8d]">
                          Professional service by {professionalName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-['Roboto',sans-serif] text-[20px] text-[#FE8A0F]">
                          {service.price}
                        </p>
                        <p className="font-['Roboto',sans-serif] text-[11px] text-[#8d8d8d]">
                          Starting from
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        ) : step === "payment" ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 overflow-auto px-6">
              <div className="space-y-4 py-4">
                {/* Selected Service Summary */}
                {selectedServiceData && (
                  <div className="bg-gradient-to-r from-[#FFF5EB] to-white border border-[#FE8A0F]/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f]">
                        {selectedServiceData.name}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStep("select")}
                        className="text-[#6b6b6b] hover:text-[#FE8A0F]"
                      >
                        Change
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-white/80 text-[#3D78CB] border-[#3D78CB]/20 font-['Roboto',sans-serif] text-[11px]">
                        {selectedServiceData.category}
                      </Badge>
                      <p className="font-['Roboto',sans-serif] text-[20px] text-[#FE8A0F]">
                        {selectedServiceData.price}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Payment Type Selection */}
                <div className="space-y-4">
                  <h4 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
                    Choose Payment Method
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Single Payment */}
                    <button
                      onClick={() => setPaymentType("single")}
                      className={`p-5 border-2 rounded-xl transition-all duration-200 text-left ${
                        paymentType === "single"
                          ? "border-[#FE8A0F] bg-[#FFF5EB]/50"
                          : "border-gray-200 hover:border-[#FE8A0F]/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${paymentType === "single" ? "bg-[#FE8A0F]" : "bg-gray-100"}`}>
                          <CreditCard className={`w-5 h-5 ${paymentType === "single" ? "text-white" : "text-gray-600"}`} />
                        </div>
                        <div>
                          <h5 className="font-['Roboto',sans-serif] text-[15px] text-[#2c353f] mb-1">
                            Single Payment
                          </h5>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#8d8d8d]">
                            Pay the full amount at once
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Milestone Payment */}
                    <button
                      onClick={() => setPaymentType("milestone")}
                      className={`p-5 border-2 rounded-xl transition-all duration-200 text-left ${
                        paymentType === "milestone"
                          ? "border-[#FE8A0F] bg-[#FFF5EB]/50"
                          : "border-gray-200 hover:border-[#FE8A0F]/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${paymentType === "milestone" ? "bg-[#FE8A0F]" : "bg-gray-100"}`}>
                          <Target className={`w-5 h-5 ${paymentType === "milestone" ? "text-white" : "text-gray-600"}`} />
                        </div>
                        <div>
                          <h5 className="font-['Roboto',sans-serif] text-[15px] text-[#2c353f] mb-1">
                            Milestone Payment
                          </h5>
                          <p className="font-['Roboto',sans-serif] text-[12px] text-[#8d8d8d]">
                            Split into multiple payments
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Milestone Configuration */}
                  {paymentType === "milestone" && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-['Roboto',sans-serif] text-[15px] text-[#2c353f]">
                          Configure Milestones
                        </h5>
                        <Button
                          onClick={addMilestone}
                          size="sm"
                          variant="outline"
                          className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Milestone
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {milestones.map((milestone, index) => (
                          <div
                            key={milestone.id}
                            className="p-4 bg-white border-2 border-gray-200 rounded-lg space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h6 className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
                                Milestone {index + 1}
                              </h6>
                              {milestones.length > 1 && (
                                <Button
                                  onClick={() => removeMilestone(milestone.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Milestone Name
                                </Label>
                                <Input
                                  type="text"
                                  placeholder="e.g., Initial Setup"
                                  value={milestone.name}
                                  onChange={(e) => updateMilestone(milestone.id, "name", e.target.value)}
                                  className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                />
                              </div>
                              <div>
                                <Label className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Amount (£)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={milestone.amount}
                                  onChange={(e) => updateMilestone(milestone.id, "amount", e.target.value)}
                                  className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                Description
                              </Label>
                              <Textarea
                                placeholder="Describe what will be delivered..."
                                value={milestone.description}
                                onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                                className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F] min-h-[60px]"
                              />
                            </div>

                            <div>
                              <Label className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                Due Date
                              </Label>
                              <Input
                                type="date"
                                value={milestone.dueDate}
                                onChange={(e) => updateMilestone(milestone.id, "dueDate", e.target.value)}
                                className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Validation */}
                      {selectedServiceData && (
                        <div className="p-4 bg-[#EFF6FF] border border-[#3D78CB]/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                              Total Milestones:
                            </span>
                            <span className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
                              £{milestones.reduce((sum, m) => sum + parseFloat(m.amount || "0"), 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                              Service Price:
                            </span>
                            <span className="font-['Roboto',sans-serif] text-[16px] text-[#FE8A0F]">
                              {selectedServiceData.price}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
              <Button
                onClick={() => setStep("select")}
                variant="outline"
                className="flex-1 font-['Roboto',sans-serif] text-[14px] border-gray-300 text-[#6b6b6b] hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handlePaymentTypeSelect}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Roboto',sans-serif] text-[14px]"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 overflow-auto px-6">
              <div className="space-y-5 py-4">
                {/* Selected Service Summary */}
                {selectedServiceData && (
                  <div className="bg-gradient-to-r from-[#FFF5EB] to-white border border-[#FE8A0F]/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f]">
                        {selectedServiceData.name}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStep("payment")}
                        className="text-[#6b6b6b] hover:text-[#FE8A0F]"
                      >
                        Change
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/80 text-[#3D78CB] border-[#3D78CB]/20 font-['Roboto',sans-serif] text-[11px]">
                          {selectedServiceData.category}
                        </Badge>
                        <Badge className="bg-white/80 text-[#FE8A0F] border-[#FE8A0F]/20 font-['Roboto',sans-serif] text-[11px]">
                          {paymentType === "single" ? "Single Payment" : `${milestones.length} Milestones`}
                        </Badge>
                      </div>
                      <p className="font-['Roboto',sans-serif] text-[20px] text-[#FE8A0F]">
                        {selectedServiceData.price}
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Details Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#FE8A0F]" />
                      Preferred Date
                    </Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="font-['Roboto',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F]"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#FE8A0F]" />
                      Preferred Time
                    </Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="font-['Roboto',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F]"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <AddressAutocomplete
                    postcode={postcode}
                    onPostcodeChange={(value) => setPostcode(value)}
                    address={address}
                    onAddressChange={(value) => setAddress(value)}
                    townCity={townCity}
                    onTownCityChange={(value) => setTownCity(value)}
                    county={county}
                    onCountyChange={(value) => setCounty(value)}
                    onAddressSelect={(addressData) => {
                      setPostcode(addressData.postcode || "");
                      setAddress(addressData.address || "");
                      setTownCity(addressData.townCity || "");
                      setCounty(addressData.county || "");
                    }}
                    label="Postcode"
                    required
                    showAddressField={true}
                    showTownCityField={true}
                    showCountyField={true}
                    addressLabel="Address"
                    className="font-['Roboto',sans-serif]"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <Label className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] mb-2">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    placeholder="Any special requirements or details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="font-['Roboto',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F] min-h-[100px]"
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
              <Button
                onClick={() => setStep("payment")}
                variant="outline"
                className="flex-1 font-['Roboto',sans-serif] text-[14px] border-gray-300 text-[#6b6b6b] hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={!selectedService || !scheduledDate || !scheduledTime || !address || !postcode}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Roboto',sans-serif] text-[14px]"
              >
                <Check className="w-4 h-4 mr-2" />
                Place Order
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
