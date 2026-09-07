const mongoose = require("mongoose");
const HSCode = require("../models/HSCode");

// ======================================================
// HELPERS
// ======================================================

// ------------------------------------------------------
// Validate MongoDB ObjectId
// ------------------------------------------------------

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// ------------------------------------------------------
// Get authenticated user's ID
// ------------------------------------------------------

const getUserId = (req) => {
    return req.user?.userId || req.user?._id || null;
};

// ------------------------------------------------------
// Check if user is admin
// ------------------------------------------------------

const isAdmin = (req) => {
    return (
        req.user?.role === "admin" ||
        req.user?.isAdmin === true
    );
};

// ------------------------------------------------------
// Normalize HS Code
// ------------------------------------------------------

const normalizeHSCode = (value) => {
    return String(value || "")
        .trim()
        .replace(/\s+/g, "");
};

// ------------------------------------------------------
// Normalize keywords
// ------------------------------------------------------

const normalizeKeywords = (keywords) => {
    if (!Array.isArray(keywords)) {
        return [];
    }

    return [
        ...new Set(
            keywords
                .map((keyword) =>
                    String(keyword)
                        .trim()
                        .toLowerCase()
                )
                .filter(Boolean)
        )
    ];
};

// ------------------------------------------------------
// Parse optional number
// ------------------------------------------------------

const parseOptionalNumber = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return null;
    }

    return number;
};

// ------------------------------------------------------
// Check ownership
//
// Owner = createdBy === logged-in user
// Admin = always allowed
// ------------------------------------------------------

const canModifyHSCode = (req, hsCode) => {
    if (isAdmin(req)) {
        return true;
    }

    const userId = getUserId(req);

    if (!userId || !hsCode?.createdBy) {
        return false;
    }

    return (
        String(hsCode.createdBy) ===
        String(userId)
    );
};

// ======================================================
// GET ALL HS CODES
//
// GET /api/v1/hs-codes
// ======================================================

