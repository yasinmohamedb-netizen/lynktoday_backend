const express = require("express");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

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
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>LynkToday Gmail Test</title>
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
                            This is an automated test email from LynkToday.
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
                error?.response?.data?.error ||
                error?.message ||
                "Unknown email error",
        });
    }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;