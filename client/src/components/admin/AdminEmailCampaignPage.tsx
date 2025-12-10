import React, { useState, useEffect } from "react";
import { Mail, Edit, Save, X, Eye, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import API_BASE_URL from "../../config/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface EmailTemplate {
  _id?: string;
  category: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  logoUrl: string;
  emailFrom?: string;
  createdAt?: string;
  updatedAt?: string;
}

const categories = [
  { value: "verification", label: "Verification", icon: "✓", color: "bg-blue-500" },
  { value: "listing", label: "Listing", icon: "📋", color: "bg-green-500" },
  { value: "orders", label: "Orders", icon: "📦", color: "bg-purple-500" },
  { value: "notification", label: "Notification", icon: "🔔", color: "bg-yellow-500" },
  { value: "support", label: "Support", icon: "💬", color: "bg-red-500" },
  { value: "team", label: "Team", icon: "👥", color: "bg-indigo-500" },
];

const defaultLogoUrl = "https://res.cloudinary.com/drv3pneh8/image/upload/v1765138083/71632be70905a17fd389a8d053249645c4e8a4df_wvs6z6.png";

interface SmtpSettings {
  smtpEmail: string;
  smtpPassword: string;
}

interface GlobalSmtpConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpUserVerification: string;
}

export default function AdminEmailCampaignPage() {
  useAdminRouteGuard();
  const [activeTab, setActiveTab] = useState<string>("verification");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    smtpEmail: "",
    smtpPassword: "",
  });
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isEditingSmtp, setIsEditingSmtp] = useState(false);
  const [globalSmtpConfig, setGlobalSmtpConfig] = useState<GlobalSmtpConfig>({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpUserVerification: "",
  });
  const [isSavingGlobalSmtp, setIsSavingGlobalSmtp] = useState(false);
  const [isEditingGlobalSmtp, setIsEditingGlobalSmtp] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    subject: "",
    body: "",
    logoUrl: defaultLogoUrl,
    emailFrom: "",
    isActive: true,
    variables: [] as string[],
  });

  useEffect(() => {
    fetchTemplates();
    fetchGlobalSmtpConfig();
  }, []);

  useEffect(() => {
    // Reset selection when tab changes
    setSelectedTemplate(null);
    setIsEditing(false);
    setIsCreating(false);
    // Fetch SMTP settings for the active tab
    fetchSmtpSettings(activeTab);
  }, [activeTab]);

  const fetchSmtpSettings = async (category: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/email-category-smtp/${category}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch SMTP settings");
      }

      const data = await response.json();
      if (data.smtpSettings) {
        setSmtpSettings({
          smtpEmail: data.smtpSettings.smtpEmail || "",
          smtpPassword: data.smtpSettings.smtpPassword === "***" ? "" : data.smtpSettings.smtpPassword || "",
        });
      } else {
        setSmtpSettings({
          smtpEmail: "",
          smtpPassword: "",
        });
      }
      setIsEditingSmtp(false);
    } catch (error) {
      console.error("Error fetching SMTP settings:", error);
      setSmtpSettings({
        smtpEmail: "",
        smtpPassword: "",
      });
    }
  };

  const fetchGlobalSmtpConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/smtp-config`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch global SMTP configuration");
      }

      const data = await response.json();
      if (data.smtpConfig) {
        setGlobalSmtpConfig({
          smtpHost: data.smtpConfig.smtpHost || "",
          smtpPort: data.smtpConfig.smtpPort || 587,
          smtpUser: data.smtpConfig.smtpUser || "",
          // If password is masked (***), keep empty. Otherwise, use the value (from env vars if not saved yet)
          smtpPass: data.smtpConfig.smtpPass === "***" ? "" : (data.smtpConfig.smtpPass || ""),
          smtpUserVerification: data.smtpConfig.smtpUserVerification || "",
        });
      } else {
        // Fallback to empty values if no config and no env vars
        setGlobalSmtpConfig({
          smtpHost: "",
          smtpPort: 587,
          smtpUser: "",
          smtpPass: "",
          smtpUserVerification: "",
        });
      }
      setIsEditingGlobalSmtp(false);
    } catch (error) {
      console.error("Error fetching global SMTP config:", error);
      setGlobalSmtpConfig({
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        smtpUserVerification: "",
      });
    }
  };

  const handleSaveSmtp = async () => {
    if (!smtpSettings.smtpEmail || !smtpSettings.smtpPassword) {
      toast.error("Please fill in both email and password");
      return;
    }

    try {
      setIsSavingSmtp(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/email-category-smtp/${activeTab}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          smtpEmail: smtpSettings.smtpEmail,
          smtpPassword: smtpSettings.smtpPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save SMTP settings");
      }

      toast.success("SMTP settings saved successfully");
      setIsEditingSmtp(false);
      // Reload settings to get masked password
      fetchSmtpSettings(activeTab);
    } catch (error) {
      console.error("Error saving SMTP settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save SMTP settings");
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleSaveGlobalSmtp = async () => {
    if (!globalSmtpConfig.smtpHost || !globalSmtpConfig.smtpPort || !globalSmtpConfig.smtpUser || !globalSmtpConfig.smtpPass) {
      toast.error("Please fill in all required fields (Host, Port, User, Password)");
      return;
    }

    try {
      setIsSavingGlobalSmtp(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/smtp-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          smtpHost: globalSmtpConfig.smtpHost,
          smtpPort: globalSmtpConfig.smtpPort,
          smtpUser: globalSmtpConfig.smtpUser,
          smtpPass: globalSmtpConfig.smtpPass,
          smtpUserVerification: globalSmtpConfig.smtpUserVerification,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save global SMTP configuration");
      }

      toast.success("Global SMTP configuration saved successfully");
      setIsEditingGlobalSmtp(false);
      // Reload settings to get masked password
      fetchGlobalSmtpConfig();
    } catch (error) {
      console.error("Error saving global SMTP config:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save global SMTP configuration");
    } finally {
      setIsSavingGlobalSmtp(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/email-templates`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  };

  const getTemplatesForCategory = (category: string) => {
    if (category === "verification") {
      // For verification tab, show templates with specific types
      const verificationTypes = [
        "verification",
        "welcome",
        "reminder-verification",
        "reminder-identity",
        "fully-verified",
        "verification-approved",
        "verification-rejected",
      ];
      return templates.filter(
        (t) =>
          t.category === category ||
          (verificationTypes.includes(t.type) && (!t.category || t.category === "verification"))
      );
    }
    return templates.filter((t) => t.category === category);
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      type: template.type,
      subject: template.subject,
      body: template.body,
      logoUrl: template.logoUrl || defaultLogoUrl,
      emailFrom: template.emailFrom || "",
      isActive: template.isActive,
      variables: template.variables || [],
    });
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setFormData({
      type: "",
      subject: "",
      body: "",
      logoUrl: defaultLogoUrl,
      emailFrom: "",
      isActive: true,
      variables: [],
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.type || !formData.subject || !formData.body) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const isUpdate = selectedTemplate?._id;
      const url = isUpdate
        ? `${API_BASE_URL}/api/admin/email-templates/${activeTab}/${selectedTemplate.type}`
        : `${API_BASE_URL}/api/admin/email-templates`;
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          category: activeTab,
          type: formData.type,
          subject: formData.subject,
          body: formData.body,
          logoUrl: formData.logoUrl,
          emailFrom: formData.emailFrom,
          isActive: formData.isActive,
          variables: formData.variables,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save template");
      }

      toast.success(`Template ${isUpdate ? "updated" : "created"} successfully`);
      setIsEditing(false);
      setIsCreating(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.type}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/admin/email-templates/${template.category}/${template.type}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      toast.success("Template deleted successfully");
      if (selectedTemplate?._id === template._id) {
        setSelectedTemplate(null);
      }
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (selectedTemplate) {
      setFormData({
        type: selectedTemplate.type,
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
        logoUrl: selectedTemplate.logoUrl || defaultLogoUrl,
        emailFrom: selectedTemplate.emailFrom || "",
        isActive: selectedTemplate.isActive,
        variables: selectedTemplate.variables || [],
      });
    }
    setIsEditing(false);
    setIsCreating(false);
  };

  const handlePreview = () => {
    if (!formData.body) {
      toast.error("Please enter email body to preview");
      return;
    }
    setPreviewOpen(true);
  };

  const renderPreview = () => {
    let previewBody = formData.body;
    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      firstName: "John",
      lastName: "Doe",
      code: "123456",
      logoUrl: formData.logoUrl || defaultLogoUrl,
      verificationType: "Email Verification",
      verificationStep: "email",
      rejectionReason: "Document quality is not clear",
      verificationLink: "https://example.com/verify",
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      previewBody = previewBody.replace(regex, value);
    });

    return previewBody;
  };

  const categoryTemplates = getTemplatesForCategory(activeTab);

  return (
    <AdminPageLayout
      title="Email Campaign Management"
      description="Manage email templates for different platform activities"
    >
      <div className="space-y-6">
        {/* Global SMTP Configuration */}
        <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#FE8A0F]" />
                Global SMTP Configuration
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configure the default SMTP server settings (from .env file). These settings are used as fallback when category-specific SMTP is not configured.
              </p>
            </div>
            {!isEditingGlobalSmtp && (
              <Button
                onClick={() => setIsEditingGlobalSmtp(true)}
                variant="outline"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                {globalSmtpConfig.smtpHost ? "Edit" : "Configure"}
              </Button>
            )}
          </div>

          {isEditingGlobalSmtp ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost" className="text-black dark:text-white">
                    SMTP Host <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpHost"
                    value={globalSmtpConfig.smtpHost}
                    onChange={(e) =>
                      setGlobalSmtpConfig({ ...globalSmtpConfig, smtpHost: e.target.value })
                    }
                    placeholder="e.g., smtp.gmail.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort" className="text-black dark:text-white">
                    SMTP Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={globalSmtpConfig.smtpPort}
                    onChange={(e) =>
                      setGlobalSmtpConfig({ ...globalSmtpConfig, smtpPort: parseInt(e.target.value) || 587 })
                    }
                    placeholder="587"
                    className="mt-1"
                    min="1"
                    max="65535"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpUser" className="text-black dark:text-white">
                    SMTP User (Default) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpUser"
                    value={globalSmtpConfig.smtpUser}
                    onChange={(e) =>
                      setGlobalSmtpConfig({ ...globalSmtpConfig, smtpUser: e.target.value })
                    }
                    placeholder="e.g., noreply@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPass" className="text-black dark:text-white">
                    SMTP Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpPass"
                    type="password"
                    value={globalSmtpConfig.smtpPass}
                    onChange={(e) =>
                      setGlobalSmtpConfig({ ...globalSmtpConfig, smtpPass: e.target.value })
                    }
                    placeholder="Enter SMTP password"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="smtpUserVerification" className="text-black dark:text-white">
                    SMTP User (Verification) <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <Input
                    id="smtpUserVerification"
                    value={globalSmtpConfig.smtpUserVerification}
                    onChange={(e) =>
                      setGlobalSmtpConfig({ ...globalSmtpConfig, smtpUserVerification: e.target.value })
                    }
                    placeholder="e.g., verification@example.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Optional: Separate email account for verification emails
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveGlobalSmtp}
                  disabled={isSavingGlobalSmtp}
                  className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/80"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingGlobalSmtp ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditingGlobalSmtp(false);
                    fetchGlobalSmtpConfig();
                  }}
                  variant="outline"
                  disabled={isSavingGlobalSmtp}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {globalSmtpConfig.smtpHost ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-black dark:text-white">Host:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{globalSmtpConfig.smtpHost}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-black dark:text-white">Port:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{globalSmtpConfig.smtpPort}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-black dark:text-white">User (Default):</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{globalSmtpConfig.smtpUser}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-black dark:text-white">Password:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">••••••••</span>
                    </div>
                    {globalSmtpConfig.smtpUserVerification && (
                      <div className="md:col-span-2">
                        <span className="text-sm font-medium text-black dark:text-white">User (Verification):</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{globalSmtpConfig.smtpUserVerification}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No global SMTP configuration. Click "Configure" to set up.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-2 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const categoryCount = getTemplatesForCategory(category.value).length;
              return (
                <button
                  key={category.value}
                  onClick={() => setActiveTab(category.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                    activeTab === category.value
                      ? "bg-[#FE8A0F] text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.label}</span>
                  {categoryCount > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === category.value
                          ? "bg-white/20 text-white"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      {categoryCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SMTP Settings Section */}
        <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#FE8A0F]" />
                SMTP Settings for {categories.find((c) => c.value === activeTab)?.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configure the email account and password used to send emails for this category
              </p>
            </div>
            {!isEditingSmtp && (
              <Button
                onClick={() => setIsEditingSmtp(true)}
                variant="outline"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                {smtpSettings.smtpEmail ? "Edit" : "Configure"}
              </Button>
            )}
          </div>

          {isEditingSmtp ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpEmail" className="text-black dark:text-white">
                    SMTP Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpEmail"
                    type="email"
                    value={smtpSettings.smtpEmail}
                    onChange={(e) =>
                      setSmtpSettings({ ...smtpSettings, smtpEmail: e.target.value })
                    }
                    placeholder="e.g., verification@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword" className="text-black dark:text-white">
                    SMTP Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={smtpSettings.smtpPassword}
                    onChange={(e) =>
                      setSmtpSettings({ ...smtpSettings, smtpPassword: e.target.value })
                    }
                    placeholder="Enter SMTP password"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveSmtp}
                  disabled={isSavingSmtp}
                  className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/80"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingSmtp ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditingSmtp(false);
                    fetchSmtpSettings(activeTab);
                  }}
                  variant="outline"
                  disabled={isSavingSmtp}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {smtpSettings.smtpEmail ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black dark:text-white">Email:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{smtpSettings.smtpEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black dark:text-white">Password:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">••••••••</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No SMTP settings configured. Click "Configure" to set up.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#FE8A0F]" />
                  Templates
                </h2>
                <Button
                  onClick={handleCreateNew}
                  size="sm"
                  className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/80"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {categoryTemplates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No templates yet</p>
                    <p className="text-sm">Click "New" to create one</p>
                  </div>
                ) : (
                  categoryTemplates.map((template) => (
                    <div
                      key={template._id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedTemplate?._id === template._id
                          ? "border-[#FE8A0F] bg-[#FE8A0F]/10"
                          : "border-gray-200 dark:border-gray-800 hover:border-[#FE8A0F]/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() => handleSelectTemplate(template)}
                          className="flex-1 text-left"
                        >
                          <p className="font-semibold text-black dark:text-white">
                            {template.type}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {template.subject}
                          </p>
                        </button>
                        <div className="flex items-center gap-1 ml-2">
                          {template.isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <button
                            onClick={() => handleDelete(template)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-2">
            {isCreating || selectedTemplate ? (
              <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-black dark:text-white">
                      {isCreating ? "Create New Template" : `Edit: ${selectedTemplate?.type}`}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Category: {categories.find((c) => c.value === activeTab)?.label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePreview}
                      variant="outline"
                      disabled={!formData.body}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/80"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isCreating ? "Create" : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={loading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="type" className="text-black dark:text-white">
                      Template Type <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      placeholder="e.g., welcome-email, order-confirmation"
                      className="mt-1"
                      disabled={!isCreating}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Unique identifier for this template
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="emailFrom" className="text-black dark:text-white">
                      From Email Address
                    </Label>
                    <Input
                      id="emailFrom"
                      value={formData.emailFrom}
                      onChange={(e) =>
                        setFormData({ ...formData, emailFrom: e.target.value })
                      }
                      placeholder="e.g., orders@example.com"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave empty to use default SMTP user for this category
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="logoUrl" className="text-black dark:text-white">
                      Logo URL
                    </Label>
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, logoUrl: e.target.value })
                      }
                      placeholder={defaultLogoUrl}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-black dark:text-white">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="Email subject"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="body" className="text-black dark:text-white">
                      Email Body (HTML) <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) =>
                        setFormData({ ...formData, body: e.target.value })
                      }
                      placeholder="HTML email template"
                      className="mt-1 font-mono text-sm"
                      rows={15}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use variables like {"{{firstName}}"}, {"{{code}}"}, {"{{logoUrl}}"}, etc.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                    <Label htmlFor="isActive" className="text-black dark:text-white">
                      Active
                    </Label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-[#FE8A0F] mx-auto mb-4" />
                  <p className="text-black dark:text-white mb-4">
                    {categoryTemplates.length === 0
                      ? "No templates in this category yet"
                      : "Select a template to view or edit"}
                  </p>
                  {categoryTemplates.length === 0 && (
                    <Button
                      onClick={handleCreateNew}
                      className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/80"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Template
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              This is how the email will look to recipients
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Subject:</p>
              <p className="font-semibold text-black dark:text-white">{formData.subject}</p>
            </div>
            <div
              className="border-2 border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-black"
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
