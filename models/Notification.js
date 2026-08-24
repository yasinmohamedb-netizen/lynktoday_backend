const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
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
        // Sender
        // ==========================================

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // ==========================================
        // Notification Type
        // ==========================================

        type: {
            type: String,

            enum: [
                "LIKE_POST",
                "COMMENT",
                "REPLY",
                "SHARE",
                "FOLLOW",
                "MENTION",
                "CONNECTION_REQUEST",
                "CONNECTION_ACCEPTED",
                "ANSWER_ACCEPTED",

                // NEW
                "MESSAGE",

                "SYSTEM"
            ],

            required: true,

            index: true
        },

        // ==========================================
        // Related Post
        // ==========================================

        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null,
            index: true
        },

        // ==========================================
        // Related Comment / Answer
        // ==========================================

        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
            index: true
        },

        // ==========================================
        // Related User
        // ==========================================

        relatedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // ==========================================
        // Related Connection
        // ==========================================

        connection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Connection",
            default: null
        },

        // ==========================================
        // Message
        // ==========================================

        message: {
            type: String,

            trim: true,

            maxlength: 500,

            default: ""
        },

        // ==========================================
        // Read Status
        // ==========================================

        isRead: {
            type: Boolean,

            default: false,

            index: true
        }
    },

    {
        timestamps: true
    }
);


// ======================================================
// Indexes
// ======================================================

NotificationSchema.index({
    receiver: 1,
    createdAt: -1
});

NotificationSchema.index({
    receiver: 1,
    isRead: 1
});

NotificationSchema.index({
    receiver: 1,
    type: 1,
    createdAt: -1
});


// ======================================================
// JSON
// ======================================================

NotificationSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,

    transform(doc, ret) {

        delete ret.__v;

        return ret;
    }
});


NotificationSchema.set("toObject", {
    virtuals: true
});


module.exports =
    mongoose.model(
        "Notification",
        NotificationSchema
    );