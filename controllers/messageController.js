const mongoose = require("mongoose");

const Conversation =
    require("../models/Conversation");

const Message =
    require("../models/Message");
    const Notification =
    require("../models/Notification");


// ======================================================
// Helpers
// ======================================================

const userFields =
    "fullName companyName profession designation profileImage location isVerified headline";


// ======================================================
// Validate ObjectId
// ======================================================

const isValidId = (id) => {

    return mongoose.Types.ObjectId.isValid(id);

};


// ======================================================
// Get / Create Conversation
//
// POST /api/v1/messages/conversations
//
// Body:
// {
//     "userId": "USER_ID"
// }
// ======================================================

exports.createConversation = async (
    req,
    res,
    next
) => {

    try {

        const currentUserId =
            req.user.userId;

        const { userId } =
            req.body;


        if (!userId) {

            return res.status(400).json({
                success: false,
                message:
                    "User ID is required."
            });

        }


        if (!isValidId(userId)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid user ID."
            });

        }


        if (
            currentUserId.toString() ===
            userId.toString()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You cannot create a conversation with yourself."
            });

        }


        // ==========================================
        // Check Existing Conversation
        // ==========================================

        let conversation =
            await Conversation.findOne({

                participants: {
                    $all: [
                        currentUserId,
                        userId
                    ]
                },

                isActive: true

            })
            .populate(
                "participants",
                userFields
            )
            .populate({
                path: "lastMessage",
                populate: [
                    {
                        path: "sender",
                        select: userFields
                    },
                    {
                        path: "receiver",
                        select: userFields
                    }
                ]
            });


        // ==========================================
        // Create New Conversation
        // ==========================================

        if (!conversation) {

            conversation =
                await Conversation.create({

                    participants: [
                        currentUserId,
                        userId
                    ],

                    unreadCounts: {

                        [currentUserId]: 0,

                        [userId]: 0

                    }

                });


            conversation =
                await Conversation.findById(
                    conversation._id
                )
                .populate(
                    "participants",
                    userFields
                );

        }


        return res.status(200).json({

            success: true,

            conversation

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Conversations
//
// GET /api/v1/messages/conversations
// ======================================================

exports.getConversations = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            req.user.userId;


        const conversations =
            await Conversation.find({

                participants: userId,

                isActive: true

            })
            .populate(
                "participants",
                userFields
            )
            .populate({
                path: "lastMessage",
                populate: [
                    {
                        path: "sender",
                        select: userFields
                    },
                    {
                        path: "receiver",
                        select: userFields
                    }
                ]
            })
            .sort({
                lastMessageAt: -1,
                updatedAt: -1
            })
            .lean();


        const formatted =
            conversations.map(
                conversation => {

                    const unread =
                        conversation
                            .unreadCounts
                            ? conversation
                                .unreadCounts[
                                    userId.toString()
                                ] || 0
                            : 0;


                    const otherUser =
                        conversation
                            .participants
                            .find(
                                participant =>
                                    participant._id
                                        .toString() !==
                                    userId.toString()
                            );


                    return {

                        ...conversation,

                        unreadCount:
                            unread,

                        otherUser:
                            otherUser || null

                    };

                }
            );


        return res.status(200).json({

            success: true,

            count:
                formatted.length,

            conversations:
                formatted

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Single Conversation
//
// GET /api/v1/messages/conversations/:id
// ======================================================

exports.getConversation = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (!isValidId(id)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid conversation ID."
            });

        }


        const conversation =
            await Conversation.findOne({

                _id: id,

                participants:
                    req.user.userId,

                isActive: true

            })
            .populate(
                "participants",
                userFields
            )
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender",
                    select: userFields
                }
            });


        if (!conversation) {

            return res.status(404).json({
                success: false,
                message:
                    "Conversation not found."
            });

        }


        return res.status(200).json({

            success: true,

            conversation

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Messages
//
// GET /api/v1/messages/conversations/:id/messages
//
// ?page=1&limit=30
// ======================================================

exports.getMessages = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (!isValidId(id)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid conversation ID."
            });

        }


        const page =
            Math.max(
                parseInt(
                    req.query.page,
                    10
                ) || 1,
                1
            );


        const limit =
            Math.min(
                Math.max(
                    parseInt(
                        req.query.limit,
                        10
                    ) || 30,
                    1
                ),
                100
            );


        const conversation =
            await Conversation.findOne({

                _id: id,

                participants:
                    req.user.userId,

                isActive: true

            });


        if (!conversation) {

            return res.status(404).json({
                success: false,
                message:
                    "Conversation not found."
            });

        }


        const skip =
            (page - 1) * limit;


        const [
            messages,
            total
        ] = await Promise.all([

            Message.find({

                conversation: id

            })
            .populate(
                "sender",
                userFields
            )
            .populate(
                "receiver",
                userFields
            )
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(limit)
            .lean(),

            Message.countDocuments({

                conversation: id

            })

        ]);


        return res.status(200).json({

            success: true,

            messages:
                messages.reverse(),

            pagination: {

                currentPage:
                    page,

                totalPages:
                    Math.ceil(
                        total / limit
                    ),

                totalResults:
                    total,

                limit

            }

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Send Message
//
// POST /api/v1/messages/conversations/:id/messages
// ======================================================

exports.sendMessage = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        const {
            content = "",
            messageType = "TEXT",
            attachments = []
        } = req.body;


        // ======================================================
        // Validate Conversation ID
        // ======================================================

        if (!isValidId(id)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid conversation ID."

            });

        }


        // ======================================================
        // Find Conversation
        // ======================================================

        const conversation =
            await Conversation.findOne({

                _id: id,

                participants:
                    req.user.userId,

                isActive: true

            });


        if (!conversation) {

            return res.status(404).json({

                success: false,

                message:
                    "Conversation not found."

            });

        }


        // ======================================================
        // Validate Message
        // ======================================================

        if (
            !content.trim() &&
            (
                !Array.isArray(attachments) ||
                attachments.length === 0
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Message content or attachment is required."

            });

        }


        // ======================================================
        // Find Receiver
        // ======================================================

        const receiver =
            conversation.participants.find(
                participant =>
                    participant.toString() !==
                    req.user.userId.toString()
            );


        if (!receiver) {

            return res.status(400).json({

                success: false,

                message:
                    "Receiver not found."

            });

        }


        const receiverId =
            receiver.toString();


        const senderId =
            req.user.userId.toString();


        // ======================================================
        // Create Message
        // ======================================================

        const message =
            await Message.create({

                conversation:
                    conversation._id,

                sender:
                    senderId,

                receiver:
                    receiverId,

                content:
                    content.trim(),

                messageType,

                attachments:
                    Array.isArray(attachments)
                        ? attachments
                        : []

            });


        // ======================================================
        // Update Unread Count
        // ======================================================

        const currentUnread =
            conversation.unreadCounts?.get(
                receiverId
            ) || 0;


        conversation.unreadCounts.set(
            receiverId,
            currentUnread + 1
        );


        // ======================================================
        // Update Last Message
        // ======================================================

        conversation.lastMessage =
            message._id;


        conversation.lastMessageAt =
            message.createdAt;


        await conversation.save();


        // ======================================================
        // Populate Message
        // ======================================================

        const populatedMessage =
            await Message.findById(
                message._id
            )
            .populate(
                "sender",
                userFields
            )
            .populate(
                "receiver",
                userFields
            );


        // ======================================================
        // REAL-TIME SOCKET
        // ======================================================

        const io =
            req.app.get("io");


        if (io) {

            // --------------------------------------
            // Send to receiver's socket room
            // --------------------------------------

            io.to(
                `user:${receiverId}`
            ).emit(
                "new_message",
                populatedMessage
            );


            // --------------------------------------
            // Confirm to sender
            // --------------------------------------

            io.to(
                `user:${senderId}`
            ).emit(
                "message_sent",
                populatedMessage
            );

        }


        // ======================================================
        // Response
        // ======================================================

        return res.status(201).json({

            success: true,

            message:
                populatedMessage

        });


    } catch (error) {

        next(error);

    }

};
// ======================================================
// Mark Conversation Read
//
// PATCH /api/v1/messages/conversations/:id/read
// ======================================================

