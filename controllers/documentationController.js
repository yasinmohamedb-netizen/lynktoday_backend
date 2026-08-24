const Documentation = require("../models/Documentation");

// ======================================================
// CREATE DOCUMENTATION
// POST /api/v1/documentation
// ======================================================

exports.createDocumentation = async (req, res, next) => {
    try {
        const {
            title,
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
            isFeatured
        } = req.body || {};

        // ==============================================
        // Validation
        // ==============================================

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Documentation title is required."
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: "Documentation description is required."
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Documentation content is required."
            });
        }

        // ==============================================
        // Create
        // ==============================================

        const documentation =
            await Documentation.create({
                title: title.trim(),

                description:
                    description.trim(),

                documentType:
                    documentType || "GUIDE",

                category:
                    category || "General",

                content:
                    content.trim(),

                fileUrl:
                    fileUrl || "",

                fileName:
                    fileName || "",

                fileType:
                    fileType || "",

                fileSize:
                    Number(fileSize) || 0,

                tags:
                    Array.isArray(tags)
                        ? tags
                        : [],

                relatedHSCode:
                    relatedHSCode || null,

                hsCode:
                    hsCode || "",

                createdBy:
                    req.user?._id || null,

                updatedBy:
                    req.user?._id || null,

                isActive:
                    true,

                isFeatured:
                    Boolean(isFeatured),

                views:
                    0
            });

        return res.status(201).json({
            success: true,

            message:
                "Documentation created successfully.",

            documentation
        });

    } catch (error) {
        next(error);
    }
};


// ======================================================
// GET DOCUMENTATION LIST
//
// GET /api/v1/documentation
//
// Supports:
//
// ?page=1
// ?limit=10
// ?category=Customs
// ?documentType=GUIDE
// ?isActive=true
// ?isFeatured=true
// ======================================================

