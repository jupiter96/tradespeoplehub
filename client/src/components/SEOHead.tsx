import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robots?: string;
}

export function SEOHead({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  robots = 'index, follow',
}: SEOHeadProps) {
  const location = useLocation();
  const thumbnailImage = "https://i.ibb.co/23knmvB9/thumbnail.jpg";
  
  // Use default thumbnail if no ogImage is provided
  const defaultThumbnail = `${window.location.origin}${thumbnailImage}`;
  const finalOgImage = ogImage || defaultThumbnail;
  const finalTwitterImage = twitterImage || ogImage || defaultThumbnail;

  useEffect(() => {
    // Set page title
    document.title = title;

    // Helper function to set or update meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Set canonical link
    const setCanonical = (url: string) => {
      let element = document.querySelector('link[rel="canonical"]');
      
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.appendChild(element);
      }
      
      element.setAttribute('href', url);
    };

    // Basic meta tags
    setMetaTag('description', description);
    setMetaTag('robots', robots);

    // Canonical URL
    const canonicalUrl = canonical || `${window.location.origin}${location.pathname}`;
    setCanonical(canonicalUrl);

    // Open Graph tags
    setMetaTag('og:title', ogTitle || title, true);
    setMetaTag('og:description', ogDescription || description, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:image', finalOgImage, true);
    setMetaTag('og:image:alt', ogTitle || title, true);
    setMetaTag('og:image:width', '1200', true);
    setMetaTag('og:image:height', '630', true);
    setMetaTag('og:site_name', 'Sortars', true);

    // Twitter Card tags
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:title', twitterTitle || ogTitle || title);
    setMetaTag('twitter:description', twitterDescription || ogDescription || description);
    setMetaTag('twitter:image', finalTwitterImage);
    setMetaTag('twitter:image:alt', twitterTitle || ogTitle || title);

    // Cleanup function to reset title on unmount (optional)
    return () => {
      // You can optionally reset to a default title here
      // document.title = 'Sortars';
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogType, twitterCard, twitterTitle, twitterDescription, twitterImage, robots, location.pathname, finalOgImage, finalTwitterImage]);

  return null; // This component doesn't render anything
}

export default SEOHead;
