const mongoose = require("mongoose");

const ConnectionSchema = new mongoose.Schema(
    {
        // ==========================================
        // Sender
        // ==========================================

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // ==========================================
        // Receiver
        // ==========================================

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // ==========================================
        // Connection Status
        // ==========================================

        status: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "REJECTED",
                "BLOCKED"
            ],
            default: "PENDING",
            index: true
        },

        // ==========================================
        // Request Date
        // ==========================================

        requestedAt: {
            type: Date,
            default: Date.now
        },

        // ==========================================
        // Accepted Date
        // ==========================================

        acceptedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// ==========================================
// Indexes
// ==========================================

ConnectionSchema.index({
    sender: 1,
    receiver: 1
});

ConnectionSchema.index({
    receiver: 1,
    status: 1
});

ConnectionSchema.index({
    sender: 1,
    status: 1
});

// ==========================================
// JSON Output
// ==========================================

ConnectionSchema.set("toJSON", {
    virtuals: true,
    versionKey: false
});

ConnectionSchema.set("toObject", {
    virtuals: true
});

// ==========================================
// Export
// ==========================================

module.exports = mongoose.model(
    "Connection",
    ConnectionSchema
);