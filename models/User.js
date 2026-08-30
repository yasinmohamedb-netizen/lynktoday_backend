const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ======================================================
// USER SCHEMA
// ======================================================

const UserSchema = new mongoose.Schema(
    {

        // ==================================================
        // BASIC INFORMATION
        // ==================================================

        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
            select: false
        },


        // ==================================================
        // ACCOUNT
        // ==================================================

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        accountType: {
            type: String,
            enum: ["individual", "company"],
            default: "individual"
        },


        // ==================================================
        // PROFESSION
        // ==================================================

        profession: {
            type: String,
            enum: [
                "Freight Forwarder",
                "Customs Broker",
                "Shipping Line",
                "Air Cargo",
                "Importer",
                "Exporter",
                "NVOCC",
                "Warehouse",
                "Transporter",
                "Trade Consultant",
                "Student",
                "Operations Executive",
                "Sales Executive",
                "Documentation Executive",
                "Logistics Executive",
                "Supply Chain Executive",
                "Manager",
                "Business Owner",
                "Other"
            ],
            default: "Other"
        },


        // ==================================================
        // PROFESSIONAL INFORMATION
        // ==================================================

        companyName: {
            type: String,
            trim: true,
            default: ""
        },

        designation: {
            type: String,
            trim: true,
            default: ""
        },

        headline: {
            type: String,
            trim: true,
            maxlength: 150,
            default: ""
        },

        location: {
            type: String,
            trim: true,
            default: ""
        },

        bio: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },


        // ==================================================
        // CONTACT
        // ==================================================

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        website: {
            type: String,
            trim: true,
            default: ""
        },

        linkedin: {
            type: String,
            trim: true,
            default: ""
        },


        // ==================================================
        // IMAGES
        // ==================================================

        profileImage: {
            type: String,
            default: ""
        },

        coverImage: {
            type: String,
            default: ""
        },


        // ==================================================
        // FOLLOW SYSTEM
        // ==================================================

        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        followersCount: {
            type: Number,
            default: 0,
            min: 0
        },

        followingCount: {
            type: Number,
            default: 0,
            min: 0
        },


        // ==================================================
        // EXPERIENCE
        // ==================================================

        experience: [
            {

                company: {
                    type: String,
                    required: true,
                    trim: true
                },

                designation: {
                    type: String,
                    required: true,
                    trim: true
                },

                employmentType: {
                    type: String,
                    trim: true,
                    default: ""
                },

                location: {
                    type: String,
                    trim: true,
                    default: ""
                },

                currentlyWorking: {
                    type: Boolean,
                    default: false
                },

                startDate: {
                    type: Date
                },

                endDate: {
                    type: Date
                },

                description: {
                    type: String,
                    trim: true,
                    default: ""
                }

            }
        ],


        // ==================================================
        // EDUCATION
        // ==================================================

        education: [
            {

                institution: {
                    type: String,
                    required: true,
                    trim: true
                },

                degree: {
                    type: String,
                    trim: true,
                    default: ""
                },

                fieldOfStudy: {
                    type: String,
                    trim: true,
                    default: ""
                },

                startYear: {
                    type: Number
                },

                endYear: {
                    type: Number
                },

                description: {
                    type: String,
                    trim: true,
                    default: ""
                }

            }
        ],


        // ==================================================
        // SKILLS
        // ==================================================

        skills: [
            {
                type: String,
                trim: true
            }
        ],


        // ==================================================
        // CERTIFICATIONS
        // ==================================================

        certifications: [
            {

                name: {
                    type: String,
                    trim: true
                },

                organization: {
                    type: String,
                    trim: true
                },

                issueDate: {
                    type: Date
                },

                credentialId: {
                    type: String,
                    trim: true,
                    default: ""
                }

            }
        ],


        // ==================================================
        // LANGUAGES
        // ==================================================

        languages: [
            {
                type: String,
                trim: true
            }
        ],


        // ==================================================
        // TRADE INTENT
        // ==================================================

        tradeIntent: {
            type: String,
            enum: [
                "Import",
                "Export",
                "Both",
                "Import & Export"
            ],
            default: "Both"
        },


        // ==================================================
        // TERMS
        // ==================================================

        agreeToTerms: {
            type: Boolean,
            required: true,
            default: false
        },


        // ==================================================
        // PROFESSIONAL VERIFICATION
        // ==================================================

        /*
         * Separate from email verification.
         *
         * isVerified / verificationStatus are for
         * LynkToday's professional/account verification.
         */

        isVerified: {
            type: Boolean,
            default: false
        },

        verificationStatus: {
            type: String,
            enum: [
                "pending",
                "verified",
                "rejected"
            ],
            default: "pending"
        },

        verificationDocuments: [
            {
                type: String
            }
        ],


        // ==================================================
        // EMAIL VERIFICATION
        // ==================================================

        /*
         * Email verification is separate from
         * professional verification.
         *
         * Signup is completed only after the user
         * successfully verifies the OTP.
         */

        emailVerified: {
            type: Boolean,
            default: false
        },


        // ==================================================
        // PASSWORD RESET
        // ==================================================

        /*
         * Password reset OTP is stored hashed.
         * Never store the plain OTP.
         */

        passwordResetOtp: {
            type: String,
            default: null,
            select: false
        },

        passwordResetOtpExpires: {
            type: Date,
            default: null,
            select: false
        },

        passwordResetAttempts: {
            type: Number,
            default: 0,
            select: false
        },

        passwordResetLastSentAt: {
            type: Date,
            default: null,
            select: false
        },


        // ==================================================
        // EMAIL VERIFICATION OTP
        // ==================================================

        /*
         * Store the HASHED OTP, not the plain OTP.
         *
         * select: false prevents it from being returned
         * in normal User.find() queries.
         */

        emailVerificationOtp: {
            type: String,
            default: null,
            select: false
        },

        emailVerificationOtpExpires: {
            type: Date,
            default: null,
            select: false
        },

        emailVerificationAttempts: {
            type: Number,
            default: 0,
            select: false
        },

        emailVerificationLastSentAt: {
            type: Date,
            default: null,
            select: false
        },


        // ==================================================
        // COMMUNITY
        // ==================================================

        reputation: {
            type: Number,
            default: 0
        },

        postsCount: {
            type: Number,
            default: 0,
            min: 0
        },

        answersCount: {
            type: Number,
            default: 0,
            min: 0
        },

        badges: [
            {
                type: String,
                trim: true
            }
        ],


        // ==================================================
        // ACCOUNT STATUS
        // ==================================================

        isActive: {
            type: Boolean,
            default: true
        }

    },

    {
        timestamps: true
    }
);


