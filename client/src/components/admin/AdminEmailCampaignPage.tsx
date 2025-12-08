import React, { useState, useEffect } from "react";
import { Mail, Edit, Save, X, Eye, CheckCircle2, XCircle } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import API_BASE_URL from "../../config/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { toast } from "sonner";

interface EmailTemplate {
  _id?: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  logoUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

const templateTypes = [
  { value: "verification", label: "Verification Email", description: "Sent when user registers with verification code" },
  { value: "welcome", label: "Welcome Email", description: "Sent when user successfully verifies email and phone" },
  { value: "reminder-verification", label: "Verification Reminder", description: "Reminder to complete email and phone verification" },
  { value: "reminder-identity", label: "Identity Verification Reminder", description: "Reminder for professionals to submit identity documents" },
  { value: "fully-verified", label: "Fully Verified Email", description: "Sent when professional completes all verifications" },
];

export default function AdminEmailCampaignPage() {
  useAdminRouteGuard();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    logoUrl: "",
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

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

  const handleSelectTemplate = (type: string) => {
    const template = templates.find((t) => t.type === type);
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        subject: template.subject,
        body: template.body,
        logoUrl: template.logoUrl,
        isActive: template.isActive,
      });
      setIsEditing(false);
    } else {
      // Create new template structure
      const templateType = templateTypes.find((t) => t.value === type);
      setSelectedTemplate({
        type,
        subject: "",
        body: "",
        variables: [],
        isActive: true,
        logoUrl: "",
      });
      setFormData({
        subject: "",
        body: "",
        logoUrl: process.env.REACT_APP_EMAIL_LOGO_URL || "https://res.cloudinary.com/drv3pneh8/image/upload/v1765138083/71632be70905a17fd389a8d053249645c4e8a4df_wvs6z6.png",
        isActive: true,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/admin/email-templates/${selectedTemplate.type}`;
      const method = selectedTemplate._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subject: formData.subject,
          body: formData.body,
          logoUrl: formData.logoUrl,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save template");
      }

      toast.success("Template saved successfully");
      setIsEditing(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (selectedTemplate?._id) {
      setFormData({
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
        logoUrl: selectedTemplate.logoUrl,
        isActive: selectedTemplate.isActive,
      });
    }
    setIsEditing(false);
  };

  const getTemplateInfo = (type: string) => {
    return templateTypes.find((t) => t.value === type);
  };

  return (
    <AdminPageLayout
      title="Email Campaign Management"
      description="Manage email templates for user notifications and campaigns"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
              <h2 className="text-xl font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#FE8A0F]" />
                Email Templates
              </h2>
              <div className="space-y-2">
                {templateTypes.map((templateType) => {
                  const template = templates.find((t) => t.type === templateType.value);
                  return (
                    <button
                      key={templateType.value}
                      onClick={() => handleSelectTemplate(templateType.value)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedTemplate?.type === templateType.value
                          ? "border-[#FE8A0F] bg-[#FE8A0F]/10"
                          : "border-gray-200 dark:border-gray-800 hover:border-[#FE8A0F]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-black dark:text-white">
                            {templateType.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {templateType.description}
                          </p>
                        </div>
                        <div className="ml-2">
                          {template ? (
                            template.isActive ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400" />
                            )
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-black dark:text-white">
                      {getTemplateInfo(selectedTemplate.type)?.label}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {getTemplateInfo(selectedTemplate.type)?.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSave}
                          disabled={loading}
                          className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/80"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          disabled={loading}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/80"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
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
                        placeholder="https://res.cloudinary.com/drv3pneh8/image/upload/v1765138083/71632be70905a17fd389a8d053249645c4e8a4df_wvs6z6.png"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject" className="text-black dark:text-white">
                        Subject
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
                        Email Body (HTML)
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
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-black dark:text-white">Status</Label>
                      <div className="mt-1">
                        {selectedTemplate.isActive ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            <CheckCircle2 className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                            <XCircle className="w-4 h-4" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-black dark:text-white">Subject</Label>
                      <p className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-black dark:text-white">
                        {selectedTemplate.subject}
                      </p>
                    </div>

                    <div>
                      <Label className="text-black dark:text-white">Preview</Label>
                      <div
                        className="mt-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-800"
                        dangerouslySetInnerHTML={{ __html: selectedTemplate.body }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 shadow-[0_0_20px_rgba(254,138,15,0.2)]">
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-[#FE8A0F] mx-auto mb-4" />
                  <p className="text-black dark:text-white">
                    Select a template to view or edit
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}


