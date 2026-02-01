import mongoose from 'mongoose';

const cartItemAddonSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const bookingInfoSchema = new mongoose.Schema({
  date: {
    type: String, // ISO date string
    required: true,
  },
  starttime: {
    type: String, // "09:00", "14:30", etc.
    required: true,
  },
  endtime: {
    type: String, // "10:00", "15:30", etc.
  },
  timeSlot: {
    type: String, // "Morning", "Afternoon", "Evening"
  },
}, { _id: false });

const thumbnailVideoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  seller: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
  },
  rating: {
    type: Number,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  addons: {
    type: [cartItemAddonSchema],
    default: [],
  },
  booking: {
    type: bookingInfoSchema,
  },
  packageType: {
    type: String, // "basic", "standard", "premium"
  },
  thumbnailVideo: {
    type: thumbnailVideoSchema,
  },
  priceUnit: {
    type: String, // "hour", "cm", "sqm", "fixed", etc.
    default: 'fixed',
  },
  // Unique identifier for cart items (serviceId + packageType + addons hash)
  itemKey: {
    type: String,
    required: true,
  },
  // For custom offer items: link to existing order and offer
  orderId: { type: String },
  offerId: { type: String },
}, { _id: true });

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    abandonedCart: {
      lastNotifiedAt: {
        type: Date,
        default: null,
      },
      lastNotifiedCartUpdatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
cartSchema.index({ userId: 1 });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
