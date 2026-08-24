const express = require("express");

const router = express.Router();

const {
    globalSearch
} = require("../controllers/searchController");

const {
    optionalAuth
} = require("../middleware/authMiddleware");

// ======================================================
// GLOBAL SEARCH
//
// GET /api/v1/search?q=cotton
// ======================================================

router.get(
    "/",
    optionalAuth,
    globalSearch
);

module.exports = router;