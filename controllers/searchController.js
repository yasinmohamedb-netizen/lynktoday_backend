const User =
    require("../models/User");

const Post =
    require("../models/Post");

const HSCode =
    require("../models/HSCode");

const Documentation =
    require("../models/Documentation");


// ======================================================
// GLOBAL SEARCH
//
// GET /api/v1/search?q=cotton
//
// Searches:
// - Users
// - Companies
// - Posts
// - Questions
// - HS Codes
// - Documentation
// ======================================================

exports.globalSearch = async (
    req,
    res,
    next
) => {

    try {

        // ==================================================
        // QUERY
        // ==================================================

        const q =
            typeof req.query.q === "string"
                ? req.query.q.trim()
                : "";


        // ==================================================
        // LIMIT
        // ==================================================

        const limit =
            Math.min(
                Math.max(
                    parseInt(
                        req.query.limit,
                        10
                    ) || 20,
                    1
                ),
                20
            );


        // ==================================================
        // VALIDATE
        // ==================================================

        /*
         * IMPORTANT:
         *
         * Do NOT require 2 characters.
         *
         * Searches such as:
         *
         * 6
         * 8
         * 10
         * a
         * b
         *
         * should work.
         */

        if (!q) {

            return res.status(400).json({

                success: false,

                message:
                    "Search query is required."

            });

        }


        // ==================================================
        // REGEX
        // ==================================================

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


        // ==================================================
        // USERS
        // ==================================================

        const users =
            await User.find({

                isActive: true,

                $or: [

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

                ]

            })

                .select(
                    "_id fullName companyName profession designation headline location profileImage isVerified followersCount"
                )

                .sort({

                    isVerified: -1,

                    followersCount: -1

                })

                .limit(limit)

                .lean();


        // ==================================================
        // POSTS
        // ==================================================

        const posts =
            await Post.find({

                status: "ACTIVE",

                $or: [

                    {
                        title:
                            searchRegex
                    },

                    {
                        content:
                            searchRegex
                    },

                    {
                        tags:
                            searchRegex
                    },

                    {
                        category:
                            searchRegex
                    }

                ]

            })

                .populate(
                    "author",
                    "fullName profileImage profession companyName isVerified"
                )

                .select(
                    "_id title content postType category tags author createdAt commentCount shareCount views isSolved"
                )

                .sort({

                    createdAt: -1

                })

                .limit(limit)

                .lean();


        // ==================================================
        // QUESTIONS
        // ==================================================

        const questions =
            await Post.find({

                status: "ACTIVE",

                postType: "QUESTION",

                $or: [

                    {
                        title:
                            searchRegex
                    },

                    {
                        content:
                            searchRegex
                    },

                    {
                        tags:
                            searchRegex
                    },

                    {
                        category:
                            searchRegex
                    }

                ]

            })

                .populate(
                    "author",
                    "fullName profileImage profession companyName isVerified"
                )

                .select(
                    "_id title content postType category tags author createdAt commentCount isSolved acceptedAnswer"
                )

                .sort({

                    createdAt: -1

                })

                .limit(limit)

                .lean();


        // ==================================================
        // HS CODES
        // ==================================================

        const hsCodes =
            await HSCode.find({

                isActive: true,

                $or: [

                    // Exact / partial HS code
                    {
                        hsCode:
                            searchRegex
                    },

                    // Description
                    {
                        description:
                            searchRegex
                    },

                    // Keywords
                    {
                        keywords:
                            searchRegex
                    },

                    // Chapter
                    {
                        chapter:
                            searchRegex
                    },

                    // Heading
                    {
                        heading:
                            searchRegex
                    },

                    // Sub heading
                    {
                        subHeading:
                            searchRegex
                    }

                ]

            })

                .select(
                    "_id hsCode description section sectionNumber chapter chapterNumber heading subHeading unit basicDuty igst cess importPolicy exportPolicy country notes keywords isActive"
                )

                .sort({

                    hsCode: 1

                })

                .limit(limit)

                .lean();


        // ==================================================
        // DOCUMENTATION
        // ==================================================

        const documentation =
            await Documentation.find({

                isActive: true,

                $or: [

                    {
                        title:
                            searchRegex
                    },

                    {
                        description:
                            searchRegex
                    },

                    {
                        content:
                            searchRegex
                    },

                    {
                        documentType:
                            searchRegex
                    },

                    {
                        category:
                            searchRegex
                    },

                    {
                        tags:
                            searchRegex
                    },

                    {
                        hsCode:
                            searchRegex
                    }

                ]

            })

                .select(
                    "_id title description documentType category content fileUrl fileName fileType fileSize tags relatedHSCode hsCode createdBy updatedBy isActive isFeatured views createdAt updatedAt"
                )

                .sort({

                    isFeatured: -1,

                    createdAt: -1

                })

                .limit(limit)

                .lean();


        // ==================================================
        // COMPANIES
        // ==================================================

        const companiesMap =
            new Map();


        users.forEach(
            (user) => {

                if (
                    user.companyName &&
                    user.companyName.trim()
                ) {

                    const companyName =
                        user.companyName.trim();


                    const key =
                        companyName.toLowerCase();


                    if (
                        !companiesMap.has(key)
                    ) {

                        companiesMap.set(
                            key,
                            {

                                companyName,

                                location:
                                    user.location ||
                                    "",

                                profession:
                                    user.profession ||
                                    "",

                                profileImage:
                                    user.profileImage ||
                                    "",

                                isVerified:
                                    user.isVerified ||
                                    false

                            }
                        );

                    }

                }

            }
        );


        const companies =
            Array.from(
                companiesMap.values()
            ).slice(
                0,
                limit
            );


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            success: true,

            query: q,

            results: {

                users,

                companies,

                posts,

                questions,

                hsCodes,

                documentation

            }

        });


    } catch (error) {

        console.error(
            "Global search controller error:",
            error
        );

        next(error);

    }

};