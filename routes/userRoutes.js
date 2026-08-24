const express = require("express");

const router = express.Router();

const {

    getAllUsers,

    getUserProfile,

    updateProfile,

    requestVerification,

    verifyUser,

    rejectVerification,

    getVerifiedUsers,

    searchUsers

} = require("../controllers/userController");


const {

    protect,

    optionalAuth,

    adminOnly

} = require("../middleware/authMiddleware");


// ======================================================
// PUBLIC / OPTIONAL AUTH ROUTES
// ======================================================


// Search Users / Companies
// GET /api/v1/users/search?q=importer

router.get(
    "/search",
    optionalAuth,
    searchUsers
);


// Get Verified Professionals
// GET /api/v1/users/verified

router.get(
    "/verified",
    getVerifiedUsers
);


// Public User Profile
// GET /api/v1/users/:id

router.get(
    "/:id",
    optionalAuth,
    getUserProfile
);


// ======================================================
// PROTECTED ROUTES
// ======================================================


// Update Own Profile
// PUT /api/v1/users/profile

router.put(
    "/profile",
    protect,
    updateProfile
);


// Request Verification
// PUT /api/v1/users/request-verification

router.put(
    "/request-verification",
    protect,
    requestVerification
);


// ======================================================
// ADMIN ROUTES
// ======================================================


// Get All Users
// GET /api/v1/users

router.get(
    "/",
    protect,
    adminOnly,
    getAllUsers
);


// Verify User
// PUT /api/v1/users/:id/verify

router.put(
    "/:id/verify",
    protect,
    adminOnly,
    verifyUser
);


// Reject Verification
// PUT /api/v1/users/:id/reject

router.put(
    "/:id/reject",
    protect,
    adminOnly,
    rejectVerification
);


module.exports = router;