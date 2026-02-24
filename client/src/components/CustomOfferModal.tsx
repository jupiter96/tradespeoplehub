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
  Package,
  Loader2
} from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useMessenger } from "./MessengerContext";
import { useAccount } from "./AccountContext";
import { toast } from "sonner@2.0.3";
import { resolveApiUrl } from "../config/api";
import { useEffect } from "react";
import { Checkbox } from "./ui/checkbox";

const resolveMediaUrl = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return resolveApiUrl(url);
  return url;
};

interface CustomOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

interface PriceUnitOption {
  name: string;
  order: number;
}

interface ProfessionalService {
  id: string;
  name: string;
  basePrice: number;
  category: string;
  serviceCategoryId?: string;
  deliveryDays: number;
  thumbnailUrl?: string;
  thumbnailType?: "image" | "video";
  priceUnit?: string;
  features?: string[];
}

interface Milestone {
  id: string;
  name?: string;
  description?: string;
  deliveryInDays: number;
  price: number;
  chargePer: string;
  noOf: number;
}

export default function CustomOfferModal({
  isOpen,
  onClose,
  clientId,
  clientName,
}: CustomOfferModalProps) {
  const { getContactById, refreshMessages } = useMessenger();
  const { userInfo } = useAccount();
  
  const [step, setStep] = useState<"select" | "payment" | "customize">("select");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [deliveryDays, setDeliveryDays] = useState<string>("");
  const [offerDescription, setOfferDescription] = useState("");
  const [paymentType, setPaymentType] = useState<"single" | "milestone">("single");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "1", name: "", deliveryInDays: 1, price: 0, chargePer: "service", noOf: 1, description: "" }
  ]);
  const [professionalServices, setProfessionalServices] = useState<ProfessionalService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [chargePer, setChargePer] = useState<string>("service");
  const [quantity, setQuantity] = useState<string>("1");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [categoryPriceUnits, setCategoryPriceUnits] = useState<PriceUnitOption[]>([]);
  const [savedMilestones, setSavedMilestones] = useState<Set<string>>(new Set());

  const selectedService = professionalServices.find(s => s.id === selectedServiceId);

  // Fetch professional's services
  useEffect(() => {
    if (isOpen && userInfo?.id) {
      fetchProfessionalServices();
    }
  }, [isOpen, userInfo?.id]);

  const fetchProfessionalServices = async () => {
    if (!userInfo?.id) return;
    setIsLoadingServices(true);
    try {
      const url = resolveApiUrl(`/api/services?professionalId=${encodeURIComponent(userInfo.id)}`);
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      const list = Array.isArray(data.services) ? data.services : [];
      const transformedServices: ProfessionalService[] = list.map((service: any) => {
        const firstGallery = service.gallery?.[0] || service.images?.[0];
        const thumbUrl = typeof firstGallery === "object" ? firstGallery?.url : firstGallery;
        const thumbType = typeof firstGallery === "object" && firstGallery?.type === "video" ? "video" : "image";
        const pkg = service.packages?.[0];
        const features = pkg?.features && Array.isArray(pkg.features) ? pkg.features : (service.highlights && Array.isArray(service.highlights) ? service.highlights : []);
        const priceUnit = pkg?.priceUnit || service.priceUnit || "fixed";
        return {
          id: service._id || service.id,
          name: service.title || service.name,
          basePrice: pkg?.price ?? service.price ?? 0,
          category: service.serviceCategory?.name || service.category?.name || service.category || "Service",
          serviceCategoryId: service.serviceCategory?._id || service.serviceCategory?.id,
          deliveryDays: pkg?.deliveryDays ?? service.deliveryDays ?? 1,
          thumbnailUrl: thumbUrl,
          thumbnailType: thumbType,
          priceUnit: priceUnit,
          features: features,
        };
      });

      setProfessionalServices(transformedServices);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load your services');
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleClose = () => {
    setStep("select");
    setSelectedServiceId(null);
    setCustomPrice("");
    setDeliveryDays("");
    setOfferDescription("");
    setPaymentType("single");
    setMilestones([{ id: "1", name: "", deliveryInDays: 1, price: 0, chargePer: "service", noOf: 1, description: "" }]);
    setChargePer("service");
    setQuantity("1");
    setSelectedAttributes([]);
    setOfferExpiresEnabled(false);
    setOfferExpiresInDays("3");
    setCategoryPriceUnits([]);
    setSavedMilestones(new Set());
    onClose();
  };

  const fetchCategoryPriceUnits = async (serviceCategoryId?: string) => {
    if (!serviceCategoryId) {
      setCategoryPriceUnits([]);
      return;
    }
    try {
      const url = resolveApiUrl(`/api/service-categories/${encodeURIComponent(serviceCategoryId)}`);
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch service category");
      }
      const data = await response.json();
      const rawUnits = data?.serviceCategory?.pricePerUnit?.units;
      const units: PriceUnitOption[] = Array.isArray(rawUnits)
        ? rawUnits
            .filter((u: any) => u?.name)
            .map((u: any) => ({ name: u.name, order: u.order ?? 0 }))
            .sort((a: PriceUnitOption, b: PriceUnitOption) => a.order - b.order)
        : [];
      setCategoryPriceUnits(units);
    } catch (error: any) {
      console.error("Error fetching service category price units:", error);
      setCategoryPriceUnits([]);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = professionalServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedServiceId(serviceId);
      setCustomPrice(service.basePrice.toString());
      setDeliveryDays(service.deliveryDays.toString());
      // Fetch category price units by category id
      fetchCategoryPriceUnits(service.serviceCategoryId);
      // Default chargePer stays "service" until units are fetched
      const defaultUnit = "service";
      setChargePer(defaultUnit);
      setQuantity("1");
      setSelectedAttributes([]);
      // Reset milestones with the dynamic default chargePer
      setMilestones([{ id: "1", name: "", deliveryInDays: 1, price: 0, chargePer: defaultUnit, noOf: 1, description: "" }]);
      setStep("payment");
    }
  };

  const handleContinueToCustomize = () => {
    // Payment type is already selected, move to customize step
    setStep("customize");
  };

  // Get dynamic charge per options from the selected service's category
  const getChargePerOptions = (): { value: string; label: string }[] => {
    const options: { value: string; label: string }[] = [
      { value: "service", label: "Per service" },
    ];
    // Add dynamic units from category
    const units = categoryPriceUnits;
    if (units && units.length > 0) {
      units.forEach(u => {
        if (u.name && u.name.toLowerCase() !== "service") {
          options.push({ value: u.name, label: u.name });
        }
      });
    }
    return options;
  };

  // Get short unit name for display (strip "Per " prefix)
  const getUnitShortName = (chargePerVal: string) => {
    if (!chargePerVal) return "unit";
    const lower = chargePerVal.toLowerCase();
    if (lower === "service") return "service";
    if (lower === "fixed") return "unit";
    // Strip "Per " prefix: "Per hour" -> "hour", "Per m²" -> "m²"
    const stripped = chargePerVal.replace(/^per\s+/i, "").trim();
    return stripped || "unit";
  };

  // Label for "No of X" based on chargePer
  const getQuantityLabel = () => {
    return `No of ${getUnitShortName(chargePer)}`;
  };

  const handleContinueToFinalize = () => {
    if (paymentType !== "milestone") {
      if (!customPrice || parseFloat(customPrice) <= 0) {
        toast.error("Please enter a valid price");
        return;
      }
      if (!deliveryDays || parseInt(deliveryDays, 10) <= 0) {
        toast.error("Please enter valid delivery expected time (days)");
        return;
      }
      const qty = parseInt(quantity, 10);
      if (!quantity || isNaN(qty) || qty < 1) {
        toast.error(`Please enter a valid ${getQuantityLabel().toLowerCase()}`);
        return;
      }
    }
    
    // Validate milestones if milestone payment is selected
    if (paymentType === "milestone") {
      const hasEmptyFields = milestones.some(
        m => !m.name?.trim() || m.deliveryInDays <= 0 || m.price <= 0 || m.noOf <= 0
      );
      
      if (hasEmptyFields) {
        toast.error("Please fill in all required milestone fields (Name, Delivery In, Price, No of)");
        return;
      }
    }
    
    // All validations passed, send the offer
    handleSendOffer();
  };

  const addMilestone = () => {
    const newId = (milestones.length + 1).toString();
    const lastChargePer = milestones[milestones.length - 1]?.chargePer
      || categoryPriceUnits?.[0]?.name
      || "service";
    setMilestones([...milestones, { id: newId, name: "", deliveryInDays: 1, price: 0, chargePer: lastChargePer, noOf: 1, description: "" }]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 1) {
      toast.error("You must have at least one milestone");
      return;
    }
    setMilestones(milestones.filter(m => m.id !== id));
    setSavedMilestones(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string | number) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const saveMilestone = (id: string) => {
    const m = milestones.find(ms => ms.id === id);
    if (!m) return;
    const errors: string[] = [];
    if (!m.name?.trim()) errors.push("Milestone Name");
    if (!m.deliveryInDays || m.deliveryInDays <= 0) errors.push("Delivery In");
    if (!m.price || m.price <= 0) errors.push("Price");
    if (!m.chargePer?.trim()) errors.push("Charge Per");
    if (!m.noOf || m.noOf <= 0) errors.push("No of");
    if (errors.length > 0) {
      toast.error(`Please fill in: ${errors.join(", ")}`);
      return;
    }
    setSavedMilestones(prev => new Set(prev).add(id));
  };

  const expandMilestone = (id: string) => {
    setSavedMilestones(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleSendOffer = async () => {
    if (!selectedService || !userInfo?.id) return;

    try {
      // Get conversation ID from the contact
      const contact = getContactById(clientId);
      if (!contact?.conversationId) {
        toast.error("Conversation not found. Please start a conversation first.");
        return;
      }

      const totalPrice = paymentType === "milestone" ? milestones.reduce((s, m) => s + m.price * (m.noOf || 1), 0) : parseFloat(customPrice);
      const totalDeliveryDays = paymentType === "milestone" ? milestones.reduce((s, m) => s + m.deliveryInDays, 0) : parseInt(deliveryDays, 10);

      // Call API to create custom offer
      const response = await fetch(resolveApiUrl(`/api/custom-offers`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: contact.conversationId,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          price: totalPrice,
          deliveryDays: totalDeliveryDays,
          quantity: parseInt(quantity, 10) || 1,
          chargePer: chargePer,
          description: offerDescription,
          paymentType: paymentType,
          milestones: paymentType === "milestone" ? milestones.map(({ id, ...m }) => m) : undefined,
          attributes: selectedAttributes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create custom offer');
      }

      const data = await response.json();

      // The message will be created by the backend, so we just need to refresh
    toast.success(`Custom offer sent to ${clientName}!`);
    handleClose();
    refreshMessages(clientId);
    } catch (error: any) {
      toast.error(error.message || "Failed to send custom offer");
    }
  };

  const totalMilestonesPrice = milestones.reduce((sum, m) => sum + m.price * (m.noOf || 1), 0);
  const totalMilestonesDelivery = milestones.reduce((sum, m) => sum + m.deliveryInDays, 0);

  const getMilestoneNoOfLabel = (chargePerVal: string) => {
    return `No of ${getUnitShortName(chargePerVal)}`;
  };

  // Get dynamic price label based on charge per value
  const getPriceLabel = (chargePerVal: string) => {
    const unit = getUnitShortName(chargePerVal);
    return `Price per ${unit}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[78vw] max-w-[1092px] sm:max-w-[1092px] h-[85vh] p-0 flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#FE8A0F]" />
            Create Custom Offer
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
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
              {isLoadingServices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
                </div>
              ) : professionalServices.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    No services found. Please create a service first.
                  </p>
                </div>
              ) : (
                professionalServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className="w-full p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-[#FE8A0F] hover:bg-[#FFF5EB]/30 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] group-hover:text-[#FE8A0F] transition-colors">
                            {service.name}
                          </h3>
                          <Badge className="bg-[#EFF6FF] text-[#3D78CB] border-[#3D78CB]/20 font-['Poppins',sans-serif] text-[11px]">
                            {service.category}
                          </Badge>
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
                          Base delivery: {service.deliveryDays} {service.deliveryDays <= 1 ? 'day' : 'days'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-['Poppins',sans-serif] text-[20px] text-[#FE8A0F]">
                          £{service.basePrice}
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                          Base price
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
                {selectedService && (
                  <div className="bg-gradient-to-r from-[#FFF5EB] to-white border border-[#FE8A0F]/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
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
                      <Badge className="bg-white/80 text-[#3D78CB] border-[#3D78CB]/20 font-['Poppins',sans-serif] text-[11px]">
                        {selectedService.category}
                      </Badge>
                      <p className="font-['Poppins',sans-serif] text-[20px] text-[#FE8A0F]">
                        £{customPrice}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Payment Type Selection */}
                <div className="space-y-4">
                  <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                    Payment Structure
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Single Payment - selecting goes straight to customize form */}
                    <button
                      onClick={() => {
                        setPaymentType("single");
                        setStep("customize");
                      }}
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
                          <h5 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-1">
                            Single Payment
                          </h5>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                            Client pays full amount upfront
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Milestone Payment - stay on step to configure milestones, then Continue */}
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
                          <h5 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-1">
                            Milestone Payment
                          </h5>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
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
                        <h5 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
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
                        {milestones.map((milestone, index) => {
                          const isSaved = savedMilestones.has(milestone.id);
                          const milestoneTotal = milestone.price * (milestone.noOf || 1);
                          return (
                          <div
                            key={milestone.id}
                            className={`p-4 bg-white border-2 rounded-lg ${isSaved ? "border-[#FE8A0F]/30 bg-[#FFF5EB]/20" : "border-gray-200"} transition-all`}
                          >
                            {isSaved ? (
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => expandMilestone(milestone.id)}
                              >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[13px] font-semibold shrink-0">
                                    {index + 1}
                                  </div>
                                  <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-medium truncate">
                                    {milestone.name}
                                  </span>
                                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] shrink-0">
                                    {milestone.deliveryInDays} {milestone.deliveryInDays <= 1 ? "day" : "days"}
                                  </span>
                                  <span className="font-['Poppins',sans-serif] text-[15px] text-[#FE8A0F] font-semibold shrink-0">
                                    £{milestoneTotal.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {milestones.length > 1 && (
                                    <Button
                                      onClick={(ev: React.MouseEvent) => { ev.stopPropagation(); removeMilestone(milestone.id); }}
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <span className="font-['Poppins',sans-serif] text-[12px] text-[#FE8A0F]">Edit</span>
                                </div>
                              </div>
                            ) : (
                              <>
                            <div className="flex items-center justify-between">
                              <h6 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
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

                            <div className="flex items-start gap-3">
                              <div className="w-[24%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Milestone Name *
                                </Label>
                                <Input
                                  type="text"
                                  placeholder="e.g., Design draft"
                                  value={milestone.name || ""}
                                  onChange={(e) => updateMilestone(milestone.id, "name", e.target.value)}
                                  className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                />
                              </div>
                              <div className="w-[14%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Delivery In (days) *
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="1"
                                  value={milestone.deliveryInDays || ""}
                                  onChange={(e) => updateMilestone(milestone.id, "deliveryInDays", parseInt(e.target.value) || 1)}
                                  className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                  min="1"
                                />
                              </div>
                              <div className="w-[16%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  {getPriceLabel(milestone.chargePer)} *
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={milestone.price || ""}
                                  onChange={(e) => updateMilestone(milestone.id, "price", parseFloat(e.target.value) || 0)}
                                  className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                  min="0"
                                  step="0.01"
                                />
                                {selectedService && (
                                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] mt-1">
                                    Base: £{selectedService.basePrice}
                                  </p>
                                )}
                              </div>
                              <div className="w-[22%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Charge Per *
                                </Label>
                                <select
                                  value={milestone.chargePer}
                                  onChange={(e) => updateMilestone(milestone.id, "chargePer", e.target.value)}
                                  className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-input-background px-3 py-2 text-sm font-['Poppins',sans-serif] border-gray-200 focus:border-[#FE8A0F] focus:outline-none focus:ring-2 focus:ring-[#FE8A0F]/20 cursor-pointer"
                                >
                                  {getChargePerOptions().map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-[12%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  {getMilestoneNoOfLabel(milestone.chargePer)} *
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="1"
                                  value={milestone.noOf ?? ""}
                                  onChange={(e) => updateMilestone(milestone.id, "noOf", parseInt(e.target.value) || 0)}
                                  className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                  min="1"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                Description (optional)
                              </Label>
                              <Textarea
                                value={milestone.description || ""}
                                onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                                className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F] min-h-[80px]"
                                placeholder="Describe what this milestone includes"
                              />
                            </div>

                            <div className="flex justify-end mt-2">
                              <Button
                                onClick={() => saveMilestone(milestone.id)}
                                size="sm"
                                className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif] text-[12px] px-4"
                              >
                                Save
                              </Button>
                            </div>
                              </>
                            )}
                          </div>
                          );
                        })}
                      </div>

                      {/* Total Validation - sum of (price × noOf) per milestone */}
                      <div className="p-4 bg-[#EFF6FF] border border-[#3D78CB]/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Total Price (sum of price × noOf per milestone):
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] font-semibold">
                            £{totalMilestonesPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Total Delivery (sum of days):
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] font-semibold">
                            {totalMilestonesDelivery} days
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Action Buttons - Continue only for milestone (single goes to customize on card click) */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
              <Button
                onClick={() => setStep("select")}
                variant="outline"
                className="flex-1 font-['Poppins',sans-serif] text-[14px] border-gray-300 text-[#6b6b6b] hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {paymentType === "milestone" && (
                <Button
                  onClick={handleContinueToCustomize}
                  className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[14px]"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 overflow-auto px-6">
              <div className="space-y-5 py-4">
                {/* Service name + thumbnail (image or video) */}
                {selectedService && (
                  <div className="bg-white border border-[#FE8A0F]/30 rounded-xl overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {selectedService.thumbnailUrl ? (
                          selectedService.thumbnailType === "video" ? (
                            <video
                              src={resolveMediaUrl(selectedService.thumbnailUrl)}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={resolveMediaUrl(selectedService.thumbnailUrl)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#FE8A0F]">
                            <ShoppingBag className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-semibold mb-1">
                          {selectedService.name}
                        </h3>
                        <Badge className="bg-[#EFF6FF] text-[#3D78CB] border-[#3D78CB]/20 font-['Poppins',sans-serif] text-[11px]">
                          {selectedService.category}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStep("select")}
                          className="mt-2 text-[#6b6b6b] hover:text-[#FE8A0F] font-['Poppins',sans-serif] text-[12px]"
                        >
                          Change service
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2">
                    Offer description
                  </Label>
                  <Textarea
                    placeholder="Custom offer..."
                    value={offerDescription}
                    onChange={(e) => setOfferDescription(e.target.value)}
                    className="font-['Poppins',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F] min-h-[100px]"
                  />
                </div>

                {/* Switch to Milestones (single payment only) */}
                {paymentType === "single" && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="link"
                      className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] p-0 h-auto"
                      onClick={() => {
                        setStep("payment");
                        setPaymentType("milestone");
                      }}
                    >
                      Switch to Milestones
                    </Button>
                  </div>
                )}

                {/* Define terms section - single payment only */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-semibold">
                    Define the terms of your offer and what it includes
                  </h4>

                  {paymentType === "single" && (
                    <div className="grid grid-cols-4 gap-3">
                      {/* Delivery expected (days) - same as order delivery expected time */}
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1 block">
                          Delivery In (days)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Delivery expected time in days"
                          value={deliveryDays}
                          onChange={(e) => setDeliveryDays(e.target.value)}
                          className="font-['Poppins',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F]"
                          min="1"
                          step="1"
                        />
                      </div>

                      {/* Price (total) */}
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1 block">
                          {getPriceLabel(chargePer)}
                        </Label>
                        <Input
                          type="number"
                          placeholder="Enter total price"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          className="font-['Poppins',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F]"
                          min="0"
                          step="0.01"
                        />
                        {selectedService && (
                          <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] mt-1">
                            Base: £{selectedService.basePrice}
                          </p>
                        )}
                      </div>

                      {/* Charge Per */}
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1 block">
                          Charge Per
                        </Label>
                        <select
                          value={chargePer}
                          onChange={(e) => setChargePer(e.target.value)}
                          className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-input-background px-3 py-2 text-sm font-['Poppins',sans-serif] border-gray-200 focus:border-[#FE8A0F] focus:outline-none focus:ring-2 focus:ring-[#FE8A0F]/20 cursor-pointer"
                        >
                          {getChargePerOptions().map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* No of ${price unit} - quantity for order */}
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1 block">
                          {getQuantityLabel()}
                        </Label>
                        <Input
                          type="number"
                          placeholder={`Enter ${getQuantityLabel().toLowerCase()}`}
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="font-['Poppins',sans-serif] text-[14px] border-gray-200 focus:border-[#FE8A0F]"
                          min="1"
                          step="1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Attributes (from service features) */}
                  {selectedService && selectedService.features && selectedService.features.length > 0 && (
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2 block">
                        Offer includes
                      </Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedService.features.map((attr) => (
                          <label
                            key={attr}
                            className="flex items-center gap-2 cursor-pointer font-['Poppins',sans-serif] text-[13px] text-[#2c353f]"
                          >
                            <Checkbox
                              checked={selectedAttributes.includes(attr)}
                              onCheckedChange={(checked) => {
                                setSelectedAttributes((prev) =>
                                  checked ? [...prev, attr] : prev.filter((a) => a !== attr)
                                );
                              }}
                            />
                            <span>{attr}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Milestone Details (if milestone payment selected) */}
                {paymentType === "milestone" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
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
                      {milestones.map((milestone, index) => {
                        const isSaved = savedMilestones.has(milestone.id);
                        const milestoneTotal = milestone.price * (milestone.noOf || 1);
                        return (
                        <div
                          key={milestone.id}
                          className={`p-4 bg-white border-2 rounded-lg ${isSaved ? "border-[#FE8A0F]/30 bg-[#FFF5EB]/20" : "border-gray-200"} transition-all`}
                        >
                          {isSaved ? (
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => expandMilestone(milestone.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[12px] font-semibold">
                                  {index + 1}
                                </div>
                                <div>
                                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                                    {milestone.name}
                                  </span>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                      {milestone.deliveryInDays} {milestone.deliveryInDays <= 1 ? "day" : "days"}
                                    </span>
                                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#FE8A0F] font-semibold">
                                      £{milestoneTotal.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {milestones.length > 1 && (
                                  <Button
                                    onClick={(ev: React.MouseEvent) => { ev.stopPropagation(); removeMilestone(milestone.id); }}
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                                <span className="font-['Poppins',sans-serif] text-[11px] text-[#FE8A0F]">Edit</span>
                              </div>
                            </div>
                          ) : (
                            <>
                          <div className="flex items-center justify-between">
                            <h6 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
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

                            <div className="flex items-start gap-3">
                              <div className="w-[24%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Milestone Name *
                                </Label>
                                <Input
                                  type="text"
                                  placeholder="e.g., Design draft"
                                  value={milestone.name || ""}
                                  onChange={(e) => updateMilestone(milestone.id, "name", e.target.value)}
                                  className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                />
                              </div>
                              <div className="w-[14%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Delivery In (days) *
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="1"
                                  value={milestone.deliveryInDays || ""}
                                  onChange={(e) => updateMilestone(milestone.id, "deliveryInDays", parseInt(e.target.value) || 1)}
                                  className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                  min="1"
                                />
                              </div>
                              <div className="w-[16%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  {getPriceLabel(milestone.chargePer)} *
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={milestone.price || ""}
                                  onChange={(e) => updateMilestone(milestone.id, "price", parseFloat(e.target.value) || 0)}
                                  className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                  min="0"
                                  step="0.01"
                                />
                                {selectedService && (
                                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] mt-1">
                                    Base: £{selectedService.basePrice}
                                  </p>
                                )}
                              </div>
                              <div className="w-[22%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  Charge Per *
                                </Label>
                                <select
                                  value={milestone.chargePer}
                                  onChange={(e) => updateMilestone(milestone.id, "chargePer", e.target.value)}
                                  className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-input-background px-3 py-2 text-sm font-['Poppins',sans-serif] border-gray-200 focus:border-[#FE8A0F] focus:outline-none focus:ring-2 focus:ring-[#FE8A0F]/20 cursor-pointer"
                                >
                                  {getChargePerOptions().map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-[12%]">
                                <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                                  {getMilestoneNoOfLabel(milestone.chargePer)} *
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="1"
                                  value={milestone.noOf ?? ""}
                                  onChange={(e) => updateMilestone(milestone.id, "noOf", parseInt(e.target.value) || 0)}
                                  className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F]"
                                  min="1"
                                />
                              </div>
                            </div>

                          <div>
                            <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                            Description (optional)
                            </Label>
                            <Textarea
                              value={milestone.description || ""}
                              onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                              className="font-['Poppins',sans-serif] text-[13px] border-gray-200 focus:border-[#FE8A0F] min-h-[80px]"
                              placeholder="Describe what this milestone includes"
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              onClick={() => saveMilestone(milestone.id)}
                              size="sm"
                              className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif] text-[12px] px-4"
                            >
                              Save
                            </Button>
                          </div>
                            </>
                          )}
                        </div>
                        );
                      })}
                    </div>

                    {/* Total Validation - sum of (price × noOf) per milestone */}
                    <div className="p-4 bg-[#EFF6FF] border border-[#3D78CB]/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          Total Price (sum of price × noOf per milestone):
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] font-semibold">
                          £{totalMilestonesPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          Total Delivery (sum of days):
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] font-semibold">
                          {totalMilestonesDelivery} days
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
                className="flex-1 font-['Poppins',sans-serif] text-[14px] border-gray-300 text-[#6b6b6b] hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleContinueToFinalize}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[14px]"
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
