const jwt = require("jsonwebtoken");
const BlacklistedToken = require("../models/BlacklistedToken");

module.exports = async function authToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Access token has been invalidated",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // { id: <driverId> }
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Invalid or expired token",
    });
  }
};
