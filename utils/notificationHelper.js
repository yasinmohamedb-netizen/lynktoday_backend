const Notification = require("../models/Notification");

// ======================================================
// Create Notification
// ======================================================

const createNotification = async ({
    receiver,
    sender = null,
    type,
    message = "",
    post = null,
    comment = null,
    relatedUser = null,
    connection = null
}) => {

    try {

        // ==========================================
        // Validation
        // ==========================================

        if (!receiver) {
            return null;
        }

        if (!type) {
            return null;
        }

        // ==========================================
        // Never notify yourself
        // ==========================================

        if (
            sender &&
            receiver.toString() === sender.toString()
        ) {

            return null;

        }

        // ==========================================
        // Create Notification
        // ==========================================

        const notification =
            await Notification.create({

                receiver,

                sender,

                type,

                message,

                post,

                comment,

                relatedUser,

                connection

            });

        return notification;

    } catch (error) {

        console.error(
            "Notification creation error:",
            error
        );

        return null;

    }

};


// ======================================================
// Delete duplicate notification
// Optional helper
// ======================================================

const deleteNotification = async ({
    receiver,
    sender = null,
    type,
    post = null,
    comment = null
}) => {

    try {

        const query = {

            receiver,

            type

        };

        if (sender) {

            query.sender = sender;

        }

        if (post) {

            query.post = post;

        }

        if (comment) {

            query.comment = comment;

        }

        await Notification.deleteMany(query);

    } catch (error) {

        console.error(
            "Delete notification error:",
            error
        );

    }

};


// ======================================================
// Export
// ======================================================

module.exports = {

    createNotification,

    deleteNotification

};