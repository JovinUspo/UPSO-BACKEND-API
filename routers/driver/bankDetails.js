const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");

const DRIVER_DB = path.join(__dirname, "../../db/driver.json");
const UPLOAD_BASE = path.join(__dirname, "../../../uploads");
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Create folders if not exist
(async () => {
  const folders = ["bankDocs", "residenceDocs", "licenseDocs"];
  try {
    await fs.mkdir(UPLOAD_BASE, { recursive: true });
    for (const folder of folders) {
      await fs.mkdir(path.join(UPLOAD_BASE, folder), { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create upload folders:", err);
  }
})();

// Multer Storage
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
    const uniqueName = `${file.fieldname}-${Date.now()}${ext}`;
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

// POST /bank-details
router.post(
  "/bank-details",
  upload.fields([
    { name: "bankDocument", maxCount: 1 },
    { name: "residenceProof", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { accountName, accountNumber, ifscCode, mobile } = req.body;
      const files = req.files;

      // Validation
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

      // Load existing drivers
      const drivers = await readDrivers();
      const driverIndex = drivers.findIndex((d) => d.mobile === mobile.trim());

      if (driverIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Driver with this mobile number not found",
        });
      }

      // Update the driver's bankDetails
      drivers[driverIndex].bankDetails = {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        documents: {
          bank: `/uploads/bankDocs/${files.bankDocument[0].filename}`,
          residence: `/uploads/residenceDocs/${files.residenceProof[0].filename}`,
          license: `/uploads/licenseDocs/${files.drivingLicense[0].filename}`,
        },
        submittedAt: new Date().toISOString(),
      };

      await writeDrivers(drivers);

      return res.status(201).json({
        success: true,
        message: "Bank details added to driver successfully",
        data: {
          driverId: drivers[driverIndex].id,
          bankDetails: drivers[driverIndex].bankDetails,
        },
      });
    } catch (err) {
      console.error("Bank details upload error:", err);
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

// Helper functions
const readDrivers = async () => {
  try {
    const data = await fs.readFile(DRIVER_DB, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.writeFile(DRIVER_DB, "[]");
      return [];
    }
    throw err;
  }
};

const writeDrivers = async (data) => {
  try {
    await fs.writeFile(DRIVER_DB, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to driver.json:", err);
    throw err;
  }
};

module.exports = router;
