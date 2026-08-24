const mongoose = require("mongoose");
const HSCode = require("../models/HSCode");

// ======================================================
// Helper: Validate MongoDB ObjectId
// ======================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// ======================================================
// Helper: Normalize keywords
// ======================================================

const normalizeKeywords = (keywords) => {
    if (!Array.isArray(keywords)) {
        return [];
    }

    return [
        ...new Set(
            keywords
                .map((keyword) => String(keyword).trim().toLowerCase())
                .filter(Boolean)
        )
    ];
};

// ======================================================
// GET ALL / SEARCH HS CODES
//
// GET /api/v1/hs-codes
//
// Supports:
// ?page=1
// ?limit=20
// ?search=cotton
// ?hsCode=62034200
// ?description=trousers
// ?keyword=cotton
// ?chapterNumber=62
// ?chapter=Articles of apparel
// ?heading=6203
// ?country=India
// ?isActive=true
// ?sort=newest
// ======================================================

exports.getHSCodes = async (req, res, next) => {
    try {
        // ==========================================
        // Pagination
        // ==========================================

        const page = Math.max(
            parseInt(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                parseInt(req.query.limit) || 20,
                1
            ),
            100
        );

        const skip = (page - 1) * limit;

        // ==========================================
        // Query
        // ==========================================

        const query = {};

        // ==========================================
        // Search
        // ==========================================

        const search = req.query.search?.trim();

        if (search) {
            query.$or = [
                {
                    hsCode: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    keywords: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    chapter: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    heading: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    subHeading: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        // ==========================================
        // Exact / Partial HS Code
        // ==========================================

        if (req.query.hsCode) {
            query.hsCode = {
                $regex: String(req.query.hsCode).trim(),
                $options: "i"
            };
        }

        // ==========================================
        // Description
        // ==========================================

        if (req.query.description) {
            query.description = {
                $regex: String(req.query.description).trim(),
                $options: "i"
            };
        }

        // ==========================================
        // Keyword
        // ==========================================

        if (req.query.keyword) {
            query.keywords = {
                $regex: String(req.query.keyword).trim(),
                $options: "i"
            };
        }

        // ==========================================
        // Chapter Number
        // ==========================================

        if (
            req.query.chapterNumber !== undefined &&
            req.query.chapterNumber !== ""
        ) {
            const chapterNumber = Number(
                req.query.chapterNumber
            );

            if (!Number.isNaN(chapterNumber)) {
                query.chapterNumber = chapterNumber;
            }
        }

        // ==========================================
        // Chapter Name
        // ==========================================

        if (req.query.chapter) {
            query.chapter = {
                $regex: String(req.query.chapter).trim(),
                $options: "i"
            };
        }

        // ==========================================
        // Heading
        // ==========================================

        if (req.query.heading) {
            query.heading = {
                $regex: String(req.query.heading).trim(),
                $options: "i"
            };
        }

        // ==========================================
        // Country
        // ==========================================

        if (req.query.country) {
            query.country = {
                $regex: `^${String(
                    req.query.country
                ).trim()}$`,
                $options: "i"
            };
        }

        // ==========================================
        // Active / Inactive
        // ==========================================

        if (req.query.isActive !== undefined) {
            const value = String(
                req.query.isActive
            ).toLowerCase();

            if (value === "true") {
                query.isActive = true;
            }

            if (value === "false") {
                query.isActive = false;
            }
        }

        // ==========================================
        // Default
        // Only active records for public listing
        // ==========================================

        if (
            req.query.isActive === undefined
        ) {
            query.isActive = true;
        }

        // ==========================================
        // Sorting
        // ==========================================

        let sort = {
            hsCode: 1
        };

        if (req.query.sort === "newest") {
            sort = {
                createdAt: -1
            };
        }

        if (req.query.sort === "oldest") {
            sort = {
                createdAt: 1
            };
        }

        if (req.query.sort === "hsCode") {
            sort = {
                hsCode: 1
            };
        }

        if (req.query.sort === "chapter") {
            sort = {
                chapterNumber: 1,
                hsCode: 1
            };
        }

        // ==========================================
        // Query Database
        // ==========================================

        const [hsCodes, total] =
            await Promise.all([
                HSCode.find(query)
                    .populate(
                        "createdBy",
                        "fullName email"
                    )
                    .populate(
                        "updatedBy",
                        "fullName email"
                    )
                    .sort(sort)
                    .skip(skip)
                    .limit(limit),

                HSCode.countDocuments(query)
            ]);

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({
            success: true,

            count: hsCodes.length,

            total,

            pagination: {
                currentPage: page,
                totalPages:
                    Math.ceil(total / limit),
                limit,
                totalResults: total
            },

            filters: {
                search:
                    req.query.search || null,

                chapterNumber:
                    req.query.chapterNumber ||
                    null,

                country:
                    req.query.country ||
                    null,

                isActive:
                    req.query.isActive !== undefined
                        ? req.query.isActive
                        : true
            },

            hsCodes
        });

    } catch (error) {
        next(error);
    }
};

// ======================================================
// SEARCH HS CODES
//
// GET /api/v1/hs-codes/search?q=cotton
//
// Dedicated search endpoint
// ======================================================

exports.searchHSCodes = async (
    req,
    res,
    next
) => {
    try {
        const search =
            req.query.q?.trim();

        if (!search) {
            return res.status(400).json({
                success: false,
                message:
                    "Search query is required."
            });
        }

        const limit = Math.min(
            Math.max(
                parseInt(req.query.limit) || 20,
                1
            ),
            100
        );

        const hsCodes =
            await HSCode.find({
                isActive: true,

                $or: [
                    {
                        hsCode: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        description: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        keywords: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        chapter: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        heading: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        subHeading: {
                            $regex: search,
                            $options: "i"
                        }
                    }
                ]
            })
                .sort({
                    hsCode: 1
                })
                .limit(limit);

        return res.status(200).json({
            success: true,
            count: hsCodes.length,
            query: search,
            hsCodes
        });

    } catch (error) {
        next(error);
    }
};

// ======================================================
// GET HS CODE BY ID
//
// GET /api/v1/hs-codes/id/:id
//
// Public
// ======================================================

exports.getHSCodeById = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid HS Code ID."
            });
        }

        const hsCode =
            await HSCode.findOne({
                _id: id,
                isActive: true
            })
                .populate(
                    "createdBy",
                    "fullName email"
                )
                .populate(
                    "updatedBy",
                    "fullName email"
                );

        if (!hsCode) {
            return res.status(404).json({
                success: false,
                message:
                    "HS Code not found."
            });
        }

        return res.status(200).json({
            success: true,
            hsCode
        });

    } catch (error) {
        next(error);
    }
};

