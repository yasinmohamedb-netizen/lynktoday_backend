const mongoose = require("mongoose");

const SidebarContentSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },

    description: {
        type: String,
        trim: true,
        maxlength: 500
    },

    type: {
        type: String,
        enum: [
            "NEWS",
            "CUSTOMS",
            "DGFT",
            "SHIPPING_LINE",
            "EVENT",
            "JOB",
            "EXPERT",
            "ANNOUNCEMENT",
            "PLATFORM_UPDATE",
            "SPONSORED"
        ],
        default: "NEWS"
    },

    link: {
        type: String,
        trim: true
    },

    imageUrl: {
        type: String,
        default: ""
    },

    isSponsored: {
        type: Boolean,
        default: false
    },

    sponsorName: {
        type: String,
        default: ""
    },

    priority: {
        type: Number,
        default: 0
    },

    isActive: {
        type: Boolean,
        default: true
    },

    startsAt: {
        type: Date,
        default: Date.now
    },

    expiresAt: {
        type: Date,
        default: null
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

},
{
    timestamps: true
});

// Fast homepage loading
SidebarContentSchema.index({
    isActive: 1,
    priority: -1,
    startsAt: 1
});

module.exports = mongoose.model(
    "SidebarContent",
    SidebarContentSchema
);