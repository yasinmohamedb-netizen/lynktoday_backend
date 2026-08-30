const { google } = require("googleapis");

// ============================================================
// GOOGLE OAUTH2 CLIENT
// ============================================================

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

// ============================================================
// SET REFRESH TOKEN
// ============================================================

oauth2Client.setCredentials({
    refresh_token:
        process.env.GOOGLE_REFRESH_TOKEN,
});

// ============================================================
// GMAIL API CLIENT
// ============================================================

const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
});

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    oauth2Client,
    gmail,
};