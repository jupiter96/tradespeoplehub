import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
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
  addons: [{
    id: Number,
    title: String,
    price: Number,
  }],
  booking: {
    date: String,
    time: String, // Start time
    endTime: String, // End time
    timeSlot: String,
  },
  packageType: {
    type: String,
  },
});

const deliveryAddressSchema = new mongoose.Schema({
  postcode: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  county: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    address: {
      type: deliveryAddressSchema,
    },
    skipAddress: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ['account_balance', 'card', 'paypal', 'bank_transfer'],
      required: true,
    },
    paymentMethodId: {
      type: String, // For card payments - Stripe payment method ID
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    promoCode: {
      code: String,
      type: {
        type: String,
        enum: ['pro', 'admin'],
      },
      discount: Number,
      discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['In Progress', 'Completed', 'Cancelled', 'Rejected', 'disputed'],
      default: 'In Progress',
      index: true,
    },
    // Order acceptance by professional
    acceptedByProfessional: {
      type: Boolean,
      default: false,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    walletTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    paymentTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Dispute ID for tracking disputes
    disputeId: {
      type: String,
      default: null,
      index: true,
    },
    // Delivery files (images/videos) and message
    deliveryFiles: [{
      url: {
        type: String,
        required: true,
      },
      fileName: {
        type: String,
        required: true,
      },
      fileType: {
        type: String,
        enum: ['image', 'video'],
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    deliveryMessage: {
      type: String,
      trim: true,
    },
    deliveredDate: {
      type: Date,
      default: null,
    },
    // Extension request for delivery time
    extensionRequest: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: null,
      },
      requestedDate: {
        type: Date,
        default: null,
      },
      newDeliveryDate: {
        type: Date,
        default: null,
      },
      reason: {
        type: String,
        trim: true,
      },
      requestedAt: {
        type: Date,
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },
    // Cancellation request
    cancellationRequest: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'withdrawn'],
        default: null,
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      reason: {
        type: String,
        trim: true,
      },
      requestedAt: {
        type: Date,
        default: null,
      },
      responseDeadline: {
        type: Date,
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    // Additional information submitted by client
    additionalInformation: {
      message: {
        type: String,
        trim: true,
      },
      files: [{
        url: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          enum: ['image', 'video', 'document'],
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      submittedAt: {
        type: Date,
        default: null,
      },
    },
    // Revision request (modification request)
    revisionRequest: {
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'rejected'],
        default: null,
      },
      reason: {
        type: String,
        trim: true,
      },
      clientMessage: {
        type: String,
        trim: true,
      },
      clientFiles: [{
        url: { type: String, required: true },
        fileName: { type: String, required: true },
        fileType: { type: String, enum: ['image', 'video', 'document'], required: true },
        uploadedAt: { type: Date, default: Date.now },
      }],
      requestedAt: {
        type: Date,
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
      additionalNotes: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
orderSchema.index({ client: 1, createdAt: -1 });
orderSchema.index({ professional: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
