import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Loader2, Save, CreditCard, Building2, Wallet } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import API_BASE_URL, { resolveApiUrl } from "../../config/api";

export default function AdminPaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Stripe Test Mode Keys
    stripeTestPublishableKey: "",
    stripeTestSecretKey: "",
    stripeTestWebhookSecret: "",
    // Stripe Live Mode Keys
    stripeLivePublishableKey: "",
    stripeLiveSecretKey: "",
    stripeLiveWebhookSecret: "",
    // Legacy Stripe fields (for backward compatibility)
    stripePublishableKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    // PayPal Sandbox Mode Keys
    paypalSandboxClientId: "",
    paypalSandboxSecretKey: "",
    // PayPal Live Mode Keys
    paypalLiveClientId: "",
    paypalLiveSecretKey: "",
    paypalEnabled: true,
    // PayPal environment
    paypalEnvironment: "sandbox",
    // Stripe environment
    stripeEnvironment: "test",
    environment: "test", // Legacy
    isActive: false,
    minDepositAmount: 1,
    maxDepositAmount: 10000,
    minWithdrawAmount: 1,
    maxWithdrawAmount: 5000,
    manualTransferEnabled: true,
    manualTransferInstructions: "",
    bankAccountDetails: {
      accountName: "",
      accountNumber: "",
      sortCode: "",
      bankName: "",
      iban: "",
      swift: "",
    },
    adminCommissionPercentage: 3.5,
    stripeCommissionPercentage: 1.55,
    stripeCommissionFixed: 0.29,
    paypalCommissionPercentage: 3.00,
    paypalCommissionFixed: 0.30,
    bankProcessingFeePercentage: 2.00,
    creditAmountForChatBid: 2.50,
    closedProjectDays: 7,
    waitingTimeInDays: 1,
    feedbackReviewValidityDays: 90,
    inviteToReview: "Activated",
    waitingTimeToAcceptOffer: 2,
    waitingTimeToApproveOrder: 2,
    stepInAmount: 5.00,
    stepInDays: 1,
    arbitrationFeeDeadlineDays: 1,
    disputeResponseTimeHours: 48,
    searchApiKey: "",
    serviceFees: 0,
    serviceFeeThreshold: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/admin/payment-settings"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            ...settings,
            ...data.settings,
            bankAccountDetails: {
              ...settings.bankAccountDetails,
              ...(data.settings.bankAccountDetails || {}),
            },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      toast.error("Failed to load payment settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(resolveApiUrl("/api/admin/payment-settings"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Payment settings saved successfully");
        // Reload settings to ensure UI is in sync
        await fetchSettings();
      } else {
        toast.error(data.error || "Failed to save payment settings");
      }
    } catch (error) {
      console.error("Error saving payment settings:", error);
      toast.error("Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const parseNumberInput = (value: string, type: "int" | "float") => {
    if (value === "") return "";
    const parsed = type === "int" ? parseInt(value, 10) : parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const updateBankField = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      bankAccountDetails: {
        ...prev.bankAccountDetails,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <AdminPageLayout
        title="Payment Settings"
        description="Manage Stripe payment gateway credentials and bank transfer settings"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Payment Settings"
      description="Manage Stripe payment gateway credentials and manual transfer settings"
    >
      <div className="space-y-6">
        <Tabs defaultValue="stripe" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stripe">Stripe Settings</TabsTrigger>
            <TabsTrigger value="paypal">PayPal Settings</TabsTrigger>
            <TabsTrigger value="manual">Bank Transfer</TabsTrigger>
            <TabsTrigger value="commissions">Commissions & Fees</TabsTrigger>
            <TabsTrigger value="other">Other Settings</TabsTrigger>
          </TabsList>

          {/* Stripe Settings Tab */}
          <TabsContent value="stripe" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Stripe API Configuration
                </CardTitle>
                <CardDescription>
                  Configure your Stripe payment gateway credentials for Test and Live modes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="font-['Poppins',sans-serif]">
                    Enable Stripe Payments
                  </Label>
                  <Switch
                    id="isActive"
                    checked={settings.isActive}
                    onCheckedChange={(checked) => updateField("isActive", checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="stripeEnvironment" className="font-['Poppins',sans-serif]">
                    Stripe Environment
                  </Label>
                  <select
                    id="stripeEnvironment"
                    value={settings.stripeEnvironment || settings.environment || "test"}
                    onChange={(e) => {
                      updateField("stripeEnvironment", e.target.value);
                      updateField("environment", e.target.value); // Keep legacy field in sync
                    }}
                    className="w-full mt-2 h-10 px-3 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F]"
                  >
                    <option value="test">Test Mode</option>
                    <option value="live">Live Mode</option>
                  </select>
                  <p className="text-[12px] text-gray-500 mt-1">
                    {(settings.stripeEnvironment || settings.environment) === "test" 
                      ? "Test mode uses test API keys. No real payments will be processed."
                      : "Live mode uses live API keys. Real payments will be processed."}
                  </p>
                </div>

                {/* Test Mode Keys */}
                {(settings.stripeEnvironment || settings.environment) === "test" && (
                  <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-['Poppins',sans-serif] text-[14px] font-semibold text-yellow-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Test Mode API Keys
                    </h4>
                    <div>
                      <Label htmlFor="stripeTestPublishableKey" className="font-['Poppins',sans-serif] text-[13px]">
                        Test Publishable Key
                      </Label>
                      <Input
                        id="stripeTestPublishableKey"
                        type="text"
                        value={settings.stripeTestPublishableKey || settings.stripePublishableKey || ""}
                        onChange={(e) => {
                          updateField("stripeTestPublishableKey", e.target.value);
                          updateField("stripePublishableKey", e.target.value); // Keep legacy in sync
                        }}
                        placeholder="pk_test_..."
                        className="mt-1 font-['Poppins',sans-serif]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stripeTestSecretKey" className="font-['Poppins',sans-serif] text-[13px]">
                        Test Secret Key
                      </Label>
                      <Input
                        id="stripeTestSecretKey"
                        type="password"
                        value={settings.stripeTestSecretKey || settings.stripeSecretKey || ""}
                        onChange={(e) => {
                          updateField("stripeTestSecretKey", e.target.value);
                          updateField("stripeSecretKey", e.target.value); // Keep legacy in sync
                        }}
                        placeholder="sk_test_..."
                        className="mt-1 font-['Poppins',sans-serif]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stripeTestWebhookSecret" className="font-['Poppins',sans-serif] text-[13px]">
                        Test Webhook Secret
                      </Label>
                      <Input
                        id="stripeTestWebhookSecret"
                        type="password"
                        value={settings.stripeTestWebhookSecret || settings.stripeWebhookSecret || ""}
                        onChange={(e) => {
                          updateField("stripeTestWebhookSecret", e.target.value);
                          updateField("stripeWebhookSecret", e.target.value); // Keep legacy in sync
                        }}
                        placeholder="whsec_..."
                        className="mt-1 font-['Poppins',sans-serif]"
                      />
                    </div>
                  </div>
                )}

                {/* Live Mode Keys */}
                {(settings.stripeEnvironment || settings.environment) === "live" && (
                  <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-['Poppins',sans-serif] text-[14px] font-semibold text-green-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Live Mode API Keys
                    </h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-red-700">
                        <strong>Warning:</strong> Live mode will process real payments. Make sure your API keys are correct.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="stripeLivePublishableKey" className="font-['Poppins',sans-serif] text-[13px]">
                        Live Publishable Key
                      </Label>
                      <Input
                        id="stripeLivePublishableKey"
                        type="text"
                        value={settings.stripeLivePublishableKey || ""}
                        onChange={(e) => {
                          updateField("stripeLivePublishableKey", e.target.value);
                          updateField("stripePublishableKey", e.target.value); // Keep legacy in sync
                        }}
                        placeholder="pk_live_..."
                        className="mt-1 font-['Poppins',sans-serif]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stripeLiveSecretKey" className="font-['Poppins',sans-serif] text-[13px]">
                        Live Secret Key
                      </Label>
                      <Input
                        id="stripeLiveSecretKey"
                        type="password"
                        value={settings.stripeLiveSecretKey || ""}
                        onChange={(e) => {
                          updateField("stripeLiveSecretKey", e.target.value);
                          updateField("stripeSecretKey", e.target.value); // Keep legacy in sync
                        }}
                        placeholder="sk_live_..."
                        className="mt-1 font-['Poppins',sans-serif]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stripeLiveWebhookSecret" className="font-['Poppins',sans-serif] text-[13px]">
                        Live Webhook Secret
                      </Label>
                      <Input
                        id="stripeLiveWebhookSecret"
                        type="password"
                        value={settings.stripeLiveWebhookSecret || ""}
                        onChange={(e) => {
                          updateField("stripeLiveWebhookSecret", e.target.value);
                          updateField("stripeWebhookSecret", e.target.value); // Keep legacy in sync
                        }}
                        placeholder="whsec_..."
                        className="mt-1 font-['Poppins',sans-serif]"
                      />
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {/* PayPal Settings Tab */}
          <TabsContent value="paypal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  PayPal API Configuration
                </CardTitle>
                <CardDescription>
                  Configure your PayPal payment gateway credentials for Sandbox and Live modes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="paypalEnabled" className="font-['Poppins',sans-serif]">
                    Enable PayPal Payments
                  </Label>
                  <Switch
                    id="paypalEnabled"
                    checked={settings.paypalEnabled}
                    onCheckedChange={(checked) => updateField("paypalEnabled", checked)}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="paypalEnvironment" className="font-['Poppins',sans-serif] text-[14px] font-semibold">
                      PayPal Environment
                    </Label>
                    <select
                      id="paypalEnvironment"
                      value={settings.paypalEnvironment || "sandbox"}
                      onChange={(e) => updateField("paypalEnvironment", e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md font-['Poppins',sans-serif] text-[13px]"
                    >
                      <option value="sandbox">Sandbox (Test Mode)</option>
                      <option value="live">Live (Production Mode)</option>
                    </select>
                    <p className="mt-1 font-['Poppins',sans-serif] text-[12px] text-gray-600">
                      Select the environment for PayPal payments. Sandbox for testing, Live for production.
                    </p>
                  </div>

                  {/* Sandbox Keys - Only show when sandbox mode is selected */}
                  {settings.paypalEnvironment === "sandbox" && (
                    <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-['Poppins',sans-serif] text-[14px] font-semibold text-yellow-800 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        PayPal Sandbox API Keys (Test Mode)
                      </h4>
                      
                      <div>
                        <Label htmlFor="paypalSandboxClientId" className="font-['Poppins',sans-serif] text-[13px]">
                          PayPal Sandbox Client ID
                        </Label>
                        <Input
                          id="paypalSandboxClientId"
                          type="text"
                          value={settings.paypalSandboxClientId || ""}
                          onChange={(e) => updateField("paypalSandboxClientId", e.target.value)}
                          placeholder="Enter PayPal Sandbox Client ID"
                          className="mt-1 font-['Poppins',sans-serif]"
                        />
                      </div>

                      <div>
                        <Label htmlFor="paypalSandboxSecretKey" className="font-['Poppins',sans-serif] text-[13px]">
                          PayPal Sandbox Secret Key
                        </Label>
                        <Input
                          id="paypalSandboxSecretKey"
                          type="password"
                          value={settings.paypalSandboxSecretKey || ""}
                          onChange={(e) => updateField("paypalSandboxSecretKey", e.target.value)}
                          placeholder="Enter PayPal Sandbox Secret Key"
                          className="mt-1 font-['Poppins',sans-serif]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Live Keys - Only show when live mode is selected */}
                  {settings.paypalEnvironment === "live" && (
                  <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-['Poppins',sans-serif] text-[14px] font-semibold text-green-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      PayPal Live API Keys (Production Mode)
                    </h4>
                    
                    <div>
                      <Label htmlFor="paypalLiveClientId" className="font-['Poppins',sans-serif] text-[13px]">
                        PayPal Live Client ID
                      </Label>
                      <Input
                        id="paypalLiveClientId"
                        type="text"
                        value={settings.paypalLiveClientId || ""}
                        onChange={(e) => updateField("paypalLiveClientId", e.target.value)}
                        placeholder="Enter PayPal Live Client ID"
                        className="mt-1 font-['Poppins',sans-serif]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="paypalLiveSecretKey" className="font-['Poppins',sans-serif] text-[13px]">
                        PayPal Live Secret Key
                      </Label>
                      <Input
                        id="paypalLiveSecretKey"
                        type="password"
                        value={settings.paypalLiveSecretKey || ""}
                        onChange={(e) => updateField("paypalLiveSecretKey", e.target.value)}
                        placeholder="Enter PayPal Live Secret Key"
                        className="mt-1 font-['Poppins',sans-serif]"
                      />
                    </div>
                  </div>
                  )}

                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Transfer Tab */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Bank Transfer Settings
                </CardTitle>
                <CardDescription>
                  Configure bank transfer options for wallet funding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="manualTransferEnabled" className="font-['Poppins',sans-serif]">
                    Enable Bank Transfer
                  </Label>
                  <Switch
                    id="manualTransferEnabled"
                    checked={settings.manualTransferEnabled}
                    onCheckedChange={(checked) => updateField("manualTransferEnabled", checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="manualTransferInstructions" className="font-['Poppins',sans-serif]">
                    Transfer Instructions
                  </Label>
                  <Textarea
                    id="manualTransferInstructions"
                    value={settings.manualTransferInstructions}
                    onChange={(e) => updateField("manualTransferInstructions", e.target.value)}
                    placeholder="Enter instructions for users on how to make bank transfers..."
                    className="mt-2 font-['Poppins',sans-serif] min-h-[100px]"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                    Bank Account Details
                  </h3>

                  <div>
                    <Label htmlFor="accountName" className="font-['Poppins',sans-serif]">
                      Account Name
                    </Label>
                    <Input
                      id="accountName"
                      type="text"
                      value={settings.bankAccountDetails.accountName}
                      onChange={(e) => updateBankField("accountName", e.target.value)}
                      className="mt-2 font-['Poppins',sans-serif]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankName" className="font-['Poppins',sans-serif]">
                      Bank Name
                    </Label>
                    <Input
                      id="bankName"
                      type="text"
                      value={settings.bankAccountDetails.bankName}
                      onChange={(e) => updateBankField("bankName", e.target.value)}
                      className="mt-2 font-['Poppins',sans-serif]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountNumber" className="font-['Poppins',sans-serif]">
                        Account Number
                      </Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        value={settings.bankAccountDetails.accountNumber}
                        onChange={(e) => updateBankField("accountNumber", e.target.value)}
                        className="mt-2 font-['Poppins',sans-serif]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sortCode" className="font-['Poppins',sans-serif]">
                        Sort Code
                      </Label>
                      <Input
                        id="sortCode"
                        type="text"
                        value={settings.bankAccountDetails.sortCode}
                        onChange={(e) => updateBankField("sortCode", e.target.value)}
                        className="mt-2 font-['Poppins',sans-serif]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="iban" className="font-['Poppins',sans-serif]">
                        IBAN
                      </Label>
                      <Input
                        id="iban"
                        type="text"
                        value={settings.bankAccountDetails.iban}
                        onChange={(e) => updateBankField("iban", e.target.value)}
                        className="mt-2 font-['Poppins',sans-serif]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="swift" className="font-['Poppins',sans-serif]">
                        SWIFT/BIC
                      </Label>
                      <Input
                        id="swift"
                        type="text"
                        value={settings.bankAccountDetails.swift}
                        onChange={(e) => updateBankField("swift", e.target.value)}
                        className="mt-2 font-['Poppins',sans-serif]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions & Fees Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                  Commission & Fee Settings
                </CardTitle>
                <CardDescription className="font-['Poppins',sans-serif]">
                  Configure commission rates and processing fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="maxWithdrawAmount" className="font-['Poppins',sans-serif]">
                        Max Withdraw Amount:
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">£</span>
                        <Input
                          id="maxWithdrawAmount"
                          type="number"
                          value={settings.maxWithdrawAmount || 0}
                          onChange={(e) => updateField("maxWithdrawAmount", parseFloat(e.target.value) || 0)}
                          className="pl-8 font-['Poppins',sans-serif]"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="maxDepositAmount" className="font-['Poppins',sans-serif]">
                        Max Deposit Amount:
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">£</span>
                        <Input
                          id="maxDepositAmount"
                          type="number"
                          value={settings.maxDepositAmount || 0}
                          onChange={(e) => updateField("maxDepositAmount", parseFloat(e.target.value) || 0)}
                          className="pl-8 font-['Poppins',sans-serif]"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="adminCommissionPercentage" className="font-['Poppins',sans-serif]">
                        Admin Commission in percentage (For Tradesman):
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="adminCommissionPercentage"
                          type="number"
                          value={settings.adminCommissionPercentage || 0}
                          onChange={(e) => updateField("adminCommissionPercentage", parseFloat(e.target.value) || 0)}
                          className="pr-8 font-['Poppins',sans-serif]"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">%</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="closedProjectDays" className="font-['Poppins',sans-serif]">
                        Closed Project Day(s):
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="closedProjectDays"
                          type="number"
                          value={settings.closedProjectDays || 0}
                          onChange={(e) => updateField("closedProjectDays", parseInt(e.target.value) || 0)}
                          className="pr-16 font-['Poppins',sans-serif]"
                          min="0"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">Day(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="minWithdrawAmount" className="font-['Poppins',sans-serif]">
                        Min Withdraw Amount:
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">£</span>
                        <Input
                          id="minWithdrawAmount"
                          type="number"
                          value={settings.minWithdrawAmount || 0}
                          onChange={(e) => updateField("minWithdrawAmount", parseFloat(e.target.value) || 0)}
                          className="pl-8 font-['Poppins',sans-serif]"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="minDepositAmount" className="font-['Poppins',sans-serif]">
                        Min Deposit Amount:
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">£</span>
                        <Input
                          id="minDepositAmount"
                          type="number"
                          value={settings.minDepositAmount || 0}
                          onChange={(e) => updateField("minDepositAmount", parseFloat(e.target.value) || 0)}
                          className="pl-8 font-['Poppins',sans-serif]"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="creditAmountForChatBid" className="font-['Poppins',sans-serif]">
                        Credit Amount for Chat/Bid(Pay as you go):
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">£</span>
                        <Input
                          id="creditAmountForChatBid"
                          type="number"
                          value={settings.creditAmountForChatBid || 0}
                          onChange={(e) => updateField("creditAmountForChatBid", parseFloat(e.target.value) || 0)}
                          className="pl-8 font-['Poppins',sans-serif]"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="waitingTimeInDays" className="font-['Poppins',sans-serif]">
                        Waiting time in days(s):
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="waitingTimeInDays"
                          type="number"
                          value={settings.waitingTimeInDays || 0}
                          onChange={(e) => updateField("waitingTimeInDays", parseInt(e.target.value) || 0)}
                          className="pr-16 font-['Poppins',sans-serif]"
                          min="0"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">Day(s)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commission Sections */}
                <div className="pt-6 border-t space-y-6">
                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f] mb-4">
                      Stripe Commission
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stripeCommissionPercentage" className="font-['Poppins',sans-serif]">
                          Stripe commission:
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="stripeCommissionPercentage"
                            type="number"
                            value={settings.stripeCommissionPercentage || 0}
                            onChange={(e) => updateField("stripeCommissionPercentage", parseFloat(e.target.value) || 0)}
                            className="pr-8 font-['Poppins',sans-serif]"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">%</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="stripeCommissionFixed" className="font-['Poppins',sans-serif]">
                          Fixed:
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="stripeCommissionFixed"
                            type="number"
                            value={settings.stripeCommissionFixed || 0}
                            onChange={(e) => updateField("stripeCommissionFixed", parseFloat(e.target.value) || 0)}
                            className="pr-12 font-['Poppins',sans-serif]"
                            min="0"
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">Fixed</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 font-['Poppins',sans-serif]">
                      Total commission will be: ({settings.stripeCommissionPercentage || 0}% + {settings.stripeCommissionFixed || 0})
                    </p>
                  </div>

                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f] mb-4">
                      PayPal Commission
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="paypalCommissionPercentage" className="font-['Poppins',sans-serif]">
                          Paypal commission:
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="paypalCommissionPercentage"
                            type="number"
                            value={settings.paypalCommissionPercentage || 0}
                            onChange={(e) => updateField("paypalCommissionPercentage", parseFloat(e.target.value) || 0)}
                            className="pr-8 font-['Poppins',sans-serif]"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">%</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="paypalCommissionFixed" className="font-['Poppins',sans-serif]">
                          Fixed:
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="paypalCommissionFixed"
                            type="number"
                            value={settings.paypalCommissionFixed || 0}
                            onChange={(e) => updateField("paypalCommissionFixed", parseFloat(e.target.value) || 0)}
                            className="pr-12 font-['Poppins',sans-serif]"
                            min="0"
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">Fixed</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 font-['Poppins',sans-serif]">
                      Total commission will be: ({settings.paypalCommissionPercentage || 0}% + {settings.paypalCommissionFixed || 0})
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bankProcessingFeePercentage" className="font-['Poppins',sans-serif]">
                      Bank Processing fee(%)(For Homeowners):
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="bankProcessingFeePercentage"
                        type="number"
                        value={settings.bankProcessingFeePercentage || 0}
                        onChange={(e) => updateField("bankProcessingFeePercentage", parseFloat(e.target.value) || 0)}
                        className="pr-8 font-['Poppins',sans-serif]"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Settings Tab */}
          <TabsContent value="other" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                  Other Settings
                </CardTitle>
                <CardDescription className="font-['Poppins',sans-serif]">
                  Configure additional system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="feedbackReviewValidityDays" className="font-['Poppins',sans-serif]">
                        Feedback/Review validity(Days):
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="feedbackReviewValidityDays"
                          type="number"
                          value={settings.feedbackReviewValidityDays === "" ? "" : settings.feedbackReviewValidityDays ?? 0}
                          onChange={(e) => updateField("feedbackReviewValidityDays", parseNumberInput(e.target.value, "float"))}
                          className="pr-16 font-['Poppins',sans-serif] no-spinner"
                          min="0"
                          step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">Day(s)</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="inviteToReview" className="font-['Poppins',sans-serif]">
                        Invite to review:
                      </Label>
                      <select
                        id="inviteToReview"
                        value={settings.inviteToReview || "Activated"}
                        onChange={(e) => updateField("inviteToReview", e.target.value)}
                        className="w-full mt-2 h-10 px-3 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F]"
                      >
                        <option value="Activated">Activated</option>
                        <option value="Deactivated">Deactivated</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="stepInAmount" className="font-['Poppins',sans-serif]">
                        Step In Amount:
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">£</span>
                        <Input
                          id="stepInAmount"
                          type="number"
                          value={settings.stepInAmount === "" ? "" : settings.stepInAmount ?? 0}
                          onChange={(e) => updateField("stepInAmount", parseNumberInput(e.target.value, "float"))}
                          className="pl-8 font-['Poppins',sans-serif] no-spinner"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="arbitrationFeeDeadlineDays" className="font-['Poppins',sans-serif]">
                        Arbitration fee deadline In Day(s):
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="arbitrationFeeDeadlineDays"
                          type="number"
                          value={settings.arbitrationFeeDeadlineDays === "" ? "" : settings.arbitrationFeeDeadlineDays ?? 0}
                          onChange={(e) => updateField("arbitrationFeeDeadlineDays", parseNumberInput(e.target.value, "float"))}
                          className="pr-16 font-['Poppins',sans-serif] no-spinner"
                          min="0"
                          step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">Day(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="waitingTimeToAcceptOffer" className="font-['Poppins',sans-serif]">
                        Waiting time to accept offer:
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="waitingTimeToAcceptOffer"
                          type="number"
                          value={settings.waitingTimeToAcceptOffer === "" ? "" : settings.waitingTimeToAcceptOffer ?? 0}
                          onChange={(e) => updateField("waitingTimeToAcceptOffer", parseNumberInput(e.target.value, "float"))}
                          className="pr-16 font-['Poppins',sans-serif] no-spinner"
                          min="0"
                          step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">hours</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="waitingTimeToApproveOrder" className="font-['Poppins',sans-serif]">
                        Waiting time to approve order:
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="waitingTimeToApproveOrder"
                          type="number"
                          value={settings.waitingTimeToApproveOrder === "" ? "" : settings.waitingTimeToApproveOrder ?? 0}
                          onChange={(e) => updateField("waitingTimeToApproveOrder", parseNumberInput(e.target.value, "float"))}
                          className="pr-16 font-['Poppins',sans-serif] no-spinner"
                          min="0"
                          step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">
                          Day(s)
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="disputeResponseTimeHours" className="font-['Poppins',sans-serif]">
                        Dispute initial response time:
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="disputeResponseTimeHours"
                          type="number"
                          value={settings.disputeResponseTimeHours === "" ? "" : settings.disputeResponseTimeHours ?? 0}
                          onChange={(e) => updateField("disputeResponseTimeHours", parseNumberInput(e.target.value, "float"))}
                          className="pr-16 font-['Poppins',sans-serif] no-spinner"
                          min="0"
                          step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">
                          Hour(s)
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="stepInDays" className="font-['Poppins',sans-serif]">
                        Step In Day(s):
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="stepInDays"
                          type="number"
                          value={settings.stepInDays === "" ? "" : settings.stepInDays ?? 0}
                          onChange={(e) => updateField("stepInDays", parseNumberInput(e.target.value, "float"))}
                          className="pr-16 font-['Poppins',sans-serif] no-spinner"
                          min="0"
                          step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">Day(s)</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="searchApiKey" className="font-['Poppins',sans-serif]">
                        Search API Key:
                      </Label>
                      <Input
                        id="searchApiKey"
                        type="text"
                        value={settings.searchApiKey || ""}
                        onChange={(e) => updateField("searchApiKey", e.target.value)}
                        className="mt-2 font-['Poppins',sans-serif]"
                        placeholder="KC89-MX72-WB81-YG55"
                      />
                    </div>

                    <div>
                      <Label htmlFor="serviceFees" className="font-['Poppins',sans-serif]">
                        Service Fees:
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">£</span>
                        <Input
                          id="serviceFees"
                          type="number"
                          value={settings.serviceFees === "" ? "" : settings.serviceFees ?? 0.01}
                          onChange={(e) => updateField("serviceFees", parseNumberInput(e.target.value, "float"))}
                          className="pl-8 font-['Poppins',sans-serif] no-spinner"
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="serviceFeeThreshold" className="font-['Poppins',sans-serif]">
                        Service Fee Threshold:
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">£</span>
                        <Input
                          id="serviceFeeThreshold"
                          type="number"
                          value={settings.serviceFeeThreshold === "" ? "" : settings.serviceFeeThreshold ?? 0.01}
                          onChange={(e) => updateField("serviceFeeThreshold", parseNumberInput(e.target.value, "float"))}
                          className="pl-8 font-['Poppins',sans-serif] no-spinner"
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-600 font-['Poppins',sans-serif]">
                        Orders with subtotal equal to or above this amount will have FREE service fee
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  );
}

