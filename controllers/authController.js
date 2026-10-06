
const User = require("../models/User");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../services/emailService");

// ============================================================
// CONSTANTS
// ============================================================

const OTP_EXPIRY_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

// ============================================================
// DEVELOPMENT OTP MODE
// ============================================================
//
// LOCAL DEVELOPMENT:
// Add this to .env:
//
// DEV_OTP_MODE=true
//
// OTP will be printed in the backend terminal instead of
// being sent through Gmail.
//
// PRODUCTION:
// DEV_OTP_MODE=false
//
// Gmail API will be used normally.
//
// ============================================================

const DEV_OTP_MODE =
    process.env.DEV_OTP_MODE === "true";
    console.log("🔧 LYNKTODAY DEV_OTP_MODE:", DEV_OTP_MODE);

// ============================================================
// HELPERS
// ============================================================

// ============================================================
// GENERATE JWT
// ============================================================

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role,
            isVerified: user.isVerified,
            verificationStatus: user.verificationStatus,
            emailVerified: user.emailVerified
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "30d"
        }
    );
};

// ============================================================
// GENERATE OTP
// ============================================================

const generateOtp = () => {
    return crypto
        .randomInt(100000, 1000000)
        .toString();
};

// ============================================================
// HASH OTP
// ============================================================

const hashOtp = (otp) => {
    return crypto
        .createHash("sha256")
        .update(String(otp))
        .digest("hex");
};

// ============================================================
// NORMALIZE EMAIL
// ============================================================

const normalizeEmail = (email) => {
    return String(email || "")
        .trim()
        .toLowerCase();
};

// ============================================================
// ESCAPE HTML
// ============================================================

const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// ============================================================
// GET SECONDS SINCE
// ============================================================

const getSecondsSince = (date) => {

    if (!date) {
        return Infinity;
    }

    return Math.floor(
        (
            Date.now() -
            new Date(date).getTime()
        ) / 1000
    );
};

// ============================================================
// CHECK OTP EXPIRY
// ============================================================

const isOtpExpired = (expiresAt) => {

    return (
        !expiresAt ||
        new Date(expiresAt) < new Date()
    );
};

// ============================================================
// CHECK OTP VALID
// ============================================================

const isOtpValid = (
    otp,
    expiresAt
) => {

    return (
        otp &&
        expiresAt &&
        new Date() < new Date(expiresAt)
    );
};

// ============================================================
// OTP EXPIRY
// ============================================================

const getOtpExpiry = () => {

    return new Date(
        Date.now() +
        OTP_EXPIRY_MINUTES *
        60 *
        1000
    );
};

// ============================================================
// EMAIL TEMPLATES
// ============================================================

const createOtpEmailHtml = (
    title,
    message,
    otp,
    footerText
) => {

    const safeOtp =
        escapeHtml(otp);

    return `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            color: #1f2937;
            background: #ffffff;
        ">

            <h2 style="
                color: #4B5563;
                margin-bottom: 20px;
            ">
                ${title}
            </h2>

            <p>
                ${message}
            </p>

            <div style="
                text-align: center;
                margin: 30px 0;
            ">

                <span style="
                    display: inline-block;
                    padding: 15px 28px;
                    background: #f3f4f6;
                    border: 1px solid #d1d5db;
                    border-radius: 10px;
                    color: #4B5563;
                    font-size: 32px;
                    font-weight: 700;
                    letter-spacing: 8px;
                ">
                    ${safeOtp}
                </span>

            </div>

            <p>
                This OTP will expire in
                <strong>
                    ${OTP_EXPIRY_MINUTES} minutes
                </strong>.
            </p>

            <p>
                ${footerText}
            </p>

            <hr style="
                margin: 30px 0;
                border: none;
                border-top: 1px solid #e5e7eb;
            " />

            <p style="
                color: #9ca3af;
                font-size: 12px;
                text-align: center;
            ">
                © LynkToday. All rights reserved.
            </p>

        </div>
    `;
};

// ============================================================
// SEND VERIFICATION EMAIL
// ============================================================

