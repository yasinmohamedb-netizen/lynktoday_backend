const express = require("express");
const { google } = require("googleapis");
const { sendEmail } = require("../services/emailService");
const { saveGoogleRefreshToken } = require("../utils/googleTokenStore");

const router = express.Router();

// ============================================================
// GOOGLE OAUTH CONFIGURATION
// ============================================================

const GOOGLE_SCOPE =
    "https://www.googleapis.com/auth/gmail.send";

const GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:5001/api/v1/email/google-callback";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);

// ============================================================
// GOOGLE OAUTH - START AUTHORIZATION
//
// GET /api/v1/email/google-auth
// ============================================================

router.get("/google-auth", (req, res) => {
    try {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",

            // Force Google to show the consent screen again.
            // This is useful for recording the verification video.
            prompt: "consent",

            scope: [GOOGLE_SCOPE],

            include_granted_scopes: true,
        });

        console.log("========================================");
        console.log("🔐 GOOGLE OAUTH START");
        console.log("Redirect URI:", GOOGLE_REDIRECT_URI);
        console.log("Scope:", GOOGLE_SCOPE);
        console.log("========================================");

        return res.redirect(authUrl);

    } catch (error) {

        console.error(
            "❌ Google OAuth start error:",
            error?.response?.data ||
            error?.message ||
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to start Google authorization",
        });
    }
});

// ============================================================
// GOOGLE OAUTH - CALLBACK
//
// GET /api/v1/email/google-callback
// ============================================================

router.get("/google-callback", async (req, res) => {
    try {
        const { code, error } = req.query;

        // --------------------------------------------------------
        // GOOGLE RETURNED AN ERROR
        // --------------------------------------------------------

        if (error) {

            console.error(
                "❌ Google OAuth error:",
                error
            );

            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>LynkToday OAuth</title>
                </head>

                <body
                    style="
                        font-family:Arial,Helvetica,sans-serif;
                        padding:40px;
                    "
                >

                    <h2>Google Authorization Failed</h2>

                    <p>
                        Google returned:
                        <strong>${String(error)}</strong>
                    </p>

                </body>
                </html>
            `);
        }

        // --------------------------------------------------------
        // NO AUTHORIZATION CODE
        // --------------------------------------------------------

        if (!code) {

            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>LynkToday OAuth</title>
                </head>

                <body
                    style="
                        font-family:Arial,Helvetica,sans-serif;
                        padding:40px;
                    "
                >

                    <h2>Authorization Code Missing</h2>

                    <p>
                        Google did not return an authorization code.
                    </p>

                </body>
                </html>
            `);
        }

        // --------------------------------------------------------
        // EXCHANGE AUTHORIZATION CODE FOR TOKENS
        // --------------------------------------------------------

        const { tokens } =
            await oauth2Client.getToken(code);

        // --------------------------------------------------------
        // LOG IMPORTANT INFORMATION
        // --------------------------------------------------------

        console.log("");
        console.log("========================================");
        console.log("✅ GOOGLE OAUTH AUTHORIZATION SUCCESS");
        console.log("========================================");

        console.log(
            "Scope:",
            tokens.scope || GOOGLE_SCOPE
        );

        console.log(
            "Access token received:",
            !!tokens.access_token
        );

        console.log(
            "Refresh token received:",
            !!tokens.refresh_token
        );

        console.log(
            "Token expiry:",
            tokens.expiry_date || null
        );

        if (!tokens.refresh_token) {
            throw new Error(
                "Google did not return a refresh token. Re-authorize Gmail with consent."
            );
        }

        await saveGoogleRefreshToken(
            tokens.refresh_token
        );

        console.log(
            "Google refresh token stored securely."
        );

        console.log("========================================");
        console.log("");

        // --------------------------------------------------------
        // IMPORTANT:
        // DO NOT DISPLAY THE ACTUAL TOKEN IN THE BROWSER.
        // --------------------------------------------------------

        return res.send(`
            <!DOCTYPE html>
            <html>

            <head>
                <meta charset="UTF-8" />

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />

                <title>
                    LynkToday - Google Authorization
                </title>
            </head>

            <body
                style="
                    margin:0;
                    padding:40px;
                    background:#f5f7fa;
                    font-family:Arial,Helvetica,sans-serif;
                "
            >

                <div
                    style="
                        max-width:600px;
                        margin:50px auto;
                        background:white;
                        padding:40px;
                        border-radius:12px;
                        box-shadow:0 4px 20px rgba(0,0,0,0.08);
                    "
                >

                    <h1
                        style="
                            color:#3B5B7A;
                            margin-top:0;
                        "
                    >
                        Google Authorization Successful
                    </h1>

                    <p>
                        LynkToday has successfully received
                        authorization to send email using Gmail.
                    </p>

                    <p>
                        <strong>Requested scope:</strong>
                    </p>

                    <p
                        style="
                            word-break:break-all;
                            background:#f5f5f5;
                            padding:12px;
                            border-radius:6px;
                        "
                    >
                        ${GOOGLE_SCOPE}
                    </p>

                    <p
                        style="
                            color:#555;
                            margin-top:25px;
                        "
                    >
                        You can close this window.
                    </p>

                </div>

            </body>

            </html>
        `);

    } catch (error) {

        console.error(
            "❌ Google OAuth callback error:",
            error?.response?.data ||
            error?.message ||
            error
        );

        return res.status(500).send(`
            <!DOCTYPE html>
            <html>

            <head>
                <title>LynkToday OAuth Error</title>
            </head>

            <body
                style="
                    font-family:Arial,Helvetica,sans-serif;
                    padding:40px;
                "
            >

                <h2>
                    Google Authorization Failed
                </h2>

                <p>
                    Please check the backend terminal
                    for the error details.
                </p>

            </body>

            </html>
        `);
    }
});

