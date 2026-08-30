const { gmail } = require("../utils/gmail");

const FROM_EMAIL = "lynktodayinfo@gmail.com";
const FROM_NAME = "LynkToday";

// ============================================================
// CREATE RAW GMAIL MESSAGE
// ============================================================

function createRawEmail({
    to,
    subject,
    text,
    html,
}) {

    const headers = [
        `From: ${FROM_NAME} <${FROM_EMAIL}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
    ];

    const body =
        html ||
        `<p>${text || ""}</p>`;

    const email = [
        ...headers,
        "",
        body,
    ].join("\r\n");

    return Buffer
        .from(email, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

// ============================================================
// SEND EMAIL USING GMAIL API
// ============================================================

async function sendEmail({
    to,
    subject,
    text,
    html,
}) {

    try {

        // ------------------------------------------------------
        // VALIDATION
        // ------------------------------------------------------

        if (!to) {
            throw new Error(
                "Recipient email is required."
            );
        }

        if (!subject) {
            throw new Error(
                "Email subject is required."
            );
        }

        // ------------------------------------------------------
        // NORMALIZE RECIPIENT
        // ------------------------------------------------------

        const recipient =
            String(to)
                .trim()
                .toLowerCase();

        // ------------------------------------------------------
        // CREATE RAW MESSAGE
        // ------------------------------------------------------

        const raw =
            createRawEmail({
                to: recipient,
                subject,
                text,
                html,
            });

        // ------------------------------------------------------
        // SEND THROUGH GMAIL API
        // ------------------------------------------------------

        const response =
            await gmail.users.messages.send({

                userId: "me",

                requestBody: {
                    raw,
                },

            });

        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        console.log(
            "✅ Gmail email sent:",
            response.data.id
        );

        return {

            success: true,

            messageId:
                response.data.id,

        };

    } catch (error) {

        // ------------------------------------------------------
        // ERROR
        // ------------------------------------------------------

        console.error(
            "❌ Gmail send error:",
            error?.response?.data ||
            error?.message ||
            error
        );

        throw error;
    }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    sendEmail,
};