const express = require("express");

const router =
    express.Router();

const controller =
    require("../controllers/adminHighlightController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");


// ======================================================
// CREATE ADMIN HIGHLIGHT
// POST /api/v1/admin/highlights
// ======================================================

router.post(
    "/",
    protect,
    adminOnly,
    controller.createHighlight
);


// ======================================================
// GET ALL ADMIN HIGHLIGHTS
// GET /api/v1/admin/highlights
// ======================================================

router.get(
    "/",
    protect,
    adminOnly,
    controller.getHighlights
);


// ======================================================
// UPDATE ADMIN HIGHLIGHT
// PATCH /api/v1/admin/highlights/:id
// ======================================================

router.patch(
    "/:id",
    protect,
    adminOnly,
    controller.updateHighlight
);


// ======================================================
// DELETE ADMIN HIGHLIGHT
// DELETE /api/v1/admin/highlights/:id
// ======================================================

router.delete(
    "/:id",
    protect,
    adminOnly,
    controller.deleteHighlight
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;