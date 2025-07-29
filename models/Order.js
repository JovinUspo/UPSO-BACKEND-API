const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  driverId: { type: String, index: true },

  // Pickup info
  pickupShopName: String,
  pickupLocation: String,
  pickupLatitude: Number,
  pickupLongitude: Number,
  pickupReachedAt: Date,

  // Delivery info
  customerName: String,
  customerPhoneNo: {
    type: String,
    validate: {
      validator: v => /^\d{10}$/.test(v),
      message: props => `${props.value} is not a valid 10-digit mobile number`
    }
  },
  deliveryAddress: String,
  deliveryLatitude: Number,
  deliveryLongitude: Number,
  deliveryReachedAt: Date,

  // Status
  status: {
    type: String,
    enum: [
      "pending", "accepted","declined", "pickup_reached", "items_collected",
      "reached", "delivered", "not_delivered", "completed", "cancelled"
    ],
    default: "pending",
    index: true
  },

  // Items & tracking
  products: { type: [productSchema], default: [] },
  collectedItems: { type: [String], default: [] },
  itemsCollectedAt: Date,

  // Delivery confirmation
  deliveryOtp: String,
  deliveredAt: Date,
  proofOfDelivery: String,

  // Payment
  paymentMode: String,
  cashToCollect: Number,
  isPaidToDriver: Boolean,

  // Meta
  distanceKm: Number,
  amount: Number,
  respondedAt: Date
}, { timestamps: true });

// Optional clean JSON output
orderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    delete ret._id;
  },
});

module.exports = mongoose.model("Order", orderSchema);
