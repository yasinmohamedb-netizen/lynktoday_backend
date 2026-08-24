const Notification = require("../models/Notification");

// ======================================================
// Get User Notifications
// GET /api/v1/notifications
// Access: Private
// ======================================================

exports.getNotifications = async (req, res, next) => {

    try {

        const userId = req.user.userId;

        // ==========================================
        // Pagination
        // ==========================================

        const page =
            Math.max(
                parseInt(req.query.page) || 1,
                1
            );

        const limit =
            Math.min(
                Math.max(
                    parseInt(req.query.limit) || 20,
                    1
                ),
                100
            );

        const skip =
            (page - 1) * limit;

        // ==========================================
        // Query
        // ==========================================

        const query = {

            receiver: userId

        };

        // ==========================================
        // Get Notifications
        // ==========================================

        const notifications =
            await Notification.find(query)

                .populate(
                    "sender",
                    "fullName profileImage profession companyName designation location isVerified"
                )

                .populate(
                    "post",
                    "title content postType category"
                )

                .populate(
                    "comment",
                    "content author post parentComment"
                )

                .populate(
                    "relatedUser",
                    "fullName profileImage profession companyName designation location isVerified"
                )

                .populate(
                    "connection"
                )

                .sort({

                    createdAt: -1

                })

                .skip(skip)

                .limit(limit);

        // ==========================================
        // Total
        // ==========================================

        const total =
            await Notification.countDocuments(query);

        // ==========================================
        // Unread Count
        // ==========================================

        const unreadCount =
            await Notification.countDocuments({

                receiver: userId,

                isRead: false

            });

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({

            success: true,

            count: notifications.length,

            total,

            unreadCount,

            page,

            limit,

            totalPages:
                Math.ceil(total / limit),

            notifications

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Unread Count
// GET /api/v1/notifications/unread-count
// Access: Private
// ======================================================

exports.getUnreadCount = async (
    req,
    res,
    next
) => {

    try {

        const count =
            await Notification.countDocuments({

                receiver:
                    req.user.userId,

                isRead: false

            });

        return res.status(200).json({

            success: true,

            count

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Mark Single Notification Read
// PATCH /api/v1/notifications/:id/read
// Access: Private
// ======================================================

exports.markAsRead = async (
    req,
    res,
    next
) => {

    try {

        const notification =
            await Notification.findById(
                req.params.id
            );

        // ==========================================
        // Not Found
        // ==========================================

        if (!notification) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification not found."

            });

        }

        // ==========================================
        // Security Check
        // ==========================================

        if (
            notification.receiver.toString() !==
            req.user.userId.toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Access denied."

            });

        }

        // ==========================================
        // Already Read
        // ==========================================

        if (!notification.isRead) {

            notification.isRead = true;

            await notification.save();

        }

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Notification marked as read.",

            notification

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Mark All Notifications Read
// PATCH /api/v1/notifications/read-all
// Access: Private
// ======================================================

exports.markAllAsRead = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await Notification.updateMany(

                {

                    receiver:
                        req.user.userId,

                    isRead: false

                },

                {

                    $set: {

                        isRead: true

                    }

                }

            );

        return res.status(200).json({

            success: true,

            message:
                "All notifications marked as read.",

            modifiedCount:
                result.modifiedCount

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Notification
// DELETE /api/v1/notifications/:id
// Access: Private
// ======================================================

exports.deleteNotification = async (
    req,
    res,
    next
) => {

    try {

        const notification =
            await Notification.findById(
                req.params.id
            );

        // ==========================================
        // Not Found
        // ==========================================

        if (!notification) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification not found."

            });

        }

        // ==========================================
        // Security Check
        // ==========================================

        if (
            notification.receiver.toString() !==
            req.user.userId.toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Access denied."

            });

        }

        // ==========================================
        // Delete
        // ==========================================

        await notification.deleteOne();

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Notification deleted successfully."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete All Read Notifications
// DELETE /api/v1/notifications/read
// Access: Private
// ======================================================

exports.deleteReadNotifications = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await Notification.deleteMany({

                receiver:
                    req.user.userId,

                isRead: true

            });

        return res.status(200).json({

            success: true,

            message:
                "Read notifications deleted successfully.",

            deletedCount:
                result.deletedCount

        });

    } catch (error) {

        next(error);

    }

};