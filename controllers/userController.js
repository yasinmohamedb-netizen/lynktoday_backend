const mongoose = require("mongoose");

const User = require("../models/User");

const Post = require("../models/Post");


// ======================================================
// GET ALL USERS
// GET /api/v1/users
// Access: Admin
// ======================================================

exports.getAllUsers = async (req, res, next) => {

    try {

        const users = await User.find()

            .select(
                "-password -verificationDocuments"
            )

            .sort({
                createdAt: -1
            });


        return res.status(200).json({

            success: true,

            count: users.length,

            users

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// GET USER PROFILE
// GET /api/v1/users/:id
// Access: Public / Optional Auth
// ======================================================

exports.getUserProfile = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        // ==================================================
        // Validate ObjectId
        // ==================================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid user ID."

            });

        }


        // ==================================================
        // Find User
        // ==================================================

        const user =
            await User.findById(id)

                .select(
                    "-password -verificationDocuments"
                );


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // ==================================================
        // Default Values
        // ==================================================

        let isFollowing = false;

        let isOwnProfile = false;


        // ==================================================
        // Check Logged-in User
        // ==================================================

        if (req.user) {

            const loggedInUserId =
                req.user.userId.toString();


            isOwnProfile =
                loggedInUserId ===
                user._id.toString();


            isFollowing =
                Array.isArray(user.followers) &&
                user.followers.some(
                    follower =>
                        follower.toString() ===
                        loggedInUserId
                );

        }


        // ==================================================
        // REAL POST COUNT
        // ==================================================

        const postsCount =
            await Post.countDocuments({

                author: user._id,

                status: "ACTIVE"

            });


        // ==================================================
        // Response
        // ==================================================

        return res.status(200).json({

            success: true,

            user: {

                ...user.toObject(),

                postsCount,

                isFollowing,

                isOwnProfile

            }

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// UPDATE OWN PROFILE
// PUT /api/v1/users/profile
// Access: Private
// ======================================================

exports.updateProfile = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            req.user.userId;


        // ==================================================
        // Fields Allowed To Be Updated
        // ==================================================

        const allowedFields = [

            "fullName",

            "profession",

            "accountType",

            "companyName",

            "designation",

            "location",

            "phone",

            "bio",

            "profileImage",

            "coverImage",

            "website",

            "linkedin",

            "headline",

            "experience",

            "education",

            "skills",

            "certifications",

            "languages",

            "tradeIntent"

        ];


        // ==================================================
        // Build Updates
        // ==================================================

        const updates = {};


        allowedFields.forEach(
            field => {

                if (
                    req.body[field] !==
                    undefined
                ) {

                    updates[field] =
                        req.body[field];

                }

            }
        );


        // ==================================================
        // Update User
        // ==================================================

        const user =
            await User.findByIdAndUpdate(

                userId,

                {
                    $set: updates
                },

                {
                    new: true,

                    runValidators: true
                }

            )

                .select(
                    "-password -verificationDocuments"
                );


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // ==================================================
        // Response
        // ==================================================

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
// REQUEST VERIFICATION
// PUT /api/v1/users/request-verification
// Access: Private
// ======================================================

exports.requestVerification = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            req.user.userId;


        const {
            verificationDocuments
        } = req.body;


        // ==================================================
        // Find User
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
        // Already Verified
        // ==================================================

        if (
            user.verificationStatus ===
            "verified"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Your account is already verified."

            });

        }


        // ==================================================
        // Validate Documents
        // ==================================================

        if (
            !Array.isArray(
                verificationDocuments
            ) ||

            verificationDocuments.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Verification documents are required."

            });

        }


        // ==================================================
        // Update Verification
        // ==================================================

        user.verificationDocuments =
            verificationDocuments;


        user.verificationStatus =
            "pending";


        user.isVerified =
            false;


        await user.save();


        // ==================================================
        // Response
        // ==================================================

        return res.status(200).json({

            success: true,

            message:
                "Verification request submitted successfully.",

            verificationStatus:
                user.verificationStatus

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// VERIFY USER
// PUT /api/v1/users/:id/verify
// Access: Admin
// ======================================================

exports.verifyUser = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        // ==================================================
        // Validate ID
        // ==================================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid user ID."

            });

        }


        // ==================================================
        // Find User
        // ==================================================

        const user =
            await User.findById(id);


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // ==================================================
        // Verify
        // ==================================================

        user.isVerified =
            true;


        user.verificationStatus =
            "verified";


        await user.save();


        // ==================================================
        // Response
        // ==================================================

        return res.status(200).json({

            success: true,

            message:
                "User verified successfully.",

            user: {

                _id:
                    user._id,

                fullName:
                    user.fullName,

                isVerified:
                    user.isVerified,

                verificationStatus:
                    user.verificationStatus

            }

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// REJECT VERIFICATION
// PUT /api/v1/users/:id/reject
// Access: Admin
// ======================================================

exports.rejectVerification = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        // ==================================================
        // Validate ID
        // ==================================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid user ID."

            });

        }


        // ==================================================
        // Find User
        // ==================================================

        const user =
            await User.findById(id);


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // ==================================================
        // Reject
        // ==================================================

        user.isVerified =
            false;


        user.verificationStatus =
            "rejected";


        await user.save();


        // ==================================================
        // Response
        // ==================================================

        return res.status(200).json({

            success: true,

            message:
                "Verification request rejected.",

            user: {

                _id:
                    user._id,

                fullName:
                    user.fullName,

                isVerified:
                    user.isVerified,

                verificationStatus:
                    user.verificationStatus

            }

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// GET VERIFIED USERS
// GET /api/v1/users/verified
// Access: Public
// ======================================================

exports.getVerifiedUsers = async (
    req,
    res,
    next
) => {

    try {

        const users =
            await User.find({

                isVerified:
                    true,

                isActive:
                    true

            })

                .select(
                    "-password -verificationDocuments"
                )

                .sort({

                    followersCount:
                        -1

                });


        return res.status(200).json({

            success: true,

            count:
                users.length,

            users

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// SEARCH USERS / COMPANIES
//
// GET /api/v1/users/search
//
// Examples:
//
// /api/v1/users/search
//
// /api/v1/users/search?q=importer
//
// /api/v1/users/search?accountType=individual
//
// /api/v1/users/search?profession=Freight%20Forwarder
//
// /api/v1/users/search?q=chennai&profession=Exporter
//
// ======================================================

exports.searchUsers = async (
    req,
    res,
    next
) => {

    try {

        // ==================================================
        // Search Query
        // ==================================================

        const q =
            typeof req.query.q === "string"
                ? req.query.q.trim()
                : "";


        // ==================================================
        // Filters
        // ==================================================

        const accountType =
            typeof req.query.accountType === "string"
                ? req.query.accountType.trim()
                : "";


        const profession =
            typeof req.query.profession === "string"
                ? req.query.profession.trim()
                : "";


        // ==================================================
        // Pagination
        // ==================================================

        const page =
            Math.max(

                parseInt(
                    req.query.page,
                    10
                ) || 1,

                1

            );


        const limit =
            Math.min(

                Math.max(

                    parseInt(
                        req.query.limit,
                        10
                    ) || 20,

                    1

                ),

                50

            );


        const skip =
            (page - 1) * limit;


        // ==================================================
        // Base Filter
        // ==================================================

        const filter = {

            isActive: true

        };


        // ==================================================
        // Account Type Filter
        // ==================================================

        if (accountType) {

            filter.accountType =
                accountType;

        }


        // ==================================================
        // Profession Filter
        // ==================================================

        if (profession) {

            filter.profession =
                profession;

        }


        // ==================================================
        // Text Search
        // ==================================================

        if (q) {

            // ----------------------------------------------
            // Minimum search length
            // ----------------------------------------------

            if (q.length < 2) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Search query must contain at least 2 characters."

                });

            }


            // ----------------------------------------------
            // Escape regex characters
            // ----------------------------------------------

            const escapedQuery =
                q.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );


            const searchRegex =
                new RegExp(
                    escapedQuery,
                    "i"
                );


            // ----------------------------------------------
            // Search Fields
            // ----------------------------------------------

            filter.$or = [

                {
                    fullName:
                        searchRegex
                },

                {
                    companyName:
                        searchRegex
                },

                {
                    profession:
                        searchRegex
                },

                {
                    headline:
                        searchRegex
                },

                {
                    designation:
                        searchRegex
                },

                {
                    location:
                        searchRegex
                }

            ];

        }


        // ==================================================
        // QUERY USERS
        // ==================================================

        const [
            users,
            total
        ] = await Promise.all([

            User.find(filter)

                .select([

                    "_id",

                    "fullName",

                    "companyName",

                    "profession",

                    "accountType",

                    "designation",

                    "headline",

                    "location",

                    "profileImage",

                    "isVerified",

                    "followers",

                    "followersCount",

                    "followingCount"

                ])

                .sort({

                    isVerified:
                        -1,

                    followersCount:
                        -1,

                    fullName:
                        1

                })

                .skip(skip)

                .limit(limit)

                .lean(),


            User.countDocuments(
                filter
            )

        ]);


        // ==================================================
        // GET REAL POST COUNTS
        // ==================================================

        const userIds =
            users.map(
                user =>
                    user._id
            );


        let postCounts = [];


        if (userIds.length > 0) {

            postCounts =
                await Post.aggregate([

                    {
                        $match: {

                            author: {
                                $in: userIds
                            },

                            status:
                                "ACTIVE"

                        }
                    },

                    {
                        $group: {

                            _id:
                                "$author",

                            count: {
                                $sum: 1
                            }

                        }
                    }

                ]);

        }


        // ==================================================
        // CREATE POST COUNT MAP
        // ==================================================

        const postCountMap =
            new Map();


        postCounts.forEach(
            item => {

                postCountMap.set(

                    item._id.toString(),

                    item.count

                );

            }
        );


        // ==================================================
        // ADD REAL POST COUNT
        // ==================================================

        users.forEach(
            user => {

                user.postsCount =
                    postCountMap.get(
                        user._id.toString()
                    ) || 0;

            }
        );


        // ==================================================
        // ADD FOLLOW STATUS
        // ==================================================

        if (req.user) {

            const loggedInUserId =
                req.user.userId.toString();


            users.forEach(
                user => {

                    user.isFollowing =

                        Array.isArray(
                            user.followers
                        ) &&

                        user.followers.some(

                            id =>

                                id.toString() ===
                                loggedInUserId

                        );


                    user.isOwnProfile =

                        user._id.toString() ===
                        loggedInUserId;


                    // Never expose follower IDs

                    delete user.followers;

                }
            );

        } else {

            users.forEach(
                user => {

                    user.isFollowing =
                        false;


                    user.isOwnProfile =
                        false;


                    delete user.followers;

                }
            );

        }


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            success: true,

            query:
                q,

            filters: {

                accountType:
                    accountType,

                profession:
                    profession

            },

            count:
                users.length,

            total,

            page,

            limit,

            totalPages:
                Math.ceil(
                    total / limit
                ),

            users

        });

    } catch (error) {

        next(error);

    }

};