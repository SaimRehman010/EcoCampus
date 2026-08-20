const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "ecocampus_fallback_secret_key_123";

/**
 * Protect routes - Verifies JWT in Authorization header and attaches User to req.user
 */
const protect = async (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) {
    console.error("JWT Verification Error: No authorization header provided");
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }

  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  if (!token) {
    console.error("JWT Verification Error: Token string is empty");
    return res.status(401).json({
      success: false,
      message: "Not authorized, token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // If MongoDB is offline or token is for a mock user
    if (mongoose.connection.readyState !== 1 || String(decoded.id).startsWith("mock_user_")) {
      req.user = {
        _id: decoded.id,
        name: "EcoUser",
        email: "user@campus.edu",
        role: decoded.role || "student",
      };
      return next();
    }

    try {
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        req.user = {
          _id: decoded.id,
          name: "EcoUser",
          email: "user@campus.edu",
          role: decoded.role || "student",
        };
        return next();
      }
      req.user = user;
      return next();
    } catch (dbErr) {
      req.user = {
        _id: decoded.id,
        name: "EcoUser",
        email: "user@campus.edu",
        role: decoded.role || "student",
      };
      return next();
    }
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid or expired",
    });
  }
};

module.exports = protect;
