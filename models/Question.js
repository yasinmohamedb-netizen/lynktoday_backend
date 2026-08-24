const mongoose = require("mongoose");


// ======================================================
// Question Schema
// ======================================================

const QuestionSchema = new mongoose.Schema(
    {

        // ==================================================
        // Author
        // ==================================================

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        // ==================================================
        // Question Title
        // ==================================================

        title: {
            type: String,
            required: [true, "Question title is required"],
            trim: true,
            minlength: 10,
            maxlength: 200
        },


        // ==================================================
        // Question Description
        // ==================================================

        description: {
            type: String,
            required: [true, "Question description is required"],
            trim: true,
            minlength: 10,
            maxlength: 10000
        },


        // ==================================================
        // Category
        // ==================================================

        category: {
            type: String,
            enum: [
                "Import",
                "Export",
                "Customs",
                "Freight Forwarding",
                "Shipping",
                "Air Cargo",
                "Sea Cargo",
                "HS Code",
                "GST",
                "FEMA",
                "Documentation",
                "Warehousing",
                "Transport",
                "Trade Compliance",
                "Other"
            ],
            default: "Other",
            index: true
        },


        // ==================================================
        // Tags
        // ==================================================

        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
                maxlength: 50
            }
        ],


        // ==================================================
        // HS Code Reference
        // Optional
        // ==================================================

        hsCode: {
            type: String,
            trim: true,
            default: ""
        },


        // ==================================================
        // Country
        // ==================================================

        country: {
            type: String,
            trim: true,
            default: ""
        },


        // ==================================================
        // Upvotes
        // ==================================================

        upvotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],


        upvotesCount: {
            type: Number,
            default: 0
        },


        // ==================================================
        // Answers Count
        // ==================================================

        answersCount: {
            type: Number,
            default: 0
        },


        // ==================================================
        // Views
        // ==================================================

        views: {
            type: Number,
            default: 0
        },


        // ==================================================
        // Status
        // ==================================================

        status: {
            type: String,
            enum: [
                "OPEN",
                "ANSWERED",
                "CLOSED"
            ],
            default: "OPEN",
            index: true
        },


        // ==================================================
        // Accepted Answer
        // ==================================================

        acceptedAnswer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Answer",
            default: null
        },


        // ==================================================
        // Visibility
        // ==================================================

        isPublished: {
            type: Boolean,
            default: true
        },


        // ==================================================
        // Moderation
        // ==================================================

        isDeleted: {
            type: Boolean,
            default: false
        }

    },
    {
        timestamps: true
    }
);


// ======================================================
// Search Index
// ======================================================

QuestionSchema.index({
    title: "text",
    description: "text",
    tags: "text",
    category: "text",
    hsCode: "text",
    country: "text"
});


// ======================================================
// Sorting Indexes
// ======================================================

QuestionSchema.index({
    createdAt: -1
});

QuestionSchema.index({
    upvotesCount: -1
});

QuestionSchema.index({
    answersCount: -1
});


// ======================================================
// Export
// ======================================================

module.exports = mongoose.model(
    "Question",
    QuestionSchema
);