import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sector from '../models/Sector.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ServiceSubCategory from '../models/ServiceSubCategory.js';
import Category from '../models/Category.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Attribute types for categoryLevelMapping
const ATTRIBUTE_TYPES = ['serviceType', 'size', 'frequency', 'make', 'model', 'brand'];
const ATTRIBUTE_LABELS = {
  serviceType: 'Service Type',
  size: 'Size',
  frequency: 'Frequency',
  make: 'Make',
  model: 'Model',
  brand: 'Brand',
};

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Helper function to get random items from array
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to generate random level (3-7)
const getRandomLevel = () => {
  return Math.floor(Math.random() * 5) + 3; // 3-7
};

// Helper function to generate categoryLevelMapping based on level
const generateCategoryLevelMapping = (level) => {
  const mapping = [];
  const usedTypes = [];
  
  for (let i = 3; i <= level; i++) {
    const availableTypes = ATTRIBUTE_TYPES.filter(type => !usedTypes.includes(type));
    if (availableTypes.length === 0) break;
    
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    usedTypes.push(randomType);
    
    mapping.push({
      level: i,
      attributeType: randomType,
      title: ATTRIBUTE_LABELS[randomType],
      thumbnail: '',
      icon: '',
      metadata: {},
    });
  }
  
  return mapping;
};

// Helper function to generate random attributes
const generateAttributes = (count = 3) => {
  const attributeNames = [
    'Urgent', 'Standard', 'Premium', 'Basic', 'Advanced',
    'Small', 'Medium', 'Large', 'Extra Large',
    'One-time', 'Weekly', 'Monthly', 'Yearly',
    'Indoor', 'Outdoor', 'Commercial', 'Residential'
  ];
  
  const selected = getRandomItems(attributeNames, count);
  return selected.map((name, index) => ({
    name,
    order: index + 1,
  }));
};

// Helper function to generate random extra services
const generateExtraServices = (count = 2) => {
  const serviceNames = [
    'Emergency Service', 'Warranty', 'After-hours Support',
    'Extended Warranty', 'Maintenance Package', 'Consultation',
    'Follow-up Service', 'Priority Service'
  ];
  
  const selected = getRandomItems(serviceNames, count);
  return selected.map((name, index) => ({
    name,
    price: Math.floor(Math.random() * 200) + 50, // 50-250
    days: Math.floor(Math.random() * 7) + 1, // 1-7
    order: index + 1,
  }));
};

// Helper function to generate price per unit
const generatePricePerUnit = () => {
  const enabled = Math.random() > 0.5;
  if (!enabled) {
    return { enabled: false, units: [] };
  }
  
  const unitNames = ['Per Hour', 'Per Square Meter', 'Per Item', 'Per Room', 'Per Unit'];
  const selected = getRandomItems(unitNames, Math.floor(Math.random() * 3) + 1);
  
  return {
    enabled: true,
    units: selected.map((name, index) => ({
      name,
      price: Math.floor(Math.random() * 100) + 20, // 20-120
      order: index + 1,
    })),
  };
};

// Get categories from existing Category model to use as base for ServiceCategory
const getCategoriesBySector = async (sectorId) => {
  return await Category.find({ sector: sectorId, isActive: true })
    .sort({ order: 1 })
    .limit(10); // Get up to 10 categories per sector
};

// Generate service category data from regular category
const generateServiceCategoryData = (category, sectorId, order) => {
  const level = getRandomLevel();
  const categoryLevelMapping = generateCategoryLevelMapping(level);
  
  return {
    sector: sectorId,
    name: category.name,
    slug: generateSlug(category.name),
    question: category.question || `What type of ${category.name.toLowerCase()} service do you need?`,
    order: order,
    description: category.description || `Professional ${category.name.toLowerCase()} services with expert care and attention to detail.`,
    metaTitle: `${category.name} Services | Professional ${category.name}`,
    metaDescription: `Find trusted professionals for ${category.name.toLowerCase()} services. Expert care, competitive prices, and guaranteed satisfaction.`,
    icon: category.icon || '',
    bannerImage: category.bannerImage || '',
    attributes: generateAttributes(Math.floor(Math.random() * 3) + 2), // 2-4 attributes
    extraServices: generateExtraServices(Math.floor(Math.random() * 3) + 1), // 1-3 extra services
    pricePerUnit: generatePricePerUnit(),
    isActive: true,
    level: level,
    categoryLevelMapping: categoryLevelMapping,
  };
};

