const express = require("express");

const router = express.Router();

const notificationController =
    require("../controllers/notificationController");

const {
    protect
} = require("../middleware/authMiddleware");


// ======================================================
// Get Notifications
// GET /api/v1/notifications
// ======================================================

router.get(
    "/",
    protect,
    notificationController.getNotifications
);


// ======================================================
// Get Unread Count
// GET /api/v1/notifications/unread-count
// ======================================================

router.get(
    "/unread-count",
    protect,
    notificationController.getUnreadCount
);


// ======================================================
// Mark All Read
// PATCH /api/v1/notifications/read-all
// ======================================================

router.patch(
    "/read-all",
    protect,
    notificationController.markAllAsRead
);


// ======================================================
// Delete All Read Notifications
// DELETE /api/v1/notifications/read
// ======================================================

router.delete(
    "/read",
    protect,
    notificationController.deleteReadNotifications
);


// ======================================================
// Mark Single Read
// PATCH /api/v1/notifications/:id/read
// ======================================================

router.patch(
    "/:id/read",
    protect,
    notificationController.markAsRead
);


// ======================================================
// Delete Notification
// DELETE /api/v1/notifications/:id
// ======================================================

router.delete(
    "/:id",
    protect,
    notificationController.deleteNotification
);


module.exports = router;