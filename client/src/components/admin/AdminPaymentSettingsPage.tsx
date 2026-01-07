import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Loader2, Save, CreditCard, Building2 } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import API_BASE_URL from "../../config/api";

export default function AdminPaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    stripePublishableKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    environment: "test",
    isActive: false,
    minDepositAmount: 10,
    maxDepositAmount: 10000,
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
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-settings`, {
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
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-settings`, {
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
        description="Manage Stripe payment gateway credentials and manual transfer settings"
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
            <TabsTrigger value="manual">Manual Transfer</TabsTrigger>
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
                  Configure your Stripe payment gateway credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="environment" className="font-['Poppins',sans-serif]">
                    Environment
                  </Label>
                  <select
                    id="environment"
                    value={settings.environment}
                    onChange={(e) => updateField("environment", e.target.value)}
                    className="w-full mt-2 h-10 px-3 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F]"
                  >
                    <option value="test">Test Mode</option>
                    <option value="live">Live Mode</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="stripePublishableKey" className="font-['Poppins',sans-serif]">
                    Stripe Publishable Key
                  </Label>
                  <Input
                    id="stripePublishableKey"
                    type="text"
                    value={settings.stripePublishableKey}
                    onChange={(e) => updateField("stripePublishableKey", e.target.value)}
                    placeholder="pk_test_..."
                    className="mt-2 font-['Poppins',sans-serif]"
                  />
                </div>

                <div>
                  <Label htmlFor="stripeSecretKey" className="font-['Poppins',sans-serif]">
                    Stripe Secret Key
                  </Label>
                  <Input
                    id="stripeSecretKey"
                    type="password"
                    value={settings.stripeSecretKey}
                    onChange={(e) => updateField("stripeSecretKey", e.target.value)}
                    placeholder="sk_test_..."
                    className="mt-2 font-['Poppins',sans-serif]"
                  />
                </div>

                <div>
                  <Label htmlFor="stripeWebhookSecret" className="font-['Poppins',sans-serif]">
                    Stripe Webhook Secret
                  </Label>
                  <Input
                    id="stripeWebhookSecret"
                    type="password"
                    value={settings.stripeWebhookSecret}
                    onChange={(e) => updateField("stripeWebhookSecret", e.target.value)}
                    placeholder="whsec_..."
                    className="mt-2 font-['Poppins',sans-serif]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minDepositAmount" className="font-['Poppins',sans-serif]">
                      Minimum Deposit Amount (£)
                    </Label>
                    <Input
                      id="minDepositAmount"
                      type="number"
                      value={settings.minDepositAmount}
                      onChange={(e) => updateField("minDepositAmount", parseFloat(e.target.value) || 0)}
                      className="mt-2 font-['Poppins',sans-serif]"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDepositAmount" className="font-['Poppins',sans-serif]">
                      Maximum Deposit Amount (£)
                    </Label>
                    <Input
                      id="maxDepositAmount"
                      type="number"
                      value={settings.maxDepositAmount}
                      onChange={(e) => updateField("maxDepositAmount", parseFloat(e.target.value) || 0)}
                      className="mt-2 font-['Poppins',sans-serif]"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Transfer Tab */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Manual Transfer Settings
                </CardTitle>
                <CardDescription>
                  Configure manual bank transfer options for wallet funding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="manualTransferEnabled" className="font-['Poppins',sans-serif]">
                    Enable Manual Transfer
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
                    placeholder="Enter instructions for users on how to make manual transfers..."
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

