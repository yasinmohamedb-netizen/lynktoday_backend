const express = require("express");

const router = express.Router();

const postController =
    require("../controllers/postController");

const {
    protect,
    optionalAuth,
    adminOnly
} = require("../middleware/authMiddleware");

const upload =
    require("../middleware/uploadMiddleware");


// ======================================================
// PUBLIC ROUTES
// ======================================================


// ======================================================
// Community Feed
//
// GET /api/v1/posts
//
// Supports:
// - Search
// - Category filtering
// - Post type filtering
// - Tag filtering
// - Solved filtering
// - Author filtering
// - Pagination
// ======================================================

router.get(
    "/",
    optionalAuth,
    postController.getFeed
);


// ======================================================
// Search Posts
//
// GET /api/v1/posts/search?search=cotton
// ======================================================

router.get(
    "/search",
    optionalAuth,
    postController.getFeed
);


// ======================================================
// User Posts
//
// GET /api/v1/posts/user/:userId/posts
// ======================================================

router.get(
    "/user/:userId/posts",
    optionalAuth,
    postController.getUserPosts
);


// ======================================================
// PROTECTED ROUTES
// ======================================================


// ======================================================
// Saved Posts
//
// GET /api/v1/posts/saved
// ======================================================

router.get(
    "/saved",
    protect,
    postController.getSavedPosts
);


// ======================================================
// POST LIKES
//
// GET /api/v1/posts/:id/likes
//
// IMPORTANT:
// This MUST come before /:id
// ======================================================

router.get(
    "/:id/likes",
    optionalAuth,
    postController.getPostLikes
);


// ======================================================
// Single Post
//
// GET /api/v1/posts/:id
// ======================================================

router.get(
    "/:id",
    optionalAuth,
    postController.getPost
);


// ======================================================
// CREATE POST / QUESTION
//
// POST /api/v1/posts
//
// postType can be:
// - DISCUSSION
// - QUESTION
// - etc.
// ======================================================

router.post(
    "/",
    protect,
    upload.single("file"),
    postController.createPost
);


// ======================================================
// UPDATE POST
//
// PUT /api/v1/posts/:id
// ======================================================

router.put(
    "/:id",
    protect,
    upload.single("file"),
    postController.updatePost
);


// ======================================================
// DELETE POST
//
// DELETE /api/v1/posts/:id
// ======================================================

router.delete(
    "/:id",
    protect,
    postController.deletePost
);


// ======================================================
// LIKE / UNLIKE
//
// POST /api/v1/posts/:id/like
// ======================================================

router.post(
    "/:id/like",
    protect,
    postController.toggleLike
);


// ======================================================
// BOOKMARK / REMOVE BOOKMARK
//
// POST /api/v1/posts/:id/bookmark
// ======================================================

router.post(
    "/:id/bookmark",
    protect,
    postController.toggleBookmark
);


// ======================================================
// SHARE POST
//
// POST /api/v1/posts/:id/share
// ======================================================

router.post(
    "/:id/share",
    protect,
    postController.sharePost
);


// ======================================================
// ACCEPT ANSWER
//
// PUT /api/v1/posts/:id/accept-answer/:commentId
//
// Only the question owner can accept an answer.
// ======================================================

router.put(
    "/:id/accept-answer/:commentId",
    protect,
    postController.acceptAnswer
);


// ======================================================
// ADMIN ROUTES
// ======================================================


// ======================================================
// PIN / UNPIN
//
// PATCH /api/v1/posts/:id/pin
// ======================================================

router.patch(
    "/:id/pin",
    protect,
    adminOnly,
    postController.togglePin
);


// ======================================================
// FEATURE / UNFEATURE
//
// PATCH /api/v1/posts/:id/feature
// ======================================================

router.patch(
    "/:id/feature",
    protect,
    adminOnly,
    postController.toggleFeature
);


// ======================================================
// LOCK / UNLOCK
//
// PATCH /api/v1/posts/:id/lock
// ======================================================

router.patch(
    "/:id/lock",
    protect,
    adminOnly,
    postController.toggleLock
);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;