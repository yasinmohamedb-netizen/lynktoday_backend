const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
    {
        // ==========================================
        // AUTHOR
        // ==========================================

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ==========================================
        // POST INFORMATION
        // ==========================================

        title: {
            type: String,
            required: [true, "Post title is required."],
            trim: true,
            maxlength: 200
        },

        content: {
            type: String,
            required: [true, "Post content is required."],
            trim: true,
            maxlength: 5000
        },

        // ==========================================
        // POST TYPE
        // ==========================================

        postType: {
            type: String,
            enum: [
                "QUESTION",
                "DISCUSSION",
                "NEWS",
                "CASE_STUDY",
                "JOB",
                "DOCUMENTATION",
                "ANNOUNCEMENT"
            ],
            default: "DISCUSSION"
        },

        // ==========================================
        // CATEGORY
        // ==========================================

        category: {
            type: String,
            enum: [
                "Sea Freight",
                "Air Freight",
                "Road Transport",
                "Rail Freight",
                "Customs",
                "Import",
                "Export",
                "DGFT",
                "GST",
                "FEMA",
                "HS Code",
                "Incoterms",
                "Container",
                "Documentation",
                "Warehousing",
                "Insurance",
                "Trade Finance",
                "Dangerous Goods",
                "General"
            ],
            default: "General"
        },

        // ==========================================
        // TAGS
        // ==========================================

        tags: [
            {
                type: String,
                trim: true,
                maxlength: 50
            }
        ],

        // ==========================================
        // MEDIA
        // ==========================================

        mediaUrls: [
            {
                type: String,
                trim: true
            }
        ],

        attachments: [
            {
                type: String,
                trim: true
            }
        ],

        // ==========================================
        // ENGAGEMENT
        // ==========================================

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        bookmarks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        views: {
            type: Number,
            default: 0,
            min: 0
        },

        commentCount: {
            type: Number,
            default: 0,
            min: 0
        },

        shareCount: {
            type: Number,
            default: 0,
            min: 0
        },

        // ==========================================
        // QUESTION FEATURES
        // ==========================================

        isSolved: {
            type: Boolean,
            default: false
        },

        acceptedAnswer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null
        },

        // ==========================================
        // SHARED POST
        // ==========================================

        sharedPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null
        },

        shareComment: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: ""
        },

        // ==========================================
        // VISIBILITY
        // ==========================================

        visibility: {
            type: String,
            enum: [
                "PUBLIC",
                "CONNECTIONS",
                "PRIVATE"
            ],
            default: "PUBLIC"
        },

        // ==========================================
        // ADMIN CONTROLS
        // ==========================================

        isPinned: {
            type: Boolean,
            default: false
        },

        isLocked: {
            type: Boolean,
            default: false
        },

        isFeatured: {
            type: Boolean,
            default: false
        },

        // ==========================================
        // STATUS
        // ==========================================

        status: {
            type: String,
            enum: [
                "ACTIVE",
                "HIDDEN",
                "ARCHIVED"
            ],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

// ======================================================
// INDEXES
// ======================================================

// ==========================================
// Author posts
// ==========================================

PostSchema.index({
    author: 1,
    createdAt: -1
});

// ==========================================
// Latest posts / feed
// ==========================================

PostSchema.index({
    createdAt: -1
});

// ==========================================
// Category filter
// ==========================================

PostSchema.index({
    category: 1
});

// ==========================================
// Post type filter
// ==========================================

PostSchema.index({
    postType: 1
});

// ==========================================
// Visibility filter
// ==========================================

PostSchema.index({
    visibility: 1
});

// ==========================================
// Status filter
// ==========================================

PostSchema.index({
    status: 1
});

// ==========================================
// Questions
// ==========================================

PostSchema.index({
    postType: 1,
    isSolved: 1,
    createdAt: -1
});

// ==========================================
// Pinned / Featured feed
// ==========================================

PostSchema.index({
    isPinned: -1,
    isFeatured: -1,
    createdAt: -1
});

// ==========================================
// Full text search
// ==========================================

PostSchema.index({
    title: "text",
    content: "text",
    tags: "text"
});

// ======================================================
// VIRTUAL FIELDS
// ======================================================

// ==========================================
// Likes Count
// ==========================================

PostSchema.virtual("likesCount").get(function () {
    return this.likes ? this.likes.length : 0;
});

// ==========================================
// Bookmarks Count
// ==========================================

PostSchema.virtual("bookmarksCount").get(function () {
    return this.bookmarks ? this.bookmarks.length : 0;
});

// ======================================================
// JSON TRANSFORMATION
// ======================================================

PostSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,

    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    }
});

PostSchema.set("toObject", {
    virtuals: true,
    versionKey: false
});

// ======================================================
// EXPORT
// ======================================================

module.exports = mongoose.model(
    "Post",
    PostSchema
);