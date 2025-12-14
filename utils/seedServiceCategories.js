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
const generateServiceSubCategoryData = (name, serviceCategoryId, parentSubCategoryId, level, attributeType = null, categoryLevel = null, order = 1, serviceCategoryName = '', parentSubCategoryName = '') => {
  // In new hierarchy, names don't need parent suffix for uniqueness
  // Each level has its own parent context
  const baseName = name;
  
  // Level 3-7 must have a parentSubCategory
  if (level >= 3 && level <= 7 && !parentSubCategoryId) {
    throw new Error(`Level ${level} subcategory must have a parentSubCategory`);
  }
  
  return {
    serviceCategory: parentSubCategoryId ? null : serviceCategoryId,
    parentSubCategory: parentSubCategoryId || null, // Level 2 can be null, Level 3-7 must have value
    name: baseName,
    slug: generateSlug(baseName),
    description: `Professional ${baseName.toLowerCase()} services with expert care and attention to detail.`,
    metaTitle: `${baseName} Services | Professional ${baseName}`,
    metaDescription: `Find trusted professionals for ${baseName.toLowerCase()} services. Expert care, competitive prices, and guaranteed satisfaction.`,
    bannerImage: '',
    icon: '',
    order: order,
    level: level,
    attributeType: level === 2 ? null : (attributeType || null), // Level 2 has no attributeType
    categoryLevel: categoryLevel || level, // categoryLevel matches level in new hierarchy
    isActive: true,
  };
};

// Create subcategories for a specific level with parent subcategories
const createSubCategoriesForLevel = async (serviceCategory, parentSubCategories, targetLevel, attributeType, categoryLevel) => {
  if (!parentSubCategories || parentSubCategories.length === 0) {
    return [];
  }

  const created = [];
  const serviceCategoryName = serviceCategory.name;
  const serviceCategoryId = serviceCategory._id;

  // Determine how many subcategories to create per parent
  const countPerParent = Math.floor(Math.random() * 3) + 2; // 2-4 subcategories per parent

  // Get names for this level based on attributeType
  const names = generateSubCategoryNames(serviceCategoryName, attributeType, targetLevel - 1); // Use level-1 for name generation

  for (const parentSubCategory of parentSubCategories) {
    // Select random names for this parent
    const selectedNames = getRandomItems(names, Math.min(countPerParent, names.length));

    // Get max order for this parent
    const maxOrderResult = await ServiceSubCategory.findOne({ 
      parentSubCategory: parentSubCategory._id 
    })
      .sort({ order: -1 })
      .select('order')
      .lean();
    const maxOrder = maxOrderResult?.order || 0;

    for (let i = 0; i < selectedNames.length; i++) {
      const name = selectedNames[i];
      const order = maxOrder + i + 1;

      // Check if subcategory already exists
      const existing = await ServiceSubCategory.findOne({
        parentSubCategory: parentSubCategory._id,
        name: name.trim()
      });

      if (existing) {
        console.log(`    ⚠️  Subcategory "${name}" (Level ${targetLevel}) already exists under parent "${parentSubCategory.name}", skipping...`);
        continue;
      }

      // Create subcategory
      const subCategoryData = generateServiceSubCategoryData(
        name,
        serviceCategoryId,
        parentSubCategory._id,
        targetLevel,
        attributeType,
        categoryLevel,
        order,
        serviceCategoryName,
        parentSubCategory.name
      );

      const subCategory = await ServiceSubCategory.create(subCategoryData);
      created.push(subCategory);
      console.log(`    ✅ Created subcategory: ${name} (Level ${targetLevel}, Parent: ${parentSubCategory.name}, Order: ${order})`);
    }
  }

  return created;
};

// Generate names for Level 2 Sub Category (first tab)
const generateLevel2SubCategoryNames = (serviceCategoryName) => {
  const baseName = serviceCategoryName.toLowerCase();
  const names = [
    `Basic ${serviceCategoryName}`,
    `Standard ${serviceCategoryName}`,
    `Premium ${serviceCategoryName}`,
    `Professional ${serviceCategoryName}`,
    `Expert ${serviceCategoryName}`,
    `Advanced ${serviceCategoryName}`,
    `Commercial ${serviceCategoryName}`,
    `Residential ${serviceCategoryName}`,
    `Emergency ${serviceCategoryName}`,
    `Complete ${serviceCategoryName} Solution`,
    `Full Service ${serviceCategoryName}`,
    `Custom ${serviceCategoryName}`
  ];
  return names;
};

