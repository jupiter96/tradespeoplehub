import { useEffect } from "react";
import API_BASE_URL from "../config/api";

interface SEOContent {
  title?: string;
  metaKeywords?: string;
  metaDescription?: string;
  metaTitle?: string;
  metaKey?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robots?: string;
  headerScript?: string;
  bodyScript?: string;
}

export function useSEO(type: "homepage" | "blog" | "cost-guide") {
  useEffect(() => {
    const applySEO = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/seo-content/${type}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.warn(`SEO content not found for type: ${type}`);
          return; // Silently fail if not found
        }

        const data: SEOContent = await response.json();

        // Update title
        if (data.title || data.metaTitle) {
          document.title = data.title || data.metaTitle || document.title;
        }

        // Update or create meta tags
        const updateMetaTag = (name: string, content: string, property?: boolean) => {
          if (!content) return;
          
          const selector = property 
            ? `meta[property="${name}"]` 
            : `meta[name="${name}"]`;
          
          let meta = document.querySelector(selector);
          if (!meta) {
            meta = document.createElement("meta");
            if (property) {
              meta.setAttribute("property", name);
            } else {
              meta.setAttribute("name", name);
            }
            document.head.appendChild(meta);
          }
          meta.setAttribute("content", content);
        };

        // Basic Meta Tags
        if (data.metaKeywords || data.metaKey) {
          updateMetaTag("keywords", data.metaKeywords || data.metaKey || "");
        }

        if (data.metaDescription) {
          updateMetaTag("description", data.metaDescription);
        }

        if (data.robots) {
          updateMetaTag("robots", data.robots);
        }

        // Open Graph Tags
        const pageTitle = data.title || data.metaTitle || document.title;
        const pageDescription = data.metaDescription || "";
        const pageUrl = data.ogUrl || window.location.href;
        const pageImage = data.ogImage || "";
        const siteName = data.ogSiteName || "";

        if (data.ogTitle || pageTitle) {
          updateMetaTag("og:title", data.ogTitle || pageTitle, true);
        }
        if (data.ogDescription || pageDescription) {
          updateMetaTag("og:description", data.ogDescription || pageDescription, true);
        }
        if (data.ogImage || pageImage) {
          updateMetaTag("og:image", data.ogImage || pageImage, true);
        }
        if (data.ogUrl || pageUrl) {
          updateMetaTag("og:url", data.ogUrl || pageUrl, true);
        }
        if (data.ogType) {
          updateMetaTag("og:type", data.ogType, true);
        }
        if (data.ogSiteName || siteName) {
          updateMetaTag("og:site_name", data.ogSiteName || siteName, true);
        }

        // Twitter Card Tags
        if (data.twitterCard) {
          updateMetaTag("twitter:card", data.twitterCard);
        }
        if (data.twitterTitle || pageTitle) {
          updateMetaTag("twitter:title", data.twitterTitle || pageTitle);
        }
        if (data.twitterDescription || pageDescription) {
          updateMetaTag("twitter:description", data.twitterDescription || pageDescription);
        }
        if (data.twitterImage || pageImage) {
          updateMetaTag("twitter:image", data.twitterImage || pageImage);
        }

        // Canonical URL
        if (data.canonicalUrl) {
          let canonical = document.querySelector("link[rel='canonical']");
          if (!canonical) {
            canonical = document.createElement("link");
            canonical.setAttribute("rel", "canonical");
            document.head.appendChild(canonical);
          }
          canonical.setAttribute("href", data.canonicalUrl);
        }

        // Apply header script
        if (data.headerScript) {
          // Remove existing header script markers
          const existingMarkers = document.querySelectorAll('[data-seo-header-script]');
          existingMarkers.forEach(marker => marker.remove());

          // Create a marker element and append script
          const marker = document.createElement("div");
          marker.setAttribute("data-seo-header-script", "true");
          marker.style.display = "none";
          marker.innerHTML = data.headerScript;
          document.head.appendChild(marker);

          // Execute any script tags within the header script
          const scripts = marker.querySelectorAll("script");
          scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            document.head.appendChild(newScript);
            oldScript.remove();
          });
        }

        // Apply body script
        if (data.bodyScript) {
          // Remove existing body script markers
          const existingMarkers = document.querySelectorAll('[data-seo-body-script]');
          existingMarkers.forEach(marker => marker.remove());

          // Create a marker element and append script
          const marker = document.createElement("div");
          marker.setAttribute("data-seo-body-script", "true");
          marker.style.display = "none";
          marker.innerHTML = data.bodyScript;
          document.body.appendChild(marker);

          // Execute any script tags within the body script
          const scripts = marker.querySelectorAll("script");
          scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            document.body.appendChild(newScript);
            oldScript.remove();
          });
        }
      } catch (error) {
        // Only log if it's not a network error (server might be down)
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          // Network error - server might not be running or CORS issue
          console.warn(`Could not fetch SEO content for ${type}. Server may not be running or CORS issue.`);
        } else {
          console.error("Error applying SEO:", error);
        }
      }
    };

    applySEO();
  }, [type]);
}

