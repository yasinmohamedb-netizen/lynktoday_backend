const mongoose = require("mongoose");
const Documentation = require("../models/Documentation");


// ======================================================
// HELPER: GENERATE SEO SLUG
// ======================================================

function generateSlug(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}


// ======================================================
// HELPER: CREATE UNIQUE SLUG
// ======================================================

async function createUniqueSlug(title, currentId = null) {

    const baseSlug =
        generateSlug(title);

    if (!baseSlug) {
        throw new Error(
            "Unable to generate a valid documentation slug."
        );
    }

    let slug =
        baseSlug;

    let counter = 2;

    while (true) {

        const query = {
            slug
        };

        if (
            currentId &&
            mongoose.Types.ObjectId.isValid(
                currentId
            )
        ) {
            query._id = {
                $ne: currentId
            };
        }

        const existing =
            await Documentation.findOne(
                query
            ).select("_id");

        if (!existing) {
            return slug;
        }

        slug =
            `${baseSlug}-${counter}`;

        counter++;
    }
}


// ======================================================
// HELPER: FIND DOCUMENTATION BY ID OR SLUG
// ======================================================

async function findDocumentationByIdOrSlug(
    value
) {

    const normalizedValue =
        String(value || "").trim();

    if (!normalizedValue) {
        return null;
    }

    const conditions = [
        {
            slug:
                normalizedValue.toLowerCase()
        }
    ];

    if (
        mongoose.Types.ObjectId.isValid(
            normalizedValue
        )
    ) {
        conditions.push({
            _id:
                normalizedValue
        });
    }

    return Documentation.findOne({
        isActive: true,
        $or: conditions
    })
        .populate(
            "createdBy",
            "fullName name email role"
        )
        .populate(
            "updatedBy",
            "fullName name email role"
        );
}


// ======================================================
// HELPER: GET AUTHENTICATED USER ID
//
// Supports JWT payloads containing:
// - userId
// - id
// - _id
// ======================================================

function getAuthenticatedUserId(
    user
) {

    if (!user) {
        return null;
    }

    const userId =
        user.userId ||
        user.id ||
        user._id ||
        null;

    if (!userId) {
        return null;
    }

    const normalized =
        String(userId).trim();

    if (
        !mongoose.Types.ObjectId.isValid(
            normalized
        )
    ) {
        return null;
    }

    return normalized;
}


// ======================================================
// HELPER: CHECK ADMIN USER
// ======================================================

function isAdminUser(
    user
) {

    if (!user) {
        return false;
    }

    const role =
        String(
            user.role || ""
        )
            .trim()
            .toLowerCase();

    return role === "admin";
}


// ======================================================
// HELPER: FIND DOCUMENTATION FOR MUTATION
//
// Owner:
// - Can modify own documentation
//
// Admin:
// - Can modify any documentation
// ======================================================

async function findDocumentationForMutation(
    id,
    user
) {

    if (
        !mongoose.Types.ObjectId.isValid(
            id
        )
    ) {
        return null;
    }

    const documentation =
        await Documentation.findById(
            id
        );

    if (!documentation) {
        return null;
    }

    // --------------------------------------------------
    // Admin can manage any documentation
    // --------------------------------------------------

    if (
        isAdminUser(user)
    ) {
        return documentation;
    }

    // --------------------------------------------------
    // Get authenticated user ID
    // --------------------------------------------------

    const userId =
        getAuthenticatedUserId(
            user
        );

    if (!userId) {
        return false;
    }

    // --------------------------------------------------
    // Owner check
    // --------------------------------------------------

    if (
        documentation.createdBy &&
        String(
            documentation.createdBy
        ) ===
        String(userId)
    ) {
        return documentation;
    }

    return false;
}


// ======================================================
// CREATE DOCUMENTATION
//
// POST /api/v1/documentation
//
// Requires authentication.
// Any logged-in user can create.
// ======================================================