exports.getHSCodes = async (
    req,
    res,
    next
) => {
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

        const search =
            req.query.search?.trim();

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
        // HS Code filter
        // ==========================================

        if (req.query.hsCode) {
            query.hsCode = {
                $regex: String(
                    req.query.hsCode
                ).trim(),
                $options: "i"
            };
        }

        // ==========================================
        // Description filter
        // ==========================================

        if (req.query.description) {
            query.description = {
                $regex: String(
                    req.query.description
                ).trim(),
                $options: "i"
            };
        }

        // ==========================================
        // Keyword filter
        // ==========================================

        if (req.query.keyword) {
            query.keywords = {
                $regex: String(
                    req.query.keyword
                ).trim(),
                $options: "i"
            };
        }

        // ==========================================
        // Chapter Number
        // ==========================================

        if (
            req.query.chapterNumber !==
                undefined &&
            req.query.chapterNumber !== ""
        ) {
            const chapterNumber =
                Number(
                    req.query.chapterNumber
                );

            if (
                !Number.isNaN(chapterNumber)
            ) {
                query.chapterNumber =
                    chapterNumber;
            }
        }

        // ==========================================
        // Chapter
        // ==========================================

        if (req.query.chapter) {
            query.chapter = {
                $regex: String(
                    req.query.chapter
                ).trim(),
                $options: "i"
            };
        }

        // ==========================================
        // Heading
        // ==========================================

        if (req.query.heading) {
            query.heading = {
                $regex: String(
                    req.query.heading
                ).trim(),
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
        //
        // Public users should only see active
        // records.
        //
        // Admin can request inactive records.
        // ==========================================

        if (isAdmin(req)) {
            if (
                req.query.isActive !==
                undefined
            ) {
                const value = String(
                    req.query.isActive
                ).toLowerCase();

                if (value === "true") {
                    query.isActive = true;
                }

                if (value === "false") {
                    query.isActive = false;
                }
            } else {
                query.isActive = true;
            }
        } else {
            query.isActive = true;
        }

        // ==========================================
        // Sorting
        // ==========================================

        let sort = {
            hsCode: 1
        };

        if (
            req.query.sort ===
            "newest"
        ) {
            sort = {
                createdAt: -1
            };
        }

        if (
            req.query.sort ===
            "oldest"
        ) {
            sort = {
                createdAt: 1
            };
        }

        if (
            req.query.sort ===
            "hsCode"
        ) {
            sort = {
                hsCode: 1
            };
        }

        if (
            req.query.sort ===
            "chapter"
        ) {
            sort = {
                chapterNumber: 1,
                hsCode: 1
            };
        }

        // ==========================================
        // Database
        // ==========================================

        const [
            hsCodes,
            total
        ] = await Promise.all([
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
                    Math.ceil(
                        total / limit
                    ),

                limit,

                totalResults: total
            },

            filters: {
                search:
                    req.query.search ||
                    null,

                chapterNumber:
                    req.query.chapterNumber ||
                    null,

                country:
                    req.query.country ||
                    null,

                isActive:
                    isAdmin(req)
                        ? req.query
                              .isActive ||
                          true
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
                parseInt(
                    req.query.limit
                ) || 20,
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
                .populate(
                    "createdBy",
                    "fullName email"
                )
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
// ======================================================

exports.getHSCodeById = async (
    req,
    res,
    next
) => {
    try {
        const { id } =
            req.params;

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
// ======================================================

exports.getHSCodeByCode = async (
    req,
    res,
    next
) => {
    try {
        const code =
            normalizeHSCode(
                req.params.hsCode
            );

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
// GET MY HS CODES
//
// GET /api/v1/hs-codes/my
//
// Authenticated user only.
// ======================================================

exports.getMyHSCodes = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "User authentication required."
            });
        }

        const page = Math.max(
            parseInt(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                parseInt(
                    req.query.limit
                ) || 20,
                1
            ),
            100
        );

        const skip =
            (page - 1) * limit;

        const query = {
            createdBy: userId
        };

        // Optional active filter
        if (
            req.query.isActive !==
            undefined
        ) {
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

        const [
            hsCodes,
            total
        ] = await Promise.all([
            HSCode.find(query)
                .populate(
                    "createdBy",
                    "fullName email"
                )
                .populate(
                    "updatedBy",
                    "fullName email"
                )
                .sort({
                    createdAt: -1
                })
                .skip(skip)
                .limit(limit),

            HSCode.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,

            count: hsCodes.length,

            total,

            pagination: {
                currentPage: page,

                totalPages:
                    Math.ceil(
                        total / limit
                    ),

                limit,

                totalResults: total
            },

            hsCodes
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
// Any authenticated user.
// ======================================================

exports.createHSCode = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "User authentication required."
            });
        }

        if (
            !req.body ||
            typeof req.body !== "object"
        ) {
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
            keywords
        } = req.body;

        // ==========================================
        // Required fields
        // ==========================================

        const normalizedCode =
            normalizeHSCode(hsCode);

        if (!normalizedCode) {
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
        // HS Code format
        // ==========================================

        if (
            !/^\d{4,10}$/.test(
                normalizedCode
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "HS Code must contain only numbers and be between 4 and 10 digits."
            });
        }

        // ==========================================
        // Duplicate
        // ==========================================

        const existing =
            await HSCode.findOne({
                hsCode: normalizedCode
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
                hsCode: normalizedCode,

                description:
                    String(
                        description
                    ).trim(),

                section:
                    section
                        ? String(section).trim()
                        : "",

                sectionNumber:
                    parseOptionalNumber(
                        sectionNumber
                    ),

                chapter:
                    chapter
                        ? String(chapter).trim()
                        : "",

                chapterNumber:
                    parseOptionalNumber(
                        chapterNumber
                    ),

                heading:
                    heading
                        ? String(heading).trim()
                        : "",

                subHeading:
                    subHeading
                        ? String(
                              subHeading
                          ).trim()
                        : "",

                unit:
                    unit
                        ? String(unit).trim()
                        : "",

                basicDuty:
                    basicDuty
                        ? String(
                              basicDuty
                          ).trim()
                        : "",

                igst:
                    igst
                        ? String(igst).trim()
                        : "",

                cess:
                    cess
                        ? String(cess).trim()
                        : "",

                importPolicy:
                    importPolicy
                        ? String(
                              importPolicy
                          ).trim()
                        : "",

                exportPolicy:
                    exportPolicy
                        ? String(
                              exportPolicy
                          ).trim()
                        : "",

                country:
                    country
                        ? String(country).trim()
                        : "India",

                notes:
                    notes
                        ? String(notes).trim()
                        : "",

                keywords:
                    normalizeKeywords(
                        keywords
                    ),

                // Every successful submission
                // becomes immediately active.
                isActive: true,

                // Ownership
                createdBy: userId,

                updatedBy: userId
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
        // Duplicate index protection
        if (
            error?.code === 11000
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "This HS Code already exists."
            });
        }

        next(error);
    }
};

// ======================================================
// UPDATE HS CODE
//
// PUT /api/v1/hs-codes/:id
//
// Owner OR Admin.
// ======================================================

exports.updateHSCode = async (
    req,
    res,
    next
) => {
    try {
        const { id } =
            req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid HS Code ID."
            });
        }

        if (
            !req.body ||
            typeof req.body !== "object"
        ) {
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
        // Ownership check
        // ==========================================

        if (
            !canModifyHSCode(
                req,
                existing
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to update this HS Code."
            });
        }

        // ==========================================
        // Duplicate HS Code
        // ==========================================

        if (
            req.body.hsCode !==
            undefined
        ) {
            const newCode =
                normalizeHSCode(
                    req.body.hsCode
                );

            if (
                !/^\d{4,10}$/.test(
                    newCode
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "HS Code must contain only numbers and be between 4 and 10 digits."
                });
            }

            const duplicate =
                await HSCode.findOne({
                    hsCode: newCode,

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

            existing.hsCode =
                newCode;
        }

        // ==========================================
        // Allowed fields
        // ==========================================

        const stringFields = [
            "description",
            "section",
            "chapter",
            "heading",
            "subHeading",
            "unit",
            "basicDuty",
            "igst",
            "cess",
            "importPolicy",
            "exportPolicy",
            "country",
            "notes"
        ];

        stringFields.forEach(
            (field) => {
                if (
                    req.body[field] !==
                    undefined
                ) {
                    existing[field] =
                        String(
                            req.body[field]
                        ).trim();
                }
            }
        );

        // ==========================================
        // Description validation
        // ==========================================

        if (
            !existing.description ||
            !existing.description.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Description is required."
            });
        }

        // ==========================================
        // Number fields
        // ==========================================

        if (
            req.body.sectionNumber !==
            undefined
        ) {
            existing.sectionNumber =
                parseOptionalNumber(
                    req.body.sectionNumber
                );
        }

        if (
            req.body.chapterNumber !==
            undefined
        ) {
            existing.chapterNumber =
                parseOptionalNumber(
                    req.body.chapterNumber
                );
        }

        // ==========================================
        // Keywords
        // ==========================================

        if (
            req.body.keywords !==
            undefined
        ) {
            existing.keywords =
                normalizeKeywords(
                    req.body.keywords
                );
        }

        // ==========================================
        // isActive
        //
        // Owner can change own active status.
        // Admin can also change it.
        // ==========================================

        if (
            req.body.isActive !==
            undefined
        ) {
            if (
                typeof req.body.isActive ===
                "boolean"
            ) {
                existing.isActive =
                    req.body.isActive;
            } else {
                const value =
                    String(
                        req.body.isActive
                    ).toLowerCase();

                if (
                    value === "true"
                ) {
                    existing.isActive =
                        true;
                }

                if (
                    value === "false"
                ) {
                    existing.isActive =
                        false;
                }
            }
        }

        // ==========================================
        // Updated By
        // ==========================================

        existing.updatedBy =
            getUserId(req);

        await existing.save();

        // ==========================================
        // Populate
        // ==========================================

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
        if (
            error?.code === 11000
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "This HS Code already exists."
            });
        }

        next(error);
    }
};

