const mongoose = require("mongoose");

// Bank Details
const bankDetailsSchema = new mongoose.Schema({
  accountName: String,
  accountNumber: String,
  ifscCode: String,
  documents: {
    bank: String,       
    residence: String, 
    license: String,    // /uploads/licenseDocs/filename.png
  },
  submittedAt: Date,
}, { _id: false });

// Address (optional structured format)
const addressSchema = new mongoose.Schema({
  apartment: String,
  street: String,
  landmark: String,
  pincode: String,
}, { _id: false });

// Main Driver Schema
const driverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dob: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String },  // Needed for signup
  password: { type: String }, // Needed for login (hashed)

  gender: { type: String, enum: ["male", "female", "other"] },
  address: addressSchema,

  bankDetails: { type: bankDetailsSchema, default: null },

  otp: String,             // For OTP login
  otpExpiresAt: Date,
  refreshTokens: [String], // To store refresh tokens for JWT

  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);
