const Post =
    require("../models/Post");

const Documentation =
    require("../models/Documentation");

const HSCode =
    require("../models/HSCode");

const AdminHighlight =
    require("../models/AdminHighlight");


// ======================================================
// INDUSTRY CATEGORIES
// ======================================================
//
// Posts from these categories can contribute to
// Industry News when they are genuinely relevant.
//
// General is included, but General posts require
// stronger relevance and engagement.
//

const INDUSTRY_CATEGORIES = [

    "Customs",

    "Import",

    "Export",

    "DGFT",

    "GST",

    "FEMA",

    "HS Code",

    "Shipping",

    "Logistics",

    "Sea Freight",

    "Air Freight",

    "Road Transport",

    "Rail Freight",

    "Container",

    "Documentation",

    "Warehousing",

    "Insurance",

    "Trade Finance",

    "Dangerous Goods",

    "General"

];


// ======================================================
// GENERAL INDUSTRY KEYWORDS
// ======================================================

const INDUSTRY_KEYWORDS = [

    "customs",

    "import",

    "export",

    "shipping",

    "logistics",

    "freight",

    "cargo",

    "container",

    "trade",

    "trading",

    "port",

    "ports",

    "vessel",

    "air cargo",

    "sea freight",

    "air freight",

    "road transport",

    "rail freight",

    "dgft",

    "gst",

    "fema",

    "hs code",

    "tariff",

    "duty",

    "duties",

    "clearance",

    "documentation",

    "bill of entry",

    "shipping bill",

    "bill of lading",

    "invoice",

    "incoterms",

    "warehouse",

    "warehousing",

    "supply chain",

    "trade finance",

    "dangerous goods",

    "icegate",

    "notification",

    "regulation",

    "regulations",

    "policy",

    "policies",

    "compliance"

];


// ======================================================
// GET RIGHT SIDEBAR DATA
//
// GET /api/v1/right-sidebar
//
// Access: Public
// ======================================================