exports.markAsRead = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (!isValidId(id)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid conversation ID."
            });

        }


        const conversation =
            await Conversation.findOne({

                _id: id,

                participants:
                    req.user.userId,

                isActive: true

            });


        if (!conversation) {

            return res.status(404).json({
                success: false,
                message:
                    "Conversation not found."
            });

        }


        await Message.updateMany(

            {
                conversation: id,

                receiver:
                    req.user.userId,

                isRead: false

            },

            {
                $set: {

                    isRead: true,

                    readAt: new Date()

                }

            }

        );


        conversation
            .unreadCounts
            .set(
                req.user.userId.toString(),
                0
            );


        await conversation.save();


        // ==========================================
        // Notify Sender
        // ==========================================

        const io =
            req.app.get("io");


        if (io) {

            conversation
                .participants
                .forEach(
                    participant => {

                        const participantId =
                            participant.toString();


                        if (
                            participantId !==
                            req.user.userId.toString()
                        ) {

                            io.to(
                                `user:${participantId}`
                            ).emit(
                                "messages_read",
                                {
                                    conversationId:
                                        id,

                                    readBy:
                                        req.user.userId
                                }
                            );

                        }

                    }
                );

        }


        return res.status(200).json({

            success: true,

            message:
                "Messages marked as read."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Unread Count
//
// GET /api/v1/messages/unread-count
// ======================================================

exports.getUnreadCount = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            req.user.userId.toString();


        const conversations =
            await Conversation.find({

                participants:
                    req.user.userId,

                isActive: true

            }).lean();


        let unreadCount = 0;


        conversations.forEach(
            conversation => {

                unreadCount +=
                    conversation
                        .unreadCounts
                        ? conversation
                            .unreadCounts[
                                userId
                            ] || 0
                        : 0;

            }
        );


        return res.status(200).json({

            success: true,

            unreadCount

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Message
//
// DELETE /api/v1/messages/:messageId
// ======================================================

exports.deleteMessage = async (
    req,
    res,
    next
) => {

    try {

        const {
            messageId
        } = req.params;


        if (!isValidId(messageId)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid message ID."
            });

        }


        const message =
            await Message.findById(
                messageId
            );


        if (!message) {

            return res.status(404).json({
                success: false,
                message:
                    "Message not found."
            });

        }


        if (
            message.sender.toString() !==
            req.user.userId.toString()
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "You can only delete your own messages."
            });

        }


        message.isDeleted =
            true;

        message.deletedAt =
            new Date();

        message.content =
            "";

        message.attachments =
            [];


        await message.save();


        const io =
            req.app.get("io");


        if (io) {

            const conversation =
                await Conversation.findById(
                    message.conversation
                );


            if (conversation) {

                conversation
                    .participants
                    .forEach(
                        participant => {

                            io.to(
                                `user:${participant.toString()}`
                            ).emit(
                                "message_deleted",
                                {
                                    messageId:
                                        message._id,

                                    conversationId:
                                        message.conversation
                                }
                            );

                        }
                    );

            }

        }


        return res.status(200).json({

            success: true,

            message:
                "Message deleted successfully."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete / Close Conversation
//
// DELETE /api/v1/messages/conversations/:id
// ======================================================

exports.deleteConversation = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (!isValidId(id)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid conversation ID."
            });

        }


        const conversation =
            await Conversation.findOne({

                _id: id,

                participants:
                    req.user.userId

            });


        if (!conversation) {

            return res.status(404).json({
                success: false,
                message:
                    "Conversation not found."
            });

        }


        conversation.isActive =
            false;


        await conversation.save();


        return res.status(200).json({

            success: true,

            message:
                "Conversation deleted successfully."

        });

    } catch (error) {

        next(error);

    }

};