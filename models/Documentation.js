const mongoose = require("mongoose");

const DocumentationSchema = new mongoose.Schema(
    {
        // ==========================================
        // Basic Information
        // ==========================================

        title: {
            type: String,
            required: [true, "Documentation title is required."],
            trim: true,
            maxlength: 250
        },

        description: {
            type: String,
            required: [true, "Documentation description is required."],
            trim: true,
            maxlength: 1000
        },

        // ==========================================
        // Document Type
        // ==========================================

        documentType: {
            type: String,
            enum: [
                "GUIDE",
                "ARTICLE",
                "POLICY",
                "PROCEDURE",
                "CIRCULAR",
                "NOTIFICATION",
                "CHECKLIST",
                "TUTORIAL",
                "REFERENCE",
                "OTHER"
            ],
            default: "GUIDE"
        },

        // ==========================================
        // Category
        // ==========================================

        category: {
            type: String,
            enum: [
                "Customs",
                "Import",
                "Export",
                "DGFT",
                "GST",
                "FEMA",
                "HS Code",
                "Shipping",
                "Freight Forwarding",
                "Documentation",
                "Incoterms",
                "Container",
                "Dangerous Goods",
                "Warehousing",
                "Insurance",
                "Trade Finance",
                "General"
            ],
            default: "General",
            index: true
        },

        // ==========================================
        // Content
        // ==========================================

        content: {
            type: String,
            default: ""
        },

        // ==========================================
        // File Information
        // ==========================================

        fileUrl: {
            type: String,
            default: ""
        },

        fileName: {
            type: String,
            default: ""
        },

        fileType: {
            type: String,
            default: ""
        },

        fileSize: {
            type: Number,
            default: 0
        },

        // ==========================================
        // Tags
        // ==========================================

        tags: [
            {
                type: String,
                trim: true
            }
        ],

        // ==========================================
        // HS Code Relationship
        // ==========================================

        relatedHSCode: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HSCode",
            default: null
        },

        hsCode: {
            type: String,
            default: "",
            trim: true
        },

        // ==========================================
        // Author
        // ==========================================

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // ==========================================
        // Status
        // ==========================================

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        isFeatured: {
            type: Boolean,
            default: false,
            index: true
        },

        // ==========================================
        // Views
        // ==========================================

        views: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);


// ======================================================
// INDEXES
// ======================================================

// Latest documents
DocumentationSchema.index({
    createdAt: -1
});

// Category + Active
DocumentationSchema.index({
    category: 1,
    isActive: 1
});

// Document type
DocumentationSchema.index({
    documentType: 1
});

// Featured documents
DocumentationSchema.index({
    isFeatured: -1,
    createdAt: -1
});

// HS Code
DocumentationSchema.index({
    hsCode: 1
});

// Full text search
DocumentationSchema.index({
    title: "text",
    description: "text",
    content: "text",
    tags: "text",
    hsCode: "text"
});


// ======================================================
// JSON
// ======================================================

DocumentationSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,

    transform(doc, ret) {
        delete ret.__v;
        return ret;
    }
});


DocumentationSchema.set("toObject", {
    virtuals: true
});


// ======================================================
// EXPORT
// ======================================================

module.exports = mongoose.model(
    "Documentation",
    DocumentationSchema
);