exports.createDocumentation = async (
    req,
    res,
    next
) => {

    try {

        // ==============================================
        // Authentication
        // ==============================================

        const userId =
            getAuthenticatedUserId(
                req.user
            );

        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authenticated user ID not found."

            });

        }


        // ==============================================
        // Request Body
        // ==============================================

        const {
            title,
            slug,
            description,
            documentType,
            category,
            content,
            fileUrl,
            fileName,
            fileType,
            fileSize,
            tags,
            relatedHSCode,
            hsCode,
            isFeatured,
            isActive
        } =
            req.body || {};


        // ==============================================
        // Validate Title
        // ==============================================

        const normalizedTitle =
            String(
                title || ""
            ).trim();

        if (!normalizedTitle) {

            return res.status(400).json({

                success: false,

                message:
                    "Documentation title is required."

            });

        }


        // ==============================================
        // Validate Description
        // ==============================================

        const normalizedDescription =
            String(
                description || ""
            ).trim();

        if (!normalizedDescription) {

            return res.status(400).json({

                success: false,

                message:
                    "Documentation description is required."

            });

        }


        // ==============================================
        // Normalize Content
        // ==============================================

        const normalizedContent =
            String(
                content || ""
            ).trim();


        // ==============================================
        // Generate Slug
        // ==============================================

        let finalSlug;

        if (
            slug &&
            String(slug).trim()
        ) {

            const normalizedSlug =
                generateSlug(
                    slug
                );

            if (!normalizedSlug) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid documentation slug."

                });

            }

            finalSlug =
                await createUniqueSlug(
                    normalizedSlug
                );

        } else {

            finalSlug =
                await createUniqueSlug(
                    normalizedTitle
                );

        }


        // ==============================================
        // Prepare Documentation
        // ==============================================

        const documentationData = {

            title:
                normalizedTitle,

            slug:
                finalSlug,

            description:
                normalizedDescription,

            documentType:
                documentType || "GUIDE",

            category:
                category || "General",

            content:
                normalizedContent,

            fileUrl:
                fileUrl || null,

            fileName:
                fileName || null,

            fileType:
                fileType || null,

            fileSize:
                Number(fileSize) || 0,

            tags:
                Array.isArray(tags)
                    ? tags
                    : [],

            relatedHSCode:
                relatedHSCode || null,

            hsCode:
                hsCode || null,

            createdBy:
                userId,

            updatedBy:
                userId,

            isFeatured:
                Boolean(isFeatured),

            isActive:
                isActive !== undefined
                    ? Boolean(isActive)
                    : true

        };


        // ==============================================
        // Create
        // ==============================================

        const documentation =
            await Documentation.create(
                documentationData
            );


        // ==============================================
        // Response
        // ==============================================

        return res.status(201).json({

            success: true,

            message:
                "Documentation created successfully.",

            documentation

        });

    } catch (error) {

        // ==============================================
        // Duplicate Slug
        // ==============================================

        if (
            error?.code === 11000
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "A documentation page with this slug already exists."

            });

        }

        next(error);
    }
};


// ======================================================
// GET DOCUMENTATIONS
//
// GET /api/v1/documentation
//
// PUBLIC
// ======================================================

