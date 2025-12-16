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
  Calendar, 
  Clock,
  X,
  CreditCard,
  Target,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Package
} from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useMessenger } from "./MessengerContext";
import { useAccount } from "./AccountContext";
import { toast } from "sonner@2.0.3";

interface CustomOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

// Mock professional services data (would come from AccountContext/database)
const mockProfessionalOwnServices = [
  { 
    id: "service-1", 
    name: "Emergency Plumbing Repair", 
    basePrice: 150, 
    category: "Plumbing",
    deliveryDays: 1
  },
  { 
    id: "service-2", 
    name: "Pipe Installation", 
    basePrice: 250, 
    category: "Plumbing",
    deliveryDays: 3
  },
  { 
    id: "service-3", 
    name: "Bathroom Fitting", 
    basePrice: 500, 
    category: "Plumbing",
    deliveryDays: 7
  },
  { 
    id: "service-4", 
    name: "Boiler Service", 
    basePrice: 120, 
    category: "Plumbing",
    deliveryDays: 2
  },
  { 
    id: "service-5", 
    name: "Kitchen Sink Installation", 
    basePrice: 180, 
    category: "Plumbing",
    deliveryDays: 2
  },
  { 
    id: "service-6", 
    name: "Radiator Installation", 
    basePrice: 200, 
    category: "Plumbing",
    deliveryDays: 3
  },
];

interface Milestone {
  id: string;
  name: string;
  description: string;
  amount: number;
  dueInDays: number;
}

