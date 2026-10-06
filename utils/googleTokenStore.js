const crypto = require("crypto");
const EmailCredential =
    require("../models/EmailCredential");

const CREDENTIAL_KEY =
    "gmail_outreach";

function getEncryptionKey() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error(
            "JWT_SECRET is required for Google token encryption."
        );
    }

    return crypto
        .createHash("sha256")
        .update(secret)
        .digest();
}

function encrypt(value) {
    const iv =
        crypto.randomBytes(12);

    const cipher =
        crypto.createCipheriv(
            "aes-256-gcm",
            getEncryptionKey(),
            iv
        );

    const encrypted =
        Buffer.concat([
            cipher.update(value, "utf8"),
            cipher.final()
        ]);

    const authTag =
        cipher.getAuthTag();

    return [
        iv.toString("base64url"),
        authTag.toString("base64url"),
        encrypted.toString("base64url")
    ].join(".");
}

function decrypt(value) {
    const [
        ivEncoded,
        authTagEncoded,
        encryptedEncoded
    ] = String(value).split(".");

    if (
        !ivEncoded ||
        !authTagEncoded ||
        !encryptedEncoded
    ) {
        throw new Error(
            "Invalid encrypted Google credential."
        );
    }

    const decipher =
        crypto.createDecipheriv(
            "aes-256-gcm",
            getEncryptionKey(),
            Buffer.from(
                ivEncoded,
                "base64url"
            )
        );

    decipher.setAuthTag(
        Buffer.from(
            authTagEncoded,
            "base64url"
        )
    );

    return Buffer.concat([
        decipher.update(
            Buffer.from(
                encryptedEncoded,
                "base64url"
            )
        ),
        decipher.final()
    ]).toString("utf8");
}

async function saveGoogleRefreshToken(
    refreshToken
) {
    if (!refreshToken) {
        throw new Error(
            "Google refresh token is required."
        );
    }

    await EmailCredential.findOneAndUpdate(
        { key: CREDENTIAL_KEY },
        {
            key: CREDENTIAL_KEY,
            encryptedRefreshToken:
                encrypt(refreshToken)
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
    );
}

async function getGoogleRefreshToken() {
    const credential =
        await EmailCredential.findOne({
            key: CREDENTIAL_KEY
        }).lean();

    if (!credential) {
        throw new Error(
            "Google Gmail authorization is not configured. Authorize Gmail first."
        );
    }

    return decrypt(
        credential.encryptedRefreshToken
    );
}

module.exports = {
    saveGoogleRefreshToken,
    getGoogleRefreshToken
};
