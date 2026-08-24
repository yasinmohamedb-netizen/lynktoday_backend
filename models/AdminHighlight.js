const mongoose = require("mongoose");

const AdminHighlightSchema = new mongoose.Schema(
    {
        // ==========================================
        // TITLE
        // ==========================================

        title: {
            type: String,
            required: [true, "Highlight title is required."],
            trim: true,
            maxlength: 250
        },

        // ==========================================
        // DESCRIPTION
        // ==========================================

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        // ==========================================
        // TYPE
        // ==========================================

        type: {
            type: String,
            enum: [
                "ANNOUNCEMENT",
                "NEWS",
                "CUSTOMS_UPDATE",
                "HS_CODE_UPDATE",
                "DOCUMENT",
                "ARTICLE",
                "ALERT",
                "OTHER"
            ],
            default: "ANNOUNCEMENT",
            index: true
        },

        // ==========================================
        // LINK
        // ==========================================

        link: {
            type: String,
            trim: true,
            default: ""
        },

        // ==========================================
        // IMAGE
        // ==========================================

        imageUrl: {
            type: String,
            trim: true,
            default: ""
        },

        // ==========================================
        // PRIORITY
        // ==========================================

        priority: {
            type: Number,
            default: 0,
            index: true
        },

        // ==========================================
        // STATUS
        // ==========================================

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        // ==========================================
        // DISPLAY DATES
        // ==========================================

        startDate: {
            type: Date,
            default: null
        },

        endDate: {
            type: Date,
            default: null
        },

        // ==========================================
        // CREATED BY ADMIN
        // ==========================================

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);


// ======================================================
// INDEXES
// ======================================================

AdminHighlightSchema.index({
    isActive: 1,
    priority: -1,
    createdAt: -1
});

AdminHighlightSchema.index({
    type: 1,
    isActive: 1,
    createdAt: -1
});


// ======================================================
// JSON
// ======================================================

AdminHighlightSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,

    transform(doc, ret) {
        delete ret.__v;
        return ret;
    }
});


// ======================================================
// EXPORT
// ======================================================

module.exports = mongoose.model(
    "AdminHighlight",
    AdminHighlightSchema
);