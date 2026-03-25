import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Loader2, CreditCard, Building2, Plus, Trash2, Check, Info, ChevronDown, ChevronUp } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { resolveApiUrl } from "../config/api";
import PaymentMethodModal from "./PaymentMethodModal";
import { useCurrency } from "./CurrencyContext";
import { useAccount } from "./AccountContext";
import paypalLogo from "../assets/paypal-logo.png";

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
  hideTitle?: boolean;
  titleText?: string;
  initialPaymentType?: "card" | "paypal" | "bank";
  initialAmount?: string;
  hideBankOption?: boolean;
  restrictToSelectedPaymentType?: boolean;
  lockAmount?: boolean;
  /** When true, card/PayPal wallet top-up skips admin min deposit (used for Quote credits flow). Bank unchanged. */
  forQuoteCreditPurchase?: boolean;
  /** When true, skip min/max deposit limits (job award → wallet → milestone escrow). */
  forJobMilestoneAward?: boolean;
}

// Payment method logos
const VisaLogo = () => (
  <svg width="40" height="24" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white"/>
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1"/>
    <path d="M22.5859 22.75H19.9609L21.7859 14H24.4109L22.5859 22.75ZM17.7109 14L15.2109 20.125L14.9109 18.375L14.0359 14.875C14.0359 14.875 13.8859 14 13.2859 14H9.08594V14.15C9.08594 14.15 10.2609 14.45 11.5859 15.175L13.9609 22.75H16.8359L20.9609 14H17.7109ZM37.8359 22.75H40.1859L38.2859 14H36.2859C35.8359 14 35.5359 14.3 35.3859 14.75L31.4609 22.75H34.3359L34.9359 21.3H38.3359L38.6359 22.75H37.8359ZM35.6359 19.125L36.9609 16.0625L37.6859 19.125H35.6359ZM31.5859 16.875L32.0359 14.875C32.0359 14.875 30.8609 14 29.6859 14C28.3609 14 25.3359 14.75 25.3359 17.5625C25.3359 20.1875 29.1859 20.1875 29.1859 21.3125C29.1859 22.4375 25.9609 22.1875 24.9359 21.4375L24.4859 23.4375C24.4859 23.4375 25.6609 24 27.4359 24C29.0609 24 31.8359 23.125 31.8359 20.5C31.8359 17.875 28.0359 17.625 28.0359 16.75C28.0359 15.75 30.5359 15.875 31.5859 16.875Z" fill="#1434CB"/>
  </svg>
);

const MastercardLogo = () => (
  <svg width="40" height="24" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white"/>
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1"/>
    <circle cx="21" cy="18" r="8" fill="#EB001B"/>
    <circle cx="35" cy="18" r="8" fill="#F79E1B"/>
    <path d="M28 11.5C26.25 13 25 15.35 25 18C25 20.65 26.25 23 28 24.5C29.75 23 31 20.65 31 18C31 15.35 29.75 13 28 11.5Z" fill="#FF5F00"/>
  </svg>
);

const PayPalLogo = () => (
  <img src={paypalLogo} alt="PayPal" className="h-5 w-auto shrink-0 object-contain" />
);

const BankLogo = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="40" height="24" rx="4" fill="#1E40AF"/>
    <path d="M20 6L26 10V18H22V12H18V18H14V10L20 6Z" fill="white"/>
  </svg>
);

