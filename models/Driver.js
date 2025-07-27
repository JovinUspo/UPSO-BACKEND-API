const mongoose = require("mongoose");

const bankDetailsSchema = new mongoose.Schema({
  accountName: String,
  accountNumber: String,
  ifscCode: String,
  documents: {
    bank: String,
    residence: String,
    license: String,
  },
  submittedAt: Date,
});

const addressSchema = new mongoose.Schema({
  apartment: String,
  street: String,
  landmark: String,
  pincode: String,
});

const driverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dob: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  gender: { type: String, required: true },
  address: addressSchema,
  bankDetails: { type: bankDetailsSchema, default: null },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Driver", driverSchema);
