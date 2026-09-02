const jwt = require("jsonwebtoken");

// ======================================================
// Protect Routes
// ======================================================
const protect = (req, res, next) => {

    const authHeader =
        req.headers.authorization;

    // --------------------------------------------------
    // Check Authorization Header
    // --------------------------------------------------
    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {

        console.error(
            "===================================="
        );

        console.error(
            "AUTHENTICATION ERROR"
        );

        console.error(
            "Authorization header missing or invalid."
        );

        console.error(
            "===================================="
        );

        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });

    }


    try {

        // --------------------------------------------------
        // Extract Token
        // --------------------------------------------------
        const token =
            authHeader.split(" ")[1];


        if (!token) {

            console.error(
                "===================================="
            );

            console.error(
                "JWT ERROR: TOKEN MISSING"
            );

            console.error(
                "===================================="
            );

            return res.status(401).json({
                success: false,
                message: "Authentication token missing."
            });

        }


        // --------------------------------------------------
        // Check JWT Secret
        // --------------------------------------------------
        if (!process.env.JWT_SECRET) {

            console.error(
                "===================================="
            );

            console.error(
                "JWT CONFIGURATION ERROR"
            );

            console.error(
                "JWT_SECRET is not configured."
            );

            console.error(
                "===================================="
            );

            return res.status(500).json({
                success: false,
                message: "Authentication configuration error."
            });

        }


        // --------------------------------------------------
        // Verify JWT
        // --------------------------------------------------
        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // --------------------------------------------------
        // Attach User To Request
        // --------------------------------------------------
        req.user =
            decoded;


        // --------------------------------------------------
        // Debug Information
        // DO NOT LOG THE ACTUAL TOKEN
        // --------------------------------------------------
        console.log(
            "===================================="
        );

        console.log(
            "JWT AUTHENTICATION SUCCESS"
        );

        console.log(
            "User ID:",
            decoded?.userId ||
            decoded?.id ||
            decoded?._id ||
            "NOT FOUND"
        );

        console.log(
            "Role:",
            decoded?.role ||
            "NOT FOUND"
        );

        console.log(
            "Is Verified:",
            decoded?.isVerified
        );

        console.log(
            "JWT Secret Available:",
            true
        );

        console.log(
            "===================================="
        );


        next();

    } catch (error) {

        // --------------------------------------------------
        // Detailed JWT Error
        // --------------------------------------------------
        console.error(
            "===================================="
        );

        console.error(
            "JWT AUTHENTICATION ERROR"
        );

        console.error(
            "Error Name:",
            error?.name
        );

        console.error(
            "Error Message:",
            error?.message
        );

        console.error(
            "JWT_SECRET Exists:",
            !!process.env.JWT_SECRET
        );

        console.error(
            "JWT_SECRET Length:",
            process.env.JWT_SECRET
                ? process.env.JWT_SECRET.length
                : 0
        );

        console.error(
            "===================================="
        );


        // --------------------------------------------------
        // Specific JWT Errors
        // --------------------------------------------------

        if (
            error?.name ===
            "TokenExpiredError"
        ) {

            return res.status(401).json({
                success: false,
                message: "Authentication token has expired."
            });

        }


        if (
            error?.name ===
            "JsonWebTokenError"
        ) {

            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });

        }


        if (
            error?.name ===
            "NotBeforeError"
        ) {

            return res.status(401).json({
                success: false,
                message: "Authentication token is not active yet."
            });

        }


        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });

    }

};


// ======================================================
// Optional Authentication
// Public routes can still identify logged-in users
// ======================================================
const optionalAuth = (
    req,
    res,
    next
) => {

    const authHeader =
        req.headers.authorization;


    // --------------------------------------------------
    // No Authorization Header
    // --------------------------------------------------
    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {

        req.user = null;

        return next();

    }


    try {

        // --------------------------------------------------
        // Extract Token
        // --------------------------------------------------
        const token =
            authHeader.split(" ")[1];


        if (
            !token ||
            !process.env.JWT_SECRET
        ) {

            req.user = null;

            return next();

        }


        // --------------------------------------------------
        // Verify Token
        // --------------------------------------------------
        req.user =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


    } catch (error) {

        // --------------------------------------------------
        // Optional Authentication Should NEVER
        // Block Public Routes
        // --------------------------------------------------
        req.user = null;

        console.warn(
            "Optional authentication failed:",
            error?.message
        );

    }


    next();

};


// ======================================================
// Admin Only
// ======================================================
const adminOnly = (
    req,
    res,
    next
) => {

    console.log(
        "===================================="
    );

    console.log(
        "ADMIN CHECK"
    );

    console.log(
        "Authorization:",
        req.headers.authorization
            ? "PRESENT"
            : "MISSING"
    );

    console.log(
        "REQ.USER:",
        req.user
    );

    console.log(
        "ROLE:",
        req.user?.role
    );

    console.log(
        "===================================="


    );


    // --------------------------------------------------
    // User Not Authenticated
    // --------------------------------------------------
    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });

    }


    // --------------------------------------------------
    // Normalize Role
    // --------------------------------------------------
    const role =
        String(
            req.user.role ||
            ""
        )
            .trim()
            .toLowerCase();


    // --------------------------------------------------
    // Admin Check
    // --------------------------------------------------
    if (
        role !== "admin"
    ) {

        return res.status(403).json({

            success: false,

            message:
                "Admin access required.",

            debugRole:
                role,

            debugUserId:
                req.user.userId ||
                req.user.id ||
                req.user._id ||
                null

        });

    }


    next();

};


// ======================================================
// Verified Professionals Only
// ======================================================
const verifiedOnly = (
    req,
    res,
    next
) => {

    // --------------------------------------------------
    // Authentication Check
    // --------------------------------------------------
    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });

    }


    // --------------------------------------------------
    // Verification Check
    // --------------------------------------------------
    if (
        !req.user.isVerified
    ) {

        return res.status(403).json({
            success: false,
            message:
                "Only verified professionals can perform this action."
        });

    }


    next();

};


// ======================================================
// EXPORTS
// ======================================================
module.exports = {

    protect,

    optionalAuth,

    adminOnly,

    verifiedOnly

};