const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ======================================================
// Get My Profile
// GET /api/v1/profile/me
// Access: Private
// ======================================================

// ======================================================
// Get My Profile
// GET /api/v1/profile/me
// Access: Private
// ======================================================

exports.getMyProfile = async (req, res, next) => {

    try {

        // ==================================================
        // Load User
        // ==================================================

        const user = await User.findById(
            req.user.userId
        ).select("-password");


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // ==================================================
        // Load Post Model
        // ==================================================

        const Post =
            require("../models/Post");


        // ==================================================
        // Count User Posts
        // ==================================================

        const postsCount =
            await Post.countDocuments({

                author: req.user.userId,

                status: "ACTIVE"

            });


        // ==================================================
        // Convert User To Plain Object
        // ==================================================

        const userData =
            user.toObject();


        // ==================================================
        // Add Dynamic Post Count
        // ==================================================

        userData.postsCount =
            postsCount;


        // ==================================================
        // Response
        // ==================================================

        return res.status(200).json({

            success: true,

            user: userData

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Public Profile
// GET /api/v1/profile/:userId
// Access: Public / Optional Auth
// ======================================================

// ======================================================
// Get Public Profile
// GET /api/v1/profile/:userId
// Access: Public / Optional Auth
// ======================================================

// ======================================================
// Get Public Profile
// GET /api/v1/profile/:userId
// Access: Public / Optional Auth
// ======================================================

exports.getProfile = async (req, res, next) => {

    try {

        // ==================================================
        // LOAD USER
        // ==================================================

        const user = await User.findById(
            req.params.userId
        ).select("-password");


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // ==================================================
        // LOAD POST MODEL
        // ==================================================

        const Post =
            require("../models/Post");


        // ==================================================
        // COUNT USER POSTS
        // ==================================================

        const postsCount =
            await Post.countDocuments({

                author: req.params.userId,

                status: "ACTIVE"

            });


        // ==================================================
        // CONVERT USER TO OBJECT
        // ==================================================

        const userData =
            user.toObject();


        // ==================================================
        // ADD POST COUNT
        // ==================================================

        userData.postsCount =
            postsCount;


        // ==================================================
        // DETERMINE FOLLOW STATUS
        // ==================================================

        let isFollowing = false;


        // Optional authentication means
        // req.user may not exist.

        if (req.user?.userId) {

            // A user cannot follow themselves.

            if (
                req.user.userId.toString() !==
                req.params.userId.toString()
            ) {

                isFollowing =
                    Array.isArray(
                        user.followers
                    ) &&
                    user.followers.some(
                        followerId =>
                            followerId.toString() ===
                            req.user.userId.toString()
                    );

            }

        }


        // ==================================================
        // ADD FOLLOW STATUS
        // ==================================================

        userData.isFollowing =
            isFollowing;


        // ==================================================
        // MAKE SURE COUNTS EXIST
        // ==================================================

        userData.followersCount =
            user.followersCount || 0;


        userData.followingCount =
            user.followingCount || 0;


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            success: true,

            user: userData

        });

    } catch (error) {

        console.error(
            "Get Profile Error:",
            error
        );

        next(error);

    }

};

// ======================================================
// Update Profile
// PUT /api/v1/profile
// Access: Private
// ======================================================

exports.updateProfile = async (req, res, next) => {

    try {

        const allowedFields = [

            "fullName",

            "headline",

            "bio",

            "profession",

            "companyName",

            "designation",

            "location",

            "phone",

            "website",

            "linkedin",

            "tradeIntent",

            "skills",

            "languages",

            "experience",

            "education",

            "certifications"

        ];


        const updates = {};


        allowedFields.forEach(field => {

            if (req.body[field] !== undefined) {

                updates[field] =
                    req.body[field];

            }

        });


        const user =
            await User.findByIdAndUpdate(

                req.user.userId,

                updates,

                {
                    new: true,
                    runValidators: true
                }

            ).select("-password");


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Profile updated successfully.",

            user

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Upload Profile Photo
// PUT /api/v1/profile/photo
// Access: Private
// ======================================================

exports.uploadProfilePhoto = async (req, res, next) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Please upload a profile image."

            });

        }


        const imagePath =
            `/uploads/${req.file.filename}`;


        const user =
            await User.findByIdAndUpdate(

                req.user.userId,

                {
                    profileImage: imagePath
                },

                {
                    new: true
                }

            ).select("-password");


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Profile photo updated successfully.",

            profileImage:
                imagePath,

            user

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Upload Cover Photo
// PUT /api/v1/profile/cover
// Access: Private
// ======================================================

exports.uploadCoverPhoto = async (req, res, next) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Please upload a cover image."

            });

        }


        const imagePath =
            `/uploads/${req.file.filename}`;


        const user =
            await User.findByIdAndUpdate(

                req.user.userId,

                {
                    coverImage: imagePath
                },

                {
                    new: true
                }

            ).select("-password");


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Cover photo updated successfully.",

            coverImage:
                imagePath,

            user

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Profile Photo
// DELETE /api/v1/profile/photo
// Access: Private
// ======================================================

