require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// ==========================================
// Routes
// ==========================================

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const messageRoutes = require("./routes/messageRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const userRoutes = require("./routes/userRoutes");
const sidebarContentRoutes = require("./routes/sidebarContentRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const followRoutes = require("./routes/followRoutes");
const searchRoutes = require("./routes/searchRoutes");

const questionRoutes = require("./routes/questionRoutes");
const hsCodeRoutes = require("./routes/hsCodeRoutes");
const documentationRoutes = require("./routes/documentationRoutes");
const topicRoutes = require("./routes/topicRoutes");
const rightSidebarRoutes = require("./routes/rightSidebarRoutes");

const adminHighlightRoutes =
    require("./routes/adminHighlightRoutes");

const adminSidebarRoutes =
    require("./routes/adminSidebarRoutes");

// ==========================================
// Socket Manager
// ==========================================

const {
    addUserSocket,
    removeUserSocket,
    getUserSocket
} = require("./utils/socketManager");

// ==========================================
// Error Middleware
// ==========================================

const errorHandler =
    require("./middleware/errorMiddleware");

// ==========================================
// Express App
// ==========================================

const app = express();

const server =
    http.createServer(app);

// ==========================================
// FRONTEND URLS
// ==========================================

const allowedOrigins = [

    // Local development
    "http://localhost:3000",

    // Vercel deployment
    "https://lynktoday-frontend.vercel.app",

    // Production domain
    "https://www.lynktoday.com"

];

// ==========================================
// CORS OPTIONS
// ==========================================

const corsOptions = {

    origin: function (
        origin,
        callback
    ) {

        // Allow requests that do not contain
        // an Origin header.
        //
        // This is useful for server-to-server
        // requests, health checks, etc.

        if (!origin) {

            return callback(
                null,
                true
            );

        }

        // Allow known frontend origins

        if (
            allowedOrigins.includes(origin)
        ) {

            return callback(
                null,
                true
            );

        }

        // Reject unknown origins

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

// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(
    server,
    {
        cors: corsOptions
    }
);

// ==========================================
// Make Socket.IO Available
// To Controllers
// ==========================================

app.set(
    "io",
    io
);

// ==========================================
// Security
// ==========================================

app.use(
    helmet()
);

// ==========================================
// CORS
// ==========================================

app.use(
    cors(
        corsOptions
    )
);

// ==========================================
// Rate Limiting
// ==========================================

const limiter =
    rateLimit({

        windowMs:
            15 * 60 * 1000,

        max: 500,

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

// ==========================================
// Body Parser
// ==========================================

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

// ==========================================
// Static Uploads
// ==========================================

app.use(
    "/uploads",
    express.static("uploads")
);

// ==========================================
// API ROUTES
// ==========================================

// HS Codes

app.use(
    "/api/v1/hs-codes",
    hsCodeRoutes
);

// Profile

app.use(
    "/api/v1/profile",
    profileRoutes
);

// Questions

app.use(
    "/api/v1/questions",
    questionRoutes
);

// Search

app.use(
    "/api/v1/search",
    searchRoutes
);

// Documentation

app.use(
    "/api/v1/documentation",
    documentationRoutes
);

// Topics

app.use(
    "/api/v1/topics",
    topicRoutes
);

// Follow

app.use(
    "/api/v1/follow",
    followRoutes
);

// Authentication

app.use(
    "/api/v1/auth",
    authRoutes
);

// Posts

app.use(
    "/api/v1/posts",
    postRoutes
);

// Messages

app.use(
    "/api/v1/messages",
    messageRoutes
);

// Connections

app.use(
    "/api/v1/connections",
    connectionRoutes
);

// Users

app.use(
    "/api/v1/users",
    userRoutes
);

// Sidebar Content

app.use(
    "/api/v1",
    sidebarContentRoutes
);

// Comments

app.use(
    "/api/v1/comments",
    commentRoutes
);

// Notifications

app.use(
    "/api/v1/notifications",
    notificationRoutes
);

// Right Sidebar

app.use(
    "/api/v1/right-sidebar",
    rightSidebarRoutes
);

// Admin Highlights

app.use(
    "/api/v1/admin/highlights",
    adminHighlightRoutes
);

// Admin Sidebar

app.use(
    "/api/v1/admin/sidebar",
    adminSidebarRoutes
);

// ==========================================
// HEALTH CHECK
// ==========================================

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

// ==========================================
// SOCKET.IO
// ==========================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "Socket Connected:",
            socket.id
        );

        // ==================================
        // SETUP USER
        // ==================================

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
                    Array.from(socket.rooms)
                );

            }
        );

        // ==================================
        // JOIN CHAT ROOM
        // ==================================

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

        // ==================================
        // LEAVE CHAT ROOM
        // ==================================

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

        // ==================================
        // CONNECTION REQUEST
        // ==================================

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

        // ==================================
        // REAL-TIME MESSAGE
        // ==================================

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

        // ==================================
        // MESSAGE TYPING
        // ==================================

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

        // ==================================
        // STOP TYPING
        // ==================================

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

        // ==================================
        // MESSAGE READ
        // ==================================

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

        // ==================================
        // USER ONLINE
        // ==================================

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

        // ==================================
        // USER OFFLINE
        // ==================================

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

        // ==================================
        // DISCONNECT
        // ==================================

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

// ==========================================
// ERROR HANDLER
// IMPORTANT:
// MUST BE AFTER ALL ROUTES
// ==========================================

app.use(
    errorHandler
);

// ==========================================
// START SERVER
// ==========================================

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