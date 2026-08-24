const jwt = require("jsonwebtoken");

// ======================================================
// Protect Routes
// ======================================================
const protect = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    try {

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

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
const optionalAuth = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (
        authHeader &&
        authHeader.startsWith("Bearer ")
    ) {
        try {

            const token = authHeader.split(" ")[1];

            req.user = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        } catch (err) {
            req.user = null;
        }
    }

    next();

};

// ======================================================
// Admin Only
// ======================================================
const adminOnly = (req, res, next) => {

    console.log("====================================");
    console.log("ADMIN CHECK");
    console.log("Authorization:", req.headers.authorization ? "PRESENT" : "MISSING");
    console.log("REQ.USER:", req.user);
    console.log("ROLE:", req.user?.role);
    console.log("====================================");

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });

    }

    const role =
        String(req.user.role || "")
            .trim()
            .toLowerCase();

    if (role !== "admin") {

        return res.status(403).json({
            success: false,
            message: "Admin access required.",
            debugRole: role,
            debugUserId: req.user.userId
        });

    }

    next();

};
// ======================================================
// Verified Professionals Only
// ======================================================
const verifiedOnly = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    if (!req.user.isVerified) {
        return res.status(403).json({
            success: false,
            message: "Only verified professionals can perform this action."
        });
    }

    next();

};

module.exports = {
    protect,
    optionalAuth,
    adminOnly,
    verifiedOnly
};