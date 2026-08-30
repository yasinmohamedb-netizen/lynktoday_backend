require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// ============================================================
// ROUTES
// ============================================================

const authRoutes =
    require("./routes/authRoutes");

const postRoutes =
    require("./routes/postRoutes");

const messageRoutes =
    require("./routes/messageRoutes");

const connectionRoutes =
    require("./routes/connectionRoutes");

const userRoutes =
    require("./routes/userRoutes");

const sidebarContentRoutes =
    require("./routes/sidebarContentRoutes");

const commentRoutes =
    require("./routes/commentRoutes");

const notificationRoutes =
    require("./routes/notificationRoutes");

const profileRoutes =
    require("./routes/profileRoutes");

const followRoutes =
    require("./routes/followRoutes");

const searchRoutes =
    require("./routes/searchRoutes");

const questionRoutes =
    require("./routes/questionRoutes");

const hsCodeRoutes =
    require("./routes/hsCodeRoutes");

const documentationRoutes =
    require("./routes/documentationRoutes");

const topicRoutes =
    require("./routes/topicRoutes");

const rightSidebarRoutes =
    require("./routes/rightSidebarRoutes");

const adminHighlightRoutes =
    require("./routes/adminHighlightRoutes");

const adminSidebarRoutes =
    require("./routes/adminSidebarRoutes");

// NEW: Email test route
const emailRoutes =
    require("./routes/emailRoutes");

// ============================================================
// SOCKET MANAGER
// ============================================================

const {
    addUserSocket,
    removeUserSocket,
    getUserSocket
} = require("./utils/socketManager");

// ============================================================
// ERROR MIDDLEWARE
// ============================================================

const errorHandler =
    require("./middleware/errorMiddleware");

// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

const server =
    http.createServer(app);

// ============================================================
// FRONTEND URLS
// ============================================================

const allowedOrigins = [

    // Local development
    "http://localhost:3000",

    // Vercel deployment
    "https://lynktoday-frontend.vercel.app",

    // Production domain
    "https://www.lynktoday.com"

];

// ============================================================
// CORS OPTIONS
// ============================================================

const corsOptions = {

    origin: function (
        origin,
        callback
    ) {

        // ------------------------------------------------------
        // Requests without Origin
        // ------------------------------------------------------

        if (!origin) {

            return callback(
                null,
                true
            );

        }

        // ------------------------------------------------------
        // Known frontend origins
        // ------------------------------------------------------

        if (
            allowedOrigins.includes(origin)
        ) {

            return callback(
                null,
                true
            );

        }

        // ------------------------------------------------------
        // Unknown origin
        // ------------------------------------------------------

        return callback(
            new Error(
                "Not allowed by CORS"
            )
        );

    },

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ],

    credentials: true

};

// ============================================================
// SOCKET.IO
// ============================================================

const io =
    new Server(
        server,
        {
            cors: corsOptions
        }
    );

// ============================================================
// MAKE SOCKET.IO AVAILABLE TO CONTROLLERS
// ============================================================

app.set(
    "io",
    io
);

// ============================================================
// SECURITY
// ============================================================

app.use(
    helmet()
);

// ============================================================
// CORS
// ============================================================

app.use(
    cors(
        corsOptions
    )
);

// ============================================================
// RATE LIMITING
// ============================================================

const limiter =
    rateLimit({

        windowMs:
            15 * 60 * 1000,

        max:
            500,

        message: {

            success: false,

            message:
                "Too many requests. Please try again later."

        }

    });

app.use(
    "/api/",
    limiter
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({

        extended: true,

        limit: "10mb"

    })
);

// ============================================================
// STATIC UPLOADS
// ============================================================

app.use(
    "/uploads",
    express.static("uploads")
);

// ============================================================
// API ROUTES
// ============================================================

// ------------------------------------------------------------
// HS CODES
// ------------------------------------------------------------

app.use(
    "/api/v1/hs-codes",
    hsCodeRoutes
);

// ------------------------------------------------------------
// PROFILE
// ------------------------------------------------------------

app.use(
    "/api/v1/profile",
    profileRoutes
);

// ------------------------------------------------------------
// QUESTIONS
// ------------------------------------------------------------