// Generate subcategory names based on service category name and attribute type
const generateSubCategoryNames = (serviceCategoryName, attributeType, level) => {
  const baseName = serviceCategoryName.toLowerCase();
  const names = {
    serviceType: {
      1: [
        `Basic ${serviceCategoryName}`, `Standard ${serviceCategoryName}`, `Premium ${serviceCategoryName}`,
        `Emergency ${serviceCategoryName}`, `Commercial ${serviceCategoryName}`, `Residential ${serviceCategoryName}`,
        `Professional ${serviceCategoryName}`, `Expert ${serviceCategoryName}`, `Advanced ${serviceCategoryName}`
      ],
      2: ['Installation', 'Repair', 'Maintenance', 'Replacement', 'Upgrade', 'Inspection', 'Consultation'],
      3: ['Standard Package', 'Premium Package', 'Basic Package', 'Complete Solution', 'Quick Fix'],
      4: ['Standard Option', 'Premium Option', 'Basic Option', 'Deluxe Option']
    },
    size: {
      1: ['Small', 'Medium', 'Large', 'Extra Large', 'Compact', 'Standard', 'Oversized'],
      2: ['Single', 'Double', 'Multiple', 'Full Set', 'Partial', 'Complete'],
      3: ['Basic Size', 'Standard Size', 'Large Size', 'Custom Size'],
      4: ['Option A', 'Option B', 'Option C']
    },
    frequency: {
      1: ['One-time', 'Weekly', 'Monthly', 'Yearly', 'Daily', 'Bi-weekly', 'Quarterly'],
      2: ['Regular', 'Occasional', 'Seasonal', 'On-demand', 'Scheduled'],
      3: ['Standard Frequency', 'Premium Frequency', 'Basic Frequency'],
      4: ['Frequency Option 1', 'Frequency Option 2']
    },
    make: {
      1: ['Generic', 'Brand A', 'Brand B', 'Brand C', 'Premium Make', 'Standard Make'],
      2: ['Model X', 'Model Y', 'Model Z', 'Standard Model', 'Premium Model'],
      3: ['Make Option 1', 'Make Option 2', 'Make Option 3'],
      4: ['Make Variant A', 'Make Variant B']
    },
    model: {
      1: ['Standard Model', 'Premium Model', 'Basic Model', 'Deluxe Model', 'Professional Model'],
      2: ['Version 1', 'Version 2', 'Version 3', 'Latest Version', 'Classic Version'],
      3: ['Model Type A', 'Model Type B', 'Model Type C'],
      4: ['Model Variant 1', 'Model Variant 2']
    },
    brand: {
      1: ['Brand A', 'Brand B', 'Brand C', 'Premium Brand', 'Standard Brand', 'Professional Brand'],
      2: ['Brand Line 1', 'Brand Line 2', 'Brand Line 3', 'Signature Line'],
      3: ['Brand Series A', 'Brand Series B', 'Brand Series C'],
      4: ['Brand Edition 1', 'Brand Edition 2']
    }
  };

  const typeNames = names[attributeType]?.[level] || [];
  if (typeNames.length === 0) {
    // Fallback names
    return Array.from({ length: 3 }, (_, i) => `${serviceCategoryName} ${attributeType} ${i + 1}`);
  }
  
  return typeNames;
};

// Generate service subcategory data
const generateServiceSubCategoryData = (name, serviceCategoryId, parentSubCategoryId, level, attributeType = null, order = 1, serviceCategoryName = '') => {
  // For nested subcategories (level > 1), include service category name to ensure uniqueness
  const baseName = level > 1 && serviceCategoryName 
    ? `${name} - ${serviceCategoryName}` 
    : name;
  
  return {
    serviceCategory: parentSubCategoryId ? null : serviceCategoryId,
    parentSubCategory: parentSubCategoryId || null,
    name: baseName,
    slug: generateSlug(baseName),
    description: `Professional ${baseName.toLowerCase()} services with expert care and attention to detail.`,
    metaTitle: `${baseName} Services | Professional ${baseName}`,
    metaDescription: `Find trusted professionals for ${baseName.toLowerCase()} services. Expert care, competitive prices, and guaranteed satisfaction.`,
    bannerImage: '',
    icon: '',
    order: order,
    level: level,
    attributeType: level === 1 ? attributeType : null,
    isActive: true,
  };
};

