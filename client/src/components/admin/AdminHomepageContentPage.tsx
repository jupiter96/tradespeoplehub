import React, { useState, useEffect } from "react";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import AdminPageLayout from "./AdminPageLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import API_BASE_URL from "../../config/api";

export default function AdminHomepageContentPage() {
  useAdminRouteGuard();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [homepageData, setHomepageData] = useState({
    title: "",
    metaKeywords: "",
    metaDescription: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogUrl: "",
    ogType: "website",
    ogSiteName: "",
    twitterCard: "summary_large_image",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    canonicalUrl: "",
    robots: "index, follow",
    headerScript: "",
    bodyScript: "",
  });
  const [blogData, setBlogData] = useState({
    title: "",
    description: "",
    metaTitle: "",
    metaKey: "",
    metaDescription: "",
  });
  const [costGuideData, setCostGuideData] = useState({
    title: "",
    description: "",
    metaTitle: "",
    metaKey: "",
    metaDescription: "",
  });

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    setLoading(true);
    try {
      // Fetch homepage content
      const homepageResponse = await fetch(`${API_BASE_URL}/api/admin/seo-content/homepage`, {
        credentials: "include",
      });
      if (homepageResponse.ok) {
        const homepage = await homepageResponse.json();
        setHomepageData({
          title: homepage.title || "",
          metaKeywords: homepage.metaKeywords || "",
          metaDescription: homepage.metaDescription || "",
          ogTitle: homepage.ogTitle || "",
          ogDescription: homepage.ogDescription || "",
          ogImage: homepage.ogImage || "",
          ogUrl: homepage.ogUrl || "",
          ogType: homepage.ogType || "website",
          ogSiteName: homepage.ogSiteName || "",
          twitterCard: homepage.twitterCard || "summary_large_image",
          twitterTitle: homepage.twitterTitle || "",
          twitterDescription: homepage.twitterDescription || "",
          twitterImage: homepage.twitterImage || "",
          canonicalUrl: homepage.canonicalUrl || "",
          robots: homepage.robots || "index, follow",
          headerScript: homepage.headerScript || "",
          bodyScript: homepage.bodyScript || "",
        });
      }

      // Fetch blog content
      const blogResponse = await fetch(`${API_BASE_URL}/api/admin/seo-content/blog`, {
        credentials: "include",
      });
      if (blogResponse.ok) {
        const blog = await blogResponse.json();
        setBlogData({
          title: blog.title || "",
          description: blog.description || "",
          metaTitle: blog.metaTitle || "",
          metaKey: blog.metaKey || "",
          metaDescription: blog.metaDescription || "",
        });
      }

      // Fetch cost guide content
      const costGuideResponse = await fetch(`${API_BASE_URL}/api/admin/seo-content/cost-guide`, {
        credentials: "include",
      });
      if (costGuideResponse.ok) {
        const costGuide = await costGuideResponse.json();
        setCostGuideData({
          title: costGuide.title || "",
          description: costGuide.description || "",
          metaTitle: costGuide.metaTitle || "",
          metaKey: costGuide.metaKey || "",
          metaDescription: costGuide.metaDescription || "",
        });
      }
    } catch (error) {
      // console.error("Error fetching content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update homepage content
      const homepageResponse = await fetch(`${API_BASE_URL}/api/admin/seo-content/homepage`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(homepageData),
      });

      if (!homepageResponse.ok) {
        const error = await homepageResponse.json();
        throw new Error(error.error || "Failed to update homepage content");
      }

      // Update blog content
      const blogResponse = await fetch(`${API_BASE_URL}/api/admin/seo-content/blog`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(blogData),
      });

      if (!blogResponse.ok) {
        const error = await blogResponse.json();
        throw new Error(error.error || "Failed to update blog content");
      }

      // Update cost guide content
      const costGuideResponse = await fetch(`${API_BASE_URL}/api/admin/seo-content/cost-guide`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(costGuideData),
      });

      if (!costGuideResponse.ok) {
        const error = await costGuideResponse.json();
        throw new Error(error.error || "Failed to update cost guide content");
      }

      toast.success("All content updated successfully!");
    } catch (error) {
      // console.error("Error updating content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageLayout title="Home Content Management">
        <div className="flex items-center justify-center py-12">
          <p className="text-black">Loading...</p>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="Home Content Management">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* HOME PAGE CONTENT Section */}
        <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
          <h2 className="text-xl font-semibold text-black mb-4">
            HOME PAGE CONTENT
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="homepage-title" className="text-black">
                Title
              </Label>
              <Input
                id="homepage-title"
                value={homepageData.title}
                onChange={(e) => setHomepageData({ ...homepageData, title: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter page title"
              />
            </div>

            <div>
              <Label htmlFor="homepage-metaKeywords" className="text-black">
                Meta Keywords
              </Label>
              <Input
                id="homepage-metaKeywords"
                value={homepageData.metaKeywords}
                onChange={(e) => setHomepageData({ ...homepageData, metaKeywords: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta keywords (comma separated)"
              />
            </div>

            <div>
              <Label htmlFor="homepage-metaDescription" className="text-black">
                Meta Description
              </Label>
              <Textarea
                id="homepage-metaDescription"
                value={homepageData.metaDescription}
                onChange={(e) => setHomepageData({ ...homepageData, metaDescription: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta description"
              />
            </div>
          </div>
        </div>

        {/* OPEN GRAPH TAGS Section */}
        <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
          <h2 className="text-xl font-semibold text-black mb-4">
            OPEN GRAPH TAGS (Social Media Sharing)
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ogTitle" className="text-black">
                OG Title
              </Label>
              <Input
                id="ogTitle"
                value={homepageData.ogTitle}
                onChange={(e) => setHomepageData({ ...homepageData, ogTitle: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Leave empty to use page title"
              />
            </div>

            <div>
              <Label htmlFor="ogDescription" className="text-black">
                OG Description
              </Label>
              <Textarea
                id="ogDescription"
                value={homepageData.ogDescription}
                onChange={(e) => setHomepageData({ ...homepageData, ogDescription: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Leave empty to use meta description"
              />
            </div>

            <div>
              <Label htmlFor="ogImage" className="text-black">
                OG Image URL
              </Label>
              <Input
                id="ogImage"
                value={homepageData.ogImage}
                onChange={(e) => setHomepageData({ ...homepageData, ogImage: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="https://gmail.com/image.jpg (Recommended: 1200x630px)"
              />
            </div>

            <div>
              <Label htmlFor="ogUrl" className="text-black">
                OG URL
              </Label>
              <Input
                id="ogUrl"
                value={homepageData.ogUrl}
                onChange={(e) => setHomepageData({ ...homepageData, ogUrl: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Leave empty to use current page URL"
              />
            </div>

            <div>
              <Label htmlFor="ogType" className="text-black">
                OG Type
              </Label>
              <Input
                id="ogType"
                value={homepageData.ogType}
                onChange={(e) => setHomepageData({ ...homepageData, ogType: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="website, article, etc."
              />
            </div>

            <div>
              <Label htmlFor="ogSiteName" className="text-black">
                OG Site Name
              </Label>
              <Input
                id="ogSiteName"
                value={homepageData.ogSiteName}
                onChange={(e) => setHomepageData({ ...homepageData, ogSiteName: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Your website name"
              />
            </div>
          </div>
        </div>

        {/* TWITTER CARD TAGS Section */}
        <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
          <h2 className="text-xl font-semibold text-black mb-4">
            TWITTER CARD TAGS
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="twitterCard" className="text-black">
                Twitter Card Type
              </Label>
              <Input
                id="twitterCard"
                value={homepageData.twitterCard}
                onChange={(e) => setHomepageData({ ...homepageData, twitterCard: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="summary_large_image, summary, etc."
              />
            </div>

            <div>
              <Label htmlFor="twitterTitle" className="text-black">
                Twitter Title
              </Label>
              <Input
                id="twitterTitle"
                value={homepageData.twitterTitle}
                onChange={(e) => setHomepageData({ ...homepageData, twitterTitle: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Leave empty to use OG title"
              />
            </div>

            <div>
              <Label htmlFor="twitterDescription" className="text-black">
                Twitter Description
              </Label>
              <Textarea
                id="twitterDescription"
                value={homepageData.twitterDescription}
                onChange={(e) => setHomepageData({ ...homepageData, twitterDescription: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Leave empty to use OG description"
              />
            </div>

            <div>
              <Label htmlFor="twitterImage" className="text-black">
                Twitter Image URL
              </Label>
              <Input
                id="twitterImage"
                value={homepageData.twitterImage}
                onChange={(e) => setHomepageData({ ...homepageData, twitterImage: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Leave empty to use OG image"
              />
            </div>
          </div>
        </div>

        {/* ADDITIONAL SEO Section */}
        <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
          <h2 className="text-xl font-semibold text-black mb-4">
            ADDITIONAL SEO SETTINGS
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="canonicalUrl" className="text-black">
                Canonical URL
              </Label>
              <Input
                id="canonicalUrl"
                value={homepageData.canonicalUrl}
                onChange={(e) => setHomepageData({ ...homepageData, canonicalUrl: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="https://gmail.com (Leave empty if not needed)"
              />
            </div>

            <div>
              <Label htmlFor="robots" className="text-black">
                Robots Meta Tag
              </Label>
              <Input
                id="robots"
                value={homepageData.robots}
                onChange={(e) => setHomepageData({ ...homepageData, robots: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="index, follow (or noindex, nofollow)"
              />
            </div>
          </div>
        </div>

        {/* SCRIPT MANAGEMENT Section */}
        <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
          <h2 className="text-xl font-semibold text-black mb-4">
            SCRIPT MANAGEMENT
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="headerScript" className="text-black">
                Header Script
              </Label>
              <Textarea
                id="headerScript"
                value={homepageData.headerScript}
                onChange={(e) => setHomepageData({ ...homepageData, headerScript: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black font-mono text-sm min-h-[150px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter header script (e.g., Google Tag Manager)"
              />
            </div>

            <div>
              <Label htmlFor="bodyScript" className="text-black">
                Body Script
              </Label>
              <Textarea
                id="bodyScript"
                value={homepageData.bodyScript}
                onChange={(e) => setHomepageData({ ...homepageData, bodyScript: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black font-mono text-sm min-h-[150px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter body script (e.g., noscript tags)"
              />
            </div>
          </div>
        </div>

        {/* BLOG CONTENT Section */}
        <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
          <h2 className="text-xl font-semibold text-black mb-4">
            BLOG CONTENT
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="blog-title" className="text-black">
                Title
              </Label>
              <Input
                id="blog-title"
                value={blogData.title}
                onChange={(e) => setBlogData({ ...blogData, title: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter blog title"
              />
            </div>

            <div>
              <Label htmlFor="blog-description" className="text-black">
                Description
              </Label>
              <Textarea
                id="blog-description"
                value={blogData.description}
                onChange={(e) => setBlogData({ ...blogData, description: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter blog description"
              />
            </div>

            <div>
              <Label htmlFor="blog-metaTitle" className="text-black">
                Meta Title
              </Label>
              <Input
                id="blog-metaTitle"
                value={blogData.metaTitle}
                onChange={(e) => setBlogData({ ...blogData, metaTitle: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta title"
              />
            </div>

            <div>
              <Label htmlFor="blog-metaKey" className="text-black">
                Meta Key
              </Label>
              <Input
                id="blog-metaKey"
                value={blogData.metaKey}
                onChange={(e) => setBlogData({ ...blogData, metaKey: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta keywords (comma separated)"
              />
            </div>

            <div>
              <Label htmlFor="blog-metaDescription" className="text-black">
                Meta Description
              </Label>
              <Textarea
                id="blog-metaDescription"
                value={blogData.metaDescription}
                onChange={(e) => setBlogData({ ...blogData, metaDescription: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta description"
              />
            </div>
          </div>
        </div>

        {/* COST GUIDES Section */}
        <div className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-[#FE8A0F]/20">
          <h2 className="text-xl font-semibold text-black mb-4">
            COST GUIDES
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cost-guide-title" className="text-black">
                Title
              </Label>
              <Input
                id="cost-guide-title"
                value={costGuideData.title}
                onChange={(e) => setCostGuideData({ ...costGuideData, title: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter cost guide title"
              />
            </div>

            <div>
              <Label htmlFor="cost-guide-description" className="text-black">
                Description
              </Label>
              <Textarea
                id="cost-guide-description"
                value={costGuideData.description}
                onChange={(e) => setCostGuideData({ ...costGuideData, description: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter cost guide description"
              />
            </div>

            <div>
              <Label htmlFor="cost-guide-metaTitle" className="text-black">
                Meta Title
              </Label>
              <Input
                id="cost-guide-metaTitle"
                value={costGuideData.metaTitle}
                onChange={(e) => setCostGuideData({ ...costGuideData, metaTitle: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta title"
              />
            </div>

            <div>
              <Label htmlFor="cost-guide-metaKey" className="text-black">
                Meta Key
              </Label>
              <Input
                id="cost-guide-metaKey"
                value={costGuideData.metaKey}
                onChange={(e) => setCostGuideData({ ...costGuideData, metaKey: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta keywords (comma separated)"
              />
            </div>

            <div>
              <Label htmlFor="cost-guide-metaDescription" className="text-black">
                Meta Description
              </Label>
              <Textarea
                id="cost-guide-metaDescription"
                value={costGuideData.metaDescription}
                onChange={(e) => setCostGuideData({ ...costGuideData, metaDescription: e.target.value })}
                className="bg-white border-0 shadow-md shadow-gray-200  text-black min-h-[100px] focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                placeholder="Enter meta description"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
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