// ======================================================
// SEARCH INDEX
// ======================================================

UserSchema.index({
    fullName: "text",
    companyName: "text",
    headline: "text",
    profession: "text",
    designation: "text",
    location: "text"
});


// ======================================================
// EMAIL NORMALIZATION
// ======================================================

UserSchema.pre("validate", function () {

    if (this.email) {

        this.email =
            this.email
                .trim()
                .toLowerCase();

    }

});


// ======================================================
// PASSWORD HASHING
// ======================================================

UserSchema.pre("save", async function () {

    // Password has not changed
    if (!this.isModified("password")) {
        return;
    }

    const salt =
        await bcrypt.genSalt(10);

    this.password =
        await bcrypt.hash(
            this.password,
            salt
        );

});


// ======================================================
// PASSWORD COMPARISON
// ======================================================

UserSchema.methods.matchPassword =
    async function (password) {

        return bcrypt.compare(
            password,
            this.password
        );

    };


// ======================================================
// REMOVE SENSITIVE DATA
// ======================================================

UserSchema.methods.toSafeObject =
    function () {

        const user =
            this.toObject();

        // Password
        delete user.password;

        // Professional verification
        delete user.verificationDocuments;

        // Email verification
        delete user.emailVerificationOtp;
        delete user.emailVerificationOtpExpires;
        delete user.emailVerificationAttempts;
        delete user.emailVerificationLastSentAt;

        // Password reset
        delete user.passwordResetOtp;
        delete user.passwordResetOtpExpires;
        delete user.passwordResetAttempts;
        delete user.passwordResetLastSentAt;

        return user;
    };


// ======================================================
// EXPORT
// ======================================================

module.exports =
    mongoose.model(
        "User",
        UserSchema
    );