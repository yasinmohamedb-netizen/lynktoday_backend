const express = require("express");

const router = express.Router();

const messageController =
    require("../controllers/messageController");

const {
    protect
} = require("../middleware/authMiddleware");


// ======================================================
// ALL MESSAGING ROUTES REQUIRE LOGIN
// ======================================================


// ======================================================
// CONVERSATIONS
// ======================================================


// ------------------------------------------------------
// Create or Get Conversation
//
// POST /api/v1/messages/conversations
//
// Body:
// {
//     "userId": "USER_ID"
// }
// ------------------------------------------------------

router.post(
    "/conversations",
    protect,
    messageController.createConversation
);


// ------------------------------------------------------
// Get All User Conversations
//
// GET /api/v1/messages/conversations
// ------------------------------------------------------

router.get(
    "/conversations",
    protect,
    messageController.getConversations
);


// ------------------------------------------------------
// Get Single Conversation
//
// GET /api/v1/messages/conversations/:id
// ------------------------------------------------------

router.get(
    "/conversations/:id",
    protect,
    messageController.getConversation
);


// ------------------------------------------------------
// Delete Conversation
//
// DELETE /api/v1/messages/conversations/:id
// ------------------------------------------------------

router.delete(
    "/conversations/:id",
    protect,
    messageController.deleteConversation
);


// ======================================================
// MESSAGES
// ======================================================


// ------------------------------------------------------
// Get Messages
//
// GET /api/v1/messages/conversations/:id/messages
//
// Query:
// ?page=1&limit=30
// ------------------------------------------------------

router.get(
    "/conversations/:id/messages",
    protect,
    messageController.getMessages
);


// ------------------------------------------------------
// Send Message
//
// POST /api/v1/messages/conversations/:id/messages
//
// Example:
// POST /api/v1/messages/conversations/CONVERSATION_ID/messages
// ------------------------------------------------------

router.post(
    "/conversations/:id/messages",
    protect,
    messageController.sendMessage
);


// ------------------------------------------------------
// Mark Messages As Read
//
// PATCH /api/v1/messages/conversations/:id/read
// ------------------------------------------------------

router.patch(
    "/conversations/:id/read",
    protect,
    messageController.markAsRead
);


// ------------------------------------------------------
// Delete Message
//
// DELETE /api/v1/messages/:messageId
// ------------------------------------------------------

router.delete(
    "/:messageId",
    protect,
    messageController.deleteMessage
);


// ======================================================
// UNREAD COUNT
// ======================================================


// ------------------------------------------------------
// Get Unread Message Count
//
// GET /api/v1/messages/unread-count
// ------------------------------------------------------

router.get(
    "/unread-count",
    protect,
    messageController.getUnreadCount
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;