const sendVerificationEmail = async (
    email,
    fullName,
    otp
) => {

    const safeName =
        escapeHtml(fullName || "there");

    await sendEmail({

        to: email,

        subject:
            "Verify your LynkToday email",

        text: `
Welcome to LynkToday

Hi ${fullName || "there"},

Thank you for creating your LynkToday account.

Please use the OTP below to verify your email address:

${otp}

This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.

If you did not create this account, you can safely ignore this email.

© LynkToday. All rights reserved.
        `.trim(),

        html: createOtpEmailHtml(
            "Welcome to LynkToday",
            `Hi ${safeName},<br><br>
             Thank you for creating your LynkToday account.<br><br>
             Please use the OTP below to verify your email address:`,
            otp,
            "If you did not create this account, you can safely ignore this email."
        )
    });
};

// ============================================================
// SEND PASSWORD RESET EMAIL
// ============================================================

const sendPasswordResetEmail = async (
    email,
    fullName,
    otp
) => {

    const safeName =
        escapeHtml(fullName || "there");

    await sendEmail({

        to: email,

        subject:
            "LynkToday password reset OTP",

        text: `
Reset your LynkToday password

Hi ${fullName || "there"},

We received a request to reset your LynkToday password.

Use the OTP below to continue:

${otp}

This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.

If you did not request a password reset, you can safely ignore this email.

© LynkToday. All rights reserved.
        `.trim(),

        html: createOtpEmailHtml(
            "Reset your LynkToday password",
            `Hi ${safeName},<br><br>
             We received a request to reset your LynkToday password.<br><br>
             Use the OTP below to continue:`,
            otp,
            "If you did not request a password reset, you can safely ignore this email."
        )
    });
};

// ============================================================
// DELIVER VERIFICATION OTP
// ============================================================

const deliverVerificationOtp = async (
    email,
    fullName,
    otp
) => {

    // --------------------------------------------------------
    // DEVELOPMENT MODE
    // --------------------------------------------------------

    if (DEV_OTP_MODE) {

        console.log("");

        console.log(
            "============================================================"
        );

        console.log(
            "🔐 DEVELOPMENT VERIFICATION OTP"
        );

        console.log(
            "============================================================"
        );

        console.log(
            "Email :",
            email
        );

        console.log(
            "Name  :",
            fullName || "there"
        );

        console.log(
            "OTP   :",
            otp
        );

        console.log(
            "Expires in :",
            `${OTP_EXPIRY_MINUTES} minutes`
        );

        console.log(
            "============================================================"
        );

        console.log("");

        return;
    }

    // --------------------------------------------------------
    // PRODUCTION MODE
    // --------------------------------------------------------

    await sendVerificationEmail(
        email,
        fullName,
        otp
    );
};

// ============================================================
// DELIVER PASSWORD RESET OTP
// ============================================================

const deliverPasswordResetOtp = async (
    email,
    fullName,
    otp
) => {

    // --------------------------------------------------------
    // DEVELOPMENT MODE
    // --------------------------------------------------------

    if (DEV_OTP_MODE) {

        console.log("");

        console.log(
            "============================================================"
        );

        console.log(
            "🔐 DEVELOPMENT PASSWORD RESET OTP"
        );

        console.log(
            "============================================================"
        );

        console.log(
            "Email :",
            email
        );

        console.log(
            "Name  :",
            fullName || "there"
        );

        console.log(
            "OTP   :",
            otp
        );

        console.log(
            "Expires in :",
            `${OTP_EXPIRY_MINUTES} minutes`
        );

        console.log(
            "============================================================"
        );

        console.log("");

        return;
    }

    // --------------------------------------------------------
    // PRODUCTION MODE
    // --------------------------------------------------------

    await sendPasswordResetEmail(
        email,
        fullName,
        otp
    );
};

// ============================================================
// SIGNUP
// POST /api/v1/auth/signup
// ============================================================