app.use(
    "/api/v1/questions",
    questionRoutes
);

// ------------------------------------------------------------
// SEARCH
// ------------------------------------------------------------

app.use(
    "/api/v1/search",
    searchRoutes
);

// ------------------------------------------------------------
// DOCUMENTATION
// ------------------------------------------------------------

app.use(
    "/api/v1/documentation",
    documentationRoutes
);

// ------------------------------------------------------------
// TOPICS
// ------------------------------------------------------------

app.use(
    "/api/v1/topics",
    topicRoutes
);

// ------------------------------------------------------------
// FOLLOW
// ------------------------------------------------------------

app.use(
    "/api/v1/follow",
    followRoutes
);

// ------------------------------------------------------------
// AUTHENTICATION
// ------------------------------------------------------------

app.use(
    "/api/v1/auth",
    authRoutes
);

// ------------------------------------------------------------
// EMAIL
// ------------------------------------------------------------

// POST /api/v1/email/test-email

app.use(
    "/api/v1/email",
    emailRoutes
);

// ------------------------------------------------------------
// POSTS
// ------------------------------------------------------------

app.use(
    "/api/v1/posts",
    postRoutes
);

// ------------------------------------------------------------
// MESSAGES
// ------------------------------------------------------------

app.use(
    "/api/v1/messages",
    messageRoutes
);

// ------------------------------------------------------------
// CONNECTIONS
// ------------------------------------------------------------

app.use(
    "/api/v1/connections",
    connectionRoutes
);

// ------------------------------------------------------------
// USERS
// ------------------------------------------------------------

app.use(
    "/api/v1/users",
    userRoutes
);

// ------------------------------------------------------------
// SIDEBAR CONTENT
// ------------------------------------------------------------

app.use(
    "/api/v1",
    sidebarContentRoutes
);

// ------------------------------------------------------------
// COMMENTS
// ------------------------------------------------------------

app.use(
    "/api/v1/comments",
    commentRoutes
);

// ------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------

app.use(
    "/api/v1/notifications",
    notificationRoutes
);

// ------------------------------------------------------------
// RIGHT SIDEBAR
// ------------------------------------------------------------

app.use(
    "/api/v1/right-sidebar",
    rightSidebarRoutes
);

// ------------------------------------------------------------
// ADMIN HIGHLIGHTS
// ------------------------------------------------------------

app.use(
    "/api/v1/admin/highlights",
    adminHighlightRoutes
);

// ------------------------------------------------------------
// ADMIN SIDEBAR
// ------------------------------------------------------------

app.use(
    "/api/v1/admin/sidebar",
    adminSidebarRoutes
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
    "/",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "API Running Successfully"

        });

    }
);

