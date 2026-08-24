const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
{
    // ==========================================
    // Post
    // ==========================================
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
        index: true
    },

    // ==========================================
    // Author
    // ==========================================
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // ==========================================
    // Parent Comment
    // null = Normal Comment
    // ObjectId = Reply
    // ==========================================
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },

    // ==========================================
    // Content
    // ==========================================
    content: {
        type: String,
        required: [true, "Comment cannot be empty."],
        trim: true,
        maxlength: 1000
    },

    // ==========================================
    // Likes
    // ==========================================
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    // ==========================================
    // Replies Count
    // ==========================================
    repliesCount: {
        type: Number,
        default: 0
    },

    // ==========================================
    // Status
    // ==========================================
    status: {
        type: String,
        enum: [
            "ACTIVE",
            "HIDDEN",
            "DELETED"
        ],
        default: "ACTIVE"
    }

},
{
    timestamps: true
});

// ==========================================
// Virtual Like Count
// ==========================================
CommentSchema.virtual("likesCount").get(function () {

    return this.likes.length;

});

// ==========================================
// JSON Settings
// ==========================================
CommentSchema.set("toJSON", {
    virtuals: true
});

CommentSchema.set("toObject", {
    virtuals: true
});

// ==========================================
// Indexes
// ==========================================

// Comments by Post
CommentSchema.index({
    post: 1,
    createdAt: -1
});

// Replies
CommentSchema.index({
    parentComment: 1
});

// User Comments
CommentSchema.index({
    author: 1
});

module.exports = mongoose.model(
    "Comment",
    CommentSchema
);