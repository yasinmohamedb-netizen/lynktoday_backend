const express = require("express");

const router = express.Router();

const documentationController =
    require("../controllers/documentationController");

const {
    protect
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
// GET MY DOCUMENTATIONS
//
// GET /api/v1/documentation/my
//
// Requires:
//
// - Login
//
// Returns only documentation created by the
// currently logged-in user.
//
// Supports:
//
// GET /api/v1/documentation/my
//
// GET /api/v1/documentation/my?page=1&limit=10
//
// GET /api/v1/documentation/my?isActive=true
//
// GET /api/v1/documentation/my?isActive=false
// ======================================================

router.get(
    "/my",
    protect,
    documentationController.getMyDocumentations
);


// ======================================================
// GET SINGLE DOCUMENTATION
//
// GET /api/v1/documentation/:id
//
// The parameter can contain:
//
// 1. MongoDB ObjectId
//
// OR
//
// 2. SEO-friendly slug
//
// Examples:
//
// GET /api/v1/documentation/6a7da644b3f84a4520a02772
//
// GET /api/v1/documentation/how-to-import-goods-into-india
// ======================================================

router.get(
    "/:id",
    documentationController.getDocumentationById
);


// ======================================================
// AUTHENTICATED USER ROUTES
//
// Any logged-in user can:
//
// - Create documentation
// - Edit documentation
// - Activate documentation
// - Deactivate documentation
// - Delete documentation
//
// The controller must enforce ownership where required.
// ======================================================


// ======================================================
// CREATE DOCUMENTATION
//
// POST /api/v1/documentation
//
// Requires:
//
// - Login
// - Any authenticated user
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
//
// - Login
// - Any authenticated user
//
// Ownership/admin authorization should be handled
// inside the controller.
// ======================================================

router.put(
    "/:id",
    protect,
    documentationController.updateDocumentation
);


// ======================================================
// DEACTIVATE DOCUMENTATION
//
// PATCH /api/v1/documentation/:id/deactivate
//
// Requires:
//
// - Login
// - Any authenticated user
//
// Ownership/admin authorization should be handled
// inside the controller.
// ======================================================

router.patch(
    "/:id/deactivate",
    protect,
    documentationController.deactivateDocumentation
);


// ======================================================
// ACTIVATE DOCUMENTATION
//
// PATCH /api/v1/documentation/:id/activate
//
// Requires:
//
// - Login
// - Any authenticated user
//
// Ownership/admin authorization should be handled
// inside the controller.
// ======================================================

router.patch(
    "/:id/activate",
    protect,
    documentationController.activateDocumentation
);


// ======================================================
// DELETE DOCUMENTATION
//
// DELETE /api/v1/documentation/:id
//
// Requires:
//
// - Login
// - Any authenticated user
//
// Ownership/admin authorization should be handled
// inside the controller.
// ======================================================

router.delete(
    "/:id",
    protect,
    documentationController.deleteDocumentation
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;