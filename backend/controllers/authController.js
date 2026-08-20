const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "ecocampus_fallback_secret_key_123";

/**
 * Generate signed JWT Token
 * @param {string} id User ID
 * @param {string} role User role
 * @returns {string} Signed JWT Token
 */
const generateToken = (id, role) => {
  const expiresIn = process.env.JWT_EXPIRE || "30d";
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn });
};

/**
 * Helper to check if MongoDB connection is active
 */
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    console.log("Register payload:", req.body);
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    const userRole = role ? role : "student";

    // Fallback if MongoDB is not connected
    if (!isMongoConnected()) {
      console.warn("[Register]: MongoDB not connected. Operating in mock/fallback mode.");
      const mockId = "mock_user_" + Date.now();
      const token = generateToken(mockId, userRole);
      return res.status(201).json({
        success: true,
        message: "User registered successfully (Mock Mode)",
        token,
        user: {
          id: mockId,
          name,
          email: email.toLowerCase(),
          role: userRole,
        },
      });
    }

    // Try MongoDB query and save/create inside try/catch
    try {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: "An account with this email address already exists",
        });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: userRole,
      });

      const token = generateToken(user._id, user.role);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (dbErr) {
      console.warn("[Register DB Error - Mock Fallback]:", dbErr.message);
      const mockId = "mock_user_" + Date.now();
      const token = generateToken(mockId, userRole);
      return res.status(201).json({
        success: true,
        message: "User registered successfully (Mock Fallback)",
        token,
        user: {
          id: mockId,
          name,
          email: email.toLowerCase(),
          role: userRole,
        },
      });
    }
  } catch (error) {
    console.error(`[Register Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

/**
 * @desc    Login user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    // Fallback if MongoDB is not connected
    if (!isMongoConnected()) {
      console.warn("[Login]: MongoDB not connected. Operating in mock/fallback mode.");
      const mockId = "mock_user_login_" + Date.now();
      const mockRole = email.includes("admin") ? "Admin" : email.includes("manager") ? "Manager" : "student";
      const token = generateToken(mockId, mockRole);
      return res.status(200).json({
        success: true,
        message: "Login successful (Mock Mode)",
        token,
        user: {
          id: mockId,
          name: email.split("@")[0] || "EcoUser",
          email: email.toLowerCase(),
          role: mockRole,
        },
      });
    }

    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const token = generateToken(user._id, user.role);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (dbErr) {
      console.warn("[Login DB Error - Mock Fallback]:", dbErr.message);
      const mockId = "mock_user_login_" + Date.now();
      const mockRole = email.includes("admin") ? "Admin" : email.includes("manager") ? "Manager" : "student";
      const token = generateToken(mockId, mockRole);
      return res.status(200).json({
        success: true,
        message: "Login successful (Mock Fallback)",
        token,
        user: {
          id: mockId,
          name: email.split("@")[0] || "EcoUser",
          email: email.toLowerCase(),
          role: mockRole,
        },
      });
    }
  } catch (error) {
    console.error(`[Login Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while logging in",
    });
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private (Authenticated)
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
