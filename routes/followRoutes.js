const express = require("express");

const router = express.Router();

const {
    toggleFollow,
    getFollowers,
    getFollowing
} = require("../controllers/followController");

const {
    protect
} = require("../middleware/authMiddleware");

// ============================================
// Follow / Unfollow
// ============================================

router.post(
    "/:userId",
    protect,
    toggleFollow
);

// ============================================
// Followers
// ============================================

router.get(
    "/followers/:userId",
    protect,
    getFollowers
);

// ============================================
// Following
// ============================================

router.get(
    "/following/:userId",
    protect,
    getFollowing
);

module.exports = router;