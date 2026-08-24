const express = require("express");

const router = express.Router();

const profileController =
    require("../controllers/profileController");

const {
    protect,
    optionalAuth
} = require("../middleware/authMiddleware");

const upload =
    require("../middleware/uploadMiddleware");


// ======================================================
// My Profile
// ======================================================

router.get(
    "/me",
    protect,
    profileController.getMyProfile
);


// ======================================================
// Update Profile
// ======================================================

router.put(
    "/",
    protect,
    profileController.updateProfile
);


// ======================================================
// Change Password
// ======================================================

router.put(
    "/change-password",
    protect,
    profileController.changePassword
);


// ======================================================
// Delete Account
// ======================================================

router.delete(
    "/account",
    protect,
    profileController.deleteAccount
);


// ======================================================
// Upload Profile Photo
// ======================================================

router.put(
    "/photo",
    protect,
    upload.single("file"),
    profileController.uploadProfilePhoto
);


// ======================================================
// Delete Profile Photo
// ======================================================

router.delete(
    "/photo",
    protect,
    profileController.deleteProfilePhoto
);


// ======================================================
// Upload Cover Photo
// ======================================================

router.put(
    "/cover",
    protect,
    upload.single("file"),
    profileController.uploadCoverPhoto
);


// ======================================================
// Delete Cover Photo
// ======================================================

router.delete(
    "/cover",
    protect,
    profileController.deleteCoverPhoto
);


// ======================================================
// Public Profile
// IMPORTANT: Keep this LAST
// ======================================================

router.get(
    "/:userId",
    optionalAuth,
    profileController.getProfile
);


module.exports = router;