# SEO Management Guide

## Overview

Sortars implements comprehensive SEO optimization across all public pages with unique titles, descriptions, and meta tags for better search engine visibility.

## SEO Implementation

### 1. Dynamic SEO Component (`SEOHead.tsx`)

A reusable React component that manages all SEO meta tags:

- **Page Title** - Unique per page
- **Meta Description** - Required, non-empty
- **Canonical URL** - Auto-generated
- **Open Graph Tags** - For social media sharing
- **Twitter Card Tags** - For Twitter sharing
- **Robots Meta** - Search engine indexing control

### 2. Pages with SEO Implementation

#### Homepage (`/`)
- Uses `useSEO("homepage")` hook
- Loads content from database via Admin SEO Management
- Fully customizable via Admin panel

#### Services Page (`/services`)
- **Default**: "Professional Services UK"
- **Category**: "{Category} Services - Trusted UK Professionals"
- **Subcategory**: "{Subcategory} in {Category} - Verified UK Professionals"
- Dynamic descriptions based on filters

#### Service Detail Page (`/service/:id`)
- **Title**: "{Service Name} - {Professional Name} | Sortars"
- **Description**: Service highlights or auto-generated
- **OG Type**: "product"
- **OG Image**: Service main image

#### Sector Page (`/sector/:sectorSlug`)
- **Title**: "{Sector/Category} - Find Trusted Professionals | Sortars"
- **Description**: Dynamic based on sector/category
- **OG Image**: Banner image (if available)

#### All Categories Page (`/all-categories`)
- **Default**: "Browse All Service Categories | Sortars"
- **Sector View**: "{Sector} Services - Browse All Categories"
- **Category View**: "{Category} Services - Browse All Subcategories"

#### Profile Page (`/profile/:id`)
- **Title**: "{Trading Name} - {Primary Category} | Sortars"
- **Description**: Profile bio or auto-generated with location and stats
- **OG Type**: "profile"
- **OG Image**: Avatar or cover image

## Database SEO Content

### Initial Setup

Run the SEO content seeder to populate default SEO data:

```bash
npm run seed-seo
# or
node utils/seedSEOContent.js
```

### Default SEO Content

#### Homepage
- **Title**: "Find Trusted Tradespeople & Professional Services UK | Sortars.com"
- **Description**: "Connect with verified tradespeople and professional service providers across the UK on Sortars.com. Compare prices, read reviews, and book trusted professionals for any job. Get instant quotes from local experts."
- **Keywords**: sortars, tradespeople, professional services, UK tradespeople, find professionals, hire tradespeople, local services, verified professionals

#### Blog
- **Title**: "Sortars Blog - Expert Tips & Industry Insights"
- **Description**: "Stay updated with the latest tips, guides, and insights from professional tradespeople on Sortars.com. Learn about home improvement, maintenance, and industry best practices."

#### Cost Guide
- **Title**: "Service Cost Guide - Compare Professional Service Prices UK | Sortars"
- **Description**: "Transparent pricing guide for professional services across the UK on Sortars.com. Compare average costs, get price estimates, and understand what you should pay for quality work."

## Admin Management

### Accessing SEO Settings

1. Login to Admin panel: `/admin-login`
2. Navigate to: **Admin Dashboard > Homepage Content**
3. Three tabs available:
   - **Homepage SEO** - Main landing page
   - **Blog SEO** - Blog section
   - **Cost Guide SEO** - Pricing guide section

### Editing SEO Content

Each section includes:
- **Basic Info**: Title, Description
- **Meta Tags**: Keywords, Meta Title, Meta Description
- **Open Graph**: Title, Description, Image, URL, Type
- **Twitter Cards**: Title, Description, Image
- **Advanced**: Canonical URL, Robots directive
- **Scripts**: Header and Body scripts (Homepage only)

### Best Practices

1. **Unique Titles**: Each page should have a unique, descriptive title (50-60 characters)
2. **Compelling Descriptions**: Write clear, actionable descriptions (150-160 characters)
3. **Keywords**: Use relevant keywords naturally, avoid keyword stuffing
4. **Images**: Use high-quality images for OG and Twitter cards (1200x630px recommended)
5. **Canonical URLs**: Set canonical URLs to avoid duplicate content issues
6. **Regular Updates**: Keep SEO content fresh and relevant

## SEO Checklist

- ✅ All public pages have unique titles
- ✅ All pages have non-empty meta descriptions
- ✅ Canonical URLs are set
- ✅ Open Graph tags for social sharing
- ✅ Twitter Card tags for Twitter sharing
- ✅ Robots meta tag for indexing control
- ✅ Dynamic content based on page context
- ✅ Mobile-friendly and responsive
- ✅ Fast page load times
- ✅ Structured data (future enhancement)

## API Endpoints

### Public Endpoint
```
GET /api/auth/seo-content/:type
```
Returns SEO content for specified type (homepage, blog, cost-guide)

### Admin Endpoints
```
GET /api/admin/seo-content/:type
PUT /api/admin/seo-content/:type
```
Manage SEO content (requires admin authentication)

## Future Enhancements

- [ ] Structured data (JSON-LD) for rich snippets
- [ ] XML sitemap generation
- [ ] Robots.txt management
- [ ] Schema.org markup for services
- [ ] Breadcrumb structured data
- [ ] FAQ schema for service pages
- [ ] Review schema for ratings
- [ ] Local business schema for professionals

