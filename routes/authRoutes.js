const express = require("express");
const router = express.Router();

// ================================
// Models
// ================================
const User = require("../models/User");

// ================================
// Controllers
// ================================
const {
    signup,
    login,
    verifyEmail,
    resendVerification
} = require("../controllers/authController");

// ================================
// Middleware
// ================================
const {
    protect
} = require("../middleware/authMiddleware");

// ============================================
// Public Routes
// ============================================

// Register
router.post("/signup", signup);

// Verify Email OTP
router.post("/verify-email", verifyEmail);

// Resend Verification OTP
router.post(
    "/resend-verification",
    resendVerification
);

// Login
router.post("/login", login);


// ============================================
// Protected Routes
// ============================================

// Get Logged-in User
router.get(
    "/me",
    protect,
    async (req, res, next) => {

        try {

            const user =
                await User.findById(
                    req.user.userId
                ).select("-password");

            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."

                });

            }

            return res.status(200).json({

                success: true,

                user

            });

        } catch (error) {

            next(error);

        }

    }
);


module.exports = router;