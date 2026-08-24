const mongoose = require("mongoose");


// ======================================================
// Message Schema
// ======================================================

const messageSchema = new mongoose.Schema(
    {
        // ==========================================
        // Conversation
        // ==========================================

        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true
        },

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
        // Message Content
        // ==========================================

        content: {
            type: String,
            trim: true,
            maxlength: 5000,
            default: ""
        },

        // ==========================================
        // Message Type
        // ==========================================

        messageType: {
            type: String,
            enum: [
                "TEXT",
                "IMAGE",
                "FILE",
                "SYSTEM"
            ],
            default: "TEXT"
        },

        // ==========================================
        // Attachments
        // ==========================================

        attachments: [
            {
                url: {
                    type: String,
                    trim: true
                },

                fileName: {
                    type: String,
                    trim: true
                },

                fileType: {
                    type: String,
                    trim: true
                },

                fileSize: {
                    type: Number,
                    default: 0
                }
            }
        ],

        // ==========================================
        // Delivery
        // ==========================================

        isDelivered: {
            type: Boolean,
            default: false
        },

        deliveredAt: {
            type: Date,
            default: null
        },

        // ==========================================
        // Read
        // ==========================================

        isRead: {
            type: Boolean,
            default: false
        },

        readAt: {
            type: Date,
            default: null
        },

        // ==========================================
        // Deleted
        // ==========================================

        isDeleted: {
            type: Boolean,
            default: false
        },

        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


// ======================================================
// Indexes
// ======================================================

messageSchema.index({
    conversation: 1,
    createdAt: -1
});

messageSchema.index({
    receiver: 1,
    isRead: 1
});


// ======================================================
// Export
// ======================================================

module.exports =
    mongoose.model(
        "Message",
        messageSchema
    );