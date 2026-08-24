const mongoose = require("mongoose");


// ======================================================
// Conversation Schema
// ======================================================

const conversationSchema = new mongoose.Schema(
    {
        // ==========================================
        // Participants
        // ==========================================

        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],

        // ==========================================
        // Last Message
        // ==========================================

        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },

        lastMessageAt: {
            type: Date,
            default: null
        },

        // ==========================================
        // Unread Counts
        //
        // Example:
        // {
        //    "userId": 5
        // }
        // ==========================================

        unreadCounts: {
            type: Map,
            of: Number,
            default: {}
        },

        // ==========================================
        // Active Conversation
        // ==========================================

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);


// ======================================================
// Indexes
// ======================================================

conversationSchema.index({
    participants: 1
});

conversationSchema.index({
    lastMessageAt: -1
});


// ======================================================
// Export
// ======================================================

module.exports =
    mongoose.model(
        "Conversation",
        conversationSchema
    );