// ======================================================
// DEACTIVATE HS CODE
//
// PATCH /api/v1/hs-codes/:id/deactivate
//
// Owner OR Admin.
// ======================================================

exports.deactivateHSCode = async (
    req,
    res,
    next
) => {
    try {
        const { id } =
            req.params;

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

        if (
            !canModifyHSCode(
                req,
                hsCode
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to deactivate this HS Code."
            });
        }

        if (!hsCode.isActive) {
            return res.status(400).json({
                success: false,
                message:
                    "HS Code is already inactive."
            });
        }

        hsCode.isActive =
            false;

        hsCode.updatedBy =
            getUserId(req);

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
// ACTIVATE HS CODE
//
// PATCH /api/v1/hs-codes/:id/activate
//
// Owner OR Admin.
// ======================================================

exports.activateHSCode = async (
    req,
    res,
    next
) => {
    try {
        const { id } =
            req.params;

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

        if (
            !canModifyHSCode(
                req,
                hsCode
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to activate this HS Code."
            });
        }

        if (hsCode.isActive) {
            return res.status(400).json({
                success: false,
                message:
                    "HS Code is already active."
            });
        }

        hsCode.isActive =
            true;

        hsCode.updatedBy =
            getUserId(req);

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
// DELETE HS CODE
//
// DELETE /api/v1/hs-codes/:id
//
// Owner OR Admin.
// ======================================================

exports.deleteHSCode = async (
    req,
    res,
    next
) => {
    try {
        const { id } =
            req.params;

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

        // ==========================================
        // Ownership
        // ==========================================

        if (
            !canModifyHSCode(
                req,
                hsCode
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to delete this HS Code."
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