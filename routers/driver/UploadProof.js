const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const Driver = require("../../models/Driver");

const UPLOAD_BASE = path.join(__filename, "../../../uploads");
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Ensure upload folders exist
(async () => {
  const folders = ["bankDocs", "residenceDocs", "licenseDocs"];
  try {
    await fs.mkdir(UPLOAD_BASE, { recursive: true });
    for (const folder of folders) {
      await fs.mkdir(path.join(UPLOAD_BASE, folder), { recursive: true });
    }
  } catch (err) {
    console.error("Upload folder creation error:", err);
  }
})();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder;
    if (file.fieldname === "bankDocument") folder = "bankDocs";
    else if (file.fieldname === "residenceProof") folder = "residenceDocs";
    else if (file.fieldname === "drivingLicense") folder = "licenseDocs";
    else return cb(new Error("Invalid field name"));
    cb(null, path.join(UPLOAD_BASE, folder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const accountName = (req.body?.accountName || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueName = `${accountName}_${file.fieldname}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Route: POST /api/driver/id-proof
router.post("/upload-proof",upload.fields([
    { name: "bankDocument", maxCount: 1 },
    { name: "residenceProof", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { accountName, accountNumber, ifscCode, mobile } = req.body;
      const files = req.files;
      console.log(UPLOAD_BASE)
      // Validate text fields
      if (!accountName?.trim() || !accountNumber?.trim() || !ifscCode?.trim() || !mobile?.trim()) {
        return res.status(400).json({
          success: false,
          message: "All text fields (including mobile) are required",
        });
      }

      if (!/^\d{10}$/.test(mobile.trim())) {
        return res.status(400).json({
          success: false,
          message: "Mobile number must be 10 digits",
        });
      }

      if (!/^\d{9,18}$/.test(accountNumber.trim())) {
        return res.status(400).json({
          success: false,
          message: "Account number must be 9-18 digits",
        });
      }

      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid IFSC code format",
        });
      }

      if (
        !files?.bankDocument?.[0] ||
        !files?.residenceProof?.[0] ||
        !files?.drivingLicense?.[0]
      ) {
        return res.status(400).json({
          success: false,
          message: "All 3 documents must be uploaded",
        });
      }

      // Find driver in DB
      const driver = await Driver.findOne({ mobile: mobile.trim() });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver with this mobile number not found",
        });
      }

      // Update bank details
      driver.bankDetails = {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        documents: {
          bank: `/uploads/bankDocs/${files.bankDocument[0].filename}`,
          residence: `/uploads/residenceDocs/${files.residenceProof[0].filename}`,
          license: `/uploads/licenseDocs/${files.drivingLicense[0].filename}`,
        },
        submittedAt: new Date(),
      };

      await driver.save();

      return res.status(201).json({
        success: true,
        message: "ID Proof added to driver successfully",
        data: {
          driverId: driver._id
        },
      });
    } catch (err) {
      console.error("ID Proof upload error:", err);
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message:
            err.code === "LIMIT_FILE_SIZE" ? "File too large (max 5MB)" : "Upload error",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

module.exports = router;