exports.getRightSidebar = async (
    req,
    res,
    next
) => {

    try {


        // ==================================================
        // 1. TRENDING TOPICS
        // ==================================================

        const topicMap =
            new Map();


        // --------------------------------------------------
        // POSTS
        // --------------------------------------------------

        const postsForTopics =
            await Post.find({

                status: "ACTIVE",

                visibility: "PUBLIC"

            })

                .select(
                    "category tags createdAt"
                )

                .sort({

                    createdAt: -1

                })

                .limit(300)

                .lean();


        postsForTopics.forEach(
            post => {


                // ------------------------------------------
                // CATEGORY
                // ------------------------------------------

                if (
                    post.category
                ) {

                    addTopic(

                        topicMap,

                        post.category,

                        "post"

                    );

                }


                // ------------------------------------------
                // TAGS
                // ------------------------------------------

                if (
                    Array.isArray(
                        post.tags
                    )
                ) {

                    post.tags.forEach(
                        tag => {

                            addTopic(

                                topicMap,

                                tag,

                                "post"

                            );

                        }
                    );

                }

            }
        );


        // --------------------------------------------------
        // DOCUMENTATION
        // --------------------------------------------------

        const documentsForTopics =
            await Documentation.find({

                isActive: true

            })

                .select(
                    "category tags title createdAt"
                )

                .sort({

                    createdAt: -1

                })

                .limit(300)

                .lean();


        documentsForTopics.forEach(
            document => {


                // ------------------------------------------
                // CATEGORY
                // ------------------------------------------

                if (
                    document.category
                ) {

                    addTopic(

                        topicMap,

                        document.category,

                        "document"

                    );

                }


                // ------------------------------------------
                // TAGS
                // ------------------------------------------

                if (
                    Array.isArray(
                        document.tags
                    )
                ) {

                    document.tags.forEach(
                        tag => {

                            addTopic(

                                topicMap,

                                tag,

                                "document"

                            );

                        }
                    );

                }

            }
        );


        // --------------------------------------------------
        // HS CODES
        // --------------------------------------------------

        const hsCodesForTopics =
            await HSCode.find({

                isActive: true

            })

                .select(
                    "chapter description keywords"
                )

                .sort({

                    createdAt: -1

                })

                .limit(300)

                .lean();


        hsCodesForTopics.forEach(
            hs => {


                // ------------------------------------------
                // CHAPTER
                // ------------------------------------------

                if (
                    hs.chapter
                ) {

                    addTopic(

                        topicMap,

                        hs.chapter,

                        "hsCode"

                    );

                }


                // ------------------------------------------
                // KEYWORDS
                // ------------------------------------------

                if (
                    Array.isArray(
                        hs.keywords
                    )
                ) {

                    hs.keywords.forEach(
                        keyword => {

                            addTopic(

                                topicMap,

                                keyword,

                                "hsCode"

                            );

                        }
                    );

                }

            }
        );


        // --------------------------------------------------
        // FINAL TRENDING TOPICS
        // --------------------------------------------------

        const trendingTopics =
        Array.from(
            topicMap.values()
        )
            .filter(topic => {
    
                const name =
                    String(
                        topic.name || ""
                    ).trim();
    
                const normalized =
                    name.toLowerCase();
    
                // Remove useless / generic topics
                const blockedTopics = [
                    "general",
                    "test",
                    "testing",
                    "new",
                    "hello",
                    "hi",
                    "hey"
                ];
    
                if (
                    blockedTopics.includes(
                        normalized
                    )
                ) {
                    return false;
                }
    
                // Ignore extremely long descriptions.
                // These are usually full HS-code descriptions.
                if (
                    name.length > 45
                ) {
                    return false;
                }
    
                // Ignore topics with no activity.
                if (
                    Number(topic.score || 0) < 1
                ) {
                    return false;
                }
    
                return true;
    
            })
            .sort(
                (a, b) => {
    
                    const scoreDifference =
                        Number(b.score || 0) -
                        Number(a.score || 0);
    
                    if (
                        scoreDifference !== 0
                    ) {
                        return scoreDifference;
                    }
    
                    return String(a.name)
                        .localeCompare(
                            String(b.name)
                        );
    
                }
            )
            .slice(
                0,
                8
            );

        // ==================================================
        // 2. INDUSTRY POSTS
        // ==================================================
        //
        // Industry News can come from:
        //
        // 1. Explicit NEWS posts
        // 2. ANNOUNCEMENT posts
        // 3. Relevant industry posts
        //
        // Ordinary discussions/questions are NOT
        // automatically treated as Industry News merely
        // because they belong to an industry category.
        //

        const industryPosts =
            await Post.find({

                status: "ACTIVE",

                visibility: "PUBLIC",

                $or: [

                    // --------------------------------------
                    // Explicit NEWS
                    // --------------------------------------

                    {
                        postType: "NEWS"
                    },


                    // --------------------------------------
                    // ANNOUNCEMENTS
                    // --------------------------------------

                    {
                        postType: "ANNOUNCEMENT"
                    },


                    // --------------------------------------
                    // Industry Categories
                    // --------------------------------------

                    {
                        category: {

                            $in:
                                INDUSTRY_CATEGORIES.filter(
                                    category =>
                                        category !==
                                        "General"
                                )

                        }
                    },


                    // --------------------------------------
                    // General
                    // --------------------------------------

                    {
                        category:
                            "General"
                    }

                ]

            })

                .populate(

                    "author",

                    "fullName profession companyName profileImage"

                )

                .select(

                    [

                        "title",

                        "content",

                        "postType",

                        "category",

                        "tags",

                        "likes",

                        "views",

                        "commentCount",

                        "shareCount",

                        "createdAt",

                        "author"

                    ].join(" ")

                )

                .sort({

                    createdAt: -1

                })

                .limit(50)

                .lean();


        // ==================================================
        // 3. PROCESS INDUSTRY POSTS
        // ==================================================

        const automaticIndustryNews =

            industryPosts

                .map(
                    post => {


                        // ----------------------------------
                        // ENGAGEMENT COUNTS
                        // ----------------------------------

                        const likes =

                            Array.isArray(
                                post.likes
                            )

                                ? post.likes.length

                                : 0;


                        const comments =

                            Number(
                                post.commentCount
                            ) || 0;


                        const shares =

                            Number(
                                post.shareCount
                            ) || 0;


                        const views =

                            Number(
                                post.views
                            ) || 0;


                        // ----------------------------------
                        // TEXT
                        // ----------------------------------

                        const title =

                            String(
                                post.title ||
                                ""
                            );


                        const content =

                            String(
                                post.content ||
                                ""
                            );


                        const tagsText =

                            Array.isArray(
                                post.tags
                            )

                                ? post.tags.join(
                                    " "
                                )

                                : "";


                        const searchableText =

                            `${title} ${content} ${tagsText}`
                                .toLowerCase();


                        // ----------------------------------
                        // KEYWORD MATCH
                        // ----------------------------------

                        const keywordMatches =

                            INDUSTRY_KEYWORDS.filter(
                                keyword =>
                                    searchableText.includes(
                                        keyword
                                    )
                            );


                        const keywordScore =
                            keywordMatches.length;


                        // ----------------------------------
                        // CATEGORY
                        // ----------------------------------

                        const category =

                            String(
                                post.category ||
                                ""
                            );


                        const isGeneral =

                            category.toLowerCase() ===
                            "general";


                        const isExplicitNews =

                            post.postType ===
                            "NEWS";


                        const isAnnouncement =

                            post.postType ===
                            "ANNOUNCEMENT";


                        const isIndustryCategory =

                            INDUSTRY_CATEGORIES

                                .filter(
                                    item =>
                                        item !==
                                        "General"
                                )

                                .some(
                                    item =>
                                        item.toLowerCase() ===
                                        category.toLowerCase()
                                );


                        // ----------------------------------
                        // ENGAGEMENT SCORE
                        // ----------------------------------

                        const engagementScore =

                            (
                                likes * 3
                            ) +

                            (
                                comments * 5
                            ) +

                            (
                                shares * 4
                            ) +

                            views;


                        // ----------------------------------
                        // MEANINGFUL ENGAGEMENT
                        // ----------------------------------

                        const meaningfulEngagement =

                            (
                                likes >= 2
                            ) ||

                            (
                                comments >= 1
                            ) ||

                            (
                                shares >= 1
                            ) ||

                            (
                                views >= 20
                            );


                        // ----------------------------------
                        // STRONG INDUSTRY RELEVANCE
                        // ----------------------------------

                        const strongIndustryRelevance =

                            keywordScore >= 2;


                        // ==================================================
                        // INDUSTRY NEWS ELIGIBILITY
                        // ==================================================

                        let qualifiesForIndustryNews =
                            false;


                        // ----------------------------------
                        // NEWS
                        //
                        // Explicit NEWS posts are always
                        // eligible.
                        // ----------------------------------

                        if (
                            isExplicitNews
                        ) {

                            qualifiesForIndustryNews =
                                true;

                        }


                        // ----------------------------------
                        // ANNOUNCEMENT
                        //
                        // Announcements are always eligible.
                        // ----------------------------------

                        else if (
                            isAnnouncement
                        ) {

                            qualifiesForIndustryNews =
                                true;

                        }


                        // ----------------------------------
                        // GENERAL
                        //
                        // General posts require BOTH:
                        //
                        // - strong industry relevance
                        // - meaningful engagement
                        //
                        // This prevents generic posts from
                        // appearing as Industry News.
                        // ----------------------------------

                        else if (
                            isGeneral
                        ) {

                            qualifiesForIndustryNews =

                                strongIndustryRelevance &&

                                meaningfulEngagement;

                        }


                        // ----------------------------------
                        // INDUSTRY CATEGORY
                        //
                        // A category alone is NOT enough.
                        //
                        // The post needs either:
                        //
                        // - strong industry relevance
                        // OR
                        // - meaningful engagement
                        // ----------------------------------

                        else if (
                            isIndustryCategory
                        ) {

                            qualifiesForIndustryNews =

                                strongIndustryRelevance ||

                                meaningfulEngagement;

                        }


                        // ----------------------------------
                        // UNKNOWN CATEGORY
                        // ----------------------------------

                        else {

                            qualifiesForIndustryNews =
                                false;

                        }


                        // ----------------------------------
                        // REMOVE NON-RELEVANT POST
                        // ----------------------------------

                        if (
                            !qualifiesForIndustryNews
                        ) {

                            return null;

                        }


                        // ==================================================
                        // FINAL POPULARITY SCORE
                        // ==================================================

                        const popularityScore =

                            engagementScore +

                            (
                                keywordScore * 10
                            ) +

                            (
                                isExplicitNews
                                    ? 30
                                    : 0
                            ) +

                            (
                                isAnnouncement
                                    ? 25
                                    : 0
                            ) +

                            (
                                isIndustryCategory
                                    ? 15
                                    : 0
                            );


                        // ==================================================
                        // RETURN COMMUNITY NEWS
                        // ==================================================

                        return {

                            _id:
                                post._id,

                            type:
                                "POST",

                            source:
                                "COMMUNITY",

                            title:
                                post.title,

                            description:
                                content.substring(
                                    0,
                                    180
                                ),

                            category:
                                post.category,

                            postType:
                                post.postType,

                            tags:
                                post.tags ||
                                [],

                            author:
                                post.author,

                            likesCount:
                                likes,

                            commentCount:
                                comments,

                            shareCount:
                                shares,

                            views:
                                views,

                            keywordMatches,

                            popularityScore,

                            createdAt:
                                post.createdAt,

                            link:
                                `/posts/${post._id}`

                        };

                    }
                )

                .filter(
                    Boolean
                );


        // ==================================================
        // 4. SORT COMMUNITY INDUSTRY NEWS
        // ==================================================

        const communityNews =

            automaticIndustryNews

                .sort(
                    (a, b) => {


                        const scoreDifference =

                            (
                                b.popularityScore ||
                                0
                            ) -

                            (
                                a.popularityScore ||
                                0
                            );


                        if (
                            scoreDifference !==
                            0
                        ) {

                            return scoreDifference;

                        }


                        return (

                            new Date(
                                b.createdAt
                            ) -

                            new Date(
                                a.createdAt
                            )

                        );

                    }
                )

                .slice(
                    0,
                    5
                );


        // ==================================================
        // 5. LATEST DOCUMENTATION
        // ==================================================

        const latestDocuments =
            await Documentation.find({

                isActive: true

            })

                .select(

                    [

                        "title",

                        "description",

                        "documentType",

                        "category",

                        "tags",

                        "views",

                        "createdAt"

                    ].join(" ")

                )

                .sort({

                    createdAt: -1

                })

                .limit(5)

                .lean();


        const latestDocumentation =

            latestDocuments.map(
                document => ({

                    _id:
                        document._id,

                    type:
                        "DOCUMENT",

                    source:
                        "COMMUNITY",

                    title:
                        document.title,

                    description:
                        document.description,

                    category:
                        document.category,

                    documentType:
                        document.documentType,

                    tags:
                        document.tags ||
                        [],

                    views:
                        document.views,

                    createdAt:
                        document.createdAt,

                    link:
                        `/documentation/${document._id}`

                })
            );


        // ==================================================
        // 6. ADMIN HIGHLIGHTS
        // ==================================================

        const now =
            new Date();


        const adminHighlights =
            await AdminHighlight.find({

                isActive: true,

                $and: [

                    {

                        $or: [

                            {
                                startDate:
                                    null
                            },

                            {
                                startDate: {
                                    $lte: now
                                }
                            }

                        ]

                    },

                    {

                        $or: [

                            {
                                endDate:
                                    null
                            },

                            {
                                endDate: {
                                    $gte: now
                                }
                            }

                        ]

                    }

                ]

            })

                .populate(

                    "createdBy",

                    "fullName"

                )

                .sort({

                    priority: -1,

                    createdAt: -1

                })

                .limit(5)

                .lean();


        // ==================================================
        // 7. CONVERT ADMIN HIGHLIGHTS
        // ==================================================

        const adminNews =

            adminHighlights.map(
                highlight => ({

                    _id:
                        highlight._id,

                    type:
                        "ADMIN_NEWS",

                    source:
                        "ADMIN",

                    title:
                        highlight.title,

                    description:
                        highlight.description ||
                        "",

                    category:
                        "Industry News",

                    highlightType:
                        highlight.type,

                    imageUrl:
                        highlight.imageUrl ||
                        "",

                    priority:
                        Number(
                            highlight.priority
                        ) || 0,

                    createdBy:
                        highlight.createdBy,

                    createdAt:
                        highlight.createdAt,

                    link:
                        highlight.link ||
                        null

                })
            );


        // ==================================================
        // 8. COMBINE INDUSTRY NEWS
        // ==================================================
        //
        // Admin news always gets priority.
        //
        // Then relevant community news.
        //
        // Maximum 6 items.
        //

        const industryNews = [

            ...adminNews,

            ...communityNews

        ]

            .slice(
                0,
                6
            );


        // ==================================================
        // 9. FEATURED DOCUMENTS
        // ==================================================

        const featuredDocuments =
            await Documentation.find({

                isActive: true,

                isFeatured: true

            })

                .select(

                    [

                        "title",

                        "description",

                        "documentType",

                        "category",

                        "fileUrl",

                        "views",

                        "createdAt"

                    ].join(" ")

                )

                .sort({

                    views: -1,

                    createdAt: -1

                })

                .limit(5)

                .lean();


        // ==================================================
        // 10. POPULAR DISCUSSIONS
        // ==================================================

        // ==================================================
// 10. POPULAR DISCUSSIONS
// ==================================================
//
// Only useful discussions/questions should appear.
//
// We intentionally remove low-quality posts such as:
// - Hi
// - Hello
// - Hey
// - Test
// - Testing
// - New
//
// A post must have useful content OR meaningful
// engagement.
//

const popularPosts =
await Post.find({

    status: "ACTIVE",

    visibility: "PUBLIC",

    postType: {

        $in: [

            "QUESTION",

            "DISCUSSION"

        ]

    }

})

    .populate(

        "author",

        "fullName profession companyName profileImage"

    )

    .select(

        [

            "title",

            "content",

            "postType",

            "category",

            "tags",

            "likes",

            "views",

            "commentCount",

            "shareCount",

            "createdAt",

            "author",

            "isSolved"

        ].join(" ")

    )

    .sort({

        createdAt: -1

    })

    .limit(100)

    .lean();


const popularDiscussions =

popularPosts

    .map(
        post => {

            const likes =

                Array.isArray(
                    post.likes
                )

                    ? post.likes.length

                    : 0;


            const comments =

                Number(
                    post.commentCount
                ) || 0;


            const shares =

                Number(
                    post.shareCount
                ) || 0;


            const views =

                Number(
                    post.views
                ) || 0;


            const title =

                String(
                    post.title ||
                    ""
                ).trim();


            const content =

                String(
                    post.content ||
                    ""
                ).trim();


            const normalizedTitle =

                title
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9\s]/g,
                        ""
                    )
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();


            const blockedTitles = [

                "hi",

                "hello",

                "hey",

                "test",

                "testing",

                "new",

                "new post",

                "test post",

                "testing post"

            ];


            // ------------------------------------------
            // BLOCK LOW-QUALITY TITLES
            // ------------------------------------------

            if (
                blockedTitles.includes(
                    normalizedTitle
                )
            ) {

                return null;

            }


            // ------------------------------------------
            // MINIMUM CONTENT QUALITY
            // ------------------------------------------

            const meaningfulTitle =
                title.length >= 10;


            const meaningfulContent =
                content.length >= 30;


            const hasTags =
                Array.isArray(
                    post.tags
                ) &&
                post.tags.length > 0;


            const hasEngagement =

                likes >= 2 ||

                comments >= 1 ||

                shares >= 1 ||

                views >= 10;


            // ------------------------------------------
            // REJECT COMPLETELY EMPTY / TEST CONTENT
            // ------------------------------------------

            if (

                !meaningfulTitle &&

                !meaningfulContent &&

                !hasTags &&

                !hasEngagement

            ) {

                return null;

            }


            // ------------------------------------------
            // ENGAGEMENT SCORE
            // ------------------------------------------

            const engagementScore =

                (
                    likes * 3
                ) +

                (
                    comments * 5
                ) +

                (
                    shares * 4
                ) +

                views;


            // ------------------------------------------
            // QUALITY SCORE
            // ------------------------------------------

            let qualityScore = 0;


            if (
                meaningfulTitle
            ) {

                qualityScore += 10;

            }


            if (
                meaningfulContent
            ) {

                qualityScore += 10;

            }


            if (
                hasTags
            ) {

                qualityScore += 5;

            }


            if (
                post.category &&
                post.category !== "General"
            ) {

                qualityScore += 5;

            }


            const popularityScore =

                engagementScore +

                qualityScore;


            return {

                _id:
                    post._id,

                type:
                    "POST",

                source:
                    "COMMUNITY",

                title:
                    post.title,

                description:
                    content.substring(
                        0,
                        160
                    ),

                postType:
                    post.postType,

                category:
                    post.category,

                tags:
                    post.tags || [],

                author:
                    post.author,

                likesCount:
                    likes,

                commentCount:
                    comments,

                shareCount:
                    shares,

                views:
                    views,

                isSolved:
                    Boolean(
                        post.isSolved
                    ),

                popularityScore,

                createdAt:
                    post.createdAt,

                link:
                    `/posts/${post._id}`

            };

        }
    )

    .filter(
        Boolean
    )

    .sort(
        (a, b) => {

            const scoreDifference =

                (
                    b.popularityScore ||
                    0
                ) -

                (
                    a.popularityScore ||
                    0
                );


            if (
                scoreDifference !== 0
            ) {

                return scoreDifference;

            }


            return (

                new Date(
                    b.createdAt
                ) -

                new Date(
                    a.createdAt
                )

            );

        }
    )

    .slice(
        0,
        5
    );


        // ==================================================
        // 11. RESPONSE
        // ==================================================

        return res.status(200).json({

            success: true,


            // ------------------------------------------
            // Automatically generated topics
            // ------------------------------------------

            trendingTopics,


            // ------------------------------------------
            // Admin + User Industry News
            // ------------------------------------------

            industryNews,


            // ------------------------------------------
            // Latest Updates
            // ------------------------------------------

            latestUpdates:
                latestDocumentation,


            // ------------------------------------------
            // Featured Documents
            // ------------------------------------------

            featuredDocuments,


            // ------------------------------------------
            // Popular Discussions
            // ------------------------------------------

            popularDiscussions,


            // ------------------------------------------
            // Admin Highlights
            // ------------------------------------------

            adminHighlights

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// ADD TOPIC HELPER
// ======================================================

function addTopic(
    map,
    rawName,
    source
) {

    if (!rawName) {

        return;

    }


    const name =
        String(
            rawName
        )
            .trim();


    if (!name) {

        return;

    }


    const normalized =
        name.toLowerCase();


    // --------------------------------------------------
    // Ignore very short values
    // --------------------------------------------------

    if (
        normalized.length < 2
    ) {

        return;

    }


    // --------------------------------------------------
    // CREATE TOPIC
    // --------------------------------------------------

    if (
        !map.has(
            normalized
        )
    ) {

        map.set(

            normalized,

            {

                name,

                slug:
                    createSlug(
                        name
                    ),

                score: 0,

                sources: {

                    posts: 0,

                    documents: 0,

                    hsCodes: 0

                }

            }

        );

    }


    const topic =
        map.get(
            normalized
        );


    // --------------------------------------------------
    // SCORE
    // --------------------------------------------------

    if (
        source === "post"
    ) {

        topic.score += 1;

        topic.sources.posts += 1;

    }


    if (
        source === "document"
    ) {

        topic.score += 1;

        topic.sources.documents += 1;

    }


    if (
        source === "hsCode"
    ) {

        topic.score += 1;

        topic.sources.hsCodes += 1;

    }

}


// ======================================================
// CREATE SLUG
// ======================================================

function createSlug(
    value
) {

    return String(
        value
    )

        .toLowerCase()

        .trim()

        .replace(
            /[^a-z0-9]+/g,
            "-"
        )

        .replace(
            /^-+|-+$/g,
            ""
        );

}