exports.signup = async (
    req,
    res,
    next
) => {

    try {

        const {
            fullName,
            email,
            password,
            accountType,
            companyName,
            profession,
            designation,
            bio,
            location,
            tradeIntent,
            agreeToTerms
        } = req.body;

        // ------------------------------------------------------
        // VALIDATION
        // ------------------------------------------------------

        if (
            !fullName ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Full name, email and password are required."

            });
        }

        if (password.length < 8) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 8 characters long."

            });
        }

        if (agreeToTerms === false) {

            return res.status(400).json({

                success: false,

                message:
                    "You must agree to the Terms and Conditions."

            });
        }

        // ------------------------------------------------------
        // NORMALIZE EMAIL
        // ------------------------------------------------------

        const normalizedEmail =
            normalizeEmail(email);

        // ------------------------------------------------------
        // CHECK EXISTING USER
        // ------------------------------------------------------

        let user =
            await User.findOne({
                email: normalizedEmail
            });

        // ------------------------------------------------------
        // EXISTING UNVERIFIED USER
        // ------------------------------------------------------

        if (
            user &&
            !user.emailVerified
        ) {

            const otp =
                generateOtp();

            user.emailVerificationOtp =
                hashOtp(otp);

            user.emailVerificationOtpExpires =
                getOtpExpiry();

            user.emailVerificationAttempts =
                0;

            user.emailVerificationLastSentAt =
                new Date();

            await user.save();

            // --------------------------------------------------
            // SEND OTP IN BACKGROUND
            // --------------------------------------------------

            deliverVerificationOtp(
                user.email,
                user.fullName,
                otp
            )
                .then(() => {

                    console.log(
                        "✅ Verification OTP delivered:",
                        user.email
                    );

                })
                .catch((error) => {

                    console.error(
                        "❌ Background verification OTP delivery failed:",
                        error?.response?.data ||
                        error?.message ||
                        error
                    );

                });

            // --------------------------------------------------
            // RESPOND IMMEDIATELY
            // --------------------------------------------------

            return res.status(200).json({

                success: true,

                existingAccount: true,

                requiresVerification: true,

                email:
                    user.email,

                message:
                    "Your account already exists and is not verified. A new verification OTP has been sent."

            });
        }

        // ------------------------------------------------------
        // EXISTING VERIFIED USER
        // ------------------------------------------------------

        if (user) {

            return res.status(409).json({

                success: false,

                message:
                    "An account with this email already exists. Please log in."

            });
        }

        // ------------------------------------------------------
        // GENERATE OTP
        // ------------------------------------------------------

        const otp =
            generateOtp();

        // ------------------------------------------------------
        // CREATE USER
        // ------------------------------------------------------

        user =
            new User({

                fullName:
                    fullName.trim(),

                accountType:
                    accountType === "company"
                        ? "company"
                        : "individual",

                email:
                    normalizedEmail,

                password,

                companyName:
                    companyName || "",

                profession:
                    profession || "",

                designation:
                    designation || "",

                bio:
                    bio || "",

                location:
                    location || "",

                tradeIntent:
                    tradeIntent || "Both",

                agreeToTerms:
                    agreeToTerms !== false,

                emailVerified:
                    false,

                isVerified:
                    false,

                verificationStatus:
                    "pending",

                emailVerificationOtp:
                    hashOtp(otp),

                emailVerificationOtpExpires:
                    getOtpExpiry(),

                emailVerificationAttempts:
                    0,

                emailVerificationLastSentAt:
                    new Date()

            });

        // ------------------------------------------------------
        // SAVE USER
        // ------------------------------------------------------

        await user.save();

        // ------------------------------------------------------
        // SEND VERIFICATION OTP IN BACKGROUND
        // ------------------------------------------------------

        deliverVerificationOtp(
            user.email,
            user.fullName,
            otp
        )
            .then(() => {

                console.log(
                    "✅ Signup verification OTP delivered:",
                    user.email
                );

            })
            .catch((error) => {

                console.error(
                    "❌ Signup verification OTP delivery failed:",
                    error?.response?.data ||
                    error?.message ||
                    error
                );

            });

        // ------------------------------------------------------
        // RESPOND IMMEDIATELY
        // ------------------------------------------------------

        return res.status(201).json({

            success: true,

            requiresVerification:
                true,

            email:
                user.email,

            message:
                "Account created successfully. Please check your email for the verification OTP."

        });

    } catch (error) {

        next(error);

    }
};

