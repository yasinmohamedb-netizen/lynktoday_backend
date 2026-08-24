const SidebarContent = require("../models/SidebarContent");

// ======================================================
// @desc    Get Public Sidebar
// @route   GET /api/v1/sidebar
// @access  Public
// ======================================================
exports.getPublicSidebarContent = async (req, res, next) => {

    try {

        const now = new Date();

        const items = await SidebarContent.find({
            isActive: true,
            startsAt: { $lte: now },
            $or: [
                { expiresAt: null },
                { expiresAt: { $gte: now } }
            ]
        })
        .sort({
            priority: -1,
            createdAt: -1
        });

        return res.status(200).json({
            success: true,
            count: items.length,
            items
        });

    } catch (error) {
        next(error);
    }

};

// ======================================================
// @desc    Get Sidebar Content (Admin)
// @route   GET /api/v1/sidebar/admin
// @access  Admin
// ======================================================
exports.getAdminSidebarContent = async (req, res, next) => {

    try {

        const items = await SidebarContent.find()
            .sort({
                priority: -1,
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: items.length,
            items
        });

    } catch (error) {
        next(error);
    }

};

// ======================================================
// @desc    Create Sidebar Item
// @route   POST /api/v1/sidebar
// @access  Admin
// ======================================================
exports.createSidebarContent = async (req, res, next) => {

    try {

        const item = await SidebarContent.create({

            title: req.body.title,

            description: req.body.description || "",

            type: req.body.type || "NEWS",
            // NEWS
            // EVENT
            // JOB
            // CUSTOMS
            // DGFT
            // SHIPPING_LINE
            // EXPERT
            // SPONSORED

            link: req.body.link || "",

            imageUrl: req.body.imageUrl || "",

            isSponsored: req.body.isSponsored || false,

            isActive:
                req.body.isActive !== undefined
                    ? req.body.isActive
                    : true,

            priority: req.body.priority || 0,

            startsAt: req.body.startsAt || new Date(),

            expiresAt: req.body.expiresAt || null,

            createdBy: req.user.userId

        });

        return res.status(201).json({
            success: true,
            message: "Sidebar content created successfully.",
            item
        });

    } catch (error) {
        next(error);
    }

};

// ======================================================
// @desc    Update Sidebar Item
// @route   PUT /api/v1/sidebar/:id
// @access  Admin
// ======================================================
exports.updateSidebarContent = async (req, res, next) => {

    try {

        const item = await SidebarContent.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Sidebar content not found."
            });
        }

        const fields = [
            "title",
            "description",
            "type",
            "link",
            "imageUrl",
            "priority",
            "startsAt",
            "expiresAt",
            "isActive",
            "isSponsored"
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                item[field] = req.body[field];
            }
        });

        await item.save();

        return res.status(200).json({
            success: true,
            message: "Sidebar content updated successfully.",
            item
        });

    } catch (error) {
        next(error);
    }

};

// ======================================================
// @desc    Delete Sidebar Item
// @route   DELETE /api/v1/sidebar/:id
// @access  Admin
// ======================================================
exports.deleteSidebarContent = async (req, res, next) => {

    try {

        const item = await SidebarContent.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Sidebar content not found."
            });
        }

        await item.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Sidebar content deleted successfully."
        });

    } catch (error) {
        next(error);
    }

};