exports.deleteProfilePhoto = async (req, res, next) => {

    try {

        const user =
            await User.findByIdAndUpdate(

                req.user.userId,

                {
                    profileImage: ""
                },

                {
                    new: true
                }

            ).select("-password");


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Profile photo removed successfully.",

            user

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Cover Photo
// DELETE /api/v1/profile/cover
// Access: Private
// ======================================================

exports.deleteCoverPhoto = async (req, res, next) => {

    try {

        const user =
            await User.findByIdAndUpdate(

                req.user.userId,

                {
                    coverImage: ""
                },

                {
                    new: true
                }

            ).select("-password");


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Cover photo removed successfully.",

            user

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Change Password
// PUT /api/v1/profile/change-password
// Access: Private
// ======================================================

exports.changePassword = async (req, res, next) => {

    try {

        const {
            currentPassword,
            newPassword
        } = req.body;


        // --------------------------------------------------
        // Validate fields
        // --------------------------------------------------

        if (
            !currentPassword ||
            !newPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Current password and new password are required."

            });

        }


        // --------------------------------------------------
        // Validate password length
        // --------------------------------------------------

        if (newPassword.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 6 characters."

            });

        }


        // --------------------------------------------------
        // Get user including password
        // --------------------------------------------------

        const user =
            await User.findById(
                req.user.userId
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // --------------------------------------------------
        // Compare current password
        // --------------------------------------------------

        const isMatch =
            await bcrypt.compare(

                currentPassword,

                user.password

            );


        if (!isMatch) {

            return res.status(400).json({

                success: false,

                message:
                    "Current password is incorrect."

            });

        }


        // --------------------------------------------------
        // Prevent same password
        // --------------------------------------------------

        const isSamePassword =
            await bcrypt.compare(

                newPassword,

                user.password

            );


        if (isSamePassword) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be different from your current password."

            });

        }


        // --------------------------------------------------
        // Hash new password
        // --------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(

                newPassword,

                10

            );


        user.password =
            hashedPassword;


        await user.save();


        return res.status(200).json({

            success: true,

            message:
                "Password changed successfully."

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Account
// DELETE /api/v1/profile/account
// Access: Private
// ======================================================

exports.deleteAccount = async (req, res, next) => {

    try {

        const userId =
            req.user.userId;


        // ==================================================
        // Check User
        // ==================================================

        const user =
            await User.findById(userId);


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // ==================================================
        // Load Related Models
        // ==================================================

        const Post =
            require("../models/Post");

        const Comment =
            require("../models/Comment");

        const Message =
            require("../models/Message");

        const Notification =
            require("../models/Notification");

        const Connection =
            require("../models/Connection");


        // ==================================================
        // Delete User's Posts
        // ==================================================

        await Post.deleteMany({

            author: userId

        });


        // ==================================================
        // Delete User's Comments
        // ==================================================

        await Comment.deleteMany({

            user: userId

        });


        // ==================================================
        // Delete User's Messages
        // ==================================================

        await Message.deleteMany({

            $or: [

                {
                    sender: userId
                },

                {
                    recipient: userId
                }

            ]

        });


        // ==================================================
        // Delete User's Notifications
        // ==================================================

        await Notification.deleteMany({

            user: userId

        });


        // ==================================================
        // Delete Connections
        // ==================================================

        await Connection.deleteMany({

            $or: [

                {
                    requester: userId
                },

                {
                    recipient: userId
                }

            ]

        });


        // ==================================================
        // Delete User
        // ==================================================

        await User.findByIdAndDelete(
            userId
        );


        // ==================================================
        // Success
        // ==================================================

        return res.status(200).json({

            success: true,

            message:
                "Your account and associated data have been permanently deleted."

        });

    } catch (error) {

        next(error);

    }

};