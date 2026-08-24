const express = require("express");

const router = express.Router();

const topicController =
    require("../controllers/topicController");

// ======================================================
// Trending Topics
// GET /api/v1/topics/trending
// ======================================================

router.get(
    "/trending",
    topicController.getTrendingTopics
);

// ======================================================
// Topic Content
// GET /api/v1/topics/:slug
// ======================================================

router.get(
    "/:slug",
    topicController.getTopicContent
);

module.exports = router;