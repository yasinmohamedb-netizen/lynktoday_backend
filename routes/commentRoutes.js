const express = require("express");

const router =
    express.Router();


const commentController =
    require("../controllers/commentController");


const {
    protect,
    optionalAuth
} = require("../middleware/authMiddleware");


// ======================================================
// Public Routes
// ======================================================


// ==========================================
// Get Comments / Answers
// ==========================================

router.get(
    "/:postId",
    optionalAuth,
    commentController.getComments
);


// ==========================================
// Get Replies
// ==========================================

router.get(
    "/:commentId/replies",
    optionalAuth,
    commentController.getReplies
);


// ======================================================
// Protected Routes
// ======================================================


// ==========================================
// Create Comment / Answer
// ==========================================

router.post(
    "/:postId",
    protect,
    commentController.createComment
);


// ==========================================
// Update Comment / Answer
// ==========================================

router.put(
    "/:commentId",
    protect,
    commentController.updateComment
);


// ==========================================
// Delete Comment / Answer
// ==========================================

router.delete(
    "/:commentId",
    protect,
    commentController.deleteComment
);


// ==========================================
// Like / Unlike Comment / Answer
// ==========================================

router.post(
    "/:commentId/like",
    protect,
    commentController.toggleLike
);


// ==========================================
// Reply
// ==========================================

router.post(
    "/:commentId/reply",
    protect,
    commentController.replyComment
);


// ==========================================
// Accept Answer
// ==========================================

router.post(
    "/:commentId/accept",
    protect,
    commentController.acceptAnswer
);


module.exports = router;