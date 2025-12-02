import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const ADDRESSY_API_KEY = process.env.ADDRESSY_API_KEY || process.env.ROYAL_MAIL_API_KEY;
const ADDRESSY_BASE_URL = 'https://api.addressy.com/Capture/Interactive/Find/v1.10/json3.ws';

// Search addresses by postcode or text
router.get('/search', async (req, res) => {
  try {
    const { postcode } = req.query;

    console.log('🔍 Address search request received:', {
      postcode: postcode,
    });

    if (!postcode) {
      console.log('❌ Missing postcode in request');
      return res.status(400).json({ error: 'Postcode is required' });
    }

    if (!ADDRESSY_API_KEY) {
      console.log('❌ Addressy API key not configured');
      return res.status(500).json({ error: 'Addressy API key not configured' });
    }

    // Clean postcode (remove spaces, uppercase)
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    console.log('🧹 Cleaned postcode:', {
      original: postcode,
      cleaned: cleanPostcode,
    });

    // Call Addressy API
    const apiUrl = `${ADDRESSY_BASE_URL}?Key=${encodeURIComponent(ADDRESSY_API_KEY)}&Text=${encodeURIComponent(cleanPostcode)}&Countries=GB&Language=en&Limit=100`;
    
    console.log('📡 Calling Addressy API:', {
      url: apiUrl.replace(ADDRESSY_API_KEY, '***'),
      postcode: cleanPostcode,
    });
    
    const response = await fetch(apiUrl);

    console.log('📥 Addressy API response:', {
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Addressy API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return res.status(response.status).json({ 
        error: 'Failed to fetch addresses from Addressy API',
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('📦 Addressy API raw response:', {
      hasItems: !!data.Items,
      itemCount: data.Items?.length || 0,
      firstItem: data.Items?.[0] || 'none',
    });

    // Map Addressy API response to our format
    const items = data.Items || [];
    
    console.log('🗺️ Processing address items:', {
      count: items.length,
      types: items.map(item => item.Type),
    });
    
    const addresses = items
      .filter(item => item.Type === 'Address') // Only include actual addresses, not postcodes
      .map((item, index) => {
        console.log(`📍 Processing address ${index + 1}:`, {
          id: item.Id,
          text: item.Text,
          description: item.Description,
        });
        
        // Parse description to extract postcode and city
        // Format: "City, POSTCODE" or "City - X Addresses"
        const description = item.Description || '';
        const parts = description.split(',');
        const cityName = parts[0]?.trim() || '';
        const postalCode = parts[1]?.trim() || cleanPostcode;
        
        // Extract address components from Text
        // Format: "Building Name, Street" or "Street Number Street Name"
        const addressText = item.Text || '';
        
        // Try to extract building number if it starts with a number
        const buildingNumberMatch = addressText.match(/^(\d+)/);
        const buildingNumber = buildingNumberMatch ? buildingNumberMatch[1] : '';
        
        // Extract street name (everything after building number)
        const streetName = buildingNumber 
          ? addressText.replace(/^\d+\s*/, '').trim()
          : addressText;
        
        const mappedAddress = {
          postcode: postalCode,
          line_1: addressText,
          line_2: undefined,
          line_3: undefined,
          town_or_city: cityName,
          county: undefined,
          country: 'United Kingdom',
          // Additional fields for formatting
          buildingNumber,
          buildingName: undefined,
          streetName,
          cityName,
          provinceName: undefined,
          countryName: 'United Kingdom',
          // Store original Addressy data
          addressyId: item.Id,
          addressyText: item.Text,
          addressyDescription: item.Description,
        };

        console.log(`  Mapped address ${index + 1}:`, JSON.stringify(mappedAddress, null, 2));

        return mappedAddress;
      });
    
    // Sort addresses: building numbers first, then numerically, then alphabetically
    addresses.sort((a, b) => {
      const startsWithNumberA = /^\d/.test(a.line_1 || "");
      const startsWithNumberB = /^\d/.test(b.line_1 || "");
      
      // Building numbers (starting with number) come first
      if (startsWithNumberA && !startsWithNumberB) return -1;
      if (!startsWithNumberA && startsWithNumberB) return 1;
      
      // If both start with numbers, sort by number
      if (startsWithNumberA && startsWithNumberB) {
        const numA = parseInt(a.line_1?.match(/^\d+/)?.[0] || "0") || 0;
        const numB = parseInt(b.line_1?.match(/^\d+/)?.[0] || "0") || 0;
        if (numA !== numB) return numA - numB;
      }
      
      // Then sort alphabetically
      return (a.line_1 || "").localeCompare(b.line_1 || "");
    });
    
    console.log('✅ Final mapped addresses:', {
      count: addresses.length,
      addresses: JSON.stringify(addresses, null, 2),
    });

    const responseData = {
      status: 200,
      result: addresses,
    };
    
    console.log('📤 Sending response to client:', {
      status: responseData.status,
      addressCount: responseData.result.length,
    });

    res.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching addresses:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ 
      error: 'Failed to fetch addresses',
      message: error.message 
    });
  }
});

export default router;