// ============================================================
// VERIFY EMAIL
// POST /api/v1/auth/verify-email
// ============================================================

exports.verifyEmail = async (
    req,
    res,
    next
) => {

    try {

        const {
            email,
            otp
        } = req.body;

        if (
            !email ||
            !otp
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and OTP are required."

            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        const user =
            await User.findOne({
                email: normalizedEmail
            }).select(
                "+emailVerificationOtp " +
                "+emailVerificationOtpExpires " +
                "+emailVerificationAttempts"
            );

        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "Account not found."

            });
        }

        if (
            user.emailVerified
        ) {

            return res.status(200).json({

                success: true,

                alreadyVerified:
                    true,

                message:
                    "Email is already verified."

            });
        }

        // ------------------------------------------------------
        // OTP EXISTS
        // ------------------------------------------------------

        if (
            !user.emailVerificationOtp
        ) {

            return res.status(400).json({

                success: false,

                code:
                    "OTP_NOT_FOUND",

                message:
                    "No active verification OTP was found. Please request a new OTP."

            });
        }

        // ------------------------------------------------------
        // OTP EXPIRY
        // ------------------------------------------------------

        if (
            isOtpExpired(
                user.emailVerificationOtpExpires
            )
        ) {

            user.emailVerificationOtp =
                null;

            user.emailVerificationOtpExpires =
                null;

            user.emailVerificationAttempts =
                0;

            await user.save();

            return res.status(400).json({

                success: false,

                code:
                    "OTP_EXPIRED",

                message:
                    "This OTP has expired. Please request a new verification OTP."

            });
        }

        // ------------------------------------------------------
        // MAX ATTEMPTS
        // ------------------------------------------------------

        if (
            user.emailVerificationAttempts >=
            MAX_OTP_ATTEMPTS
        ) {

            return res.status(429).json({

                success: false,

                code:
                    "TOO_MANY_ATTEMPTS",

                message:
                    "Too many incorrect attempts. Please request a new OTP."

            });
        }

        // ------------------------------------------------------
        // CHECK OTP
        // ------------------------------------------------------

        const hashedOtp =
            hashOtp(
                String(otp).trim()
            );

        if (
            hashedOtp !==
            user.emailVerificationOtp
        ) {

            user.emailVerificationAttempts +=
                1;

            await user.save();

            return res.status(400).json({

                success: false,

                code:
                    "INVALID_OTP",

                message:
                    "Invalid OTP. Please check the code and try again."

            });
        }

        // ------------------------------------------------------
        // VERIFY EMAIL
        // ------------------------------------------------------

        user.emailVerified =
            true;

        user.emailVerificationOtp =
            null;

        user.emailVerificationOtpExpires =
            null;

        user.emailVerificationAttempts =
            0;

        user.emailVerificationLastSentAt =
            null;

        await user.save();

        return res.status(200).json({

            success: true,

            message:
                "Email verified successfully. You can now log in."

        });

    } catch (error) {

        next(error);

    }
};
// ============================================================
// RESEND VERIFICATION OTP
// POST /api/v1/auth/resend-verification
// ============================================================

