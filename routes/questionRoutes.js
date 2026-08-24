const express = require("express");

const router = express.Router();

const {
    createQuestion,
    getQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion,
    toggleUpvote,
    getMyQuestions
} = require("../controllers/questionController");

const {
    protect,
    optionalAuth
} = require("../middleware/authMiddleware");


// ======================================================
// PUBLIC / OPTIONAL AUTH
// ======================================================

// Get all questions
// GET /api/v1/questions

router.get(
    "/",
    optionalAuth,
    getQuestions
);


// Get single question
// GET /api/v1/questions/:id

router.get(
    "/:id",
    optionalAuth,
    getQuestion
);


// ======================================================
// PRIVATE
// ======================================================

// Create question
// POST /api/v1/questions

router.post(
    "/",
    protect,
    createQuestion
);


// My questions
// GET /api/v1/questions/my

router.get(
    "/my",
    protect,
    getMyQuestions
);


// Update question
// PUT /api/v1/questions/:id

router.put(
    "/:id",
    protect,
    updateQuestion
);


// Delete question
// DELETE /api/v1/questions/:id

router.delete(
    "/:id",
    protect,
    deleteQuestion
);


// Upvote / Remove upvote
// PUT /api/v1/questions/:id/upvote

router.put(
    "/:id/upvote",
    protect,
    toggleUpvote
);


module.exports = router;