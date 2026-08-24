const express = require("express");

const router =
    express.Router();

const controller =
    require("../controllers/rightSidebarController");


// ======================================================
// RIGHT SIDEBAR
// GET /api/v1/right-sidebar
// ======================================================

router.get(
    "/",
    controller.getRightSidebar
);


module.exports = router;