// ============================================================
// TEST EMAIL
// POST /api/v1/email/test-email
// ============================================================

router.post("/test-email", async (req, res) => {
    try {
        const { to } = req.body;

        // --------------------------------------------------------
        // VALIDATION
        // --------------------------------------------------------

        if (!to || !String(to).trim()) {
            return res.status(400).json({
                success: false,
                message: "Recipient email is required",
            });
        }

        const recipientEmail =
            String(to).trim().toLowerCase();

        // --------------------------------------------------------
        // SEND TEST EMAIL
        // --------------------------------------------------------

        const result = await sendEmail({
            to: recipientEmail,

            subject: "LynkToday Gmail Test",

            text:
                "This is a test email from LynkToday.\n\n" +
                "Your Gmail API integration is working correctly.",

            html: `
                <!DOCTYPE html>
                <html>

                <head>
                    <meta charset="UTF-8" />

                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0"
                    />

                    <title>
                        LynkToday Gmail Test
                    </title>
                </head>

                <body
                    style="
                        margin:0;
                        padding:0;
                        background:#f5f7fa;
                        font-family:Arial,Helvetica,sans-serif;
                    "
                >

                    <div
                        style="
                            max-width:600px;
                            margin:40px auto;
                            background:#ffffff;
                            border-radius:12px;
                            padding:40px;
                            box-sizing:border-box;
                        "
                    >

                        <h2
                            style="
                                margin:0 0 20px;
                                color:#3B5B7A;
                            "
                        >
                            LynkToday
                        </h2>

                        <p
                            style="
                                margin:0 0 15px;
                                color:#333333;
                                font-size:16px;
                                line-height:1.6;
                            "
                        >
                            This is a test email sent using the
                            <strong>Gmail API</strong>.
                        </p>

                        <p
                            style="
                                margin:0;
                                color:#333333;
                                font-size:16px;
                                line-height:1.6;
                            "
                        >
                            Your LynkToday Gmail integration is
                            working correctly.
                        </p>

                        <div
                            style="
                                margin-top:30px;
                                padding-top:20px;
                                border-top:1px solid #eeeeee;
                                color:#777777;
                                font-size:13px;
                            "
                        >
                            This is an automated test email
                            from LynkToday.
                        </div>

                    </div>

                </body>

                </html>
            `,
        });

        // --------------------------------------------------------
        // SUCCESS
        // --------------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Email sent successfully",
            messageId: result?.messageId || null,
        });

    } catch (error) {

        // --------------------------------------------------------
        // ERROR LOG
        // --------------------------------------------------------

        console.error(
            "Test email error:",
            error
        );

        // --------------------------------------------------------
        // ERROR RESPONSE
        // --------------------------------------------------------

        return res.status(500).json({
            success: false,
            message: "Failed to send email",

            error:
                error?.response?.data ||
                error?.message ||
                "Unknown email error",
        });
    }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;