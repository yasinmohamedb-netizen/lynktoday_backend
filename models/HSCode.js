const mongoose = require("mongoose");

const HSCodeSchema = new mongoose.Schema(
    {
        // ==========================================
        // HS Code
        // ==========================================

        hsCode: {
            type: String,
            required: [true, "HS Code is required."],
            trim: true
        },

        // ==========================================
        // Description
        // ==========================================

        description: {
            type: String,
            required: [true, "Description is required."],
            trim: true
        },

        // ==========================================
        // Classification
        // ==========================================

        section: {
            type: String,
            default: ""
        },

        sectionNumber: {
            type: Number,
            default: null
        },

        chapter: {
            type: String,
            default: ""
        },

        chapterNumber: {
            type: Number,
            default: null
        },

        heading: {
            type: String,
            default: ""
        },

        subHeading: {
            type: String,
            default: ""
        },

        // ==========================================
        // Tariff Information
        // ==========================================

        unit: {
            type: String,
            default: ""
        },

        basicDuty: {
            type: String,
            default: ""
        },

        igst: {
            type: String,
            default: ""
        },

        cess: {
            type: String,
            default: ""
        },

        // ==========================================
        // Trade Information
        // ==========================================

        importPolicy: {
            type: String,
            default: ""
        },

        exportPolicy: {
            type: String,
            default: ""
        },

        country: {
            type: String,
            default: "India"
        },

        // ==========================================
        // Additional Information
        // ==========================================

        notes: {
            type: String,
            default: ""
        },

        keywords: [
            {
                type: String,
                trim: true
            }
        ],

        // ==========================================
        // Status
        // ==========================================

        isActive: {
            type: Boolean,
            default: true
        },

        // ==========================================
        // Audit
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
        }
    },
    {
        timestamps: true
    }
);

// ======================================================
// INDEXES
// ======================================================

// Exact HS Code lookup
HSCodeSchema.index({
    hsCode: 1
});

// Chapter lookup
HSCodeSchema.index({
    chapterNumber: 1
});

// Country + Active HS Codes
HSCodeSchema.index({
    country: 1,
    isActive: 1
});

// Full Text Search
HSCodeSchema.index({
    description: "text",
    keywords: "text",
    hsCode: "text",
    heading: "text",
    subHeading: "text"
});

// ======================================================
// JSON
// ======================================================

HSCodeSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,

    transform(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

HSCodeSchema.set("toObject", {
    virtuals: true
});

// ======================================================
// EXPORT
// ======================================================

module.exports = mongoose.model(
    "HSCode",
    HSCodeSchema
);