const AdminSidebarContent =
    require("../models/AdminSidebarContent");


// ======================================================
// CREATE SIDEBAR CONTENT
// POST /api/v1/admin/sidebar
// Access: Private / Admin
// ======================================================

exports.createSidebarContent = async (
    req,
    res,
    next
) => {

    try {

        const {
            section,
            title,
            description,
            link,
            category,
            imageUrl,
            priority,
            isActive,
            startDate,
            endDate
        } = req.body;


        // ==========================================
        // Validation
        // ==========================================

        if (!section) {

            return res.status(400).json({

                success: false,

                message:
                    "Section is required."

            });

        }


        if (!title) {

            return res.status(400).json({

                success: false,

                message:
                    "Title is required."

            });

        }


        // ==========================================
        // Create
        // ==========================================

        const sidebarContent =
            await AdminSidebarContent.create({

                section,

                title,

                description:
                    description || "",

                link:
                    link || "",

                category:
                    category || "",

                imageUrl:
                    imageUrl || "",

                priority:
                    Number(priority) || 0,

                isActive:
                    isActive !== undefined
                        ? Boolean(isActive)
                        : true,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                createdBy:
                    req.user.userId,

                updatedBy:
                    req.user.userId

            });


        // ==========================================
        // Response
        // ==========================================

        return res.status(201).json({

            success: true,

            message:
                "Sidebar content created successfully.",

            sidebarContent

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// GET ALL SIDEBAR CONTENT
// GET /api/v1/admin/sidebar
// Access: Private / Admin
// ======================================================

exports.getAllSidebarContent = async (
    req,
    res,
    next
) => {

    try {

        const {
            section,
            active
        } = req.query;


        // ==========================================
        // Query
        // ==========================================

        const query = {};


        if (section) {

            query.section =
                section.toUpperCase();

        }


        if (active !== undefined) {

            query.isActive =
                active === "true";

        }


        // ==========================================
        // Get Data
        // ==========================================

        const items =
            await AdminSidebarContent.find(query)

                .populate(
                    "createdBy",
                    "fullName email"
                )

                .populate(
                    "updatedBy",
                    "fullName email"
                )

                .sort({

                    priority: -1,

                    createdAt: -1

                });


        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({

            success: true,

            count:
                items.length,

            items

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// GET SINGLE SIDEBAR CONTENT
// GET /api/v1/admin/sidebar/:id
// Access: Private / Admin
// ======================================================

exports.getSidebarContentById = async (
    req,
    res,
    next
) => {

    try {

        const item =
            await AdminSidebarContent.findById(
                req.params.id
            )

                .populate(
                    "createdBy",
                    "fullName email"
                )

                .populate(
                    "updatedBy",
                    "fullName email"
                );


        if (!item) {

            return res.status(404).json({

                success: false,

                message:
                    "Sidebar content not found."

            });

        }


        return res.status(200).json({

            success: true,

            item

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// UPDATE SIDEBAR CONTENT
// PATCH /api/v1/admin/sidebar/:id
// Access: Private / Admin
// ======================================================

exports.updateSidebarContent = async (
    req,
    res,
    next
) => {

    try {

        const allowedFields = [

            "section",

            "title",

            "description",

            "link",

            "category",

            "imageUrl",

            "priority",

            "isActive",

            "startDate",

            "endDate"

        ];


        const updateData = {};


        // ==========================================
        // Only accept allowed fields
        // ==========================================

        allowedFields.forEach(field => {

            if (
                req.body[field] !== undefined
            ) {

                updateData[field] =
                    req.body[field];

            }

        });


        // ==========================================
        // Normalize section
        // ==========================================

        if (updateData.section) {

            updateData.section =
                updateData.section.toUpperCase();

        }


        // ==========================================
        // Priority
        // ==========================================

        if (
            updateData.priority !== undefined
        ) {

            updateData.priority =
                Number(updateData.priority);

        }


        // ==========================================
        // Updated By
        // ==========================================

        updateData.updatedBy =
            req.user.userId;


        // ==========================================
        // Update
        // ==========================================

        const item =
            await AdminSidebarContent.findByIdAndUpdate(

                req.params.id,

                {
                    $set: updateData
                },

                {
                    new: true,

                    runValidators: true
                }

            );


        if (!item) {

            return res.status(404).json({

                success: false,

                message:
                    "Sidebar content not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Sidebar content updated successfully.",

            item

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// TOGGLE ACTIVE STATUS
// PATCH /api/v1/admin/sidebar/:id/toggle
// Access: Private / Admin
// ======================================================

exports.toggleSidebarContent = async (
    req,
    res,
    next
) => {

    try {

        const item =
            await AdminSidebarContent.findById(
                req.params.id
            );


        if (!item) {

            return res.status(404).json({

                success: false,

                message:
                    "Sidebar content not found."

            });

        }


        item.isActive =
            !item.isActive;


        item.updatedBy =
            req.user.userId;


        await item.save();


        return res.status(200).json({

            success: true,

            message:
                item.isActive
                    ? "Sidebar content activated."
                    : "Sidebar content deactivated.",

            item

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// DELETE SIDEBAR CONTENT
// DELETE /api/v1/admin/sidebar/:id
// Access: Private / Admin
// ======================================================

exports.deleteSidebarContent = async (
    req,
    res,
    next
) => {

    try {

        const item =
            await AdminSidebarContent.findById(
                req.params.id
            );


        if (!item) {

            return res.status(404).json({

                success: false,

                message:
                    "Sidebar content not found."

            });

        }


        await item.deleteOne();


        return res.status(200).json({

            success: true,

            message:
                "Sidebar content deleted successfully."

        });

    } catch (error) {

        next(error);

    }

};