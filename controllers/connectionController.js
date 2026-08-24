const Connection = require("../models/Connection");
const User = require("../models/User");
const Notification = require("../models/Notification");

// ======================================================
// Send Connection Request
// POST /api/v1/connections/request
// ======================================================

exports.sendConnectionRequest = async (req, res, next) => {

    try {

        const senderId = req.user.userId;
        const { receiverId } = req.body;

        // ==========================================
        // Validate Receiver
        // ==========================================

        if (!receiverId) {

            return res.status(400).json({
                success: false,
                message: "Receiver is required."
            });

        }

        // ==========================================
        // Cannot Connect With Yourself
        // ==========================================

        if (
            senderId.toString() ===
            receiverId.toString()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You cannot connect with yourself."
            });

        }

        // ==========================================
        // Find Users
        // ==========================================

        const sender = await User.findById(
            senderId
        );

        const receiver = await User.findById(
            receiverId
        );

        if (!sender || !receiver) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }

        // ==========================================
        // Check Existing Connection
        // ==========================================

        const existingConnection =
            await Connection.findOne({

                $or: [

                    {
                        sender: senderId,
                        receiver: receiverId
                    },

                    {
                        sender: receiverId,
                        receiver: senderId
                    }

                ]

            });

        // ==========================================
        // Existing Relationship
        // ==========================================

        if (existingConnection) {

            if (
                existingConnection.status ===
                "PENDING"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "A connection request is already pending."
                });

            }

            if (
                existingConnection.status ===
                "ACCEPTED"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "You are already connected."
                });

            }

            if (
                existingConnection.status ===
                "BLOCKED"
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "This connection is blocked."
                });

            }

            // ======================================
            // Re-use Rejected Connection
            // ======================================

            if (
                existingConnection.status ===
                "REJECTED"
            ) {

                existingConnection.sender =
                    senderId;

                existingConnection.receiver =
                    receiverId;

                existingConnection.status =
                    "PENDING";

                existingConnection.requestedAt =
                    new Date();

                existingConnection.acceptedAt =
                    null;

                await existingConnection.save();

                // Remove old notification
                await Notification.deleteMany({

                    receiver: receiverId,
                    sender: senderId,
                    type: "CONNECTION_REQUEST"

                });

                // Create new notification
                await Notification.create({

                    receiver: receiverId,

                    sender: senderId,

                    type: "CONNECTION_REQUEST",

                    message:
                        `${sender.fullName} sent you a connection request.`

                });

                return res.status(201).json({

                    success: true,

                    message:
                        "Connection request sent successfully.",

                    connection:
                        existingConnection

                });

            }

        }

        // ==========================================
        // Create New Connection Request
        // ==========================================

        const connection =
            await Connection.create({

                sender: senderId,

                receiver: receiverId,

                status: "PENDING",

                requestedAt: new Date()

            });

        // ==========================================
        // Create Notification
        // ==========================================

        await Notification.create({

            receiver: receiverId,

            sender: senderId,

            type: "CONNECTION_REQUEST",

            message:
                `${sender.fullName} sent you a connection request.`

        });

        return res.status(201).json({

            success: true,

            message:
                "Connection request sent successfully.",

            connection

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Accept / Reject Connection Request
// PUT /api/v1/connections/respond
// ======================================================

exports.respondToRequest = async (
    req,
    res,
    next
) => {

    try {

        const {
            requestId,
            action
        } = req.body;

        const receiverId =
            req.user.userId;

        // ==========================================
        // Validate Action
        // ==========================================

        if (
            !["ACCEPTED", "REJECTED"]
                .includes(action)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Action must be ACCEPTED or REJECTED."

            });

        }

        // ==========================================
        // Find Request
        // ==========================================

        const request =
            await Connection.findOne({

                _id: requestId,

                receiver: receiverId,

                status: "PENDING"

            });

        if (!request) {

            return res.status(404).json({

                success: false,

                message:
                    "Connection request not found."

            });

        }

        // ==========================================
        // Find Sender
        // ==========================================

        const sender =
            await User.findById(
                request.sender
            );

        if (!sender) {

            return res.status(404).json({

                success: false,

                message:
                    "Sender user not found."

            });

        }

        // ==========================================
        // Accept
        // ==========================================

        if (
            action === "ACCEPTED"
        ) {

            request.status =
                "ACCEPTED";

            request.acceptedAt =
                new Date();

            await request.save();

            // ======================================
            // Remove Connection Request Notification
            // ======================================

            await Notification.deleteMany({

                receiver: receiverId,

                sender: request.sender,

                type: "CONNECTION_REQUEST"

            });

            // ======================================
            // Notify Sender
            // ======================================

            const receiver =
                await User.findById(
                    receiverId
                );

            if (receiver) {

                await Notification.create({

                    receiver: request.sender,

                    sender: receiverId,

                    type: "CONNECTION_ACCEPTED",

                    message:
                        `${receiver.fullName} accepted your connection request.`

                });

            }

            return res.status(200).json({

                success: true,

                status: "ACCEPTED",

                message:
                    "Connection request accepted.",

                connection: request

            });

        }

        // ==========================================
        // Reject
        // ==========================================

        request.status =
            "REJECTED";

        request.acceptedAt =
            null;

        await request.save();

        // ==========================================
        // Remove Notification
        // ==========================================

        await Notification.deleteMany({

            receiver: receiverId,

            sender: request.sender,

            type: "CONNECTION_REQUEST"

        });

        return res.status(200).json({

            success: true,

            status: "REJECTED",

            message:
                "Connection request rejected.",

            connection: request

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get My Network
// GET /api/v1/connections
// ======================================================

exports.getMyNetwork = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            req.user.userId;

        const connections =
            await Connection.find({

                status: "ACCEPTED",

                $or: [

                    {
                        sender: userId
                    },

                    {
                        receiver: userId
                    }

                ]

            })

            .populate(
                "sender",
                "fullName profileImage companyName profession designation location role isVerified"
            )

            .populate(
                "receiver",
                "fullName profileImage companyName profession designation location role isVerified"
            )

            .sort({
                acceptedAt: -1
            });

        // ==========================================
        // Format Network
        // ==========================================

        const network =
            connections
                .map(connection => {

                    if (
                        !connection.sender ||
                        !connection.receiver
                    ) {

                        return null;

                    }

                    if (
                        connection.sender._id
                            .toString() ===
                        userId.toString()
                    ) {

                        return connection.receiver;

                    }

                    return connection.sender;

                })
                .filter(Boolean);

        return res.status(200).json({

            success: true,

            count: network.length,

            network

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Incoming Pending Requests
// GET /api/v1/connections/requests/pending
// ======================================================

exports.getPendingRequests = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            req.user.userId;

        const requests =
            await Connection.find({

                receiver: userId,

                status: "PENDING"

            })

            .populate(

                "sender",

                "fullName profileImage companyName profession designation location role isVerified followersCount followingCount"

            )

            .sort({

                createdAt: -1

            });

        return res.status(200).json({

            success: true,

            count: requests.length,

            requests

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Sent Pending Requests
// GET /api/v1/connections/requests/sent
// ======================================================

exports.getSentRequests = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            req.user.userId;

        const requests =
            await Connection.find({

                sender: userId,

                status: "PENDING"

            })

            .populate(

                "receiver",

                "fullName profileImage companyName profession designation location role isVerified followersCount followingCount"

            )

            .sort({

                createdAt: -1

            });

        return res.status(200).json({

            success: true,

            count: requests.length,

            requests

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Cancel Sent Connection Request
// DELETE /api/v1/connections/request/:id
// ======================================================

exports.cancelConnectionRequest = async (
    req,
    res,
    next
) => {

    try {

        const request =
            await Connection.findOne({

                _id: req.params.id,

                sender: req.user.userId,

                status: "PENDING"

            });

        if (!request) {

            return res.status(404).json({

                success: false,

                message:
                    "Pending connection request not found."

            });

        }

        // ==========================================
        // Remove Notification
        // ==========================================

        await Notification.deleteMany({

            receiver: request.receiver,

            sender: request.sender,

            type: "CONNECTION_REQUEST"

        });

        // ==========================================
        // Delete Request
        // ==========================================

        await request.deleteOne();

        return res.status(200).json({

            success: true,

            message:
                "Connection request cancelled successfully."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Remove Existing Connection
// DELETE /api/v1/connections/:userId
// ======================================================

exports.removeConnection = async (
    req,
    res,
    next
) => {

    try {

        const currentUserId =
            req.user.userId;

        const targetUserId =
            req.params.userId;

        // ==========================================
        // Cannot Remove Yourself
        // ==========================================

        if (
            currentUserId.toString() ===
            targetUserId.toString()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid connection user."

            });

        }

        // ==========================================
        // Find Accepted Connection
        // ==========================================

        const connection =
            await Connection.findOne({

                status: "ACCEPTED",

                $or: [

                    {
                        sender: currentUserId,

                        receiver: targetUserId

                    },

                    {
                        sender: targetUserId,

                        receiver: currentUserId

                    }

                ]

            });

        if (!connection) {

            return res.status(404).json({

                success: false,

                message:
                    "Connection not found."

            });

        }

        // ==========================================
        // Delete Connection
        // ==========================================

        await connection.deleteOne();

        // ==========================================
        // Remove Related Accepted Notifications
        // ==========================================

        await Notification.deleteMany({

            $or: [

                {
                    receiver: currentUserId,

                    sender: targetUserId,

                    type: "CONNECTION_ACCEPTED"

                },

                {
                    receiver: targetUserId,

                    sender: currentUserId,

                    type: "CONNECTION_ACCEPTED"

                }

            ]

        });

        return res.status(200).json({

            success: true,

            message:
                "Connection removed successfully."

        });

    } catch (error) {

        next(error);

    }

};