export default function CustomOfferModal({
  isOpen,
  onClose,
  clientId,
  clientName,
}: CustomOfferModalProps) {
  const { addMessage } = useMessenger();
  const { userInfo } = useAccount();
  
  const [step, setStep] = useState<"select" | "payment" | "customize">("select");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [deliveryDays, setDeliveryDays] = useState<string>("");
  const [offerDescription, setOfferDescription] = useState("");
  const [paymentType, setPaymentType] = useState<"single" | "milestone">("single");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "1", name: "", description: "", amount: 0, dueInDays: 1 }
  ]);

  const selectedService = mockProfessionalOwnServices.find(s => s.id === selectedServiceId);

  const handleClose = () => {
    setStep("select");
    setSelectedServiceId(null);
    setCustomPrice("");
    setDeliveryDays("");
    setOfferDescription("");
    setPaymentType("single");
    setMilestones([{ id: "1", name: "", description: "", amount: 0, dueInDays: 1 }]);
    onClose();
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = mockProfessionalOwnServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedServiceId(serviceId);
      setCustomPrice(service.basePrice.toString());
      setDeliveryDays(service.deliveryDays.toString());
      setStep("payment");
    }
  };

  const handleContinueToCustomize = () => {
    // Payment type is already selected, move to customize step
    setStep("customize");
  };

  const handleContinueToFinalize = () => {
    if (!customPrice || parseFloat(customPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!deliveryDays || parseInt(deliveryDays) <= 0) {
      toast.error("Please enter valid delivery days");
      return;
    }
    
    // Validate milestones if milestone payment is selected
    if (paymentType === "milestone") {
      const hasEmptyFields = milestones.some(
        m => !m.name || !m.description || m.amount <= 0 || m.dueInDays <= 0
      );
      
      if (hasEmptyFields) {
        toast.error("Please fill in all milestone fields");
        return;
      }

      const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
      const offerPrice = parseFloat(customPrice);
      
      if (Math.abs(totalMilestoneAmount - offerPrice) > 0.01) {
        toast.error(`Total milestone amount (£${totalMilestoneAmount.toFixed(2)}) must equal offer price (£${offerPrice.toFixed(2)})`);
        return;
      }
    }
    
    // All validations passed, send the offer
    handleSendOffer();
  };

  const addMilestone = () => {
    const newId = (milestones.length + 1).toString();
    setMilestones([...milestones, { id: newId, name: "", description: "", amount: 0, dueInDays: 1 }]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 1) {
      toast.error("You must have at least one milestone");
      return;
    }
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string | number) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleSendOffer = () => {
    if (!selectedService || !userInfo?.id) return;

    // Generate offer ID
    const offerId = `OFFER-${Date.now().toString().slice(-6)}`;

    // Add custom offer message to conversation
    addMessage(clientId, {
      senderId: userInfo.id,
      text: `Custom offer sent: ${selectedService.name}`,
      read: false,
      type: "custom_offer",
      orderId: offerId,
      orderDetails: {
        service: selectedService.name,
        amount: `£${customPrice}`,
        deliveryDays: parseInt(deliveryDays),
        description: offerDescription,
        status: "pending",
        paymentType: paymentType,
        milestones: paymentType === "milestone" ? milestones : undefined,
      },
    });

    toast.success(`Custom offer sent to ${clientName}!`);
    handleClose();
  };

  const totalMilestones = milestones.reduce((sum, m) => sum + m.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[70vw] h-[85vh] p-0 flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="font-['Roboto',sans-serif] text-[24px] text-[#2c353f] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#FE8A0F]" />
            Create Custom Offer
          </DialogTitle>
          <DialogDescription className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
            {step === "select" 
              ? `Select a service to offer to ${clientName}`
              : step === "payment"
              ? "Choose payment method for this offer"
              : "Customize your offer details"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <ScrollArea className="flex-1 overflow-auto px-6">
            <div className="space-y-3 py-4">
              {mockProfessionalOwnServices.map((service) => (
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
                        Base delivery: {service.deliveryDays} {service.deliveryDays === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-['Roboto',sans-serif] text-[20px] text-[#FE8A0F]">
                        £{service.basePrice}
                      </p>
                      <p className="font-['Roboto',sans-serif] text-[11px] text-[#8d8d8d]">
                        Base price
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : step === "payment" ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 overflow-auto px-6">
              <div className="space-y-4 py-4">
                {/* Selected Service Summary */}
                {selectedService && (
                  <div className="bg-gradient-to-r from-[#FFF5EB] to-white border border-[#FE8A0F]/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f]">
                        {selectedService.name}
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
                        {selectedService.category}
                      </Badge>
                      <p className="font-['Roboto',sans-serif] text-[20px] text-[#FE8A0F]">
                        £{customPrice}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Payment Type Selection */}
                <div className="space-y-4">
                  <h4 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
                    Payment Structure
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
                            Client pays full amount upfront
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
                            Split into multiple stages
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
                                  value={milestone.amount || ""}
                                  onChange={(e) => updateMilestone(milestone.id, "amount", parseFloat(e.target.value) || 0)}
                                  className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                Description
                              </Label>
                              <Textarea
                                placeholder="What will be delivered in this milestone..."
                                value={milestone.description}
                                onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                                className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F] min-h-[60px]"
                              />
                            </div>

                            <div>
                              <Label className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                Due in Days
                              </Label>
                              <Input
                                type="number"
                                placeholder="Number of days"
                                value={milestone.dueInDays || ""}
                                onChange={(e) => updateMilestone(milestone.id, "dueInDays", parseInt(e.target.value) || 1)}
                                className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                min="1"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Validation */}
                      <div className="p-4 bg-[#EFF6FF] border border-[#3D78CB]/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                            Total Milestones:
                          </span>
                          <span className={`font-['Roboto',sans-serif] text-[16px] ${
                            Math.abs(totalMilestones - parseFloat(customPrice || "0")) < 0.01
                              ? "text-green-600"
                              : "text-red-600"
                          }`}>
                            £{totalMilestones.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                            Offer Price:
                          </span>
                          <span className="font-['Roboto',sans-serif] text-[16px] text-[#FE8A0F]">
                            £{parseFloat(customPrice || "0").toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
              <Button
                onClick={() => setStep("select")}
                variant="outline"
                className="flex-1 font-['Roboto',sans-serif] text-[14px] border-gray-300 text-[#6b6b6b] hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleContinueToCustomize}
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
                {selectedService && (
                  <div className="bg-gradient-to-r from-[#FFF5EB] to-white border border-[#FE8A0F]/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f]">
                        {selectedService.name}
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
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/80 text-[#3D78CB] border-[#3D78CB]/20 font-['Roboto',sans-serif] text-[11px]">
                        {selectedService.category}
                      </Badge>
                      <Badge className="bg-white/80 text-[#FE8A0F] border-[#FE8A0F]/20 font-['Roboto',sans-serif] text-[11px]">
                        {paymentType === "single" ? "Single Payment" : `${milestones.length} Milestones`}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div>
                  <Label className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#FE8A0F]" />
                    Offer Price (£)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter your price"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="font-['Roboto',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F]"
                    min="1"
                    step="1"
                  />
                  {selectedService && (
                    <p className="font-['Roboto',sans-serif] text-[12px] text-[#8d8d8d] mt-1">
                      Base price: £{selectedService.basePrice}
                    </p>
                  )}
                </div>

                {/* Delivery Time */}
                <div>
                  <Label className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FE8A0F]" />
                    Delivery Time (Days)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Number of days"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    className="font-['Roboto',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F]"
                    min="1"
                    step="1"
                  />
                  {selectedService && (
                    <p className="font-['Roboto',sans-serif] text-[12px] text-[#8d8d8d] mt-1">
                      Standard delivery: {selectedService.deliveryDays} {selectedService.deliveryDays === 1 ? 'day' : 'days'}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f] mb-2">
                    Offer Description
                  </Label>
                  <Textarea
                    placeholder="Describe what's included in this offer..."
                    value={offerDescription}
                    onChange={(e) => setOfferDescription(e.target.value)}
                    className="font-['Roboto',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F] min-h-[120px]"
                  />
                </div>

                {/* Milestone Details (if milestone payment selected) */}
                {paymentType === "milestone" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-['Roboto',sans-serif] text-[15px] text-[#2c353f]">
                        Milestone Details
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
                                value={milestone.amount || ""}
                                onChange={(e) => updateMilestone(milestone.id, "amount", parseFloat(e.target.value) || 0)}
                                className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Description
                            </Label>
                            <Textarea
                              placeholder="What will be delivered in this milestone..."
                              value={milestone.description}
                              onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                              className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F] min-h-[60px]"
                            />
                          </div>

                          <div>
                            <Label className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                              Due in Days
                            </Label>
                            <Input
                              type="number"
                              placeholder="Number of days"
                              value={milestone.dueInDays || ""}
                              onChange={(e) => updateMilestone(milestone.id, "dueInDays", parseInt(e.target.value) || 1)}
                              className="font-['Roboto',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                              min="1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Validation */}
                    <div className="p-4 bg-[#EFF6FF] border border-[#3D78CB]/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                          Total Milestones:
                        </span>
                        <span className={`font-['Roboto',sans-serif] text-[16px] ${
                          Math.abs(totalMilestones - parseFloat(customPrice || "0")) < 0.01
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                          £{totalMilestones.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                          Offer Price:
                        </span>
                        <span className="font-['Roboto',sans-serif] text-[16px] text-[#FE8A0F]">
                          £{parseFloat(customPrice || "0").toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
              <Button
                onClick={() => setStep("payment")}
                variant="outline"
                className="flex-1 font-['Roboto',sans-serif] text-[14px] border-gray-300 text-[#6b6b6b] hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleContinueToFinalize}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Roboto',sans-serif] text-[14px]"
              >
                Send Offer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