// ======================================================
// GET HS CODE BY CODE
//
// GET /api/v1/hs-codes/code/:hsCode
//
// Public
// ======================================================

exports.getHSCodeByCode = async (
    req,
    res,
    next
) => {
    try {
        const code =
            req.params.hsCode?.trim();

        if (!code) {
            return res.status(400).json({
                success: false,
                message:
                    "HS Code is required."
            });
        }

        const hsCode =
            await HSCode.findOne({
                hsCode: code,
                isActive: true
            })
                .populate(
                    "createdBy",
                    "fullName email"
                )
                .populate(
                    "updatedBy",
                    "fullName email"
                );

        if (!hsCode) {
            return res.status(404).json({
                success: false,
                message:
                    "HS Code not found."
            });
        }

        return res.status(200).json({
            success: true,
            hsCode
        });

    } catch (error) {
        next(error);
    }
};

// ======================================================
// CREATE HS CODE
//
// POST /api/v1/hs-codes
//
// Admin Only
// ======================================================

exports.createHSCode = async (
    req,
    res,
    next
) => {
    try {
        // ==========================================
        // Body Validation
        // ==========================================

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message:
                    "Request body is required."
            });
        }

        const {
            hsCode,
            description,
            section,
            sectionNumber,
            chapter,
            chapterNumber,
            heading,
            subHeading,
            unit,
            basicDuty,
            igst,
            cess,
            importPolicy,
            exportPolicy,
            country,
            notes,
            keywords,
            isActive
        } = req.body;

        // ==========================================
        // Required Fields
        // ==========================================

        if (
            !hsCode ||
            !String(hsCode).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "HS Code is required."
            });
        }

        if (
            !description ||
            !String(description).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Description is required."
            });
        }

        // ==========================================
        // Duplicate Check
        // ==========================================

        const existing =
            await HSCode.findOne({
                hsCode: String(
                    hsCode
                ).trim()
            });

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "This HS Code already exists.",
                hsCode: existing
            });
        }

        // ==========================================
        // Create
        // ==========================================

        const newHSCode =
            await HSCode.create({
                hsCode:
                    String(hsCode).trim(),

                description:
                    String(description).trim(),

                section:
                    section || "",

                sectionNumber:
                    sectionNumber !== undefined &&
                    sectionNumber !== ""
                        ? Number(sectionNumber)
                        : null,

                chapter:
                    chapter || "",

                chapterNumber:
                    chapterNumber !== undefined &&
                    chapterNumber !== ""
                        ? Number(chapterNumber)
                        : null,

                heading:
                    heading || "",

                subHeading:
                    subHeading || "",

                unit:
                    unit || "",

                basicDuty:
                    basicDuty || "",

                igst:
                    igst || "",

                cess:
                    cess || "",

                importPolicy:
                    importPolicy || "",

                exportPolicy:
                    exportPolicy || "",

                country:
                    country || "India",

                notes:
                    notes || "",

                keywords:
                    normalizeKeywords(
                        keywords
                    ),

                isActive:
                    isActive !== undefined
                        ? Boolean(isActive)
                        : true,

                createdBy:
                    req.user.userId,

                updatedBy:
                    req.user.userId
            });

        // ==========================================
        // Populate
        // ==========================================

        await newHSCode.populate([
            {
                path: "createdBy",
                select:
                    "fullName email"
            },
            {
                path: "updatedBy",
                select:
                    "fullName email"
            }
        ]);

        return res.status(201).json({
            success: true,
            message:
                "HS Code created successfully.",
            hsCode: newHSCode
        });

    } catch (error) {
        next(error);
    }
};

