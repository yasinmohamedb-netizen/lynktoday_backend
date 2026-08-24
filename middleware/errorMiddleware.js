// middleware/errorMiddleware.js

module.exports = (err, req, res, next) => {

    console.error("====================================");
    console.error("🚨 Error:", err);
    console.error("====================================");

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // ==========================================
    // Invalid MongoDB ObjectId
    // ==========================================
    if (err.name === "CastError") {
        statusCode = 404;
        message = "Requested resource not found.";
    }

    // ==========================================
    // Duplicate Key
    // ==========================================
    if (err.code === 11000) {

        const field = Object.keys(err.keyValue)[0];

        statusCode = 400;
        message = `${field} already exists.`;

    }

    // ==========================================
    // Mongoose Validation
    // ==========================================
    if (err.name === "ValidationError") {

        statusCode = 400;

        message = Object.values(err.errors)
            .map(error => error.message)
            .join(", ");

    }

    // ==========================================
    // JWT Expired
    // ==========================================
    if (err.name === "TokenExpiredError") {

        statusCode = 401;
        message = "Session expired. Please login again.";

    }

    // ==========================================
    // Invalid JWT
    // ==========================================
    if (err.name === "JsonWebTokenError") {

        statusCode = 401;
        message = "Invalid authentication token.";

    }

    // ==========================================
    // MongoDB Connection Error
    // ==========================================
    if (
        err.name === "MongoNetworkError" ||
        err.name === "MongooseServerSelectionError"
    ) {

        statusCode = 500;
        message = "Unable to connect to the database.";

    }

    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack
        })
    });

};