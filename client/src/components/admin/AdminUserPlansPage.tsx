import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2, Save } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { resolveApiUrl } from "../../config/api";

type QuoteCreditSettingsState = {
  freeBidsPerMonth: number | "" | undefined;
  pricePerBid: number | "" | undefined;
  basicPlanPrice: number | "" | undefined;
  basicPlanBids: number | "" | undefined;
  standardPlanPrice: number | "" | undefined;
  standardPlanBids: number | "" | undefined;
  premiumPlanPrice: number | "" | undefined;
  premiumPlanBids: number | "" | undefined;
};

const DEFAULTS: QuoteCreditSettingsState = {
  freeBidsPerMonth: 3,
  pricePerBid: 2.5,
  basicPlanPrice: 5,
  basicPlanBids: 2,
  standardPlanPrice: 10,
  standardPlanBids: 5,
  premiumPlanPrice: 15,
  premiumPlanBids: 15,
};

export default function AdminUserPlansPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<QuoteCreditSettingsState>({ ...DEFAULTS });

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
          const s = data.settings;
          setSettings({
            freeBidsPerMonth: s.freeBidsPerMonth ?? DEFAULTS.freeBidsPerMonth,
            pricePerBid: s.pricePerBid ?? DEFAULTS.pricePerBid,
            basicPlanPrice: s.basicPlanPrice ?? DEFAULTS.basicPlanPrice,
            basicPlanBids: s.basicPlanBids ?? DEFAULTS.basicPlanBids,
            standardPlanPrice: s.standardPlanPrice ?? DEFAULTS.standardPlanPrice,
            standardPlanBids: s.standardPlanBids ?? DEFAULTS.standardPlanBids,
            premiumPlanPrice: s.premiumPlanPrice ?? DEFAULTS.premiumPlanPrice,
            premiumPlanBids: s.premiumPlanBids ?? DEFAULTS.premiumPlanBids,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching quote credit settings:", error);
      toast.error("Failed to load quote credit settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        freeBidsPerMonth:
          settings.freeBidsPerMonth === "" ? 0 : Number(settings.freeBidsPerMonth ?? 0),
        pricePerBid: settings.pricePerBid === "" ? 0 : Number(settings.pricePerBid ?? 0),
        basicPlanPrice: settings.basicPlanPrice === "" ? 0 : Number(settings.basicPlanPrice ?? 0),
        basicPlanBids: settings.basicPlanBids === "" ? 0 : Number(settings.basicPlanBids ?? 0),
        standardPlanPrice:
          settings.standardPlanPrice === "" ? 0 : Number(settings.standardPlanPrice ?? 0),
        standardPlanBids:
          settings.standardPlanBids === "" ? 0 : Number(settings.standardPlanBids ?? 0),
        premiumPlanPrice:
          settings.premiumPlanPrice === "" ? 0 : Number(settings.premiumPlanPrice ?? 0),
        premiumPlanBids:
          settings.premiumPlanBids === "" ? 0 : Number(settings.premiumPlanBids ?? 0),
      };

      const response = await fetch(resolveApiUrl("/api/admin/payment-settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Quote credit settings saved successfully");
        await fetchSettings();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving quote credit settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof QuoteCreditSettingsState, value: number | "") => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const parseNumberInput = (value: string, type: "int" | "float") => {
    if (value === "") return "" as const;
    const parsed = type === "int" ? parseInt(value, 10) : parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  if (loading) {
    return (
      <AdminPageLayout
        title="User Plans"
        description="Configure quote credits professionals use when sending quotes on jobs"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="User Plans"
      description="Configure quote credits professionals use when sending quotes (same values as the Quote credits area in the app)"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
              Quote credits
            </CardTitle>
            <CardDescription className="font-['Poppins',sans-serif]">
              These values control how many quote credits professionals get for free each month, the
              price per credit when buying a custom quantity, and the Basic, Standard, and Premium
              packs (price and number of credits).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="freeBidsPerMonth" className="font-['Poppins',sans-serif]">
                  Free quote credits per month
                </Label>
                <Input
                  id="freeBidsPerMonth"
                  type="number"
                  value={settings.freeBidsPerMonth === "" ? "" : settings.freeBidsPerMonth ?? 3}
                  onChange={(e) =>
                    updateField("freeBidsPerMonth", parseNumberInput(e.target.value, "int") || 0)
                  }
                  className="mt-2 font-['Poppins',sans-serif] no-spinner"
                  min="0"
                />
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-1">
                  Number of free quote credits each professional receives every month (one credit per
                  quote sent).
                </p>
              </div>
              <div>
                <Label htmlFor="pricePerBid" className="font-['Poppins',sans-serif]">
                  Price per quote credit (£)
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">
                    £
                  </span>
                  <Input
                    id="pricePerBid"
                    type="number"
                    value={settings.pricePerBid === "" ? "" : settings.pricePerBid ?? 2.5}
                    onChange={(e) =>
                      updateField("pricePerBid", parseNumberInput(e.target.value, "float") || 0)
                    }
                    className="pl-8 font-['Poppins',sans-serif] no-spinner"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-1">
                  Applied when a professional buys a custom number of credits (e.g. 10 credits =
                  £25.00 at £2.50 per credit).
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">
                  Basic plan
                </h4>
                <div>
                  <Label htmlFor="basicPlanPrice" className="font-['Poppins',sans-serif]">
                    Price (£)
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">
                      £
                    </span>
                    <Input
                      id="basicPlanPrice"
                      type="number"
                      value={settings.basicPlanPrice === "" ? "" : settings.basicPlanPrice ?? 5}
                      onChange={(e) =>
                        updateField("basicPlanPrice", parseNumberInput(e.target.value, "float") || 0)
                      }
                      className="pl-8 font-['Poppins',sans-serif] no-spinner"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="basicPlanBids" className="font-['Poppins',sans-serif]">
                    Quote credits
                  </Label>
                  <Input
                    id="basicPlanBids"
                    type="number"
                    value={settings.basicPlanBids === "" ? "" : settings.basicPlanBids ?? 2}
                    onChange={(e) =>
                      updateField("basicPlanBids", parseNumberInput(e.target.value, "int") || 0)
                    }
                    className="mt-2 font-['Poppins',sans-serif] no-spinner"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">
                  Standard plan
                </h4>
                <div>
                  <Label htmlFor="standardPlanPrice" className="font-['Poppins',sans-serif]">
                    Price (£)
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">
                      £
                    </span>
                    <Input
                      id="standardPlanPrice"
                      type="number"
                      value={
                        settings.standardPlanPrice === "" ? "" : settings.standardPlanPrice ?? 10
                      }
                      onChange={(e) =>
                        updateField(
                          "standardPlanPrice",
                          parseNumberInput(e.target.value, "float") || 0,
                        )
                      }
                      className="pl-8 font-['Poppins',sans-serif] no-spinner"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="standardPlanBids" className="font-['Poppins',sans-serif]">
                    Quote credits
                  </Label>
                  <Input
                    id="standardPlanBids"
                    type="number"
                    value={settings.standardPlanBids === "" ? "" : settings.standardPlanBids ?? 5}
                    onChange={(e) =>
                      updateField("standardPlanBids", parseNumberInput(e.target.value, "int") || 0)
                    }
                    className="mt-2 font-['Poppins',sans-serif] no-spinner"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">
                  Premium plan
                </h4>
                <div>
                  <Label htmlFor="premiumPlanPrice" className="font-['Poppins',sans-serif]">
                    Price (£)
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-['Poppins',sans-serif]">
                      £
                    </span>
                    <Input
                      id="premiumPlanPrice"
                      type="number"
                      value={
                        settings.premiumPlanPrice === "" ? "" : settings.premiumPlanPrice ?? 15
                      }
                      onChange={(e) =>
                        updateField(
                          "premiumPlanPrice",
                          parseNumberInput(e.target.value, "float") || 0,
                        )
                      }
                      className="pl-8 font-['Poppins',sans-serif] no-spinner"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="premiumPlanBids" className="font-['Poppins',sans-serif]">
                    Quote credits
                  </Label>
                  <Input
                    id="premiumPlanBids"
                    type="number"
                    value={settings.premiumPlanBids === "" ? "" : settings.premiumPlanBids ?? 15}
                    onChange={(e) =>
                      updateField("premiumPlanBids", parseNumberInput(e.target.value, "int") || 0)
                    }
                    className="mt-2 font-['Poppins',sans-serif] no-spinner"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
