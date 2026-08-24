const mongoose = require("mongoose");

const AdminSidebarContentSchema = new mongoose.Schema(
    {
        // ==========================================
        // SECTION
        // ==========================================

        section: {
            type: String,
            enum: [
                "TOPIC",
                "NEWS",
                "FEATURED",
                "ANNOUNCEMENT"
            ],
            required: [true, "Sidebar section is required."],
            index: true
        },

        // ==========================================
        // TITLE
        // ==========================================

        title: {
            type: String,
            required: [true, "Sidebar title is required."],
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
        // LINK
        // ==========================================

        link: {
            type: String,
            trim: true,
            default: ""
        },

        // ==========================================
        // CATEGORY
        // ==========================================

        category: {
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
        // Higher number = higher priority
        // ==========================================

        priority: {
            type: Number,
            default: 0
        },

        // ==========================================
        // ACTIVE STATUS
        // ==========================================

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        // ==========================================
        // START DATE
        // ==========================================

        startDate: {
            type: Date,
            default: null
        },

        // ==========================================
        // END DATE
        // ==========================================

        endDate: {
            type: Date,
            default: null
        },

        // ==========================================
        // CREATED BY
        // ==========================================

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ==========================================
        // UPDATED BY
        // ==========================================

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);


// ======================================================
// INDEXES
// ======================================================

AdminSidebarContentSchema.index({
    section: 1,
    isActive: 1,
    priority: -1
});

AdminSidebarContentSchema.index({
    createdAt: -1
});


// ======================================================
// JSON
// ======================================================

AdminSidebarContentSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,

    transform(doc, ret) {
        delete ret.__v;
        return ret;
    }
});


AdminSidebarContentSchema.set("toObject", {
    virtuals: true,
    versionKey: false
});


// ======================================================
// EXPORT
// ======================================================

module.exports = mongoose.model(
    "AdminSidebarContent",
    AdminSidebarContentSchema
);