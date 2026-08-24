const Post = require("../models/Post");
const Documentation = require("../models/Documentation");
const HSCode = require("../models/HSCode");

// ======================================================
// GET TRENDING TOPICS
// GET /api/v1/topics/trending
// Access: Public
// ======================================================

exports.getTrendingTopics = async (req, res, next) => {

    try {

        // ==================================================
        // 1. POST CATEGORIES
        // ==================================================

        const postCategories =
            await Post.aggregate([

                {
                    $match: {
                        status: "ACTIVE",
                        visibility: "PUBLIC"
                    }
                },

                {
                    $group: {
                        _id: "$category",
                        count: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        count: -1
                    }
                },

                {
                    $limit: 20
                }

            ]);


        // ==================================================
        // 2. DOCUMENT CATEGORIES
        // ==================================================

        const documentCategories =
            await Documentation.aggregate([

                {
                    $match: {
                        isActive: true
                    }
                },

                {
                    $group: {
                        _id: "$category",
                        count: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        count: -1
                    }
                },

                {
                    $limit: 20
                }

            ]);


        // ==================================================
        // 3. POST TAGS
        // ==================================================

        const postTags =
            await Post.aggregate([

                {
                    $match: {
                        status: "ACTIVE",
                        visibility: "PUBLIC"
                    }
                },

                {
                    $unwind: "$tags"
                },

                {
                    $group: {
                        _id: "$tags",
                        count: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        count: -1
                    }
                },

                {
                    $limit: 30
                }

            ]);


        // ==================================================
        // 4. DOCUMENT TAGS
        // ==================================================

        const documentTags =
            await Documentation.aggregate([

                {
                    $match: {
                        isActive: true
                    }
                },

                {
                    $unwind: "$tags"
                },

                {
                    $group: {
                        _id: "$tags",
                        count: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        count: -1
                    }
                },

                {
                    $limit: 30
                }

            ]);


        // ==================================================
        // COMBINE TOPICS
        // ==================================================

        const topicMap = new Map();


        const addTopic = (
            name,
            count,
            type
        ) => {

            if (!name) {
                return;
            }

            const cleanName =
                String(name)
                    .trim();

            if (!cleanName) {
                return;
            }

            const key =
                cleanName.toLowerCase();


            if (!topicMap.has(key)) {

                topicMap.set(
                    key,
                    {
                        name: cleanName,
                        slug: createSlug(cleanName),
                        score: 0,
                        sources: {
                            posts: 0,
                            documents: 0
                        }
                    }
                );

            }


            const topic =
                topicMap.get(key);


            topic.score += count;


            if (type === "post") {

                topic.sources.posts += count;

            }


            if (type === "document") {

                topic.sources.documents += count;

            }

        };


        // Add categories

        postCategories.forEach(item => {

            addTopic(
                item._id,
                item.count,
                "post"
            );

        });


        documentCategories.forEach(item => {

            addTopic(
                item._id,
                item.count,
                "document"
            );

        });


        // Add post tags

        postTags.forEach(item => {

            addTopic(
                item._id,
                item.count,
                "post"
            );

        });


        // Add document tags

        documentTags.forEach(item => {

            addTopic(
                item._id,
                item.count,
                "document"
            );

        });


        // ==================================================
        // SORT
        // ==================================================

        const topics =
            Array.from(
                topicMap.values()
            )
            .sort(
                (a, b) =>
                    b.score - a.score
            )
            .slice(0, 10);


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            success: true,

            count: topics.length,

            topics

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// GET TOPIC CONTENT
// GET /api/v1/topics/:slug
// Access: Public
// ======================================================

exports.getTopicContent = async (
    req,
    res,
    next
) => {

    try {

        const slug =
            req.params.slug
                .trim()
                .toLowerCase();


        if (!slug) {

            return res.status(400).json({

                success: false,

                message:
                    "Topic is required."

            });

        }


        const topicName =
            slug
                .replace(/-/g, " ");


        // ==================================================
        // POSTS
        // ==================================================

        const posts =
            await Post.find({

                status: "ACTIVE",

                visibility: "PUBLIC",

                $or: [

                    {
                        category:
                            new RegExp(
                                `^${escapeRegex(topicName)}$`,
                                "i"
                            )
                    },

                    {
                        tags: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        title: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        content: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    }

                ]

            })

            .populate(
                "author",
                "fullName profileImage profession companyName designation"
            )

            .sort({
                createdAt: -1
            })

            .limit(20);


        // ==================================================
        // DOCUMENTS
        // ==================================================

        const documents =
            await Documentation.find({

                isActive: true,

                $or: [

                    {
                        category:
                            new RegExp(
                                `^${escapeRegex(topicName)}$`,
                                "i"
                            )
                    },

                    {
                        tags: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        title: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        description: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        hsCode: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    }

                ]

            })

            .populate(
                "createdBy",
                "fullName profileImage profession companyName designation"
            )

            .sort({
                createdAt: -1
            })

            .limit(20);


        // ==================================================
        // HS CODES
        // ==================================================

        const hsCodes =
            await HSCode.find({

                isActive: true,

                $or: [

                    {
                        hsCode: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        description: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        chapter: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        heading: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        subHeading: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    },

                    {
                        keywords: {
                            $regex:
                                topicName,
                            $options: "i"
                        }
                    }

                ]

            })

            .sort({
                hsCode: 1
            })

            .limit(50);


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            success: true,

            topic: {
                name: topicName,
                slug
            },

            counts: {

                posts:
                    posts.length,

                documents:
                    documents.length,

                hsCodes:
                    hsCodes.length

            },

            posts,

            documents,

            hsCodes

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// HELPERS
// ======================================================

function createSlug(value) {

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

}


function escapeRegex(value) {

    return String(value)
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

}