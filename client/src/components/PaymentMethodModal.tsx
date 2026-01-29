import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2, CreditCard } from "lucide-react";
import API_BASE_URL from "../config/api";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  publishableKey: string;
}

export default function PaymentMethodModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  publishableKey 
}: PaymentMethodModalProps) {
  const [loading, setLoading] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && publishableKey) {
      loadStripe();
    }
    
    return () => {
      if (cardElement) {
        cardElement.unmount();
      }
    };
  }, [isOpen, publishableKey]);

  const loadStripe = async () => {
    try {
      const stripeModule = await import("@stripe/stripe-js");
      const stripeInstance = await stripeModule.loadStripe(publishableKey);
      setStripe(stripeInstance);
      
      if (stripeInstance && cardElementRef.current) {
        const elementsInstance = stripeInstance.elements();
        setElements(elementsInstance);
        
        const card = elementsInstance.create("card", {
          style: {
            base: {
              fontSize: "16px",
              color: "#2c353f",
              fontFamily: "'Poppins', sans-serif",
              "::placeholder": {
                color: "#9ca3af",
              },
            },
          },
        });
        
        if (cardElementRef.current) {
          card.mount(cardElementRef.current);
          setCardElement(card);
        }
      }
    } catch (error) {
      console.error("Error loading Card payment:", error);
      toast.error("Failed to load payment form");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[card-add][step 1] submit clicked");
    
    if (!stripe || !cardElement) {
      console.log("[card-add][step 1.1] stripe or cardElement missing", {
        hasStripe: Boolean(stripe),
        hasCardElement: Boolean(cardElement),
      });
      toast.error("Payment form not ready");
      return;
    }

    setLoading(true);
    try {
      console.log("[card-add][step 2] create setup intent request");
      // Create setup intent on backend
      const response = await fetch(`${API_BASE_URL}/api/payment-methods/create-setup-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("[card-add][step 2.1] create-setup-intent response", {
        status: response.status,
        data,
      });
      if (!response.ok) {
        throw new Error(data.error || "Failed to create setup intent");
      }

      console.log("[card-add][step 3] confirm card setup");
      // Confirm setup intent with card
      const { error: confirmError, setupIntent: confirmedIntent } = await stripe.confirmCardSetup(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        console.log("[card-add][step 3.1] confirm error", confirmError);
        throw new Error(confirmError.message);
      }

      console.log("[card-add][step 4] save payment method", {
        paymentMethodId: confirmedIntent?.payment_method,
      });
      // Save payment method to user account
      const saveResponse = await fetch(`${API_BASE_URL}/api/payment-methods/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          paymentMethodId: confirmedIntent.payment_method,
        }),
      });

      const saveData = await saveResponse.json();
      console.log("[card-add][step 4.1] save response", {
        status: saveResponse.status,
        data: saveData,
      });
      if (!saveResponse.ok) {
        throw new Error(saveData.error || "Failed to save payment method");
      }

      toast.success("Payment method added successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.log("[card-add][error]", error);
      toast.error(error.message || "Failed to add payment method");
    } finally {
      setLoading(false);
      console.log("[card-add][step 5] done");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
            Add Payment Method
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              Card Details
            </label>
            <div
              ref={cardElementRef}
              className="p-3 border-2 border-gray-200 rounded-xl focus-within:border-[#FE8A0F]"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || !stripe}
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Card"
              )}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="font-['Poppins',sans-serif]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
