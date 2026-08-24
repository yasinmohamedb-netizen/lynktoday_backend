const mongoose = require("mongoose");

const Comment = require("../models/Comment");
const Post = require("../models/Post");

const createNotification =
    require("../utils/notificationHelper");


const authorFields =
    "fullName profession companyName designation location profileImage isVerified headline";


// ======================================================
// @desc    Create Comment / Answer
// @route   POST /api/v1/comments/:postId
// @access  Private
// ======================================================

exports.createComment = async (
    req,
    res,
    next
) => {

    try {

        const {
            content
        } = req.body;


        if (
            !content ||
            !content.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Comment cannot be empty."

            });

        }


        const post =
            await Post.findById(
                req.params.postId
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        if (
            post.status !== "ACTIVE"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This post is not available."

            });

        }


        if (post.isLocked) {

            return res.status(400).json({

                success: false,

                message:
                    "This post is locked. New comments or answers are not allowed."

            });

        }


        // ==========================================
        // Create Comment / Answer
        // ==========================================

        const comment =
            await Comment.create({

                post:
                    post._id,

                author:
                    req.user.userId,

                content:
                    content.trim()

            });


        // ==========================================
        // Increase Count
        // ==========================================

        await Post.findByIdAndUpdate(

            post._id,

            {
                $inc: {
                    commentCount: 1
                }
            }

        );


        // ==========================================
        // Notification
        // ==========================================

        if (
            post.author.toString() !==
            req.user.userId
        ) {

            await createNotification({

                receiver:
                    post.author,

                sender:
                    req.user.userId,

                type:
                    post.postType === "QUESTION"
                        ? "ANSWER_POST"
                        : "COMMENT_POST",

                post:
                    post._id,

                comment:
                    comment._id,

                message:
                    post.postType === "QUESTION"
                        ? "answered your question."
                        : "commented on your post."

            });

        }


        const populatedComment =
            await Comment.findById(
                comment._id
            )
            .populate(
                "author",
                authorFields
            );


        return res.status(201).json({

            success: true,

            message:
                post.postType === "QUESTION"
                    ? "Answer added successfully."
                    : "Comment added successfully.",

            comment:
                populatedComment

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Get Comments / Answers
// @route   GET /api/v1/comments/:postId
// @access  Public
// ======================================================

exports.getComments = async (
    req,
    res,
    next
) => {

    try {

        const post =
            await Post.findById(
                req.params.postId
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        const comments =
            await Comment.find({

                post:
                    req.params.postId,

                parentComment:
                    null,

                status:
                    "ACTIVE"

            })

            .populate(
                "author",
                authorFields
            )

            .sort({
                createdAt: -1
            });


        const currentUserId =
            req.user?.userId
                ? req.user.userId.toString()
                : null;


        const formattedComments =
            comments.map(comment => {

                const data =
                    comment.toJSON();


                data.isLiked =
                    currentUserId
                        ? comment.likes.some(
                            id =>
                                id.toString() ===
                                currentUserId
                        )
                        : false;


                data.isAccepted =
                    post.acceptedAnswer &&
                    post.acceptedAnswer.toString() ===
                    comment._id.toString();


                data.isOwner =
                    currentUserId
                        ? comment.author._id.toString() ===
                          currentUserId
                        : false;


                return data;

            });


        return res.status(200).json({

            success: true,

            postType:
                post.postType,

            isQuestion:
                post.postType === "QUESTION",

            isSolved:
                post.isSolved,

            acceptedAnswer:
                post.acceptedAnswer,

            count:
                formattedComments.length,

            comments:
                formattedComments

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Update Comment / Answer
// @route   PUT /api/v1/comments/:commentId
// @access  Private
// ======================================================

exports.updateComment = async (
    req,
    res,
    next
) => {

    try {

        const {
            content
        } = req.body;


        if (
            !content ||
            !content.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Comment content is required."

            });

        }


        const comment =
            await Comment.findById(
                req.params.commentId
            );


        if (
            !comment ||
            comment.status !== "ACTIVE"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Comment not found."

            });

        }


        if (
            comment.author.toString() !==
            req.user.userId
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Not authorized."

            });

        }


        const post =
            await Post.findById(
                comment.post
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        if (post.isLocked) {

            return res.status(400).json({

                success: false,

                message:
                    "This post is locked."

            });

        }


        comment.content =
            content.trim();


        await comment.save();


        const updatedComment =
            await Comment.findById(
                comment._id
            )
            .populate(
                "author",
                authorFields
            );


        return res.status(200).json({

            success: true,

            message:
                "Comment updated successfully.",

            comment:
                updatedComment

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Delete Comment / Answer
// @route   DELETE /api/v1/comments/:commentId
// @access  Private
// ======================================================

exports.deleteComment = async (
    req,
    res,
    next
) => {

    try {

        const comment =
            await Comment.findById(
                req.params.commentId
            );


        if (!comment) {

            return res.status(404).json({

                success: false,

                message:
                    "Comment not found."

            });

        }


        if (

            comment.author.toString() !==
            req.user.userId &&

            req.user.role !== "admin"

        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Not authorized."

            });

        }


        const post =
            await Post.findById(
                comment.post
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        // ==========================================
        // If Accepted Answer Is Deleted
        // ==========================================

        if (
            post.acceptedAnswer &&
            post.acceptedAnswer.toString() ===
            comment._id.toString()
        ) {

            post.acceptedAnswer = null;

            post.isSolved = false;

        }


        // ==========================================
        // Delete Replies
        // ==========================================

        const replyCount =
            await Comment.countDocuments({

                parentComment:
                    comment._id,

                status:
                    {
                        $ne:
                            "DELETED"
                    }

            });


        await Comment.updateMany(

            {
                $or: [

                    {
                        _id:
                            comment._id
                    },

                    {
                        parentComment:
                            comment._id
                    }

                ]

            },

            {
                $set: {
                    status:
                        "DELETED"
                }

            }

        );


        // ==========================================
        // Update Post Count
        // ==========================================

        const decrement =
            1 + replyCount;


        post.commentCount =
            Math.max(
                0,
                post.commentCount -
                decrement
            );


        await post.save();


        return res.status(200).json({

            success: true,

            message:
                "Comment deleted successfully."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Like / Unlike Comment / Answer
// @route   POST /api/v1/comments/:commentId/like
// @access  Private
// ======================================================

exports.toggleLike = async (
    req,
    res,
    next
) => {

    try {

        const comment =
            await Comment.findById(
                req.params.commentId
            );


        if (
            !comment ||
            comment.status !== "ACTIVE"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Comment not found."

            });

        }


        const post =
            await Post.findById(
                comment.post
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        const userId =
            req.user.userId;


        const alreadyLiked =
            comment.likes.some(

                id =>
                    id.toString() ===
                    userId

            );


        if (alreadyLiked) {

            comment.likes.pull(
                userId
            );

        } else {

            comment.likes.push(
                userId
            );

        }


        await comment.save();


        // ==========================================
        // Notification
        // ==========================================

        if (

            !alreadyLiked &&

            comment.author.toString() !==
            userId

        ) {

            await createNotification({

                receiver:
                    comment.author,

                sender:
                    userId,

                type:
                    "LIKE_COMMENT",

                post:
                    post._id,

                comment:
                    comment._id,

                message:
                    "liked your comment."

            });

        }


        return res.status(200).json({

            success: true,

            liked:
                !alreadyLiked,

            likes:
                comment.likes.length,

            message:
                alreadyLiked
                    ? "Comment unliked."
                    : "Comment liked."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Reply to Comment / Answer
// @route   POST /api/v1/comments/:commentId/reply
// @access  Private
// ======================================================

exports.replyComment = async (
    req,
    res,
    next
) => {

    try {

        const {
            content
        } = req.body;


        if (
            !content ||
            !content.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Reply cannot be empty."

            });

        }


        const parent =
            await Comment.findById(
                req.params.commentId
            );


        if (
            !parent ||
            parent.status !== "ACTIVE"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Parent comment not found."

            });

        }


        const post =
            await Post.findById(
                parent.post
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        if (post.isLocked) {

            return res.status(400).json({

                success: false,

                message:
                    "This post is locked."

            });

        }


        const reply =
            await Comment.create({

                post:
                    parent.post,

                author:
                    req.user.userId,

                parentComment:
                    parent._id,

                content:
                    content.trim()

            });


        parent.repliesCount += 1;

        await parent.save();


        await Post.findByIdAndUpdate(

            parent.post,

            {
                $inc: {
                    commentCount: 1
                }
            }

        );


        // ==========================================
        // Notification
        // ==========================================

        if (
            parent.author.toString() !==
            req.user.userId
        ) {

            await createNotification({

                receiver:
                    parent.author,

                sender:
                    req.user.userId,

                type:
                    "REPLY_COMMENT",

                post:
                    post._id,

                comment:
                    reply._id,

                message:
                    "replied to your comment."

            });

        }


        const populatedReply =
            await Comment.findById(
                reply._id
            )
            .populate(
                "author",
                authorFields
            );


        return res.status(201).json({

            success: true,

            message:
                "Reply added successfully.",

            reply:
                populatedReply

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Get Replies
// @route   GET /api/v1/comments/:commentId/replies
// @access  Public
// ======================================================

exports.getReplies = async (
    req,
    res,
    next
) => {

    try {

        const replies =
            await Comment.find({

                parentComment:
                    req.params.commentId,

                status:
                    "ACTIVE"

            })

            .populate(
                "author",
                authorFields
            )

            .sort({
                createdAt: 1
            });


        const currentUserId =
            req.user?.userId
                ? req.user.userId.toString()
                : null;


        const formattedReplies =
            replies.map(reply => {

                const data =
                    reply.toJSON();


                data.isLiked =
                    currentUserId
                        ? reply.likes.some(
                            id =>
                                id.toString() ===
                                currentUserId
                        )
                        : false;


                data.isOwner =
                    currentUserId
                        ? reply.author._id.toString() ===
                          currentUserId
                        : false;


                return data;

            });


        return res.status(200).json({

            success: true,

            count:
                formattedReplies.length,

            replies:
                formattedReplies

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// @desc    Accept Answer
// @route   POST /api/v1/comments/:commentId/accept
// @access  Private
// ======================================================

exports.acceptAnswer = async (
    req,
    res,
    next
) => {

    try {

        const answer =
            await Comment.findById(
                req.params.commentId
            );


        if (
            !answer ||
            answer.status !== "ACTIVE"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Answer not found."

            });

        }


        const post =
            await Post.findById(
                answer.post
            );


        if (!post) {

            return res.status(404).json({

                success: false,

                message:
                    "Post not found."

            });

        }


        // ==========================================
        // Must Be Question
        // ==========================================

        if (
            post.postType !==
            "QUESTION"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This post is not a question."

            });

        }


        // ==========================================
        // Only Question Author
        // ==========================================

        if (
            post.author.toString() !==
            req.user.userId
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Only the question author can accept an answer."

            });

        }


        // ==========================================
        // Answer Must Be Direct Answer
        // ==========================================

        if (
            answer.parentComment
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A reply cannot be accepted as the answer."

            });

        }


        // ==========================================
        // Toggle Accepted Answer
        // ==========================================

        if (
            post.acceptedAnswer &&
            post.acceptedAnswer.toString() ===
            answer._id.toString()
        ) {

            post.acceptedAnswer = null;

            post.isSolved = false;

            await post.save();


            return res.status(200).json({

                success: true,

                status:
                    "UNACCEPTED",

                message:
                    "Answer unaccepted.",

                postId:
                    post._id

            });

        }


        post.acceptedAnswer =
            answer._id;

        post.isSolved =
            true;


        await post.save();


        // ==========================================
        // Notify Answer Author
        // ==========================================

        if (
            answer.author.toString() !==
            req.user.userId
        ) {

            await createNotification({

                receiver:
                    answer.author,

                sender:
                    req.user.userId,

                type:
                    "ACCEPTED_ANSWER",

                post:
                    post._id,

                comment:
                    answer._id,

                message:
                    "Your answer was accepted."

            });

        }


        return res.status(200).json({

            success: true,

            status:
                "ACCEPTED",

            message:
                "Answer accepted successfully.",

            postId:
                post._id,

            acceptedAnswer:
                answer._id,

            isSolved:
                true

        });

    } catch (error) {

        next(error);

    }

};