exports.resendVerification = async (
    req,
    res,
    next
) => {

    try {

        const {
            email
        } = req.body;

        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required."

            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        const user =
            await User.findOne({
                email: normalizedEmail
            }).select(
                "+emailVerificationOtp " +
                "+emailVerificationOtpExpires " +
                "+emailVerificationAttempts " +
                "+emailVerificationLastSentAt"
            );

        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "No account was found with this email."

            });
        }

        if (
            user.emailVerified
        ) {

            return res.status(400).json({

                success: false,

                code:
                    "EMAIL_ALREADY_VERIFIED",

                message:
                    "This email is already verified. Please log in."

            });
        }

        // ------------------------------------------------------
        // COOLDOWN
        // ------------------------------------------------------

        const secondsPassed =
            getSecondsSince(
                user.emailVerificationLastSentAt
            );

        if (
            secondsPassed <
            OTP_COOLDOWN_SECONDS
        ) {

            return res.status(429).json({

                success: false,

                message:
                    `Please wait ${
                        OTP_COOLDOWN_SECONDS -
                        secondsPassed
                    } seconds before requesting another OTP.`

            });
        }

        // ------------------------------------------------------
        // NEW OTP
        // ------------------------------------------------------

        const otp =
            generateOtp();

        user.emailVerificationOtp =
            hashOtp(otp);

        user.emailVerificationOtpExpires =
            getOtpExpiry();

        user.emailVerificationAttempts =
            0;

        user.emailVerificationLastSentAt =
            new Date();

        await user.save();

        // ------------------------------------------------------
        // DELIVER OTP
        // ------------------------------------------------------

        try {

            await deliverVerificationOtp(
                user.email,
                user.fullName,
                otp
            );

            console.log(
                "✅ Verification OTP delivered:",
                user.email
            );

        } catch (emailError) {

            console.error(
                "❌ Resend verification OTP error:",
                emailError?.response?.data ||
                emailError?.message ||
                emailError
            );

            user.emailVerificationOtp =
                null;

            user.emailVerificationOtpExpires =
                null;

            user.emailVerificationLastSentAt =
                null;

            await user.save();

            return res.status(500).json({

                success: false,

                code:
                    "EMAIL_SEND_FAILED",

                message:
                    "Unable to send verification email. Please try again later."

            });
        }

        return res.status(200).json({

            success: true,

            message:
                "A new verification OTP has been sent to your email."

        });

    } catch (error) {

        next(error);

    }
};

// ============================================================
// LOGIN
// POST /api/v1/auth/login
// ============================================================

exports.login = async (
    req,
    res,
    next
) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide email and password."

            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        const user =
            await User.findOne({
                email: normalizedEmail
            }).select(
                "+password " +
                "+emailVerificationOtp " +
                "+emailVerificationOtpExpires " +
                "+emailVerificationAttempts " +
                "+emailVerificationLastSentAt"
            );

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });
        }

        if (
            user.isActive === false
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is currently inactive. Please contact LynkToday support."

            });
        }

        const isMatch =
            await user.matchPassword(
                password
            );

        if (!isMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });
        }

        // ------------------------------------------------------
        // EMAIL VERIFICATION REQUIRED
        // ------------------------------------------------------

        if (
            !user.emailVerified
        ) {

            let otpWasSent =
                false;

            let otpMessage =
                "Please verify your email before logging in.";

            const existingOtpIsValid =
                isOtpValid(
                    user.emailVerificationOtp,
                    user.emailVerificationOtpExpires
                );

            const secondsPassed =
                getSecondsSince(
                    user.emailVerificationLastSentAt
                );

            const canSendOtp =
                secondsPassed >=
                OTP_COOLDOWN_SECONDS;

            if (
                !existingOtpIsValid ||
                canSendOtp
            ) {

                const otp =
                    generateOtp();

                user.emailVerificationOtp =
                    hashOtp(otp);

                user.emailVerificationOtpExpires =
                    getOtpExpiry();

                user.emailVerificationAttempts =
                    0;

                user.emailVerificationLastSentAt =
                    new Date();

                await user.save();

                try {

                    await deliverVerificationOtp(
                        user.email,
                        user.fullName,
                        otp
                    );

                    otpWasSent =
                        true;

                    otpMessage =
                        "Your email is not verified. A new verification OTP has been sent to your email.";

                } catch (emailError) {

                    console.error(
                        "LOGIN VERIFICATION OTP ERROR:",
                        emailError?.response?.data ||
                        emailError?.message ||
                        emailError
                    );

                    user.emailVerificationOtp =
                        null;

                    user.emailVerificationOtpExpires =
                        null;

                    user.emailVerificationLastSentAt =
                        null;

                    await user.save();

                    return res.status(500).json({

                        success: false,

                        message:
                            "Your email is not verified and we could not send a new OTP. Please try again."

                    });
                }

            } else {

                otpMessage =
                    "Your email is not verified. Please enter the OTP already sent to your email.";

            }

            return res.status(403).json({

                success: false,

                code:
                    "EMAIL_NOT_VERIFIED",

                message:
                    otpMessage,

                email:
                    user.email,

                otpSent:
                    otpWasSent,

                requiresEmailVerification:
                    true

            });
        }

        // ------------------------------------------------------
        // VERIFIED USER
        // ------------------------------------------------------

        const token =
            generateToken(user);

        return res.status(200).json({

            success: true,

            message:
                `Welcome back, ${user.fullName}!`,

            token,

            user: {

                _id:
                    user._id,

                accountType:
                    user.accountType,

                fullName:
                    user.fullName,

                email:
                    user.email,

                companyName:
                    user.companyName,

                profession:
                    user.profession,

                location:
                    user.location,

                tradeIntent:
                    user.tradeIntent,

                role:
                    user.role,

                isVerified:
                    user.isVerified,

                verificationStatus:
                    user.verificationStatus,

                emailVerified:
                    user.emailVerified

            }

        });

    } catch (error) {

        next(error);

    }
};

