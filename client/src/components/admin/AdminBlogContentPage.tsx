import React, { useState, useEffect } from "react";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import AdminPageLayout from "./AdminPageLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import API_BASE_URL from "../../config/api";

export default function AdminBlogContentPage() {
  useAdminRouteGuard();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    metaTitle: "",
    metaKey: "",
    metaDescription: "",
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/seo-content/blog`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }

      const data = await response.json();
      setFormData({
        title: data.title || "",
        description: data.description || "",
        metaTitle: data.metaTitle || "",
        metaKey: data.metaKey || "",
        metaDescription: data.metaDescription || "",
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/seo-content/blog`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update content");
      }

      toast.success("Blog content updated successfully!");
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageLayout title="Blog Content Management">
        <div className="flex items-center justify-center py-12">
          <p className="text-black dark:text-white">Loading...</p>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="Blog Content Management">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border-0 bg-white dark:bg-black p-6 shadow-xl shadow-[#FE8A0F]/20">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            BLOG CONTENT
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-black dark:text-white">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter blog title"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-black dark:text-white">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter blog description"
              />
            </div>

            <div>
              <Label htmlFor="metaTitle" className="text-black dark:text-white">
                Meta Title
              </Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta title"
              />
            </div>

            <div>
              <Label htmlFor="metaKey" className="text-black dark:text-white">
                Meta Key
              </Label>
              <Input
                id="metaKey"
                value={formData.metaKey}
                onChange={(e) => setFormData({ ...formData, metaKey: e.target.value })}
                className="bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta keywords (comma separated)"
              />
            </div>

            <div>
              <Label htmlFor="metaDescription" className="text-black dark:text-white">
                Meta Description
              </Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta description"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/90 text-white px-8 border-0 shadow-lg shadow-[#FE8A0F]/40 hover:shadow-xl hover:shadow-[#FE8A0F]/50 transition-all"
          >
            {saving ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </AdminPageLayout>
  );
}

