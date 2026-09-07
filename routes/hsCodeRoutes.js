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

// ------------------------------------------------------
// GET ALL ACTIVE HS CODES
//
// GET /api/v1/hs-codes
// ------------------------------------------------------

router.get(
    "/",
    hsCodeController.getHSCodes
);

// ------------------------------------------------------
// SEARCH HS CODES
//
// GET /api/v1/hs-codes/search?q=cotton
// ------------------------------------------------------

router.get(
    "/search",
    hsCodeController.searchHSCodes
);

// ------------------------------------------------------
// GET HS CODE BY EXACT CODE
//
// GET /api/v1/hs-codes/code/62034200
// ------------------------------------------------------

router.get(
    "/code/:hsCode",
    hsCodeController.getHSCodeByCode
);

// ------------------------------------------------------
// GET HS CODE BY MONGODB ID
//
// GET /api/v1/hs-codes/id/:id
// ------------------------------------------------------

router.get(
    "/id/:id",
    hsCodeController.getHSCodeById
);

// ======================================================
// USER ROUTES
// ======================================================

// ------------------------------------------------------
// GET MY HS CODES
//
// GET /api/v1/hs-codes/my
//
// Returns only HS Codes created by logged-in user.
// ------------------------------------------------------

router.get(
    "/my",
    protect,
    hsCodeController.getMyHSCodes
);

// ------------------------------------------------------
// CREATE HS CODE
//
// POST /api/v1/hs-codes
//
// Any authenticated user can create.
// ------------------------------------------------------

router.post(
    "/",
    protect,
    hsCodeController.createHSCode
);

// ------------------------------------------------------
// UPDATE OWN HS CODE
//
// PUT /api/v1/hs-codes/:id
//
// Owner OR Admin
// ------------------------------------------------------

router.put(
    "/:id",
    protect,
    hsCodeController.updateHSCode
);

// ------------------------------------------------------
// DEACTIVATE OWN HS CODE
//
// PATCH /api/v1/hs-codes/:id/deactivate
//
// Owner OR Admin
// ------------------------------------------------------

router.patch(
    "/:id/deactivate",
    protect,
    hsCodeController.deactivateHSCode
);

// ------------------------------------------------------
// ACTIVATE OWN HS CODE
//
// PATCH /api/v1/hs-codes/:id/activate
//
// Owner OR Admin
// ------------------------------------------------------

router.patch(
    "/:id/activate",
    protect,
    hsCodeController.activateHSCode
);

// ------------------------------------------------------
// DELETE OWN HS CODE
//
// DELETE /api/v1/hs-codes/:id
//
// Owner OR Admin
// ------------------------------------------------------

router.delete(
    "/:id",
    protect,
    hsCodeController.deleteHSCode
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;