// ============================================================
// FORGOT PASSWORD
// POST /api/v1/auth/forgot-password
// ============================================================

exports.forgotPassword = async (
    req,
    res,
    next
) => {

    try {

        const {
            email
        } = req.body;

        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required."

            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        const user =
            await User.findOne({
                email: normalizedEmail
            }).select(
                "+passwordResetOtp " +
                "+passwordResetOtpExpires " +
                "+passwordResetAttempts " +
                "+passwordResetLastSentAt"
            );

        // ------------------------------------------------------
        // DO NOT REVEAL WHETHER ACCOUNT EXISTS
        // ------------------------------------------------------

        if (!user) {

            return res.status(200).json({

                success: true,

                message:
                    "If an account exists with this email, a password reset OTP has been sent."

            });
        }

        // ------------------------------------------------------
        // COOLDOWN
        // ------------------------------------------------------

        const secondsPassed =
            getSecondsSince(
                user.passwordResetLastSentAt
            );

        if (
            secondsPassed <
            OTP_COOLDOWN_SECONDS
        ) {

            return res.status(429).json({

                success: false,

                message:
                    `Please wait ${
                        OTP_COOLDOWN_SECONDS -
                        secondsPassed
                    } seconds before requesting another password reset OTP.`

            });
        }

        // ------------------------------------------------------
        // GENERATE OTP
        // ------------------------------------------------------

        const otp =
            generateOtp();

        user.passwordResetOtp =
            hashOtp(otp);

        user.passwordResetOtpExpires =
            getOtpExpiry();

        user.passwordResetAttempts =
            0;

        user.passwordResetLastSentAt =
            new Date();

        await user.save();

        // ------------------------------------------------------
        // DELIVER PASSWORD RESET OTP
        // ------------------------------------------------------

        try {

            await deliverPasswordResetOtp(
                user.email,
                user.fullName,
                otp
            );

            console.log(
                "✅ Password reset OTP delivered:",
                user.email
            );

        } catch (emailError) {

            console.error(
                "❌ Password reset OTP error:",
                emailError?.response?.data ||
                emailError?.message ||
                emailError
            );

            user.passwordResetOtp =
                null;

            user.passwordResetOtpExpires =
                null;

            user.passwordResetLastSentAt =
                null;

            await user.save();

            return res.status(500).json({

                success: false,

                code:
                    "EMAIL_SEND_FAILED",

                message:
                    "Unable to send the password reset email. Please try again later."

            });
        }

        return res.status(200).json({

            success: true,

            message:
                "If an account exists with this email, a password reset OTP has been sent.",

            email:
                user.email

        });

    } catch (error) {

        next(error);

    }
};

// ============================================================
// VERIFY RESET OTP
// POST /api/v1/auth/verify-reset-otp
// ============================================================

