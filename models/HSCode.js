const mongoose = require("mongoose");

const HSCodeSchema = new mongoose.Schema(
    {
        // ==========================================
        // HS CODE
        // ==========================================

        hsCode: {
            type: String,
            required: [true, "HS Code is required."],
            trim: true
        },

        // ==========================================
        // DESCRIPTION
        // ==========================================

        description: {
            type: String,
            required: [true, "Description is required."],
            trim: true
        },

        // ==========================================
        // CLASSIFICATION
        // ==========================================

        section: {
            type: String,
            default: "",
            trim: true
        },

        sectionNumber: {
            type: Number,
            default: null
        },

        chapter: {
            type: String,
            default: "",
            trim: true
        },

        chapterNumber: {
            type: Number,
            default: null
        },

        heading: {
            type: String,
            default: "",
            trim: true
        },

        subHeading: {
            type: String,
            default: "",
            trim: true
        },

        // ==========================================
        // TARIFF INFORMATION
        // ==========================================

        unit: {
            type: String,
            default: "",
            trim: true
        },

        basicDuty: {
            type: String,
            default: "",
            trim: true
        },

        igst: {
            type: String,
            default: "",
            trim: true
        },

        cess: {
            type: String,
            default: "",
            trim: true
        },

        // ==========================================
        // TRADE INFORMATION
        // ==========================================

        importPolicy: {
            type: String,
            default: "",
            trim: true
        },

        exportPolicy: {
            type: String,
            default: "",
            trim: true
        },

        country: {
            type: String,
            default: "India",
            trim: true
        },

        // ==========================================
        // ADDITIONAL INFORMATION
        // ==========================================

        notes: {
            type: String,
            default: "",
            trim: true
        },

        keywords: [
            {
                type: String,
                trim: true,
                lowercase: true
            }
        ],

        // ==========================================
        // ACTIVE STATUS
        //
        // true  = publicly visible
        // false = hidden
        // ==========================================

        isActive: {
            type: Boolean,
            default: true
        },

        // ==========================================
        // OWNERSHIP / AUDIT
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

// HS Code lookup
HSCodeSchema.index({
    hsCode: 1
});

// Chapter lookup
HSCodeSchema.index({
    chapterNumber: 1
});

// Country + active
HSCodeSchema.index({
    country: 1,
    isActive: 1
});

// User's contributions
HSCodeSchema.index({
    createdBy: 1,
    createdAt: -1
});

// Full text search
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