const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  driverId: { type: String, required: true, index: true },

  // Pickup info
  shopName: String,
  shopAddress: String,
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
      "pending", "accepted", "picked", "items_collected",
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
  paymentMode: { type: String, default: "Cash" },
  cashToCollect: { type: Number, default: 0 },
  isPaidToDriver: { type: Boolean, default: false },

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