exports.verifyResetOtp = async (
    req,
    res,
    next
) => {

    try {

        const {
            email,
            otp
        } = req.body;

        if (
            !email ||
            !otp
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and OTP are required."

            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        const user =
            await User.findOne({
                email: normalizedEmail
            }).select(
                "+passwordResetOtp " +
                "+passwordResetOtpExpires " +
                "+passwordResetAttempts"
            );

        if (
            !user ||
            !user.passwordResetOtp
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid or expired reset OTP."

            });
        }

        if (
            isOtpExpired(
                user.passwordResetOtpExpires
            )
        ) {

            user.passwordResetOtp =
                null;

            user.passwordResetOtpExpires =
                null;

            user.passwordResetAttempts =
                0;

            await user.save();

            return res.status(400).json({

                success: false,

                code:
                    "OTP_EXPIRED",

                message:
                    "This reset OTP has expired. Please request a new one."

            });
        }

        if (
            user.passwordResetAttempts >=
            MAX_OTP_ATTEMPTS
        ) {

            return res.status(429).json({

                success: false,

                message:
                    "Too many incorrect attempts. Please request a new OTP."

            });
        }

        const hashedOtp =
            hashOtp(
                String(otp).trim()
            );

        if (
            hashedOtp !==
            user.passwordResetOtp
        ) {

            user.passwordResetAttempts +=
                1;

            await user.save();

            return res.status(400).json({

                success: false,

                code:
                    "INVALID_OTP",

                message:
                    "Invalid reset OTP."

            });
        }

        // OTP intentionally remains active.
        // resetPassword() verifies it again.

        return res.status(200).json({

            success: true,

            message:
                "OTP verified. You can now reset your password."

        });

    } catch (error) {

        next(error);

    }
};

// ============================================================
// RESET PASSWORD
// POST /api/v1/auth/reset-password
// ============================================================

exports.resetPassword = async (
    req,
    res,
    next
) => {

    try {

        const {
            email,
            otp,
            newPassword
        } = req.body;

        if (
            !email ||
            !otp ||
            !newPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email, OTP and new password are required."

            });
        }

        if (
            newPassword.length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 6 characters."

            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        const user =
            await User.findOne({
                email: normalizedEmail
            }).select(
                "+password " +
                "+passwordResetOtp " +
                "+passwordResetOtpExpires " +
                "+passwordResetAttempts"
            );

        if (
            !user ||
            !user.passwordResetOtp
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid or expired reset OTP."

            });
        }

        if (
            isOtpExpired(
                user.passwordResetOtpExpires
            )
        ) {

            user.passwordResetOtp =
                null;

            user.passwordResetOtpExpires =
                null;

            user.passwordResetAttempts =
                0;

            await user.save();

            return res.status(400).json({

                success: false,

                code:
                    "OTP_EXPIRED",

                message:
                    "This reset OTP has expired. Please request a new one."

            });
        }

        if (
            user.passwordResetAttempts >=
            MAX_OTP_ATTEMPTS
        ) {

            return res.status(429).json({

                success: false,

                message:
                    "Too many incorrect attempts. Please request a new OTP."

            });
        }

        // ------------------------------------------------------
        // ALWAYS VERIFY OTP AGAIN
        // ------------------------------------------------------

        const hashedOtp =
            hashOtp(
                String(otp).trim()
            );

        if (
            hashedOtp !==
            user.passwordResetOtp
        ) {

            user.passwordResetAttempts +=
                1;

            await user.save();

            return res.status(400).json({

                success: false,

                code:
                    "INVALID_OTP",

                message:
                    "Invalid reset OTP."

            });
        }

        // ------------------------------------------------------
        // UPDATE PASSWORD
        // ------------------------------------------------------

        user.password =
            newPassword;

        // ------------------------------------------------------
        // CLEAR RESET DATA
        // ------------------------------------------------------

        user.passwordResetOtp =
            null;

        user.passwordResetOtpExpires =
            null;

        user.passwordResetAttempts =
            0;

        user.passwordResetLastSentAt =
            null;

        await user.save();

        return res.status(200).json({

            success: true,

            message:
                "Password reset successfully. You can now log in."

        });

    } catch (error) {

        next(error);

    }
};

// ============================================================
// LOCAL DEVELOPMENT .ENV
// ============================================================
//
// DEV_OTP_MODE=true
//
// PRODUCTION:
// DEV_OTP_MODE=false
//
// ============================================================