exports.getDocumentations = async (
    req,
    res,
    next
) => {

    try {

        // ==============================================
        // Pagination
        // ==============================================

        const page =
            Math.max(
                Number(
                    req.query.page
                ) || 1,
                1
            );

        const limit =
            Math.min(
                Math.max(
                    Number(
                        req.query.limit
                    ) || 10,
                    1
                ),
                100
            );

        const skip =
            (page - 1) * limit;


        // ==============================================
        // Filters
        // ==============================================

        const filter = {};


        // ==============================================
        // Active Filter
        // ==============================================

        if (
            req.query.isActive !==
            undefined
        ) {

            filter.isActive =
                String(
                    req.query.isActive
                ).toLowerCase() ===
                "true";

        } else {

            filter.isActive =
                true;

        }


        // ==============================================
        // Category
        // ==============================================

        if (
            req.query.category
        ) {

            filter.category =
                String(
                    req.query.category
                ).trim();

        }


        // ==============================================
        // Document Type
        // ==============================================

        if (
            req.query.documentType
        ) {

            filter.documentType =
                String(
                    req.query.documentType
                ).trim();

        }


        // ==============================================
        // Featured
        // ==============================================

        if (
            req.query.isFeatured !==
            undefined
        ) {

            filter.isFeatured =
                String(
                    req.query.isFeatured
                ).toLowerCase() ===
                "true";

        }


        // ==============================================
        // HS Code
        // ==============================================

        if (
            req.query.hsCode
        ) {

            filter.hsCode =
                String(
                    req.query.hsCode
                ).trim();

        }


        // ==============================================
        // Query
        // ==============================================

        const [
            documentation,
            totalItems
        ] =
            await Promise.all([

                Documentation.find(
                    filter
                )
                    .populate(
                        "createdBy",
                        "fullName name email role"
                    )
                    .populate(
                        "updatedBy",
                        "fullName name email role"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .skip(skip)
                    .limit(limit)
                    .lean(),

                Documentation.countDocuments(
                    filter
                )

            ]);


        // ==============================================
        // Pagination
        // ==============================================

        const totalPages =
            Math.ceil(
                totalItems /
                limit
            );


        // ==============================================
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            documentation,

            pagination: {

                currentPage:
                    page,

                totalPages,

                totalItems,

                limit

            }

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// GET MY DOCUMENTATIONS
//
// GET /api/v1/documentation/my
//
// Requires authentication.
//
// Returns documentation created by
// currently authenticated user.
// ======================================================

exports.getMyDocumentations = async (
    req,
    res,
    next
) => {

    try {

        // ==============================================
        // Get User ID
        // ==============================================

        const userId =
            getAuthenticatedUserId(
                req.user
            );

        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authenticated user ID not found."

            });

        }


        // ==============================================
        // Pagination
        // ==============================================

        const page =
            Math.max(
                Number(
                    req.query.page
                ) || 1,
                1
            );

        const limit =
            Math.min(
                Math.max(
                    Number(
                        req.query.limit
                    ) || 10,
                    1
                ),
                100
            );

        const skip =
            (page - 1) * limit;


        // ==============================================
        // Filter
        // ==============================================

        const filter = {

            createdBy:
                userId

        };


        // ==============================================
        // Active Filter
        // ==============================================

        if (
            req.query.isActive !==
            undefined
        ) {

            filter.isActive =
                String(
                    req.query.isActive
                ).toLowerCase() ===
                "true";

        }


        // ==============================================
        // Query
        // ==============================================

        const [
            documentation,
            totalItems
        ] =
            await Promise.all([

                Documentation.find(
                    filter
                )
                    .populate(
                        "createdBy",
                        "fullName name email role"
                    )
                    .populate(
                        "updatedBy",
                        "fullName name email role"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .skip(skip)
                    .limit(limit)
                    .lean(),

                Documentation.countDocuments(
                    filter
                )

            ]);


        // ==============================================
        // Pagination
        // ==============================================

        const totalPages =
            Math.ceil(
                totalItems /
                limit
            );


        // ==============================================
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            documentation,

            pagination: {

                currentPage:
                    page,

                totalPages,

                totalItems,

                limit

            }

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// GET SINGLE DOCUMENTATION
//
// GET /api/v1/documentation/:id
//
// Supports:
// - MongoDB ObjectId
// - SEO-friendly slug
// ======================================================

exports.getDocumentationById = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } =
            req.params;


        // ==============================================
        // Find
        // ==============================================

        const documentation =
            await findDocumentationByIdOrSlug(
                id
            );


        // ==============================================
        // Not Found
        // ==============================================

        if (!documentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }


        // ==============================================
        // Increment Views
        // ==============================================

        documentation.views =
            Number(
                documentation.views || 0
            ) + 1;

        await documentation.save();


        // ==============================================
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            documentation

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// SEARCH DOCUMENTATIONS
//
// GET /api/v1/documentation/search?q=customs
//
// PUBLIC
// ======================================================

exports.searchDocumentations = async (
    req,
    res,
    next
) => {

    try {

        // ==============================================
        // Search Query
        // ==============================================

        const q =
            String(
                req.query.q || ""
            ).trim();


        if (!q) {

            return res.status(400).json({

                success: false,

                message:
                    "Search query is required."

            });

        }


        // ==============================================
        // Pagination
        // ==============================================

        const page =
            Math.max(
                Number(
                    req.query.page
                ) || 1,
                1
            );

        const limit =
            Math.min(
                Math.max(
                    Number(
                        req.query.limit
                    ) || 10,
                    1
                ),
                100
            );

        const skip =
            (page - 1) * limit;


        // ==============================================
        // Search Regex
        // ==============================================

        const searchRegex =
            new RegExp(
                q.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                ),
                "i"
            );


        // ==============================================
        // Search Filter
        // ==============================================

        const filter = {

            isActive:
                true,

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
                    slug:
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

        };


        // ==============================================
        // Category
        // ==============================================

        if (
            req.query.category
        ) {

            filter.category =
                String(
                    req.query.category
                ).trim();

        }


        // ==============================================
        // Document Type
        // ==============================================

        if (
            req.query.documentType
        ) {

            filter.documentType =
                String(
                    req.query.documentType
                ).trim();

        }


        // ==============================================
        // Query
        // ==============================================

        const [
            documentation,
            totalItems
        ] =
            await Promise.all([

                Documentation.find(
                    filter
                )
                    .populate(
                        "createdBy",
                        "fullName name email role"
                    )
                    .populate(
                        "updatedBy",
                        "fullName name email role"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .skip(skip)
                    .limit(limit)
                    .lean(),

                Documentation.countDocuments(
                    filter
                )

            ]);


        // ==============================================
        // Pagination
        // ==============================================

        const totalPages =
            Math.ceil(
                totalItems /
                limit
            );


        // ==============================================
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            documentation,

            pagination: {

                currentPage:
                    page,

                totalPages,

                totalItems,

                limit

            }

        });

    } catch (error) {

        next(error);

    }

};
// ======================================================
// UPDATE DOCUMENTATION
//
// PUT /api/v1/documentation/:id
//
// AUTHENTICATED USER
// - Owner can update their documentation
// - Admin can update any documentation
// ======================================================