// ======================================================
// UPDATE HS CODE
//
// PUT /api/v1/hs-codes/:id
//
// Admin Only
// ======================================================

exports.updateHSCode = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid HS Code ID."
            });
        }

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message:
                    "Request body is required."
            });
        }

        const existing =
            await HSCode.findById(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message:
                    "HS Code not found."
            });
        }

        // ==========================================
        // Prevent Duplicate HS Code
        // ==========================================

        if (req.body.hsCode) {
            const duplicate =
                await HSCode.findOne({
                    hsCode:
                        String(
                            req.body.hsCode
                        ).trim(),

                    _id: {
                        $ne: id
                    }
                });

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Another HS Code with this code already exists."
                });
            }
        }

        // ==========================================
        // Allowed Fields
        // ==========================================

        const allowedFields = [
            "hsCode",
            "description",
            "section",
            "sectionNumber",
            "chapter",
            "chapterNumber",
            "heading",
            "subHeading",
            "unit",
            "basicDuty",
            "igst",
            "cess",
            "importPolicy",
            "exportPolicy",
            "country",
            "notes",
            "keywords",
            "isActive"
        ];

        allowedFields.forEach(
            (field) => {
                if (
                    req.body[field] !==
                    undefined
                ) {
                    if (
                        field ===
                        "keywords"
                    ) {
                        existing[field] =
                            normalizeKeywords(
                                req.body[field]
                            );
                    } else if (
                        field ===
                            "sectionNumber" ||
                        field ===
                            "chapterNumber"
                    ) {
                        existing[field] =
                            req.body[field] !==
                                "" &&
                            req.body[field] !==
                                null
                                ? Number(
                                      req.body[
                                          field
                                      ]
                                  )
                                : null;
                    } else if (
                        typeof req.body[
                            field
                        ] === "string"
                    ) {
                        existing[field] =
                            req.body[
                                field
                            ].trim();
                    } else {
                        existing[field] =
                            req.body[field];
                    }
                }
            }
        );

        // ==========================================
        // Updated By
        // ==========================================

        existing.updatedBy =
            req.user.userId;

        await existing.save();

        await existing.populate([
            {
                path: "createdBy",
                select:
                    "fullName email"
            },
            {
                path: "updatedBy",
                select:
                    "fullName email"
            }
        ]);

        return res.status(200).json({
            success: true,
            message:
                "HS Code updated successfully.",
            hsCode: existing
        });

    } catch (error) {
        next(error);
    }
};

// ======================================================
// DEACTIVATE HS CODE
//
// PATCH /api/v1/hs-codes/:id/deactivate
//
// Admin Only
// ======================================================

exports.deactivateHSCode = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid HS Code ID."
            });
        }

        const hsCode =
            await HSCode.findById(id);

        if (!hsCode) {
            return res.status(404).json({
                success: false,
                message:
                    "HS Code not found."
            });
        }

        if (!hsCode.isActive) {
            return res.status(400).json({
                success: false,
                message:
                    "HS Code is already inactive."
            });
        }

        hsCode.isActive = false;

        hsCode.updatedBy =
            req.user.userId;

        await hsCode.save();

        return res.status(200).json({
            success: true,
            message:
                "HS Code deactivated successfully.",
            hsCode
        });

    } catch (error) {
        next(error);
    }
};

// ======================================================
// REACTIVATE HS CODE
//
// PATCH /api/v1/hs-codes/:id/activate
//
// Admin Only
// ======================================================

exports.activateHSCode = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid HS Code ID."
            });
        }

        const hsCode =
            await HSCode.findById(id);

        if (!hsCode) {
            return res.status(404).json({
                success: false,
                message:
                    "HS Code not found."
            });
        }

        if (hsCode.isActive) {
            return res.status(400).json({
                success: false,
                message:
                    "HS Code is already active."
            });
        }

        hsCode.isActive = true;

        hsCode.updatedBy =
            req.user.userId;

        await hsCode.save();

        return res.status(200).json({
            success: true,
            message:
                "HS Code activated successfully.",
            hsCode
        });

    } catch (error) {
        next(error);
    }
};

// ======================================================
// HARD DELETE HS CODE
//
// DELETE /api/v1/hs-codes/:id
//
// Admin Only
// ======================================================

exports.deleteHSCode = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid HS Code ID."
            });
        }

        const hsCode =
            await HSCode.findById(id);

        if (!hsCode) {
            return res.status(404).json({
                success: false,
                message:
                    "HS Code not found."
            });
        }

        await hsCode.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "HS Code deleted permanently."
        });

    } catch (error) {
        next(error);
    }
};