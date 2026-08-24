const express = require("express");

const router =
    express.Router();

const adminSidebarController =
    require("../controllers/adminSidebarController");

const {
    protect
} = require("../middleware/authMiddleware");


// ======================================================
// CREATE
// POST /api/v1/admin/sidebar
// ======================================================

router.post(
    "/",
    protect,
    adminSidebarController.createSidebarContent
);


// ======================================================
// GET ALL
// GET /api/v1/admin/sidebar
// ======================================================

router.get(
    "/",
    protect,
    adminSidebarController.getAllSidebarContent
);


// ======================================================
// GET SINGLE
// GET /api/v1/admin/sidebar/:id
// ======================================================

router.get(
    "/:id",
    protect,
    adminSidebarController.getSidebarContentById
);


// ======================================================
// UPDATE
// PATCH /api/v1/admin/sidebar/:id
// ======================================================

router.patch(
    "/:id",
    protect,
    adminSidebarController.updateSidebarContent
);


// ======================================================
// TOGGLE
// PATCH /api/v1/admin/sidebar/:id/toggle
// ======================================================

router.patch(
    "/:id/toggle",
    protect,
    adminSidebarController.toggleSidebarContent
);


// ======================================================
// DELETE
// DELETE /api/v1/admin/sidebar/:id
// ======================================================

router.delete(
    "/:id",
    protect,
    adminSidebarController.deleteSidebarContent
);


module.exports = router;