export default function WalletFundModal({
  isOpen,
  onClose,
  onSuccess,
  hideTitle,
  titleText,
  initialPaymentType,
  initialAmount,
  hideBankOption,
  restrictToSelectedPaymentType,
  lockAmount,
  forQuoteCreditPurchase = false,
  forJobMilestoneAward = false,
}: WalletFundModalProps) {
  const { userInfo } = useAccount();
  const { formatPrice, symbol, currency, toGBP, fromGBP, formatAmountInSelectedCurrency } = useCurrency();
  const [selectedPaymentType, setSelectedPaymentType] = useState<"card" | "paypal" | "bank">(initialPaymentType ?? "card");
  const [expandedPaymentType, setExpandedPaymentType] = useState<"card" | "paypal" | "bank" | null>(initialPaymentType ?? "card");
  const [amount, setAmount] = useState(initialAmount ?? "20");
  const [reference, setReference] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfDeposit, setDateOfDeposit] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingReference, setLoadingReference] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [bankAccountDetails, setBankAccountDetails] = useState({
    accountName: "",
    accountNumber: "",
    sortCode: "",
    bankName: "",
  });
  const [paymentSettings, setPaymentSettings] = useState({
    stripeCommissionPercentage: 1.55,
    stripeCommissionFixed: 0.29,
    bankProcessingFeePercentage: 2.00,
  });

  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [paypalTransactionId, setPaypalTransactionId] = useState<string | null>(null);

  const restrictPaymentType = !!restrictToSelectedPaymentType;
  const lockAmountField = !!lockAmount;
  const isQuoteCreditTopUp = !!forQuoteCreditPurchase;
  const isJobMilestoneAwardTopUp = !!forJobMilestoneAward;

  // Calculate fees (amount and fee in selected currency for display)
  const calculateFees = () => {
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) return { total: 0, fee: 0, paymentDue: 0 };

    if (isQuoteCreditTopUp) {
      return { total: amountNum, fee: 0, paymentDue: amountNum };
    }

    let fee = 0;
    if (selectedPaymentType === "card") {
      const fixedInSelected = fromGBP(paymentSettings.stripeCommissionFixed);
      fee = (amountNum * paymentSettings.stripeCommissionPercentage / 100) + fixedInSelected;
    } else if (selectedPaymentType === "bank") {
      fee = amountNum * paymentSettings.bankProcessingFeePercentage / 100;
    } else if (selectedPaymentType === "paypal") {
      fee = (amountNum * 3.0 / 100) + fromGBP(0.30);
    }

    return {
      total: amountNum,
      fee: fee,
      paymentDue: amountNum + fee,
    };
  };

  const fees = calculateFees();

  // Generate deposit reference when bank transfer is selected
  useEffect(() => {
    if (isOpen && selectedPaymentType === "bank") {
      generateDepositReference();
      fetchBankAccountDetails();
      if (userInfo?.firstName && userInfo?.lastName) {
        setFullName(`${userInfo.firstName} ${userInfo.lastName}`);
      } else if (userInfo?.name) {
        setFullName(userInfo.name);
      }
    }
  }, [isOpen, selectedPaymentType, userInfo]);

  // Fetch payment methods when card is selected
  useEffect(() => {
    if (isOpen && selectedPaymentType === "card") {
      fetchPaymentMethods();
      fetchPublishableKey();
    }
  }, [isOpen, selectedPaymentType]);

  // Always fetch publishable keys (needed for PayPal) when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetchPublishableKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fetch payment settings when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPaymentSettings();
      if (typeof initialPaymentType !== "undefined") {
        setSelectedPaymentType(initialPaymentType);
        setExpandedPaymentType(initialPaymentType);
      }
      if (typeof initialAmount !== "undefined") {
        setAmount(String(initialAmount));
      }
      setPaypalOrderId(null);
      setPaypalTransactionId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialPaymentType, initialAmount]);

  const fetchBankAccountDetails = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.bankAccountDetails) {
          setBankAccountDetails({
            accountName: data.bankAccountDetails.accountName || "",
            accountNumber: data.bankAccountDetails.accountNumber || "",
            sortCode: data.bankAccountDetails.sortCode || "",
            bankName: data.bankAccountDetails.bankName || "",
          });
        }
        if (data.stripeCommissionPercentage !== undefined) {
          setPaymentSettings({
            stripeCommissionPercentage: data.stripeCommissionPercentage || 1.55,
            stripeCommissionFixed: data.stripeCommissionFixed || 0.29,
            bankProcessingFeePercentage: data.bankProcessingFeePercentage || 2.00,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching bank account details:", error);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.stripeCommissionPercentage !== undefined) {
          setPaymentSettings({
            stripeCommissionPercentage: data.stripeCommissionPercentage || 1.55,
            stripeCommissionFixed: data.stripeCommissionFixed || 0.29,
            bankProcessingFeePercentage: data.bankProcessingFeePercentage || 2.00,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    }
  };

  const generateDepositReference = async () => {
    setLoadingReference(true);
    try {
      const response = await fetch(resolveApiUrl("/api/wallet/fund/manual/reference"), {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setReference(data.reference || "");
      } else {
        if (userInfo?.email && userInfo?.referenceId) {
          const emailPrefix = userInfo.email.split('@')[0];
          setReference(`${emailPrefix}-${userInfo.referenceId}`);
        } else {
          setReference("");
        }
      }
    } catch (error) {
      if (userInfo?.email && userInfo?.referenceId) {
        const emailPrefix = userInfo.email.split('@')[0];
        setReference(`${emailPrefix}-${userInfo.referenceId}`);
      } else {
        setReference("");
      }
    } finally {
      setLoadingReference(false);
    }
  };

  const fetchPublishableKey = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPublishableKey(data.publishableKey);
        setPaypalClientId(data.paypalClientId || null);
        setPaypalEnabled(data.paypalEnabled === true);
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

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (selectedPaymentType === "card") {
      await handleStripePayment();
    } else if (selectedPaymentType === "bank") {
      await handleManualTransfer();
    } else if (selectedPaymentType === "paypal") {
      // PayPal is handled via PayPalButtons in the UI.
    }
  };

  const handlePayPalCreateOrder = async (): Promise<string> => {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Please enter a valid amount");
    }
    const amountGBP = toGBP(parseFloat(amount));
      const response = await fetch(resolveApiUrl("/api/wallet/fund/paypal"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: amountGBP,
          ...(isQuoteCreditTopUp ? { forQuoteCreditPurchase: true } : {}),
          ...(isJobMilestoneAwardTopUp ? { forJobMilestoneAward: true } : {}),
        }),
      });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Failed to create PayPal order");
    }

    setPaypalOrderId(data.orderId ?? null);
    setPaypalTransactionId(data.transactionId ?? null);
    return data.orderId as string;
  };

  const handlePayPalApprove = async (data: { orderID: string }) => {
    try {
      setLoading(true);
      if (!paypalTransactionId) {
        throw new Error("Missing PayPal transaction id");
      }
      const response = await fetch(resolveApiUrl("/api/wallet/fund/paypal/capture"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: data.orderID,
          transactionId: paypalTransactionId,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to capture PayPal payment");
      }

      toast.success(`Wallet funded successfully! New balance: ${formatPrice(result.balance ?? 0)}`);
      await Promise.resolve(onSuccess());
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to process PayPal payment");
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
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
          amount: toGBP(parseFloat(amount)),
          paymentMethodId: selectedPaymentMethod,
          ...(isQuoteCreditTopUp ? { forQuoteCreditPurchase: true } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      if (data.status === 'succeeded') {
        toast.success(`Wallet funded successfully! New balance: ${formatPrice(data.balance)}`);
        await Promise.resolve(onSuccess());
        onClose();
      } else if (data.requiresAction) {
        toast.info("Please complete the authentication");
        pollPaymentStatus(data.transactionId, data.clientSecret);
      } else {
        toast.success("Payment processed successfully!");
        await Promise.resolve(onSuccess());
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string, clientSecret: string) => {
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
          toast.success(`Wallet funded successfully! New balance: ${formatPrice(data.balance)}`);
          Promise.resolve(onSuccess()).then(() => onClose());
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
    if (!fullName || !fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!dateOfDeposit) {
      toast.error("Please select the date of deposit");
      return;
    }

    if (!reference || !reference.trim()) {
      toast.error("Deposit reference is missing. Please try again.");
      await generateDepositReference();
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
          amount: toGBP(parseFloat(amount)),
          reference: reference.trim(),
          fullName: fullName.trim(),
          dateOfDeposit: dateOfDeposit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create transfer request");
      }

      toast.success("Transfer request submitted successfully. We will credit your wallet once we receive your payment.");
      setAmount("");
      setFullName("");
      setDateOfDeposit("");
      setReference("");
      await Promise.resolve(onSuccess());
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

  const getCardBrandLogo = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return <VisaLogo />;
    if (brandLower.includes('mastercard')) return <MastercardLogo />;
    return <CreditCard className="w-10 h-6 text-gray-400" />;
  };

  const togglePaymentType = (type: "card" | "paypal" | "bank") => {
    if (hideBankOption && type === "bank") return;
    if (expandedPaymentType === type) {
      setExpandedPaymentType(null);
    } else {
      setExpandedPaymentType(type);
      setSelectedPaymentType(type);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={[
            "w-full min-w-0 overflow-y-auto p-4 sm:p-6",
            "max-h-[90vh]",
            /* Mobile: full-viewport width sheet; undo default centered narrow dialog */
            "max-sm:mx-0 max-sm:max-h-[100dvh] max-sm:h-full max-sm:max-w-none max-sm:w-full max-sm:rounded-none max-sm:border-x-0",
            "max-sm:inset-x-0 max-sm:top-0 max-sm:bottom-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0",
            /* Desktop / tablet: ~60% of viewport width (not full-width) */
            "sm:mx-auto sm:w-[60%] sm:max-w-[60vw]",
          ].join(" ")}
          style={{ zIndex: 2000001 }}
        >
          <DialogHeader>
            <DialogTitle
              className={
                hideTitle
                  ? "sr-only"
                  : "font-['Poppins',sans-serif] text-[20px] text-[#2c353f]"
              }
            >
              {titleText || "Fund Your Wallet"}
            </DialogTitle>
          </DialogHeader>

          <div className="w-full min-w-0 max-w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Left Section: Select Payment Method */}
            <div className="space-y-4">
              <h3 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                Select payment method
              </h3>

              <RadioGroup
                value={selectedPaymentType}
                onValueChange={(value: string) => {
                  if (restrictPaymentType) return;
                  const type = value as "card" | "paypal" | "bank";
                  togglePaymentType(type);
                }}
                className="space-y-4"
              >
                {/* Card Payment Option */}
                {(!restrictPaymentType || selectedPaymentType === "card") && (
                  <div className="border-2 rounded-lg">
                  <div
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPaymentType === "card"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => togglePaymentType("card")}
                  >
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <RadioGroupItem
                          value="card"
                          id="payment-card"
                          className="mt-0.5 shrink-0"
                        />
                        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                          <span className="shrink-0">
                            {getCardBrandLogo(paymentMethods.find(m => m.paymentMethodId === selectedPaymentMethod)?.card.brand || "visa")}
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] break-words">
                            {selectedPaymentMethod && paymentMethods.length > 0
                              ? `•••• ${paymentMethods.find(m => m.paymentMethodId === selectedPaymentMethod)?.card.last4} (${currency})`
                              : "Debit or credit card"}
                          </span>
                        </div>
                      </div>
                      {expandedPaymentType === "card" ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                    {!expandedPaymentType && selectedPaymentType === "card" && (
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-2 ml-7">
                        All major cards accepted
                      </p>
                    )}
                  </div>

                {expandedPaymentType === "card" && (
                  <div className="border-t border-gray-200 p-4 bg-white space-y-3">
                    {loadingMethods ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
                      </div>
                    ) : paymentMethods.length === 0 ? (
                      <div className="space-y-3">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-gray-600">
                          No Cards found.
                        </p>
                      </div>
                    ) : (
                      <RadioGroup
                        value={selectedPaymentMethod || ""}
                        onValueChange={setSelectedPaymentMethod}
                      >
                        {paymentMethods.map((method) => (
                          <div
                            key={method.paymentMethodId}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedPaymentMethod === method.paymentMethodId
                                ? "border-[#FE8A0F] bg-[#FFF5EB]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedPaymentMethod(method.paymentMethodId)}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <RadioGroupItem
                                value={method.paymentMethodId}
                                id={`method-${method.paymentMethodId}`}
                                className="mt-0.5 shrink-0"
                              />
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <span className="shrink-0 pt-0.5">{getCardBrandLogo(method.card.brand)}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f] break-all sm:break-words">
                                      •••• {method.card.last4}
                                    </span>
                                    {method.isDefault && (
                                      <span className="px-2 py-0.5 bg-[#FE8A0F] text-white text-[10px] rounded shrink-0">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                    Expires {String(method.card.expMonth).padStart(2, '0')}/{method.card.expYear}
                                  </p>
                                </div>
                              </div>
                              {selectedPaymentMethod === method.paymentMethodId && (
                                <Check className="w-5 h-5 text-[#FE8A0F] shrink-0 mt-0.5" />
                              )}
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      <div className="space-y-2">
                        <div
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() => setShowAddCardModal(true)}
                        >
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <Plus className="w-3 h-3 text-gray-400" />
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            <div>
                              <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                Add New Card
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                )}

                {/* PayPal Option */}
                {(!restrictPaymentType || selectedPaymentType === "paypal") && (
                  <div className="border-2 rounded-lg">
                  <div
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPaymentType === "paypal"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => togglePaymentType("paypal")}
                  >
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <RadioGroupItem
                          value="paypal"
                          id="payment-paypal"
                          className="mt-0 shrink-0"
                        />
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0"><PayPalLogo /></span>
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            PayPal
                          </span>
                        </div>
                      </div>
                      {expandedPaymentType === "paypal" ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                    </div>
                  </div>

                {expandedPaymentType === "paypal" && (
                  <div className="border-t border-gray-200 p-4 bg-white">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                      Select the amount on the right. PayPal buttons will appear below.
                    </p>
                  </div>
                )}
                  </div>
                )}

                {!hideBankOption && (!restrictPaymentType || selectedPaymentType === "bank") && (
                  <>
                    {/* Bank Transfer Option */}
                    <div className="border-2 rounded-lg">
                      <div
                        className={`p-4 cursor-pointer transition-all ${
                          selectedPaymentType === "bank"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => togglePaymentType("bank")}
                      >
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <RadioGroupItem
                              value="bank"
                              id="payment-bank"
                              className="mt-0 shrink-0"
                            />
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0"><BankLogo /></span>
                              <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                Bank Transfer
                              </span>
                            </div>
                          </div>
                          {expandedPaymentType === "bank" ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                          )}
                        </div>
                      </div>

                      {expandedPaymentType === "bank" && (
                        <div className="border-t border-gray-200 p-4 bg-white space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                            <h4 className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                              Our bank information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-[#6b6b6b]">Account Name: </span>
                                <span className="font-semibold text-[#2c353f]">
                                  {bankAccountDetails.accountName || "Loading..."}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#6b6b6b]">Bank Name: </span>
                                <span className="font-semibold text-[#2c353f]">
                                  {bankAccountDetails.bankName || "Loading..."}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#6b6b6b]">Sort Code: </span>
                                <span className="font-semibold text-[#2c353f]">
                                  {bankAccountDetails.sortCode || "Loading..."}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#6b6b6b]">Account Number: </span>
                                <span className="font-semibold text-[#2c353f]">
                                  {bankAccountDetails.accountNumber || "Loading..."}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#6b6b6b]">Reference ID: </span>
                                <span className="font-semibold text-[#2c353f]">
                                  {userInfo?.referenceId || "Loading..."}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="full-name" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                Full name:
                              </Label>
                              <Input
                                id="full-name"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                className="mt-1 font-['Poppins',sans-serif]"
                              />
                            </div>

                            <div>
                              <Label htmlFor="date-of-deposit" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                Date of deposit:
                              </Label>
                              <Input
                                id="date-of-deposit"
                                type="date"
                                value={dateOfDeposit}
                                onChange={(e) => setDateOfDeposit(e.target.value)}
                                className="mt-1 font-['Poppins',sans-serif]"
                              />
                            </div>

                            <div>
                              <Label htmlFor="deposit-reference" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                Deposit reference:
                              </Label>
                              <Input
                                id="deposit-reference"
                                type="text"
                                value={loadingReference ? "Generating..." : reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Enter deposit reference"
                                className="mt-1 font-['Poppins',sans-serif] bg-gray-50"
                                readOnly
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </RadioGroup>
            </div>

            {/* Right Section: Select Amount */}
            <div className="space-y-4">
              <h3 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                Select amount ({currency})
              </h3>

              <div>
                <Label htmlFor="amount" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                  Amount
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-[#2c353f] font-medium">
                    {symbol}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    disabled={lockAmountField}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="20"
                    className="pl-8 font-['Poppins',sans-serif]"
                    min={isQuoteCreditTopUp ? "0.01" : "10"}
                    step="0.01"
                  />
                </div>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
                  {(isQuoteCreditTopUp || isJobMilestoneAwardTopUp) &&
                  (selectedPaymentType === "card" || selectedPaymentType === "paypal") ? (
                    <></>
                  ) : (
                    <>Minimum: {formatAmountInSelectedCurrency(10)}</>
                  )}
                </p>

                {selectedPaymentType === "paypal" && (
                  <div className="pt-3">
                    {!paypalEnabled || !paypalClientId ? (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-yellow-800">
                        PayPal is not configured.
                      </p>
                    ) : (
                      <PayPalScriptProvider
                        options={{
                          clientId: paypalClientId,
                          currency: "GBP",
                          intent: "capture",
                        }}
                      >
                        <PayPalButtons
                          createOrder={handlePayPalCreateOrder}
                          onApprove={handlePayPalApprove}
                          onError={() => {
                            toast.error("PayPal payment failed. Please try again.");
                            setLoading(false);
                          }}
                          onCancel={() => {
                            setPaypalOrderId(null);
                            setPaypalTransactionId(null);
                          }}
                          style={{
                            layout: "vertical",
                            color: "blue",
                            shape: "rect",
                            label: "paypal",
                          }}
                        />
                      </PayPalScriptProvider>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                    Total due:
                  </span>
                  <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                    {formatAmountInSelectedCurrency(fees.total)}
                  </span>
                </div>
                {!isQuoteCreditTopUp && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        Processing fee:
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-blue-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-white border border-gray-200 text-gray-800 shadow-lg p-3 max-w-xs">
                          <p className="font-['Poppins',sans-serif] text-[13px]">
                            {selectedPaymentType === "card"
                              ? `Card charges (${paymentSettings.stripeCommissionPercentage}%+${symbol}${paymentSettings.stripeCommissionFixed}) processing fee and processes your payment immediately.`
                              : selectedPaymentType === "bank"
                              ? `We charge ${paymentSettings.bankProcessingFeePercentage}% processing fee and process your payment within 1-2 working days.`
                              : "PayPal processing fee information"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                      {formatAmountInSelectedCurrency(fees.fee)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                      Payment due:
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#2c353f]">
                      {formatAmountInSelectedCurrency(fees.paymentDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              {selectedPaymentType !== "paypal" && (
                <Button
                  onClick={handlePayment}
                  disabled={
                    loading ||
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    (selectedPaymentType === "card" && !selectedPaymentMethod && paymentMethods.length === 0) ||
                    (selectedPaymentType === "bank" && (!fullName || !dateOfDeposit || !reference))
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-['Poppins',sans-serif] py-6 text-[16px] font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Confirm and pay ${formatAmountInSelectedCurrency(fees.paymentDue)}`
                  )}
                </Button>
              )}

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
            </div>
          </div>
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