exports.updateDocumentation = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } =
            req.params;


        // ==============================================
        // Validate ID
        // ==============================================

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid documentation ID."

            });

        }


        // ==============================================
        // Authorization
        // ==============================================

        const existingDocumentation =
            await findDocumentationForMutation(
                id,
                req.user
            );


        if (
            existingDocumentation === false
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to update this documentation."

            });

        }


        if (!existingDocumentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }


        // ==============================================
        // Allowed Fields
        // ==============================================

        const allowedFields = [

            "title",

            "slug",

            "description",

            "documentType",

            "category",

            "content",

            "fileUrl",

            "fileName",

            "fileType",

            "fileSize",

            "tags",

            "relatedHSCode",

            "hsCode",

            "isFeatured",

            "isActive"

        ];


        const updateData = {};


        // ==============================================
        // Copy Allowed Fields
        // ==============================================

        allowedFields.forEach(
            (field) => {

                if (
                    req.body &&
                    req.body[field] !==
                    undefined
                ) {

                    updateData[field] =
                        req.body[field];

                }

            }
        );


        // ==============================================
        // Normalize Title
        // ==============================================

        if (
            updateData.title !==
            undefined
        ) {

            updateData.title =
                String(
                    updateData.title
                ).trim();

        }


        // ==============================================
        // Normalize Description
        // ==============================================

        if (
            updateData.description !==
            undefined
        ) {

            updateData.description =
                String(
                    updateData.description
                ).trim();

        }


        // ==============================================
        // Normalize Content
        // ==============================================

        if (
            updateData.content !==
            undefined
        ) {

            updateData.content =
                String(
                    updateData.content
                ).trim();

        }


        // ==============================================
        // Normalize File Size
        // ==============================================

        if (
            updateData.fileSize !==
            undefined
        ) {

            updateData.fileSize =
                Number(
                    updateData.fileSize
                ) || 0;

        }


        // ==============================================
        // Normalize Tags
        // ==============================================

        if (
            updateData.tags !==
            undefined
        ) {

            updateData.tags =
                Array.isArray(
                    updateData.tags
                )
                    ? updateData.tags
                    : [];

        }


        // ==============================================
        // Slug Handling
        // ==============================================

        if (
            updateData.slug !==
            undefined
        ) {

            const normalizedSlug =
                generateSlug(
                    updateData.slug
                );


            if (!normalizedSlug) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid documentation slug."

                });

            }


            updateData.slug =
                await createUniqueSlug(
                    normalizedSlug,
                    id
                );

        }


        // ==============================================
        // Updated By
        // ==============================================

        updateData.updatedBy =
            getAuthenticatedUserId(
                req.user
            );


        // ==============================================
        // Update
        // ==============================================

        const documentation =
            await Documentation.findByIdAndUpdate(
                id,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );


        // ==============================================
        // Not Found
        // ==============================================

        if (!documentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }


        // ==============================================
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            message:
                "Documentation updated successfully.",

            documentation

        });

    } catch (error) {

        // Duplicate slug
        if (
            error?.code === 11000
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "A documentation page with this slug already exists."

            });

        }

        next(error);

    }

};


