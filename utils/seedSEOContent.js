import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SEOContent from '../models/SEOContent.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sortars';

const seoContentData = [
  {
    type: 'homepage',
    title: 'Find Trusted Tradespeople & Professional Services UK | Sortars.com',
    metaKeywords: 'sortars, tradespeople, professional services, UK tradespeople, find professionals, hire tradespeople, local services, verified professionals, home services, business services',
    metaDescription: 'Connect with verified tradespeople and professional service providers across the UK on Sortars.com. Compare prices, read reviews, and book trusted professionals for any job. Get instant quotes from local experts.',
    metaTitle: 'Find Trusted Tradespeople & Professional Services UK | Sortars.com',
    ogTitle: 'Sortars - Find Trusted Tradespeople & Professional Services',
    ogDescription: 'Connect with verified tradespeople and professional service providers across the UK on Sortars.com. Compare prices, read reviews, and book trusted professionals for any job.',
    ogImage: '',
    ogUrl: '',
    ogType: 'website',
    ogSiteName: 'Sortars',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Sortars - Find Trusted Tradespeople & Professional Services',
    twitterDescription: 'Connect with verified tradespeople and professional service providers across the UK on Sortars.com. Compare prices, read reviews, and book trusted professionals.',
    twitterImage: '',
    canonicalUrl: '',
    robots: 'index, follow',
    headerScript: '',
    bodyScript: '',
    description: 'Sortars is the UK\'s leading platform for connecting customers with verified professional tradespeople and service providers. Whether you need a plumber, electrician, builder, or any other professional service, we make it easy to find, compare, and book trusted experts in your area.',
  },
  {
    type: 'blog',
    title: 'Sortars Blog - Expert Tips & Industry Insights',
    description: 'Stay updated with the latest tips, guides, and insights from professional tradespeople on Sortars.com. Learn about home improvement, maintenance, and industry best practices.',
    metaTitle: 'Sortars Blog - Expert Tips & Industry Insights',
    metaKey: 'sortars, blog, tradespeople tips, home improvement, maintenance guides, professional advice, industry insights, DIY tips, trade news',
    metaDescription: 'Expert tips, guides, and insights from professional tradespeople on Sortars.com. Learn about home improvement, maintenance, and industry best practices from verified experts.',
  },
  {
    type: 'cost-guide',
    title: 'Service Cost Guide - Compare Professional Service Prices UK | Sortars',
    description: 'Transparent pricing guide for professional services across the UK on Sortars.com. Compare average costs, get price estimates, and understand what you should pay for quality work.',
    metaTitle: 'Service Cost Guide - Compare Professional Service Prices UK | Sortars',
    metaKey: 'sortars, cost guide, service prices, professional fees, price comparison, average costs, service estimates, UK prices, tradesperson rates',
    metaDescription: 'Comprehensive cost guide for professional services in the UK on Sortars.com. Compare average prices, get accurate estimates, and understand fair pricing for quality tradespeople services.',
  },
];

async function seedSEOContent() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing SEO content...');
    await SEOContent.deleteMany({});
    console.log('Existing SEO content cleared');

    console.log('Inserting SEO content...');
    for (const content of seoContentData) {
      await SEOContent.create(content);
      console.log(`✓ Created SEO content for: ${content.type}`);
    }

    console.log('\n✅ SEO content seeding completed successfully!');
    console.log(`Total SEO content entries created: ${seoContentData.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding SEO content:', error);
    process.exit(1);
  }
}

seedSEOContent();