// Create nested subcategories recursively
const createNestedSubCategories = async (serviceCategory, parentSubCategory, currentLevel, maxLevel, attributeType = null, usedLevel1Names = null) => {
  if (currentLevel > maxLevel) return [];

  const created = [];
  const serviceCategoryName = serviceCategory.name;
  const serviceCategoryId = serviceCategory._id;
  
  // For Level 1, use the shared set of used names if provided
  const createdNamesInBatch = currentLevel === 1 && !parentSubCategory && usedLevel1Names 
    ? usedLevel1Names 
    : new Set();
  
  // Determine how many subcategories to create at this level
  let count;
  if (currentLevel === 1) {
    // Level 1: Create 3-5 subcategories per attributeType
    count = Math.floor(Math.random() * 3) + 3; // 3-5
  } else if (currentLevel === 2) {
    // Level 2: Create 2-4 subcategories
    count = Math.floor(Math.random() * 3) + 2; // 2-4
  } else if (currentLevel === 3) {
    // Level 3: Create 2-3 subcategories (only for some parents)
    if (Math.random() > 0.6) return []; // 40% chance to skip
    count = Math.floor(Math.random() * 2) + 2; // 2-3
  } else if (currentLevel === 4) {
    // Level 4: Create 1-2 subcategories (only for some parents)
    if (Math.random() > 0.7) return []; // 30% chance to skip
    count = Math.floor(Math.random() * 2) + 1; // 1-2
  } else {
    return [];
  }

  // Get names for this level
  let names;
  if (currentLevel === 1 && attributeType) {
    names = generateSubCategoryNames(serviceCategoryName, attributeType, 1);
  } else if (currentLevel === 2) {
    const parentAttributeType = attributeType || 'serviceType';
    names = generateSubCategoryNames(serviceCategoryName, parentAttributeType, 2);
  } else if (currentLevel === 3) {
    names = generateSubCategoryNames(serviceCategoryName, 'serviceType', 3);
  } else {
    names = generateSubCategoryNames(serviceCategoryName, 'serviceType', 4);
  }

  // Select random names
  const selectedNames = getRandomItems(names, Math.min(count, names.length));

  // Get max order for this level
  let maxOrder = 0;
  if (parentSubCategory) {
    const maxOrderResult = await ServiceSubCategory.findOne({ parentSubCategory: parentSubCategory._id })
      .sort({ order: -1 })
      .select('order')
      .lean();
    maxOrder = maxOrderResult?.order || 0;
  } else {
    const maxOrderResult = await ServiceSubCategory.findOne({ 
      serviceCategory: serviceCategory._id,
      level: 1,
      attributeType: attributeType
    })
      .sort({ order: -1 })
      .select('order')
      .lean();
    maxOrder = maxOrderResult?.order || 0;
  }

  for (let i = 0; i < selectedNames.length; i++) {
    let name = selectedNames[i];
    
    // For Level 1, ensure uniqueness by adding index if duplicate name found in batch
    if (currentLevel === 1 && !parentSubCategory) {
      let uniqueName = name;
      let nameIndex = 1;
      while (createdNamesInBatch.has(uniqueName)) {
        uniqueName = `${name} ${nameIndex}`;
        nameIndex++;
      }
      name = uniqueName;
      createdNamesInBatch.add(name);
    }
    
    // For nested subcategories, use unique name with service category
    const uniqueName = currentLevel > 1 ? name : name;
    const order = maxOrder + i + 1;
    
    // Check if subcategory already exists in database
    const existingQuery = parentSubCategory
      ? { parentSubCategory: parentSubCategory._id, name: uniqueName }
      : { serviceCategory: serviceCategoryId, parentSubCategory: null, name: uniqueName, attributeType: attributeType };
    
    const existing = await ServiceSubCategory.findOne(existingQuery);
    if (existing) {
      console.log(`    ⚠️  Subcategory "${uniqueName}" (Level ${currentLevel}) already exists, skipping...`);
      continue;
    }

    // Create subcategory
    const subCategoryData = generateServiceSubCategoryData(
      uniqueName,
      serviceCategoryId,
      parentSubCategory ? parentSubCategory._id : null,
      currentLevel,
      currentLevel === 1 ? attributeType : null,
      order,
      serviceCategoryName
    );

    const subCategory = await ServiceSubCategory.create(subCategoryData);
    created.push(subCategory);
    console.log(`    ✅ Created subcategory: ${name} (Level ${currentLevel}, Order: ${order})`);

    // Recursively create nested subcategories
    if (currentLevel < maxLevel) {
      const nested = await createNestedSubCategories(
        serviceCategory,
        subCategory,
        currentLevel + 1,
        maxLevel,
        attributeType,
        usedLevel1Names
      );
      created.push(...nested);
    }
  }

  return created;
};