// ======================================================
// DEACTIVATE DOCUMENTATION
//
// PATCH /api/v1/documentation/:id/deactivate
//
// AUTHENTICATED USER
// - Owner can deactivate their documentation
// - Admin can deactivate any documentation
// ======================================================

exports.deactivateDocumentation = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } =
            req.params;


        // ==============================================
        // Validate ID
        // ==============================================

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid documentation ID."

            });

        }


        // ==============================================
        // Authorization
        // ==============================================

        const existingDocumentation =
            await findDocumentationForMutation(
                id,
                req.user
            );


        if (
            existingDocumentation === false
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to deactivate this documentation."

            });

        }


        if (!existingDocumentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }


        // ==============================================
        // Deactivate
        // ==============================================

        const documentation =
            await Documentation.findByIdAndUpdate(
                id,
                {
                    isActive: false,

                    updatedBy:
                        getAuthenticatedUserId(
                            req.user
                        )
                },
                {
                    new: true,
                    runValidators: true
                }
            );


        // ==============================================
        // Not Found
        // ==============================================

        if (!documentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }


        // ==============================================
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            message:
                "Documentation deactivated successfully.",

            documentation

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// ACTIVATE DOCUMENTATION
//
// PATCH /api/v1/documentation/:id/activate
//
// AUTHENTICATED USER
// - Owner can activate their documentation
// - Admin can activate any documentation
// ======================================================

exports.activateDocumentation = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } =
            req.params;


        // ==============================================
        // Validate ID
        // ==============================================

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid documentation ID."

            });

        }


        // ==============================================
        // Authorization
        // ==============================================

        const existingDocumentation =
            await findDocumentationForMutation(
                id,
                req.user
            );


        if (
            existingDocumentation === false
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to activate this documentation."

            });

        }


        if (!existingDocumentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }


        // ==============================================
        // Activate
        // ==============================================

        const documentation =
            await Documentation.findByIdAndUpdate(
                id,
                {
                    isActive: true,

                    updatedBy:
                        getAuthenticatedUserId(
                            req.user
                        )
                },
                {
                    new: true,
                    runValidators: true
                }
            );


        // ==============================================
        // Not Found
        // ==============================================

        if (!documentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }


        // ==============================================
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            message:
                "Documentation activated successfully.",

            documentation

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// DELETE DOCUMENTATION
//
// DELETE /api/v1/documentation/:id
//
// AUTHENTICATED USER
// - Owner can delete their documentation
// - Admin can delete any documentation
// ======================================================

exports.deleteDocumentation = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } =
            req.params;


        // ==============================================
        // Validate ID
        // ==============================================

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid documentation ID."

            });

        }


        // ==============================================
        // Authorization
        // ==============================================

        const existingDocumentation =
            await findDocumentationForMutation(
                id,
                req.user
            );


        if (
            existingDocumentation === false
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to delete this documentation."

            });

        }


        if (!existingDocumentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }


        // ==============================================
        // Delete
        // ==============================================

        const documentation =
            await Documentation.findByIdAndDelete(
                id
            );


        // ==============================================
        // Not Found
        // ==============================================

        if (!documentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }


        // ==============================================
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            message:
                "Documentation deleted successfully.",

            documentation

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// EXPORTS
// ======================================================

module.exports = exports;