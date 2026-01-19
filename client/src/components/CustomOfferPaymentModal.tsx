import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { CreditCard, Gift, Wallet, Loader2 } from "lucide-react";
import { resolveApiUrl } from "../config/api";
import { useAccount } from "./AccountContext";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  type: "account_balance" | "card" | "paypal" | "bank_transfer";
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  isDefault?: boolean;
  balance?: number;
}

interface CustomOfferPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  offerPrice: number;
  serviceFee: number;
  total: number;
  onSuccess: (orderNumber: string) => void;
}

export default function CustomOfferPaymentModal({
  isOpen,
  onClose,
  offerId,
  offerPrice,
  serviceFee,
  total,
  onSuccess,
}: CustomOfferPaymentModalProps) {
  const { userInfo } = useAccount();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance().then(() => {
        fetchPaymentMethods();
      });
    }
  }, [isOpen]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/payment/wallet-balance"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const balance = data.balance || 0;
        setWalletBalance(balance);
        return balance;
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
    return 0;
  };

  const fetchPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const response = await fetch(resolveApiUrl("/api/payment-methods"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const methods: PaymentMethod[] = [
          {
            id: "account_balance",
            type: "account_balance",
            isDefault: true,
            balance: walletBalance,
          },
          ...(data.paymentMethods || []).map((pm: any) => ({
            id: pm.paymentMethodId || pm.id,
            type: "card" as const,
            cardNumber: pm.cardNumber || `****${pm.last4 || "****"}`,
            cardHolder: pm.cardHolder || "Card Holder",
            expiryDate: pm.expiryDate || "MM/YY",
            isDefault: pm.isDefault || false,
          })),
        ];
        setPaymentMethods(methods);
        
        // Set default payment method
        const defaultMethod = methods.find(m => m.isDefault) || methods[0];
        if (defaultMethod) {
          setSelectedPayment(defaultMethod.id);
        }
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }

    setLoading(true);
    try {
      const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
      const paymentMethod = selectedMethod?.type || "account_balance";
      const paymentMethodId = paymentMethod === "card" ? selectedMethod?.id : undefined;

      const response = await fetch(resolveApiUrl(`/api/custom-offers/${offerId}/accept`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentMethod,
          paymentMethodId,
          skipAddress: true, // Custom offers can skip address for now
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle PayPal redirect
        if (error.requiresApproval && error.approveUrl) {
          window.location.href = error.approveUrl;
          return;
        }
        
        throw new Error(error.error || 'Failed to accept offer');
      }

      const data = await response.json();
      
      // Check if PayPal approval is required
      if (data.requiresApproval && data.approveUrl) {
        window.location.href = data.approveUrl;
        return;
      }

      toast.success("Offer accepted! Order created.");
      onSuccess(data.order.orderNumber);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept offer");
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
  const calculatedServiceFee = serviceFee || 0;
  const calculatedTotal = total || (offerPrice + calculatedServiceFee);
  const canUseAccountBalance = selectedPayment === "account_balance" && walletBalance >= calculatedTotal;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
            Accept Custom Offer
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Choose a payment method to accept this offer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Offer Price:</span>
                <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">£{offerPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Service Fee:</span>
                <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">£{calculatedServiceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-['Poppins',sans-serif] text-[15px] font-medium text-[#2c353f]">Total:</span>
                <span className="font-['Poppins',sans-serif] text-[15px] font-medium text-[#FE8A0F]">£{calculatedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          {loadingMethods ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
            </div>
          ) : (
            <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id}>
                    <div className={`relative border-2 rounded-lg p-4 transition-all ${
                      selectedPayment === method.id 
                        ? "border-[#3B82F6] bg-blue-50/50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="mt-0.5 shrink-0" />
                        <Label htmlFor={`payment-${method.id}`} className="cursor-pointer flex-1">
                          {method.type === "account_balance" && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#10B981] rounded-full flex items-center justify-center shrink-0">
                                <Gift className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                                    Account Balance
                                  </span>
                                  {method.isDefault && (
                                    <Badge className="bg-[#10B981] text-white text-[10px]">Default</Badge>
                                  )}
                                </div>
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-0.5">
                                  Available: £{walletBalance.toFixed(2)}
                                  {walletBalance < total && (
                                    <span className="text-red-600 ml-2">(Insufficient)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                          {method.type === "card" && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
                                <CreditCard className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                                    {method.cardNumber}
                                  </span>
                                  {method.isDefault && (
                                    <Badge className="bg-[#10B981] text-white text-[10px]">Default</Badge>
                                  )}
                                </div>
                                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-0.5">
                                  {method.cardHolder} • Exp. {method.expiryDate}
                                </p>
                              </div>
                            </div>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* PayPal Option */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="payment-paypal"
                checked={selectedPayment === "paypal"}
                onChange={() => setSelectedPayment("paypal")}
                className="mt-0.5 shrink-0"
              />
              <Label htmlFor="payment-paypal" className="cursor-pointer flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0070BA] rounded flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                      PayPal
                    </span>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-0.5">
                      Pay with your PayPal account
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="font-['Poppins',sans-serif]"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcceptOffer}
            disabled={loading || !selectedPayment || (selectedPayment === "account_balance" && !canUseAccountBalance)}
            className="font-['Poppins',sans-serif] bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Accept Offer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
