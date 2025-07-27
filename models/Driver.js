const mongoose = require("mongoose");

// Bank Details
const bankDetailsSchema = new mongoose.Schema({
  accountName: String,
  accountNumber: {
    type: String,
    match: [/^\d{9,18}$/, "Invalid account number"]
  },
  ifscCode: {
    type: String,
    match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"]
  },
  documents: {
    bank: String,
    residence: String,
    license: String,
  },
  submittedAt: Date,
}, { _id: false });

// Address schema
const addressSchema = new mongoose.Schema({
  apartment: String,
  street: String,
  landmark: String,
  pincode: {
    type: String,
    match: [/^\d{6}$/, "Invalid pincode"]
  },
}, { _id: false });

// Main Driver Schema
const driverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true }, // changed to Date
  mobile: { type: String, required: true, unique: true, index: true },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  password: String,

  gender: {
    type: String,
    enum: ["male", "female", "other"],
    set: v => v?.toLowerCase(),
  },
  address: addressSchema,
  bankDetails: { type: bankDetailsSchema, default: null },

  otp: String,
  otpExpiresAt: Date,
  refreshTokens: [String],

  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);
