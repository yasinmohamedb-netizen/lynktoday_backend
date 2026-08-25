const AdminHighlight =
    require("../models/AdminHighlight");


// ======================================================
// CREATE ADMIN HIGHLIGHT
// POST /api/v1/admin/highlights
// ======================================================

exports.createHighlight = async (
    req,
    res,
    next
) => {

    try {

        const {
            title,
            description,
            type,
            link,
            imageUrl,
            priority,
            startDate,
            endDate
        } = req.body;


        const highlight =
            await AdminHighlight.create({

                title,

                description,

                type,

                /*
                 * Keep the manually supplied link for
                 * backwards compatibility.
                 *
                 * Industry News will generate its own
                 * /news/:id link in rightSidebarController.
                 */

                link:
                    link || "",

                imageUrl:
                    imageUrl || "",

                priority:
                    Number(priority) || 0,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                createdBy:
                    req.user.userId

            });


        return res.status(201).json({

            success: true,

            highlight

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// GET ALL ADMIN HIGHLIGHTS
// GET /api/v1/admin/highlights
// ======================================================

exports.getHighlights = async (
    req,
    res,
    next
) => {

    try {

        const highlights =
            await AdminHighlight.find()

                .populate(
                    "createdBy",
                    "fullName"
                )

                .sort({

                    priority: -1,

                    createdAt: -1

                });


        return res.status(200).json({

            success: true,

            count:
                highlights.length,

            highlights

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// GET SINGLE ADMIN HIGHLIGHT
// GET /api/v1/admin/highlights/:id
// ======================================================

exports.getHighlightById = async (
    req,
    res,
    next
) => {
    try {
        const highlight =
            await AdminHighlight.findById(
                req.params.id
            ).populate(
                "createdBy",
                "fullName"
            );

        if (!highlight) {
            return res.status(404).json({
                success: false,
                message: "Highlight not found."
            });
        }

        return res.status(200).json({
            success: true,
            highlight
        });

    } catch (error) {
        next(error);
    }
};
// ======================================================
// UPDATE ADMIN HIGHLIGHT
// PATCH /api/v1/admin/highlights/:id
// ======================================================

exports.updateHighlight = async (
    req,
    res,
    next
) => {

    try {

        const highlight =
            await AdminHighlight.findById(
                req.params.id
            );


        if (!highlight) {

            return res.status(404).json({

                success: false,

                message:
                    "Highlight not found."

            });

        }


        const allowedFields = [

            "title",

            "description",

            "type",

            "link",

            "imageUrl",

            "priority",

            "isActive",

            "startDate",

            "endDate"

        ];


        allowedFields.forEach(
            (field) => {

                if (
                    req.body[field] !==
                    undefined
                ) {

                    highlight[field] =
                        req.body[field];

                }

            }
        );


        await highlight.save();


        return res.status(200).json({

            success: true,

            highlight

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// DELETE ADMIN HIGHLIGHT
// DELETE /api/v1/admin/highlights/:id
// ======================================================

exports.deleteHighlight = async (
    req,
    res,
    next
) => {

    try {

        const highlight =
            await AdminHighlight.findById(
                req.params.id
            );


        if (!highlight) {

            return res.status(404).json({

                success: false,

                message:
                    "Highlight not found."

            });

        }


        await highlight.deleteOne();


        return res.status(200).json({

            success: true,

            message:
                "Highlight deleted successfully."

        });

    } catch (error) {

        next(error);

    }

};