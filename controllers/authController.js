const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ============================================================
// EMAIL TRANSPORTER
// ============================================================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// ============================================================
// GENERATE JWT TOKEN
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
    return crypto.randomInt(100000, 1000000).toString();
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
// SEND VERIFICATION EMAIL
// ============================================================

const sendVerificationEmail = async (email, fullName, otp) => {
    await transporter.sendMail({
        from: `"LynkToday" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your LynkToday email",
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                color: #1f2937;
            ">

                <h2 style="
                    color: #0f4c81;
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
                        background: #eff6ff;
                        border: 1px solid #bfdbfe;
                        border-radius: 10px;
                        color: #0f4c81;
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
// SIGNUP
// POST /api/v1/auth/signup
// ============================================================

exports.signup = async (req, res, next) => {
    try {
        const {
            accountType,
            fullName,
            email,
            password,
            companyName,
            profession,
            location,
            tradeIntent,
            agreeToTerms
        } = req.body;

        // --------------------------------------------------------
        // ACCOUNT TYPE
        // --------------------------------------------------------

        if (!accountType) {
            return res.status(400).json({
                success: false,
                message: "Account type is required."
            });
        }

        if (
            accountType !== "individual" &&
            accountType !== "company"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid account type."
            });
        }

        // --------------------------------------------------------
        // EMAIL / PASSWORD
        // --------------------------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // --------------------------------------------------------
        // INDIVIDUAL
        // --------------------------------------------------------

        if (
            accountType === "individual" &&
            !fullName
        ) {
            return res.status(400).json({
                success: false,
                message: "Full name is required."
            });
        }

        // --------------------------------------------------------
        // COMPANY
        // --------------------------------------------------------

        if (
            accountType === "company" &&
            !companyName
        ) {
            return res.status(400).json({
                success: false,
                message: "Company name is required."
            });
        }

        // --------------------------------------------------------
        // TERMS
        // --------------------------------------------------------

        if (!agreeToTerms) {
            return res.status(400).json({
                success: false,
                message:
                    "You must agree to the terms and conditions."
            });
        }

        // --------------------------------------------------------
        // NORMALIZE EMAIL
        // --------------------------------------------------------

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        // --------------------------------------------------------
        // CHECK EXISTING USER
        // --------------------------------------------------------

        const userExists = await User.findOne({
            email: normalizedEmail
        });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message:
                    "An account with this email already exists."
            });
        }

        // --------------------------------------------------------
        // GENERATE OTP
        // --------------------------------------------------------

        const otp = generateOtp();

        const hashedOtp = hashOtp(otp);

        const otpExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // --------------------------------------------------------
        // CREATE USER
        // --------------------------------------------------------

        const user = await User.create({
            accountType,

            fullName:
                accountType === "company"
                    ? companyName
                    : fullName,

            email: normalizedEmail,

            password,

            companyName: companyName || "",

            profession: profession || "Other",

            location: location || "",

            tradeIntent: tradeIntent || "Both",

            agreeToTerms,

            role: "user",

            isVerified: false,

            verificationStatus: "pending",

            emailVerified: false,

            emailVerificationOtp: hashedOtp,

            emailVerificationOtpExpires: otpExpires,

            emailVerificationAttempts: 0,

            emailVerificationLastSentAt: new Date()
        });

        // --------------------------------------------------------
        // SEND OTP
        // --------------------------------------------------------

        try {
            await sendVerificationEmail(
                user.email,
                user.fullName,
                otp
            );
        } catch (emailError) {
            console.error(
                "Verification email error:",
                emailError
            );

            await User.findByIdAndDelete(user._id);

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send verification email. Please try again."
            });
        }

        // --------------------------------------------------------
        // RESPONSE
        // --------------------------------------------------------

        return res.status(201).json({
            success: true,
            requiresEmailVerification: true,
            message:
                "Account created. Please verify your email using the OTP sent to your email.",
            email: user.email
        });

    } catch (error) {
        next(error);
    }
};

// ============================================================
// VERIFY EMAIL
// POST /api/v1/auth/verify-email
// ============================================================

exports.verifyEmail = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required."
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        const cleanOtp = otp
            .toString()
            .trim();

        if (!/^\d{6}$/.test(cleanOtp)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid 6-digit OTP."
            });
        }

        const user = await User.findOne({
            email: normalizedEmail
        }).select(
            "+emailVerificationOtp " +
            "+emailVerificationOtpExpires " +
            "+emailVerificationAttempts"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found."
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified."
            });
        }

        if (
            user.emailVerificationAttempts >= 5
        ) {
            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new OTP."
            });
        }

        if (
            !user.emailVerificationOtp ||
            !user.emailVerificationOtpExpires
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "OTP is no longer valid. Please request a new OTP."
            });
        }

        if (
            new Date() >
            user.emailVerificationOtpExpires
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "OTP has expired. Please request a new OTP."
            });
        }

        const hashedOtp = hashOtp(cleanOtp);

        if (
            hashedOtp !==
            user.emailVerificationOtp
        ) {
            user.emailVerificationAttempts += 1;

            await user.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP."
            });
        }

        // --------------------------------------------------------
        // VERIFY
        // --------------------------------------------------------

        user.emailVerified = true;

        user.isVerified = true;

        user.verificationStatus = "verified";

        // --------------------------------------------------------
        // CLEAR OTP
        // --------------------------------------------------------

        user.emailVerificationOtp = null;

        user.emailVerificationOtpExpires = null;

        user.emailVerificationAttempts = 0;

        user.emailVerificationLastSentAt = null;

        await user.save();

        // --------------------------------------------------------
        // GENERATE TOKEN
        // --------------------------------------------------------

        const token = generateToken(user);

        // --------------------------------------------------------
        // RESPONSE
        // --------------------------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Email verified successfully.",
            token,
            user: {
                _id: user._id,
                accountType: user.accountType,
                fullName: user.fullName,
                email: user.email,
                companyName: user.companyName,
                profession: user.profession,
                location: user.location,
                tradeIntent: user.tradeIntent,
                role: user.role,
                isVerified: user.isVerified,
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
// RESEND VERIFICATION OTP
// POST /api/v1/auth/resend-verification
// ============================================================

exports.resendVerification = async (
    req,
    res,
    next
) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        const user = await User.findOne({
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
                message: "Account not found."
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message:
                    "Email is already verified."
            });
        }

        // --------------------------------------------------------
        // 60 SECOND COOLDOWN
        // --------------------------------------------------------

        if (
            user.emailVerificationLastSentAt
        ) {
            const secondsPassed = Math.floor(
                (
                    Date.now() -
                    new Date(
                        user.emailVerificationLastSentAt
                    ).getTime()
                ) / 1000
            );

            if (secondsPassed < 60) {
                return res.status(429).json({
                    success: false,
                    message:
                        `Please wait ${60 - secondsPassed} seconds before requesting another OTP.`
                });
            }
        }

        // --------------------------------------------------------
        // NEW OTP
        // --------------------------------------------------------

        const otp = generateOtp();

        const hashedOtp = hashOtp(otp);

        const otpExpires = new Date(
            Date.now() + 10 * 60 * 1000
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

        // --------------------------------------------------------
        // SEND EMAIL
        // --------------------------------------------------------

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

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send verification email. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "A new OTP has been sent to your email."
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

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide email and password."
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
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

        // --------------------------------------------------------
        // EMAIL VERIFICATION REQUIRED
        // --------------------------------------------------------

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                code: "EMAIL_NOT_VERIFIED",
                message:
                    "Please verify your email before logging in.",
                email: user.email
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message:
                `Welcome back, ${user.fullName}!`,
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                companyName: user.companyName,
                profession: user.profession,
                location: user.location,
                tradeIntent: user.tradeIntent,
                role: user.role,
                isVerified: user.isVerified,
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