// ============================================================
// SOCKET.IO
// ============================================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "Socket Connected:",
            socket.id
        );

        // ====================================================
        // SETUP USER
        // ====================================================

        socket.on(
            "setup",
            (userId) => {

                console.log(
                    "SETUP EVENT RECEIVED:",
                    userId
                );

                if (!userId) {

                    console.log(
                        "SETUP FAILED: No userId"
                    );

                    return;
                }

                addUserSocket(
                    userId,
                    socket.id
                );

                const roomName =
                    `user:${userId}`;

                socket.join(
                    roomName
                );

                console.log(
                    "SOCKET REGISTERED:",
                    userId
                );

                console.log(
                    "JOINED ROOM:",
                    roomName
                );

                console.log(
                    "SOCKET ROOMS:",
                    Array.from(
                        socket.rooms
                    )
                );

            }
        );

        // ====================================================
        // JOIN CHAT ROOM
        // ====================================================

        socket.on(
            "join_room",
            (roomId) => {

                if (!roomId) {
                    return;
                }

                socket.join(
                    roomId
                );

                console.log(
                    `Socket ${socket.id} joined room ${roomId}`
                );

            }
        );

        // ====================================================
        // LEAVE CHAT ROOM
        // ====================================================

        socket.on(
            "leave_room",
            (roomId) => {

                if (!roomId) {
                    return;
                }

                socket.leave(
                    roomId
                );

                console.log(
                    `Socket ${socket.id} left room ${roomId}`
                );

            }
        );

        // ====================================================
        // CONNECTION REQUEST
        // ====================================================

        socket.on(
            "send_request",
            (data) => {

                if (!data) {
                    return;
                }

                if (!data.receiverId) {
                    return;
                }

                const receiverSocket =
                    getUserSocket(
                        data.receiverId
                    );

                if (receiverSocket) {

                    io.to(
                        receiverSocket
                    ).emit(
                        "new_request_received",
                        data
                    );

                }

            }
        );

        // ====================================================
        // REAL-TIME MESSAGE
        // ====================================================

        socket.on(
            "send_message",
            (messageData) => {

                if (!messageData) {
                    return;
                }

                const roomId =
                    messageData.inquiryRoomId ||
                    messageData.roomId ||
                    messageData.conversationId;

                if (!roomId) {
                    return;
                }

                socket
                    .to(roomId)
                    .emit(
                        "receive_message",
                        messageData
                    );

            }
        );

        // ====================================================
        // MESSAGE TYPING
        // ====================================================

        socket.on(
            "typing",
            (data) => {

                if (!data) {
                    return;
                }

                const roomId =
                    data.inquiryRoomId ||
                    data.roomId ||
                    data.conversationId;

                if (!roomId) {
                    return;
                }

                socket
                    .to(roomId)
                    .emit(
                        "user_typing",
                        data
                    );

            }
        );

        // ====================================================
        // STOP TYPING
        // ====================================================

        socket.on(
            "stop_typing",
            (data) => {

                if (!data) {
                    return;
                }

                const roomId =
                    data.inquiryRoomId ||
                    data.roomId ||
                    data.conversationId;

                if (!roomId) {
                    return;
                }

                socket
                    .to(roomId)
                    .emit(
                        "user_stopped_typing",
                        data
                    );

            }
        );

        // ====================================================
        // MESSAGE READ
        // ====================================================

        socket.on(
            "message_read",
            (data) => {

                if (!data) {
                    return;
                }

                const roomId =
                    data.inquiryRoomId ||
                    data.roomId ||
                    data.conversationId;

                if (!roomId) {
                    return;
                }

                socket
                    .to(roomId)
                    .emit(
                        "message_read",
                        data
                    );

            }
        );

        // ====================================================
        // USER ONLINE
        // ====================================================

        socket.on(
            "user_online",
            (data) => {

                if (!data) {
                    return;
                }

                const roomId =
                    data.inquiryRoomId ||
                    data.roomId ||
                    data.conversationId;

                if (!roomId) {
                    return;
                }

                socket
                    .to(roomId)
                    .emit(
                        "user_online",
                        data
                    );

            }
        );

        // ====================================================
        // USER OFFLINE
        // ====================================================

        socket.on(
            "user_offline",
            (data) => {

                if (!data) {
                    return;
                }

                const roomId =
                    data.inquiryRoomId ||
                    data.roomId ||
                    data.conversationId;

                if (!roomId) {
                    return;
                }

                socket
                    .to(roomId)
                    .emit(
                        "user_offline",
                        data
                    );

            }
        );

        // ====================================================
        // DISCONNECT
        // ====================================================

        socket.on(
            "disconnect",
            () => {

                removeUserSocket(
                    socket.id
                );

                console.log(
                    "Socket Disconnected:",
                    socket.id
                );

            }
        );

    }
);

// ============================================================
// ERROR HANDLER
// MUST BE AFTER ALL ROUTES
// ============================================================

app.use(
    errorHandler
);

// ============================================================
// START SERVER
// ============================================================

const PORT =
    process.env.PORT || 5001;

connectDB()

    .then(
        () => {

            server.listen(
                PORT,
                "0.0.0.0",
                () => {

                    console.log(
                        `Server running on port ${PORT}`
                    );

                    console.log(
                        "Allowed Frontend Origins:",
                        allowedOrigins
                    );

                    console.log(
                        `API: http://localhost:${PORT}/api/v1`
                    );

                    console.log(
                        `Socket.IO: http://localhost:${PORT}`
                    );

                }
            );

        }
    )

    .catch(
        (err) => {

            console.error(
                "Database Connection Failed"
            );

            console.error(
                err
            );

            process.exit(1);

        }
    );