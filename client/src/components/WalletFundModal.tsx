import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Loader2, CreditCard, Building2, Plus, Trash2, Check } from "lucide-react";
import { resolveApiUrl } from "../config/api";
import PaymentMethodModal from "./PaymentMethodModal";

interface PaymentMethod {
  paymentMethodId: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: string;
}

interface WalletFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WalletFundModal({ isOpen, onClose, onSuccess }: WalletFundModalProps) {
  const [activeTab, setActiveTab] = useState<"stripe" | "manual">("stripe");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === "stripe") {
      fetchPaymentMethods();
      fetchPublishableKey();
    }
  }, [isOpen, activeTab]);

  const fetchPublishableKey = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPublishableKey(data.publishableKey);
      }
    } catch (error) {
      console.error("Error fetching publishable key:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const response = await fetch(resolveApiUrl("/api/payment-methods"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
        const defaultMethod = data.paymentMethods?.find((pm: PaymentMethod) => pm.isDefault);
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod.paymentMethodId);
        } else if (data.paymentMethods?.length > 0) {
          setSelectedPaymentMethod(data.paymentMethods[0].paymentMethodId);
        }
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleStripePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!selectedPaymentMethod && paymentMethods.length === 0) {
      toast.error("Please add a payment method first");
      setShowAddCardModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(resolveApiUrl("/api/wallet/fund/stripe"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          paymentMethodId: selectedPaymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      // If payment succeeded immediately
      if (data.status === 'succeeded') {
        toast.success(`Wallet funded successfully! New balance: £${data.balance?.toFixed(2)}`);
        onSuccess();
        onClose();
      } else if (data.requiresAction) {
        // Handle 3D Secure or other actions
        toast.info("Please complete the authentication");
        // In a real implementation, you'd handle the requires_action flow
        // For now, we'll poll for status
        pollPaymentStatus(data.transactionId, data.clientSecret);
      } else {
        toast.success("Payment processed successfully!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string, clientSecret: string) => {
    // Poll for payment status
    const maxAttempts = 10;
    let attempts = 0;
    
    const poll = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(resolveApiUrl("/api/wallet/fund/stripe/confirm"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            transactionId,
            paymentIntentId: clientSecret.split('_secret')[0],
          }),
        });

        const data = await response.json();
        if (response.ok && data.transaction?.status === 'completed') {
          clearInterval(poll);
          toast.success(`Wallet funded successfully! New balance: £${data.balance?.toFixed(2)}`);
          onSuccess();
          onClose();
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          toast.error("Payment confirmation timeout. Please check your wallet balance.");
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(poll);
        }
      }
    }, 2000);
  };

  const handleManualTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(resolveApiUrl("/api/wallet/fund/manual"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          amount: parseFloat(amount),
          reference: reference.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create transfer request");
      }

      toast.success("Transfer request created. Please complete the bank transfer and wait for admin approval.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create transfer request");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCardSuccess = () => {
    fetchPaymentMethods();
    setShowAddCardModal(false);
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch(resolveApiUrl("/api/payment-methods/set-default"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ paymentMethodId }),
      });

      if (response.ok) {
        toast.success("Default payment method updated");
        fetchPaymentMethods();
      }
    } catch (error) {
      toast.error("Failed to set default payment method");
    }
  };

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return;
    }

    try {
      const response = await fetch(resolveApiUrl(`/api/payment-methods/${paymentMethodId}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Payment method deleted");
        fetchPaymentMethods();
        if (selectedPaymentMethod === paymentMethodId) {
          setSelectedPaymentMethod(null);
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete payment method");
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'VISA';
    if (brandLower.includes('mastercard')) return 'MC';
    if (brandLower.includes('amex')) return 'AMEX';
    return brand.toUpperCase().slice(0, 4);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Fund Your Wallet
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stripe" className="font-['Poppins',sans-serif]">
                <CreditCard className="w-4 h-4 mr-2" />
                Stripe Payment
              </TabsTrigger>
              <TabsTrigger value="manual" className="font-['Poppins',sans-serif]">
                <Building2 className="w-4 h-4 mr-2" />
                Manual Transfer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stripe" className="space-y-4 mt-4">
              {/* Payment Methods List */}
              {loadingMethods ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-yellow-800 mb-3">
                    <strong>No payment methods found.</strong> Please add a payment method to fund your wallet.
                  </p>
                  <Button
                    onClick={() => setShowAddCardModal(true)}
                    className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Select Payment Method
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddCardModal(true)}
                      className="font-['Poppins',sans-serif] text-[12px]"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Card
                    </Button>
                  </div>
                  
                  {paymentMethods.map((method) => (
                    <div
                      key={method.paymentMethodId}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === method.paymentMethodId
                          ? "border-[#FE8A0F] bg-[#FFF5EB]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedPaymentMethod(method.paymentMethodId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FE8A0F]/10 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-[#FE8A0F]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                                {getCardBrandIcon(method.card.brand)} •••• {method.card.last4}
                              </span>
                              {method.isDefault && (
                                <span className="px-2 py-0.5 bg-[#FE8A0F] text-white text-[10px] rounded font-['Poppins',sans-serif]">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                              Expires {String(method.card.expMonth).padStart(2, '0')}/{method.card.expYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedPaymentMethod === method.paymentMethodId && (
                            <Check className="w-5 h-5 text-[#FE8A0F]" />
                          )}
                          {!method.isDefault && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefault(method.paymentMethodId);
                              }}
                              className="text-[12px]"
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCard(method.paymentMethodId);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label htmlFor="stripe-amount" className="font-['Poppins',sans-serif]">
                  Amount (£)
                </Label>
                <Input
                  id="stripe-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-2 font-['Poppins',sans-serif]"
                  min="10"
                  step="0.01"
                />
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
                  Minimum: £10.00
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleStripePayment}
                  disabled={loading || !amount || paymentMethods.length === 0}
                  className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Fund Wallet"
                  )}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="font-['Poppins',sans-serif]"
                >
                  Cancel
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="manual-amount" className="font-['Poppins',sans-serif]">
                  Amount (£)
                </Label>
                <Input
                  id="manual-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-2 font-['Poppins',sans-serif]"
                  min="10"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="reference" className="font-['Poppins',sans-serif]">
                  Reference (Optional)
                </Label>
                <Input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter payment reference"
                  className="mt-2 font-['Poppins',sans-serif]"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-['Poppins',sans-serif] text-[13px] text-yellow-800 mb-2">
                  <strong>Important:</strong> After making the bank transfer, your wallet will be credited once an admin approves your request.
                </p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-yellow-700">
                  Please include the reference number in your bank transfer for faster processing.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleManualTransfer}
                  disabled={loading || !amount}
                  className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Request...
                    </>
                  ) : (
                    "Create Transfer Request"
                  )}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="font-['Poppins',sans-serif]"
                >
                  Cancel
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Card Modal */}
      {showAddCardModal && (
        <PaymentMethodModal
          isOpen={showAddCardModal}
          onClose={() => setShowAddCardModal(false)}
          onSuccess={handleAddCardSuccess}
          publishableKey={publishableKey || ""}
        />
      )}
    </>
  );
}
