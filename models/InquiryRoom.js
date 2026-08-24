const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
{
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ],

    startedFromPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        default: null
    },

    lastMessage: {
        type: String,
        default: ""
    },

    lastMessageBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    lastMessageAt: {
        type: Date,
        default: Date.now
    },

    isArchived: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
}
);

// Prevent duplicate conversations
ConversationSchema.index(
    {
        participants: 1
    }
);

module.exports = mongoose.model(
    "Conversation",
    ConversationSchema
);