// Create Level 2 Sub Categories (first tab - Sub Category tab)
const createLevel2SubCategories = async (serviceCategory) => {
  console.log(`    📑 Creating Level 2 Sub Categories (first tab - Sub Category)...`);
  
  const serviceCategoryName = serviceCategory.name;
  const serviceCategoryId = serviceCategory._id;
  
  // Get names for Level 2
  const allNames = generateLevel2SubCategoryNames(serviceCategoryName);
  const count = Math.floor(Math.random() * 4) + 4; // 4-7 subcategories
  const selectedNames = getRandomItems(allNames, Math.min(count, allNames.length));
  
  // Get max order for Level 2 subcategories
  const maxOrderResult = await ServiceSubCategory.findOne({ 
    serviceCategory: serviceCategoryId,
    level: 2,
    parentSubCategory: null
  })
    .sort({ order: -1 })
    .select('order')
    .lean();
  const maxOrder = maxOrderResult?.order || 0;
  
  const created = [];
  for (let i = 0; i < selectedNames.length; i++) {
    const name = selectedNames[i];
    const order = maxOrder + i + 1;
    
    // Check if already exists
    const existing = await ServiceSubCategory.findOne({
      serviceCategory: serviceCategoryId,
      parentSubCategory: null,
      level: 2,
      name: name.trim()
    });
    
    if (existing) {
      console.log(`    ⚠️  Sub Category "${name}" (Level 2) already exists, skipping...`);
      continue;
    }
    
    // Create Level 2 subcategory (no parentSubCategory, no attributeType, categoryLevel=2)
    const subCategoryData = generateServiceSubCategoryData(
      name,
      serviceCategoryId,
      null,
      2, // level
      null, // No attributeType for Level 2
      2, // categoryLevel = 2
      order,
      serviceCategoryName,
      ''
    );
    
    const subCategory = await ServiceSubCategory.create(subCategoryData);
    created.push(subCategory);
    console.log(`    ✅ Created Level 2 Sub Category: ${name} (Order: ${order})`);
  }
  
  return created;
};

// Create all subcategories for a service category (new hierarchical structure)
const createServiceSubCategories = async (serviceCategory) => {
  console.log(`  📁 Creating subcategories for: ${serviceCategory.name}`);
  
  const categoryLevelMapping = serviceCategory.categoryLevelMapping || [];
  
  if (categoryLevelMapping.length === 0) {
    console.log(`    ⚠️  No category level mapping found, skipping subcategories...`);
    return;
  }

  let totalCreated = 0;

  // Step 1: Create Level 2 Sub Categories (first tab - Sub Category tab)
  // Parent: ServiceCategory, Level: 2, CategoryLevel: 2
  console.log(`    📑 Step 1: Creating Level 2 Sub Categories (Sub Category tab)...`);
  const level2SubCategories = await createLevel2SubCategories(serviceCategory);
  totalCreated += level2SubCategories.length;
  console.log(`    ✅ Created ${level2SubCategories.length} Level 2 subcategories`);

  // Step 2: Create subcategories for each level in categoryLevelMapping (Level 3-6)
  // Each level uses the previous level's subcategories as parents
  const sortedMappings = categoryLevelMapping
    .filter(m => m.level >= 3 && m.level <= 6)
    .sort((a, b) => a.level - b.level);

  if (sortedMappings.length === 0) {
    console.log(`    ⚠️  No valid level mappings (3-6) found, skipping additional tabs...`);
    console.log(`    ✅ Created ${totalCreated} total subcategories`);
    return totalCreated;
  }

  // Track parent subcategories for each level
  let currentParentSubCategories = level2SubCategories;

  // Create subcategories for each level sequentially
  for (const mapping of sortedMappings) {
    const attributeType = mapping.attributeType;
    const targetLevel = mapping.level;
    const categoryLevel = mapping.level;
    
    console.log(`    📑 Step ${targetLevel - 1}: Creating Level ${targetLevel} subcategories for tab: ${mapping.title || attributeType} (CategoryLevel ${categoryLevel})`);
    
    if (currentParentSubCategories.length === 0) {
      console.log(`    ⚠️  No parent subcategories available for Level ${targetLevel}, skipping...`);
      continue;
    }

    // Create subcategories for this level using previous level's subcategories as parents
    const levelSubCategories = await createSubCategoriesForLevel(
      serviceCategory,
      currentParentSubCategories,
      targetLevel,
      attributeType,
      categoryLevel
    );
    
    totalCreated += levelSubCategories.length;
    console.log(`    ✅ Created ${levelSubCategories.length} Level ${targetLevel} subcategories`);
    
    // Update parent subcategories for next level
    currentParentSubCategories = levelSubCategories;
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

