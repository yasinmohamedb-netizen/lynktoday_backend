const mongoose = require("mongoose");

const EmailCredentialSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        encryptedRefreshToken: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.models.EmailCredential ||
    mongoose.model(
        "EmailCredential",
        EmailCredentialSchema
    );
