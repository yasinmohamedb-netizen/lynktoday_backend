const express = require("express");

const router = express.Router();

const hsCodeController = require("../controllers/hsCodeController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");


// ======================================================
// PUBLIC ROUTES
// ======================================================


// ======================================================
// GET ALL HS CODES
//
// GET /api/v1/hs-codes
//
// Supports:
// - Pagination
// - Chapter filtering
// - Country filtering
// - Active/inactive filtering
// ======================================================

router.get(
    "/",
    hsCodeController.getHSCodes
);


// ======================================================
// SEARCH HS CODES
//
// GET /api/v1/hs-codes/search?q=cotton
//
// Supports:
// - HS Code
// - Description
// - Keyword
// - Chapter
// - Heading
// ======================================================

router.get(
    "/search",
    hsCodeController.searchHSCodes
);


// ======================================================
// GET HS CODE BY EXACT CODE
//
// GET /api/v1/hs-codes/code/62034200
// ======================================================

router.get(
    "/code/:hsCode",
    hsCodeController.getHSCodeByCode
);


// ======================================================
// GET HS CODE BY MONGODB ID
//
// GET /api/v1/hs-codes/id/6a7d9d30a5ec7d2a1bc442d7
// ======================================================

router.get(
    "/id/:id",
    hsCodeController.getHSCodeById
);


// ======================================================
// ADMIN ROUTES
// ======================================================


// ======================================================
// CREATE HS CODE
//
// POST /api/v1/hs-codes
// ======================================================

router.post(
    "/",
    protect,
    adminOnly,
    hsCodeController.createHSCode
);


// ======================================================
// UPDATE HS CODE
//
// PUT /api/v1/hs-codes/:id
// ======================================================

router.put(
    "/:id",
    protect,
    adminOnly,
    hsCodeController.updateHSCode
);


// ======================================================
// DEACTIVATE HS CODE
//
// PATCH /api/v1/hs-codes/:id/deactivate
// ======================================================

router.patch(
    "/:id/deactivate",
    protect,
    adminOnly,
    hsCodeController.deactivateHSCode
);


// ======================================================
// ACTIVATE HS CODE
//
// PATCH /api/v1/hs-codes/:id/activate
// ======================================================

router.patch(
    "/:id/activate",
    protect,
    adminOnly,
    hsCodeController.activateHSCode
);


// ======================================================
// PERMANENT DELETE HS CODE
//
// DELETE /api/v1/hs-codes/:id
// ======================================================

router.delete(
    "/:id",
    protect,
    adminOnly,
    hsCodeController.deleteHSCode
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;