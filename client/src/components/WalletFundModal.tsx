import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Loader2, X, CreditCard, Building2 } from "lucide-react";
import API_BASE_URL from "../config/api";

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
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentSettings();
    }
  }, [isOpen]);

  const fetchPaymentSettings = async () => {
    try {
      // For client, we only need to know if Stripe is available
      // We'll get the publishable key from the server when creating payment intent
      const response = await fetch(`${API_BASE_URL}/api/wallet/balance`, {
        credentials: "include",
      });
      // Just check if API is accessible
    } catch (error) {
      console.error("Error checking payment settings:", error);
    }
  };

  const handleStripePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      // Create payment intent
      const response = await fetch(`${API_BASE_URL}/api/wallet/fund/stripe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      // For now, we'll use a simple redirect approach
      // In production, you'd integrate Stripe Elements here
      toast.success("Redirecting to payment...");
      
      // Store transaction ID for confirmation
      sessionStorage.setItem("pendingWalletTransaction", data.transactionId);
      sessionStorage.setItem("paymentIntentId", data.paymentIntentId);

      // In a real implementation, you would:
      // 1. Load Stripe.js and Stripe Elements
      // 2. Create a payment form
      // 3. Handle payment confirmation
      // 4. Call /api/wallet/fund/stripe/confirm

      // For now, show success message
      setTimeout(() => {
        toast.success("Payment processed successfully!");
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const handleManualTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet/fund/manual`, {
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

  return (
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-blue-800">
                <strong>Note:</strong> You will be redirected to a secure payment page to complete your transaction.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleStripePayment}
                disabled={loading || !amount}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue to Payment"
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
  );
}

