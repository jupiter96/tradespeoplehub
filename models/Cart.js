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
  time: {
    type: String, // "09:00", "14:30", etc.
    required: true,
  },
  timeSlot: {
    type: String, // "Morning", "Afternoon", "Evening"
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
  // Unique identifier for cart items (serviceId + packageType + addons hash)
  itemKey: {
    type: String,
    required: true,
  },
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
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
cartSchema.index({ userId: 1 });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
