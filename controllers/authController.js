const User = require("../models/User");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ============================================================
// EMAIL TRANSPORTER - GMAIL OAUTH 2.0
// ============================================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        type: "OAuth2",

        user:
            process.env.EMAIL_USER,

        clientId:
            process.env.GOOGLE_CLIENT_ID,

        clientSecret:
            process.env.GOOGLE_CLIENT_SECRET,

        refreshToken:
            process.env.GOOGLE_REFRESH_TOKEN

    }

});

// ============================================================
// GENERATE JWT
// ============================================================

const generateToken = (user) => {

    return jwt.sign(

        {
            userId:
                user._id,

            role:
                user.role,

            isVerified:
                user.isVerified,

            verificationStatus:
                user.verificationStatus,

            emailVerified:
                user.emailVerified

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
        .randomInt(
            100000,
            1000000
        )
        .toString();

};

// ============================================================
// HASH OTP
// ============================================================

const hashOtp = (otp) => {

    return crypto
        .createHash("sha256")
        .update(otp)
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
// SEND VERIFICATION EMAIL
// ============================================================

const sendVerificationEmail = async (
    email,
    fullName,
    otp
) => {

    await transporter.sendMail({

        from:
            `"LynkToday" <${process.env.EMAIL_USER}>`,

        to:
            email,

        subject:
            "Verify your LynkToday email",

        html: `

            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                color: #1f2937;
            ">

                <h2 style="
                    color: #4B5563;
                    margin-bottom: 20px;
                ">
                    Welcome to LynkToday
                </h2>

                <p>
                    Hi ${fullName || "there"},
                </p>

                <p>
                    Thank you for creating your LynkToday account.
                </p>

                <p>
                    Please use the OTP below to verify your email address:
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
                        ${otp}
                    </span>

                </div>

                <p>
                    This OTP will expire in
                    <strong>10 minutes</strong>.
                </p>

                <p>
                    If you did not create this account,
                    you can safely ignore this email.
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

        `

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

    await transporter.sendMail({

        from:
            `"LynkToday" <${process.env.EMAIL_USER}>`,

        to:
            email,

        subject:
            "LynkToday password reset OTP",

        html: `

            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                color: #1f2937;
            ">

                <h2 style="
                    color: #4B5563;
                    margin-bottom: 20px;
                ">
                    Reset your LynkToday password
                </h2>

                <p>
                    Hi ${fullName || "there"},
                </p>

                <p>
                    We received a request to reset your LynkToday password.
                </p>

                <p>
                    Use the OTP below to continue:
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
                        ${otp}
                    </span>

                </div>

                <p>
                    This OTP will expire in
                    <strong>10 minutes</strong>.
                </p>

                <p>
                    If you did not request a password reset,
                    you can safely ignore this email.
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

        `

    });

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
            companyName,
            profession,
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

        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 6 characters."

            });

        }

        if (agreeToTerms === false) {

            return res.status(400).json({

                success: false,

                message:
                    "You must agree to the terms and conditions."

            });

        }

        const normalizedEmail =
            normalizeEmail(email);

        // ------------------------------------------------------
        // CHECK EXISTING USER
        // ------------------------------------------------------

        let user =
            await User.findOne({
                email: normalizedEmail
            }).select(
                "+emailVerificationOtp " +
                "+emailVerificationOtpExpires " +
                "+emailVerificationAttempts " +
                "+emailVerificationLastSentAt"
            );

        // ------------------------------------------------------
        // EXISTING UNVERIFIED USER
        //
        // Instead of creating a duplicate account,
        // generate a new verification OTP.
        // ------------------------------------------------------

        if (user && !user.emailVerified) {

            const secondsPassed =
                user.emailVerificationLastSentAt
                    ? Math.floor(
                        (
                            Date.now() -
                            new Date(
                                user.emailVerificationLastSentAt
                            ).getTime()
                        ) / 1000
                    )
                    : 999;

            if (secondsPassed < 60) {

                return res.status(429).json({

                    success: false,

                    code:
                        "EMAIL_NOT_VERIFIED",

                    message:
                        `An account already exists but is not verified. Please wait ${60 - secondsPassed} seconds before requesting another OTP.`,

                    email:
                        user.email

                });

            }

            const otp =
                generateOtp();

            user.emailVerificationOtp =
                hashOtp(otp);

            user.emailVerificationOtpExpires =
                new Date(
                    Date.now() +
                    10 * 60 * 1000
                );

            user.emailVerificationAttempts =
                0;

            user.emailVerificationLastSentAt =
                new Date();

            await user.save();

            try {

                await sendVerificationEmail(
                    user.email,
                    user.fullName,
                    otp
                );

            } catch (emailError) {

                console.error(
                    "Existing user verification email error:",
                    emailError
                );

                // Clear OTP because email wasn't sent.

                user.emailVerificationOtp =
                    null;

                user.emailVerificationOtpExpires =
                    null;

                await user.save();

                return res.status(500).json({

                    success: false,

                    message:
                        "Your account exists, but we could not send the verification email. Please try again."

                });

            }

            return res.status(200).json({

                success: true,

                existingAccount:
                    true,

                requiresVerification:
                    true,

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

                email:
                    normalizedEmail,

                password,

                companyName:
                    companyName || "",

                profession:
                    profession || "",

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
                    new Date(
                        Date.now() +
                        10 * 60 * 1000
                    ),

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
        // SEND OTP
        // ------------------------------------------------------

        try {

            await sendVerificationEmail(
                user.email,
                user.fullName,
                otp
            );

        } catch (emailError) {

            console.error(
                "Signup verification email error:",
                emailError
            );

            /*
             * Important:
             *
             * We keep the account because the user has
             * already registered.
             *
             * But remove the OTP so an invalid/stale OTP
             * cannot remain active.
             */

            user.emailVerificationOtp =
                null;

            user.emailVerificationOtpExpires =
                null;

            await user.save();

            return res.status(503).json({

                success: false,

                code:
                    "EMAIL_SEND_FAILED",

                message:
                    "Your account was created, but we could not send the verification email. Please use Resend OTP after a short while.",

                email:
                    user.email

            });

        }

        // ------------------------------------------------------
        // RESPONSE
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

        if (!email || !otp) {

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

        if (user.emailVerified) {

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

        if (!user.emailVerificationOtp) {

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
            !user.emailVerificationOtpExpires ||
            user.emailVerificationOtpExpires <
            new Date()
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
            user.emailVerificationAttempts >= 5
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

            user.emailVerificationAttempts += 1;

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
        // VERIFY USER
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
// RESEND VERIFICATION
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

        if (user.emailVerified) {

            return res.status(400).json({

                success: false,

                code:
                    "EMAIL_ALREADY_VERIFIED",

                message:
                    "This email is already verified. Please log in."

            });

        }

        // ------------------------------------------------------
        // RESEND COOLDOWN
        // ------------------------------------------------------

        if (
            user.emailVerificationLastSentAt
        ) {

            const secondsPassed =
                Math.floor(
                    (
                        Date.now() -
                        new Date(
                            user.emailVerificationLastSentAt
                        ).getTime()
                    ) / 1000
                );

            if (
                secondsPassed < 60
            ) {

                return res.status(429).json({

                    success: false,

                    message:
                        `Please wait ${60 - secondsPassed} seconds before requesting another OTP.`

                });

            }

        }

            // ------------------------------------------------------
        // NEW OTP
        // ------------------------------------------------------

        const otp =
            generateOtp();

        user.emailVerificationOtp =
            hashOtp(otp);

        user.emailVerificationOtpExpires =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );

        user.emailVerificationAttempts =
            0;

        user.emailVerificationLastSentAt =
            new Date();

        await user.save();

        // ------------------------------------------------------
        // SEND EMAIL
        // ------------------------------------------------------

        try {

            await sendVerificationEmail(
                user.email,
                user.fullName,
                otp
            );

        } catch (emailError) {

            console.error(
                "Resend verification email error:",
                emailError
            );

            user.emailVerificationOtp =
                null;

            user.emailVerificationOtpExpires =
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

        // ========================================================
        // VALIDATION
        // ========================================================

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide email and password."

            });

        }

        // ========================================================
        // NORMALIZE EMAIL
        // ========================================================

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();

        // ========================================================
        // FIND USER
        // ========================================================

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

        // ========================================================
        // USER NOT FOUND
        // ========================================================

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }

        // ========================================================
        // ACCOUNT STATUS
        // ========================================================

        if (
            user.isActive === false
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is currently inactive. Please contact LynkToday support."

            });

        }

        // ========================================================
        // PASSWORD
        // ========================================================

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

        // ========================================================
        // EMAIL NOT VERIFIED
        // ========================================================

        if (!user.emailVerified) {

            let otpWasSent = false;

            let otpMessage =
                "Please verify your email before logging in.";

            // ----------------------------------------------------
            // CHECK WHETHER EXISTING OTP IS STILL VALID
            // ----------------------------------------------------

            const existingOtpIsValid =
                user.emailVerificationOtp &&
                user.emailVerificationOtpExpires &&
                new Date() <
                    new Date(
                        user.emailVerificationOtpExpires
                    );

            // ----------------------------------------------------
            // CHECK 60 SECOND COOLDOWN
            // ----------------------------------------------------

            let canSendOtp = true;

            if (
                user.emailVerificationLastSentAt
            ) {

                const secondsPassed =
                    Math.floor(
                        (
                            Date.now() -
                            new Date(
                                user.emailVerificationLastSentAt
                            ).getTime()
                        ) / 1000
                    );

                if (
                    secondsPassed < 60
                ) {

                    canSendOtp = false;

                }

            }

            // ----------------------------------------------------
            // SEND NEW OTP
            // ----------------------------------------------------

            if (
                !existingOtpIsValid ||
                canSendOtp
            ) {

                const otp =
                    generateOtp();

                const hashedOtp =
                    hashOtp(otp);

                const otpExpires =
                    new Date(
                        Date.now() +
                        10 * 60 * 1000
                    );

                user.emailVerificationOtp =
                    hashedOtp;

                user.emailVerificationOtpExpires =
                    otpExpires;

                user.emailVerificationAttempts =
                    0;

                user.emailVerificationLastSentAt =
                    new Date();

                await user.save();

                try {

                    await sendVerificationEmail(
                        user.email,
                        user.fullName,
                        otp
                    );

                    otpWasSent = true;

                    otpMessage =
                        "Your email is not verified. A new verification OTP has been sent to your email.";

                } catch (emailError) {

                    console.error(
                        "LOGIN VERIFICATION EMAIL ERROR:",
                        emailError
                    );

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

            // ----------------------------------------------------
            // DO NOT CREATE LOGIN TOKEN
            // ----------------------------------------------------

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

        // ========================================================
        // VERIFIED USER
        // ========================================================

        const token =
            generateToken(user);

        // ========================================================
        // RESPONSE
        // ========================================================

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

        /*
         * Security:
         *
         * We don't reveal whether an email exists.
         * This prevents account enumeration.
         */

        if (!user) {

            return res.status(200).json({

                success: true,

                message:
                    "If an account exists with this email, a password reset OTP has been sent."

            });

        }

        // ------------------------------------------------------
        // RESET OTP COOLDOWN
        // ------------------------------------------------------

        if (
            user.passwordResetLastSentAt
        ) {

            const secondsPassed =
                Math.floor(
                    (
                        Date.now() -
                        new Date(
                            user.passwordResetLastSentAt
                        ).getTime()
                    ) / 1000
                );

            if (
                secondsPassed < 60
            ) {

                return res.status(429).json({

                    success: false,

                    message:
                        `Please wait ${60 - secondsPassed} seconds before requesting another password reset OTP.`

                });

            }

        }

        // ------------------------------------------------------
        // GENERATE OTP
        // ------------------------------------------------------

        const otp =
            generateOtp();

        user.passwordResetOtp =
            hashOtp(otp);

        user.passwordResetOtpExpires =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );

        user.passwordResetAttempts =
            0;

        user.passwordResetLastSentAt =
            new Date();

        await user.save();

        // ------------------------------------------------------
        // SEND EMAIL
        // ------------------------------------------------------

        try {

            await sendPasswordResetEmail(
                user.email,
                user.fullName,
                otp
            );

        } catch (emailError) {

            console.error(
                "Password reset email error:",
                emailError
            );

            user.passwordResetOtp =
                null;

            user.passwordResetOtpExpires =
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

        if (!user) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid or expired reset OTP."

            });

        }

        // ------------------------------------------------------
        // OTP EXISTS
        // ------------------------------------------------------

        if (
            !user.passwordResetOtp
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid or expired reset OTP. Please request a new OTP."

            });

        }

        // ------------------------------------------------------
        // EXPIRY
        // ------------------------------------------------------

        if (
            !user.passwordResetOtpExpires ||
            user.passwordResetOtpExpires <
            new Date()
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

        // ------------------------------------------------------
        // MAX ATTEMPTS
        // ------------------------------------------------------

        if (
            user.passwordResetAttempts >= 5
        ) {

            return res.status(429).json({

                success: false,

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
            user.passwordResetOtp
        ) {

            user.passwordResetAttempts += 1;

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
        // OTP IS VALID
        //
        // We don't consume it here because resetPassword()
        // still needs it to securely change the password.
        // ------------------------------------------------------

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

        // ------------------------------------------------------
        // PASSWORD VALIDATION
        // ------------------------------------------------------

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

        if (!user) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid or expired reset OTP."

            });

        }

        // ------------------------------------------------------
        // OTP EXISTS
        // ------------------------------------------------------

        if (
            !user.passwordResetOtp
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid or expired reset OTP."

            });

        }

        // ------------------------------------------------------
        // OTP EXPIRY
        // ------------------------------------------------------

        if (
            !user.passwordResetOtpExpires ||
            user.passwordResetOtpExpires <
            new Date()
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

        // ------------------------------------------------------
        // MAX ATTEMPTS
        // ------------------------------------------------------

        if (
            user.passwordResetAttempts >= 5
        ) {

            return res.status(429).json({

                success: false,

                message:
                    "Too many incorrect attempts. Please request a new OTP."

            });

        }

        // ------------------------------------------------------
        // VERIFY OTP AGAIN
        //
        // Never trust that the frontend previously verified it.
        // ------------------------------------------------------

        const hashedOtp =
            hashOtp(
                String(otp).trim()
            );

        if (
            hashedOtp !==
            user.passwordResetOtp
        ) {

            user.passwordResetAttempts += 1;

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
        // CHANGE PASSWORD
        //
        // UserSchema pre-save middleware will hash it.
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