const mongoose = require("mongoose");

const Post = require("../models/Post");
const Comment = require("../models/Comment");

const createNotification =
    require("../utils/notificationHelper");


// ======================================================
// HELPERS
// ======================================================

const authorFields =
    "fullName companyName profession designation profileImage location isVerified headline";


const isValidObjectId = (id) => {

    return mongoose.Types.ObjectId.isValid(id);

};


const getUserId = (req) => {

    return req.user?.userId
        ? req.user.userId.toString()
        : null;

};


const isAdmin = (req) => {

    return (
        req.user?.role === "admin" ||
        req.user?.role === "ADMIN"
    );

};


const populatePost = (query) => {

    return query

        .populate(
            "author",
            authorFields
        )

        .populate({
            path: "sharedPost",

            populate: {
                path: "author",
                select: authorFields
            }
        })

        .populate({
            path: "acceptedAnswer",

            populate: {
                path: "author",
                select: authorFields
            }
        });

};


// ======================================================
// FORMAT POST
// ======================================================

const formatPost = (
    post,
    currentUserId = null
) => {

    const data =
        post.toJSON
            ? post.toJSON()
            : post;


    const likes =
        post.likes || [];


    const bookmarks =
        post.bookmarks || [];


    data.likesCount =
        likes.length;


    data.bookmarksCount =
        bookmarks.length;


    data.isLiked =
        currentUserId
            ? likes.some(
                id =>
                    id.toString() ===
                    currentUserId
            )
            : false;


    data.isBookmarked =
        currentUserId
            ? bookmarks.some(
                id =>
                    id.toString() ===
                    currentUserId
            )
            : false;


    const authorId =
        post.author?._id
            ? post.author._id.toString()
            : post.author?.toString();


    data.isOwner =
        currentUserId &&
        authorId
            ? authorId === currentUserId
            : false;


    return data;

};


// ======================================================
// @desc    Create Post
// @route   POST /api/v1/posts
// @access  Private
// ======================================================

