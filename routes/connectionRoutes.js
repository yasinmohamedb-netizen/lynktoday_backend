const express = require("express");

const router =
    express.Router();

const {
    sendConnectionRequest,
    respondToRequest,
    getMyNetwork,
    getPendingRequests,
    getSentRequests,
    cancelConnectionRequest,
    removeConnection
} = require(
    "../controllers/connectionController"
);

const {
    protect
} = require(
    "../middleware/authMiddleware"
);


// ======================================================
// All Connection Routes Require Authentication
// ======================================================

router.use(protect);


// ======================================================
// Send Connection Request
// POST /api/v1/connections/request
// ======================================================

router.post(
    "/request",
    sendConnectionRequest
);


// ======================================================
// Accept / Reject Connection Request
// PUT /api/v1/connections/respond
// ======================================================

router.put(
    "/respond",
    respondToRequest
);


// ======================================================
// Get Incoming Pending Requests
// GET /api/v1/connections/requests/pending
// ======================================================

router.get(
    "/requests/pending",
    getPendingRequests
);


// ======================================================
// Get Sent Pending Requests
// GET /api/v1/connections/requests/sent
// ======================================================

router.get(
    "/requests/sent",
    getSentRequests
);


// ======================================================
// Cancel Sent Request
// DELETE /api/v1/connections/request/:id
// ======================================================

router.delete(
    "/request/:id",
    cancelConnectionRequest
);


// ======================================================
// Remove Existing Connection
// DELETE /api/v1/connections/:userId
// ======================================================

router.delete(
    "/:userId",
    removeConnection
);


// ======================================================
// Get Accepted Connections
// GET /api/v1/connections
// ======================================================

router.get(
    "/",
    getMyNetwork
);


module.exports = router;