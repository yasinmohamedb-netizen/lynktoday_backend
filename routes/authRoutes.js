const express = require("express");

const router = express.Router();

// ============================================================
// MODELS
// ============================================================

const User = require("../models/User");

// ============================================================
// CONTROLLERS
// ============================================================

const {
    signup,
    login,
    verifyEmail,
    resendVerification,

    // Password reset
    forgotPassword,
    verifyResetOtp,
    resetPassword
} = require("../controllers/authController");

// ============================================================
// MIDDLEWARE
// ============================================================

const {
    protect
} = require("../middleware/authMiddleware");

// ============================================================
// PUBLIC AUTH ROUTES
// ============================================================

// ------------------------------------------------------------
// SIGNUP
// POST /api/v1/auth/signup
// ------------------------------------------------------------

router.post(
    "/signup",
    signup
);

// ------------------------------------------------------------
// VERIFY EMAIL OTP
// POST /api/v1/auth/verify-email
// ------------------------------------------------------------

router.post(
    "/verify-email",
    verifyEmail
);

// ------------------------------------------------------------
// RESEND VERIFICATION OTP
// POST /api/v1/auth/resend-verification
//
// IMPORTANT:
// Frontend must use this exact endpoint.
// ------------------------------------------------------------

router.post(
    "/resend-verification",
    resendVerification
);

// Backward-compatible alias.
// This prevents older frontend code using /resend-otp
// from immediately breaking.

router.post(
    "/resend-otp",
    resendVerification
);

// ------------------------------------------------------------
// LOGIN
// POST /api/v1/auth/login
// ------------------------------------------------------------

router.post(
    "/login",
    login
);

// ============================================================
// PASSWORD RESET ROUTES
// ============================================================

// ------------------------------------------------------------
// FORGOT PASSWORD
//
// POST /api/v1/auth/forgot-password
//
// Body:
// {
//     "email": "user@example.com"
// }
// ------------------------------------------------------------

router.post(
    "/forgot-password",
    forgotPassword
);

// ------------------------------------------------------------
// VERIFY PASSWORD RESET OTP
//
// POST /api/v1/auth/verify-reset-otp
//
// Body:
// {
//     "email": "user@example.com",
//     "otp": "123456"
// }
// ------------------------------------------------------------

router.post(
    "/verify-reset-otp",
    verifyResetOtp
);

// ------------------------------------------------------------
// RESET PASSWORD
//
// POST /api/v1/auth/reset-password
//
// Body:
// {
//     "email": "user@example.com",
//     "otp": "123456",
//     "newPassword": "NewPassword123"
// }
// ------------------------------------------------------------

router.post(
    "/reset-password",
    resetPassword
);

// ============================================================
// PROTECTED ROUTES
// ============================================================

// ------------------------------------------------------------
// GET LOGGED-IN USER
//
// GET /api/v1/auth/me
// ------------------------------------------------------------

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

// ============================================================
// EXPORT
// ============================================================

module.exports = router;