exports.getDocumentations = async (
    req,
    res,
    next
) => {
    try {

        const {
            page = 1,
            limit = 10,
            category,
            documentType,
            isActive,
            isFeatured
        } = req.query;

        // ==============================================
        // Pagination
        // ==============================================

        const currentPage =
            Math.max(
                parseInt(page, 10) || 1,
                1
            );

        const perPage =
            Math.min(
                Math.max(
                    parseInt(limit, 10) || 10,
                    1
                ),
                100
            );

        const skip =
            (currentPage - 1) * perPage;

        // ==============================================
        // Filter
        // ==============================================

        const filter = {};

        // By default only active documentation
        if (isActive === undefined) {

            filter.isActive = true;

        } else {

            filter.isActive =
                isActive === "true";

        }

        if (category) {

            filter.category = category;

        }

        if (documentType) {

            filter.documentType =
                documentType;

        }

        if (isFeatured !== undefined) {

            filter.isFeatured =
                isFeatured === "true";

        }

        // ==============================================
        // Database
        // ==============================================

        const [
            documentation,
            total
        ] = await Promise.all([

            Documentation.find(filter)

                .populate(
                    "createdBy",
                    "fullName email profileImage"
                )

                .populate(
                    "updatedBy",
                    "fullName email profileImage"
                )

                .sort({
                    isFeatured: -1,
                    createdAt: -1
                })

                .skip(skip)

                .limit(perPage)

                .lean(),

            Documentation.countDocuments(
                filter
            )

        ]);

        // ==============================================
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            documentation,

            pagination: {

                currentPage,

                totalPages:
                    Math.ceil(
                        total / perPage
                    ),

                totalItems:
                    total,

                itemsPerPage:
                    perPage

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
// ======================================================

exports.getDocumentationById = async (
    req,
    res,
    next
) => {

    try {

        const { id } =
            req.params;

        // ==============================================
        // Find Documentation
        // ==============================================

        const documentation =
            await Documentation.findOne({

                _id: id,

                isActive: true

            })

                .populate(
                    "createdBy",
                    "fullName email profileImage"
                )

                .populate(
                    "updatedBy",
                    "fullName email profileImage"
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
        // Increase Views
        // ==============================================

        documentation.views =
            (documentation.views || 0) + 1;

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
// SEARCH DOCUMENTATION
//
// GET /api/v1/documentation/search?q=customs
//
// Searches:
// - title
// - description
// - content
// - category
// - documentType
// - HS Code
// - tags
// ======================================================

exports.searchDocumentations = async (
    req,
    res,
    next
) => {

    try {

        const q =
            typeof req.query.q === "string"
                ? req.query.q.trim()
                : "";

        // ==============================================
        // Validation
        // ==============================================

        if (!q) {

            return res.status(400).json({

                success: false,

                message:
                    "Search query is required."

            });

        }

        if (q.length < 2) {

            return res.status(400).json({

                success: false,

                message:
                    "Search query must contain at least 2 characters."

            });

        }

        // ==============================================
        // Pagination
        // ==============================================

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
                    ) || 10,
                    1
                ),
                100
            );

        const skip =
            (page - 1) * limit;

        // ==============================================
        // Escape Search Query
        // ==============================================

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

        // ==============================================
        // Search Filter
        // ==============================================

        const filter = {

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
                    category:
                        searchRegex
                },

                {
                    documentType:
                        searchRegex
                },

                {
                    hsCode:
                        searchRegex
                },

                {
                    tags:
                        searchRegex
                }

            ]

        };

        // ==============================================
        // Database
        // ==============================================

        const [
            documentation,
            total
        ] = await Promise.all([

            Documentation.find(filter)

                .populate(
                    "createdBy",
                    "fullName profileImage"
                )

                .sort({
                    isFeatured: -1,
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
        // Response
        // ==============================================

        return res.status(200).json({

            success: true,

            query: q,

            documentation,

            pagination: {

                currentPage:
                    page,

                totalPages:
                    Math.ceil(
                        total / limit
                    ),

                totalItems:
                    total,

                itemsPerPage:
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
// ADMIN ONLY
// ======================================================

exports.updateDocumentation = async (
    req,
    res,
    next
) => {

    try {

        const { id } =
            req.params;

        // ==============================================
        // Allowed Fields
        // ==============================================

        const allowedFields = [

            "title",

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
                    req.body[field] !== undefined
                ) {

                    updateData[field] =
                        req.body[field];

                }

            }
        );

        // ==============================================
        // Normalize Data
        // ==============================================

        if (
            updateData.title !== undefined
        ) {

            updateData.title =
                String(
                    updateData.title
                ).trim();

        }

        if (
            updateData.description !== undefined
        ) {

            updateData.description =
                String(
                    updateData.description
                ).trim();

        }

        if (
            updateData.content !== undefined
        ) {

            updateData.content =
                String(
                    updateData.content
                ).trim();

        }

        if (
            updateData.fileSize !== undefined
        ) {

            updateData.fileSize =
                Number(
                    updateData.fileSize
                ) || 0;

        }

        // ==============================================
        // Updated By
        // ==============================================

        updateData.updatedBy =
            req.user?._id || null;

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

        next(error);

    }
};


// ======================================================
// DEACTIVATE DOCUMENTATION
//
// PATCH /api/v1/documentation/:id/deactivate
// ADMIN ONLY
// ======================================================

exports.deactivateDocumentation = async (
    req,
    res,
    next
) => {

    try {

        const { id } =
            req.params;

        const documentation =
            await Documentation.findByIdAndUpdate(

                id,

                {

                    isActive: false,

                    updatedBy:
                        req.user?._id || null

                },

                {

                    new: true,

                    runValidators: true

                }

            );

        if (!documentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }

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
// ADMIN ONLY
// ======================================================

exports.activateDocumentation = async (
    req,
    res,
    next
) => {

    try {

        const { id } =
            req.params;

        const documentation =
            await Documentation.findByIdAndUpdate(

                id,

                {

                    isActive: true,

                    updatedBy:
                        req.user?._id || null

                },

                {

                    new: true,

                    runValidators: true

                }

            );

        if (!documentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }

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
// PERMANENT DELETE DOCUMENTATION
//
// DELETE /api/v1/documentation/:id
// ADMIN ONLY
// ======================================================

exports.deleteDocumentation = async (
    req,
    res,
    next
) => {

    try {

        const { id } =
            req.params;

        const documentation =
            await Documentation.findByIdAndDelete(
                id
            );

        if (!documentation) {

            return res.status(404).json({

                success: false,

                message:
                    "Documentation not found."

            });

        }

        return res.status(200).json({

            success: true,

            message:
                "Documentation deleted successfully."

        });

    } catch (error) {

        next(error);

    }
};