// Create all subcategories for a service category
const createServiceSubCategories = async (serviceCategory) => {
  console.log(`  📁 Creating subcategories for: ${serviceCategory.name}`);
  
  const categoryLevelMapping = serviceCategory.categoryLevelMapping || [];
  
  if (categoryLevelMapping.length === 0) {
    console.log(`    ⚠️  No category level mapping found, skipping subcategories...`);
    return;
  }

  const maxLevel = Math.min(serviceCategory.level || 3, 4); // Limit to level 4 for seeding
  let totalCreated = 0;

  // Each level (3-7) in categoryLevelMapping becomes a tab
  // Sort by level to ensure consistent order
  const sortedMappings = categoryLevelMapping
    .filter(m => m.level >= 3 && m.level <= 7)
    .sort((a, b) => a.level - b.level);

  if (sortedMappings.length === 0) {
    console.log(`    ⚠️  No valid level mappings (3-7) found, skipping subcategories...`);
    return;
  }

  // Track all Level 1 names across all tabs to prevent duplicates
  const allUsedLevel1Names = new Set();

  // Create Level 1 subcategories for each level mapping
  // Each level mapping becomes a tab in the UI
  for (const mapping of sortedMappings) {
    const attributeType = mapping.attributeType;
    const level = mapping.level;
    
    console.log(`    📑 Creating subcategories for tab: ${mapping.title || attributeType} (Level ${level})`);
    
    // Create Level 1 subcategories for this attributeType/level
    // Pass the shared set to ensure uniqueness across all tabs
    const level1SubCategories = await createNestedSubCategories(
      serviceCategory,
      null,
      1,
      maxLevel,
      attributeType,
      allUsedLevel1Names
    );
    
    totalCreated += level1SubCategories.length;
  }

  console.log(`    ✅ Created ${totalCreated} total subcategories`);
  return totalCreated;
};

const seedServiceCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all sectors
    const sectors = await Sector.find({ isActive: true }).sort({ order: 1 });
    console.log(`📋 Found ${sectors.length} sectors`);

    if (sectors.length === 0) {
      console.log('⚠️  No sectors found. Please run seedSectorsAndCategories.js first.');
      process.exit(1);
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    // For each sector, create 5-6 service categories
    for (const sector of sectors) {
      console.log(`\n📦 Processing sector: ${sector.name}`);
      
      // Get existing categories for this sector
      const categories = await getCategoriesBySector(sector._id);
      
      if (categories.length === 0) {
        console.log(`  ⚠️  No categories found for sector "${sector.name}", skipping...`);
        continue;
      }

      // Select 5-6 random categories (or all if less than 5)
      const selectedCategories = categories.length <= 6 
        ? categories 
        : getRandomItems(categories, Math.floor(Math.random() * 2) + 5); // 5-6

      console.log(`  📝 Creating ${selectedCategories.length} service categories...`);

      // Get the maximum order value for existing service categories in this sector
      const maxOrderResult = await ServiceCategory.findOne({ sector: sector._id })
        .sort({ order: -1 })
        .select('order')
        .lean();
      const maxOrder = maxOrderResult?.order || 0;
      let currentOrder = maxOrder + 1;

      for (let i = 0; i < selectedCategories.length; i++) {
        const category = selectedCategories[i];
        
        // Check if service category already exists
        const existingServiceCategory = await ServiceCategory.findOne({
          sector: sector._id,
          name: category.name,
        });

        if (existingServiceCategory) {
          console.log(`  ⚠️  Service category "${category.name}" already exists in sector "${sector.name}", skipping...`);
          totalSkipped++;
          continue;
        }

        // Generate service category data with unique order
        const serviceCategoryData = generateServiceCategoryData(
          category,
          sector._id,
          currentOrder
        );
        currentOrder++;

        // Create service category
        const serviceCategory = await ServiceCategory.create(serviceCategoryData);
        console.log(`  ✅ Created service category: ${category.name} (Level: ${serviceCategoryData.level}, Order: ${serviceCategoryData.order})`);
        totalCreated++;

        // Create subcategories for this service category
        await createServiceSubCategories(serviceCategory);
      }
    }

    console.log('\n✅ Seeding completed!');
    console.log(`📊 Summary: ${totalCreated} created, ${totalSkipped} skipped`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('seedServiceCategories.js');

if (isMainModule) {
  seedServiceCategories();
}

export default seedServiceCategories;

