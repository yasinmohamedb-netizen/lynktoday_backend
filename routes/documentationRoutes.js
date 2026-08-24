const express = require("express");

const router = express.Router();

const documentationController =
    require("../controllers/documentationController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");


// ======================================================
// PUBLIC ROUTES
// ======================================================


// ======================================================
// GET DOCUMENTATION LIST
//
// GET /api/v1/documentation
//
// Examples:
//
// GET /api/v1/documentation
//
// GET /api/v1/documentation?page=1&limit=10
//
// GET /api/v1/documentation?category=Customs
//
// GET /api/v1/documentation?documentType=GUIDE
//
// GET /api/v1/documentation?isFeatured=true
//
// GET /api/v1/documentation?isActive=true
// ======================================================

router.get(
    "/",
    documentationController.getDocumentations
);


// ======================================================
// SEARCH DOCUMENTATION
//
// GET /api/v1/documentation/search?q=customs
//
// Examples:
//
// GET /api/v1/documentation/search?q=customs
//
// GET /api/v1/documentation/search?q=bill&page=1&limit=10
// ======================================================

router.get(
    "/search",
    documentationController.searchDocumentations
);


// ======================================================
// GET SINGLE DOCUMENTATION
//
// GET /api/v1/documentation/:id
//
// Example:
//
// GET /api/v1/documentation/6a7da644b3f84a4520a02772
// ======================================================

router.get(
    "/:id",
    documentationController.getDocumentationById
);


// ======================================================
// ADMIN ROUTES
// ======================================================


// ======================================================
// CREATE DOCUMENTATION
//
// POST /api/v1/documentation
//
// Requires:
// - Login
// - Admin role
// ======================================================

router.post(
    "/",
    protect,
    documentationController.createDocumentation
);


// ======================================================
// UPDATE DOCUMENTATION
//
// PUT /api/v1/documentation/:id
//
// Requires:
// - Login
// - Admin role
// ======================================================

router.put(
    "/:id",
    protect,
    adminOnly,
    documentationController.updateDocumentation
);


// ======================================================
// DEACTIVATE DOCUMENTATION
//
// PATCH /api/v1/documentation/:id/deactivate
//
// Requires:
// - Login
// - Admin role
// ======================================================

router.patch(
    "/:id/deactivate",
    protect,
    adminOnly,
    documentationController.deactivateDocumentation
);


// ======================================================
// ACTIVATE DOCUMENTATION
//
// PATCH /api/v1/documentation/:id/activate
//
// Requires:
// - Login
// - Admin role
// ======================================================

router.patch(
    "/:id/activate",
    protect,
    adminOnly,
    documentationController.activateDocumentation
);


// ======================================================
// PERMANENT DELETE DOCUMENTATION
//
// DELETE /api/v1/documentation/:id
//
// Requires:
// - Login
// - Admin role
// ======================================================

router.delete(
    "/:id",
    protect,
    adminOnly,
    documentationController.deleteDocumentation
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;