exports.createPost = async (
    req,
    res,
    next
) => {

    try {

        const {

            title,

            content,

            postType,

            category,

            tags,

            attachments,

            visibility

        } = req.body;


        // ==================================================
        // Validate title
        // ==================================================

        if (
            !title ||
            typeof title !== "string" ||
            !title.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Post title is required."

            });

        }


        // ==================================================
        // Validate content
        // ==================================================

        if (
            !content ||
            typeof content !== "string" ||
            !content.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Post content is required."

            });

        }


        // ==================================================
        // Media URLs
        // ==================================================

        let mediaUrls = [];


        if (req.body.mediaUrls) {

            mediaUrls =
                Array.isArray(
                    req.body.mediaUrls
                )
                    ? req.body.mediaUrls
                    : [
                        req.body.mediaUrls
                    ];

        }


        // ==================================================
        // Uploaded File
        // ==================================================

        if (req.file) {

            mediaUrls.push(

                `${req.protocol}://${req.get(
                    "host"
                )}/uploads/${req.file.filename}`

            );

        }


        // ==================================================
        // Tags
        // ==================================================

        let parsedTags = [];


        if (tags) {

            parsedTags =
                Array.isArray(tags)
                    ? tags
                    : [tags];

        }


        parsedTags =
            parsedTags

                .filter(
                    tag =>
                        typeof tag === "string"
                )

                .map(
                    tag =>
                        tag.trim()
                )

                .filter(
                    tag =>
                        tag.length > 0
                );


        // ==================================================
        // Attachments
        // ==================================================

        let parsedAttachments = [];


        if (attachments) {

            parsedAttachments =
                Array.isArray(
                    attachments
                )
                    ? attachments
                    : [attachments];

        }


        parsedAttachments =
            parsedAttachments.filter(
                item =>
                    typeof item === "string" &&
                    item.trim().length > 0
            );


        // ==================================================
        // Create Post
        // ==================================================

        const post =
            await Post.create({

                author:
                    req.user.userId,

                title:
                    title.trim(),

                content:
                    content.trim(),

                postType:
                    postType ||
                    "DISCUSSION",

                category:
                    category ||
                    "General",

                tags:
                    parsedTags,

                mediaUrls:
                    mediaUrls,

                attachments:
                    parsedAttachments,

                visibility:
                    visibility ||
                    "PUBLIC"

            });


        // ==================================================
        // Populate
        // ==================================================

        const populatedPost =
            await populatePost(

                Post.findById(
                    post._id
                )

            );


        return res.status(201).json({

            success: true,

            message:
                post.postType === "QUESTION"
                    ? "Question created successfully."
                    : "Post created successfully.",

            post:
                populatedPost

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Community Feed / Search / Filters
// @route   GET /api/v1/posts
// @access  Public
// ======================================================

exports.getFeed = async (
    req,
    res,
    next
) => {

    try {

        const {

            search,

            category,

            postType,

            tag,

            solved,

            author,

            page = 1,

            limit = 10

        } = req.query;


        const pageNumber =
            Math.max(
                parseInt(page, 10) || 1,
                1
            );


        const limitNumber =
            Math.min(
                Math.max(
                    parseInt(limit, 10) || 10,
                    1
                ),
                100
            );


        const filter = {

            status:
                "ACTIVE"

        };


        // ==================================================
        // Category
        // ==================================================

        if (category) {

            filter.category =
                category.trim();

        }


        // ==================================================
        // Post Type
        // ==================================================

        if (postType) {

            filter.postType =
                postType.trim();

        }


        // ==================================================
        // Tag
        // ==================================================

        if (tag) {

            filter.tags =
                tag.trim();

        }


        // ==================================================
        // Author
        // ==================================================

        if (author) {

            if (
                !isValidObjectId(
                    author
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid author ID."

                });

            }


            filter.author =
                author;

        }


        // ==================================================
        // Solved Filter
        // ==================================================

        if (
            solved !== undefined
        ) {

            if (
                solved === "true" ||
                solved === "false"
            ) {

                filter.isSolved =
                    solved === "true";

            }

        }


        // ==================================================
        // Text Search
        // ==================================================

        if (
            search &&
            search.trim()
        ) {

            filter.$text = {

                $search:
                    search.trim()

            };

        }


        // ==================================================
        // Pagination
        // ==================================================

        const skip =
            (pageNumber - 1) *
            limitNumber;


        const postsQuery =
            Post.find(filter)

                .sort({

                    isPinned: -1,

                    isFeatured: -1,

                    createdAt: -1

                })

                .skip(skip)

                .limit(limitNumber);


        const [
            posts,
            totalPosts
        ] = await Promise.all([

            populatePost(
                postsQuery
            ),

            Post.countDocuments(
                filter
            )

        ]);


        // ==================================================
        // Current User
        // ==================================================

        const currentUserId =
            getUserId(req);


        // ==================================================
        // Format
        // ==================================================

        const formattedPosts =
            posts.map(

                post =>
                    formatPost(
                        post,
                        currentUserId
                    )

            );


        return res.status(200).json({

            success: true,

            count:
                formattedPosts.length,

            pagination: {

                currentPage:
                    pageNumber,

                totalPages:
                    Math.ceil(
                        totalPosts /
                        limitNumber
                    ),

                totalResults:
                    totalPosts,

                limit:
                    limitNumber

            },

            posts:
                formattedPosts

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Get Single Post
// @route   GET /api/v1/posts/:id
// @access  Public
// ======================================================

exports.getPost = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        const post =
            await populatePost(

                Post.findOne({

                    _id: id,

                    status:
                        "ACTIVE"

                })

            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        // ==================================================
        // Increment Views
        // ==================================================

        await Post.updateOne(

            {
                _id:
                    post._id
            },

            {
                $inc: {
                    views: 1
                }
            }

        );


        const currentUserId =
            getUserId(req);


        const data =
            formatPost(
                post,
                currentUserId
            );


        data.views =
            (post.views || 0) + 1;


        return res.status(200).json({

            success: true,

            post:
                data

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Update Post
// @route   PUT /api/v1/posts/:id
// @access  Private
// ======================================================

exports.updatePost = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        const post =
            await Post.findById(
                id
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        const userId =
            getUserId(req);


        if (

            post.author.toString() !==
            userId &&

            !isAdmin(req)

        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to update this post."

            });

        }


        if (post.isLocked) {

            return res.status(400).json({

                success: false,

                message:
                    "This post is locked and cannot be updated."

            });

        }


        // ==================================================
        // Allowed Fields
        // ==================================================

        const allowedFields = [

            "title",

            "content",

            "category",

            "postType",

            "tags",

            "visibility"

        ];


        allowedFields.forEach(
            field => {

                if (
                    req.body[field] !==
                    undefined
                ) {

                    post[field] =
                        req.body[field];

                }

            }
        );


        // ==================================================
        // Validate Title
        // ==================================================

        if (
            !post.title ||
            !post.title.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Post title is required."

            });

        }


        // ==================================================
        // Validate Content
        // ==================================================

        if (
            !post.content ||
            !post.content.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Post content is required."

            });

        }


        post.title =
            post.title.trim();


        post.content =
            post.content.trim();


        // ==================================================
        // Normalize Tags
        // ==================================================

        if (
            req.body.tags !==
            undefined
        ) {

            const incomingTags =
                Array.isArray(
                    req.body.tags
                )
                    ? req.body.tags
                    : [req.body.tags];


            post.tags =
                incomingTags

                    .filter(
                        tag =>
                            typeof tag ===
                            "string"
                    )

                    .map(
                        tag =>
                            tag.trim()
                    )

                    .filter(
                        tag =>
                            tag.length > 0
                    );

        }


        // ==================================================
        // Uploaded File
        // ==================================================

        if (req.file) {

            const fileUrl =
                `${req.protocol}://${req.get(
                    "host"
                )}/uploads/${req.file.filename}`;


            if (
                !Array.isArray(
                    post.mediaUrls
                )
            ) {

                post.mediaUrls = [];

            }


            post.mediaUrls.push(
                fileUrl
            );

        }


        await post.save();


        const updatedPost =
            await populatePost(

                Post.findById(
                    post._id
                )

            );


        return res.status(200).json({

            success: true,

            message:
                "Post updated successfully.",

            post:
                updatedPost

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Get User Posts
// @route   GET /api/v1/posts/user/:userId/posts
// @access  Public
// ======================================================

exports.getUserPosts = async (
    req,
    res,
    next
) => {

    try {

        const {
            userId
        } = req.params;


        if (
            !isValidObjectId(
                userId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid user ID."

            });

        }


        const posts =
            await populatePost(

                Post.find({

                    author:
                        userId,

                    status:
                        "ACTIVE"

                })

                    .sort({

                        createdAt:
                            -1

                    })

            );


        const currentUserId =
            getUserId(req);


        const formattedPosts =
            posts.map(

                post =>
                    formatPost(
                        post,
                        currentUserId
                    )

            );


        return res.status(200).json({

            success: true,

            count:
                formattedPosts.length,

            posts:
                formattedPosts

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Delete Post
// @route   DELETE /api/v1/posts/:id
// @access  Private
// ======================================================

exports.deletePost = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        const post =
            await Post.findById(
                id
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        const userId =
            getUserId(req);


        if (

            post.author.toString() !==
            userId &&

            !isAdmin(req)

        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to delete this post."

            });

        }


        await post.deleteOne();


        return res.status(200).json({

            success: true,

            message:
                "Post deleted successfully."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Like / Unlike Post
// @route   POST /api/v1/posts/:id/like
// @access  Private
// ======================================================

exports.toggleLike = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        const post =
            await Post.findOne({

                _id:
                    id,

                status:
                    "ACTIVE"

            });


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        const userId =
            getUserId(req);


        const alreadyLiked =
            post.likes.some(

                item =>
                    item.toString() ===
                    userId

            );


        if (alreadyLiked) {

            post.likes.pull(
                userId
            );

        } else {

            post.likes.push(
                userId
            );

        }


        await post.save();


        // ==================================================
        // Notification
        // ==================================================

        if (

            !alreadyLiked &&

            post.author.toString() !==
            userId

        ) {

            try {

                await createNotification({

                    receiver:
                        post.author,

                    sender:
                        userId,

                    type:
                        "LIKE_POST",

                    post:
                        post._id,

                    message:
                        "liked your post."

                });

            } catch (
                notificationError
            ) {

                console.error(
                    "Like notification error:",
                    notificationError
                );

            }

        }


        return res.status(200).json({

            success: true,

            liked:
                !alreadyLiked,

            likes:
                post.likes.length,

            likesCount:
                post.likes.length,

            message:
                alreadyLiked
                    ? "Post unliked."
                    : "Post liked."

        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// GET POST LIKES
//
// GET /api/v1/posts/:id/likes
//
// Returns users who liked the post
// ======================================================

exports.getPostLikes = async (req, res, next) => {

    try {

        const Post =
            require("../models/Post");


        // ==================================================
        // FIND POST
        // ==================================================

        const post =
            await Post.findById(
                req.params.id
            ).populate({

                path: "likes",

                select:
                    "_id fullName companyName profession designation profileImage location isVerified"

            });


        // ==================================================
        // POST NOT FOUND
        // ==================================================

        if (!post) {

            return res.status(404).json({

                success: false,

                message: "Post not found."

            });

        }


        // ==================================================
        // RETURN LIKED USERS
        // ==================================================

        return res.status(200).json({

            success: true,

            users:
                Array.isArray(post.likes)
                    ? post.likes
                    : [],

            count:
                Array.isArray(post.likes)
                    ? post.likes.length
                    : 0

        });

    } catch (error) {

        console.error(
            "Get post likes error:",
            error
        );

        next(error);

    }

};


// ======================================================
// @desc    Bookmark / Remove Bookmark
// @route   POST /api/v1/posts/:id/bookmark
// @access  Private
// ======================================================

exports.toggleBookmark = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        const post =
            await Post.findOne({

                _id:
                    id,

                status:
                    "ACTIVE"

            });


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        const userId =
            getUserId(req);


        const alreadyBookmarked =
            post.bookmarks.some(

                item =>
                    item.toString() ===
                    userId

            );


        if (
            alreadyBookmarked
        ) {

            post.bookmarks.pull(
                userId
            );

        } else {

            post.bookmarks.push(
                userId
            );

        }


        await post.save();


        return res.status(200).json({

            success: true,

            bookmarked:
                !alreadyBookmarked,

            bookmarks:
                post.bookmarks.length,

            bookmarksCount:
                post.bookmarks.length,

            message:
                alreadyBookmarked
                    ? "Bookmark removed."
                    : "Post bookmarked."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Get Saved Posts
// @route   GET /api/v1/posts/saved
// @access  Private
// ======================================================

exports.getSavedPosts = async (
    req,
    res,
    next
) => {

    try {

        const posts =
            await populatePost(

                Post.find({

                    bookmarks:
                        getUserId(req),

                    status:
                        "ACTIVE"

                })

                    .sort({

                        createdAt:
                            -1

                    })

            );


        const currentUserId =
            getUserId(req);


        const formattedPosts =
            posts.map(

                post =>
                    formatPost(
                        post,
                        currentUserId
                    )

            );


        return res.status(200).json({

            success: true,

            count:
                formattedPosts.length,

            posts:
                formattedPosts

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Accept Answer
// @route   PUT /api/v1/posts/:id/accept-answer/:commentId
// @access  Private
// ======================================================

exports.acceptAnswer = async (
    req,
    res,
    next
) => {

    try {

        const {
            id,
            commentId
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        if (
            !isValidObjectId(
                commentId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid answer ID."

            });

        }


        const post =
            await Post.findById(
                id
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        // ==================================================
        // Question Only
        // ==================================================

        if (
            post.postType !==
            "QUESTION"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Only questions can have an accepted answer."

            });

        }


        // ==================================================
        // Owner Only
        // ==================================================

        if (
            post.author.toString() !==
            getUserId(req)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Only the question owner can accept an answer."

            });

        }


        // ==================================================
        // Existing Accepted Answer
        // ==================================================

        if (
            post.isSolved &&
            post.acceptedAnswer
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This question already has an accepted answer."

            });

        }


        // ==================================================
        // Find Answer
        // ==================================================

        const comment =
            await Comment.findOne({

                _id:
                    commentId,

                post:
                    id,

                parentComment:
                    null,

                status:
                    "ACTIVE"

            });


        if (!comment) {

            return res.status(404).json({

                success: false,

                message:
                    "Answer not found."

            });

        }


        // ==================================================
        // Accept Answer
        // ==================================================

        post.acceptedAnswer =
            comment._id;


        post.isSolved =
            true;


        await post.save();


        const updatedPost =
            await populatePost(

                Post.findById(
                    post._id
                )

            );


        return res.status(200).json({

            success: true,

            message:
                "Answer accepted successfully.",

            post:
                updatedPost

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Share Post
// @route   POST /api/v1/posts/:id/share
// @access  Private
// ======================================================

exports.sharePost = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        const originalPost =
            await Post.findOne({

                _id:
                    id,

                status:
                    "ACTIVE"

            });


        if (!originalPost) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        const {
            shareComment = ""
        } = req.body;


        if (
            typeof shareComment !==
            "string"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Share comment must be text."

            });

        }


        const sharedPost =
            await Post.create({

                author:
                    getUserId(req),

                title:
                    originalPost.title,

                content:
                    originalPost.content,

                postType:
                    originalPost.postType,

                category:
                    originalPost.category,

                tags:
                    originalPost.tags,

                mediaUrls:
                    originalPost.mediaUrls,

                attachments:
                    originalPost.attachments,

                sharedPost:
                    originalPost._id,

                shareComment:
                    shareComment.trim(),

                visibility:
                    "PUBLIC"

            });


        originalPost.shareCount =
            (originalPost.shareCount || 0) + 1;


        await originalPost.save();


        const populatedPost =
            await populatePost(

                Post.findById(
                    sharedPost._id
                )

            );


        return res.status(201).json({

            success: true,

            message:
                "Post shared successfully.",

            post:
                populatedPost

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Pin / Unpin
// @route   PATCH /api/v1/posts/:id/pin
// @access  Admin
// ======================================================

exports.togglePin = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        const post =
            await Post.findById(
                id
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        post.isPinned =
            !post.isPinned;


        await post.save();


        return res.status(200).json({

            success: true,

            isPinned:
                post.isPinned,

            message:
                post.isPinned
                    ? "Post pinned."
                    : "Post unpinned."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Feature / Unfeature
// @route   PATCH /api/v1/posts/:id/feature
// @access  Admin
// ======================================================

exports.toggleFeature = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        const post =
            await Post.findById(
                id
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        post.isFeatured =
            !post.isFeatured;


        await post.save();


        return res.status(200).json({

            success: true,

            isFeatured:
                post.isFeatured,

            message:
                post.isFeatured
                    ? "Post featured."
                    : "Feature removed."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Lock / Unlock
// @route   PATCH /api/v1/posts/:id/lock
// @access  Admin
// ======================================================

exports.toggleLock = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid post ID."

            });

        }


        const post =
            await Post.findById(
                id
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        post.isLocked =
            !post.isLocked;


        await post.save();


        return res.status(200).json({

            success: true,

            isLocked:
                post.isLocked,

            message:
                post.isLocked
                    ? "Post locked."
                    : "Post unlocked."

        });

    } catch (error) {

        next(error);

    }

};