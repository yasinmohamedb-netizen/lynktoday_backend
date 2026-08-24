const express = require("express");
const router = express.Router();

const {
    getPublicSidebarContent,
    getAdminSidebarContent,
    createSidebarContent,
    updateSidebarContent,
    deleteSidebarContent
} = require("../controllers/sidebarContentController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");

// ======================================================
// Public Routes
// ======================================================

// Get active sidebar items
router.get("/", getPublicSidebarContent);

// ======================================================
// Admin Routes
// ======================================================

// Get all sidebar items
router.get(
    "/admin",
    protect,
    adminOnly,
    getAdminSidebarContent
);

// Create sidebar item
router.post(
    "/admin",
    protect,
    adminOnly,
    createSidebarContent
);

// Update sidebar item
router.put(
    "/admin/:id",
    protect,
    adminOnly,
    updateSidebarContent
);

// Delete sidebar item
router.delete(
    "/admin/:id",
    protect,
    adminOnly,
    deleteSidebarContent
);

module.exports = router;