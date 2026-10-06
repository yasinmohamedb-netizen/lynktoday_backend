const { google } = require("googleapis");

const {
    getGoogleRefreshToken
} = require("./googleTokenStore");

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

async function getGmail() {
    const refreshToken =
        await getGoogleRefreshToken();

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    return google.gmail({
        version: "v1",
        auth: oauth2Client
    });
}

module.exports = {
    oauth2Client,
    getGmail
};
