const mongoose = require("mongoose");

const Question = require("../models/Question");
const User = require("../models/User");


// ======================================================
// CREATE QUESTION
// POST /api/v1/questions
// Private
// ======================================================

exports.createQuestion = async (req, res, next) => {

    try {

        const userId = req.user.userId;

        const {
            title,
            description,
            category,
            tags,
            hsCode,
            country
        } = req.body;


        // ==============================================
        // Validation
        // ==============================================

        if (!title || !title.trim()) {

            return res.status(400).json({
                success: false,
                message: "Question title is required."
            });

        }

        if (!description || !description.trim()) {

            return res.status(400).json({
                success: false,
                message: "Question description is required."
            });

        }


        // ==============================================
        // Check User
        // ==============================================

        const user = await User.findById(userId);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        // ==============================================
        // Create Question
        // ==============================================

        const question = await Question.create({

            author: userId,

            title: title.trim(),

            description: description.trim(),

            category: category || "Other",

            tags: Array.isArray(tags)
                ? tags
                : [],

            hsCode: hsCode || "",

            country: country || ""

        });


        // ==============================================
        // Populate Author
        // ==============================================

        await question.populate(
            "author",
            "fullName profession companyName designation location profileImage isVerified"
        );


        return res.status(201).json({

            success: true,

            message:
                "Question created successfully.",

            question

        });

    } catch (error) {

        next(error);

    }

};



// ======================================================
// GET ALL QUESTIONS
// GET /api/v1/questions
// Public / Optional Auth
// ======================================================

exports.getQuestions = async (req, res, next) => {

    try {

        const {
            page = 1,
            limit = 20,
            search = "",
            category,
            status,
            hsCode,
            country,
            sort = "latest"
        } = req.query;


        const pageNumber =
            Math.max(
                parseInt(page) || 1,
                1
            );


        const limitNumber =
            Math.min(
                Math.max(
                    parseInt(limit) || 20,
                    1
                ),
                100
            );


        // ==============================================
        // Base Filter
        // ==============================================

        const filter = {

            isDeleted: false,

            isPublished: true

        };


        // ==============================================
        // Category Filter
        // ==============================================

        if (category) {

            filter.category = category;

        }


        // ==============================================
        // Status Filter
        // ==============================================

        if (status) {

            filter.status = status;

        }


        // ==============================================
        // HS Code Filter
        // ==============================================

        if (hsCode) {

            filter.hsCode = {
                $regex: hsCode.trim(),
                $options: "i"
            };

        }


        // ==============================================
        // Country Filter
        // ==============================================

        if (country) {

            filter.country = {
                $regex: country.trim(),
                $options: "i"
            };

        }


        // ==============================================
        // Search
        // ==============================================

        if (search.trim()) {

            filter.$text = {
                $search: search.trim()
            };

        }


        // ==============================================
        // Sorting
        // ==============================================

        let sortOption = {
            createdAt: -1
        };


        if (sort === "popular") {

            sortOption = {
                upvotesCount: -1,
                createdAt: -1
            };

        }


        if (sort === "unanswered") {

            sortOption = {
                answersCount: 1,
                createdAt: -1
            };

        }


        if (sort === "views") {

            sortOption = {
                views: -1,
                createdAt: -1
            };

        }


        // ==============================================
        // Count
        // ==============================================

        const total =
            await Question.countDocuments(
                filter
            );


        // ==============================================
        // Fetch
        // ==============================================

        const questions =
            await Question.find(filter)

                .populate(
                    "author",
                    "fullName profession companyName designation location profileImage isVerified"
                )

                .sort(sortOption)

                .skip(
                    (pageNumber - 1) *
                    limitNumber
                )

                .limit(limitNumber)

                .lean();


        // ==============================================
        // Current User
        // ==============================================

        const currentUserId =
            req.user?.userId;


        // ==============================================
        // Format Questions
        // ==============================================

        const formattedQuestions =
            questions.map(question => {

                const isUpvoted =
                    currentUserId
                        ? question.upvotes.some(
                            id =>
                                id.toString() ===
                                currentUserId.toString()
                        )
                        : false;


                const isOwner =
                    currentUserId
                    &&
                    question.author?._id?.toString() ===
                    currentUserId.toString();


                return {

                    ...question,

                    isUpvoted,

                    isOwner

                };

            });


        return res.status(200).json({

            success: true,

            count:
                formattedQuestions.length,

            total,

            page:
                pageNumber,

            limit:
                limitNumber,

            totalPages:
                Math.ceil(
                    total /
                    limitNumber
                ),

            questions:
                formattedQuestions

        });

    } catch (error) {

        next(error);

    }

};



// ======================================================
// GET SINGLE QUESTION
// GET /api/v1/questions/:id
// Public / Optional Auth
// ======================================================

exports.getQuestion = async (req, res, next) => {

    try {

        const { id } = req.params;


        // ==============================================
        // Validate ID
        // ==============================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid question ID."
            });

        }


        // ==============================================
        // Find Question
        // ==============================================

        const question =
            await Question.findOne({

                _id: id,

                isDeleted: false,

                isPublished: true

            })

                .populate(
                    "author",
                    "fullName profession companyName designation location profileImage isVerified"
                )

                .lean();


        if (!question) {

            return res.status(404).json({

                success: false,

                message:
                    "Question not found."

            });

        }


        // ==============================================
        // Increase Views
        // ==============================================

        await Question.updateOne(

            { _id: id },

            {
                $inc: {
                    views: 1
                }
            }

        );


        // ==============================================
        // Current User
        // ==============================================

        const currentUserId =
            req.user?.userId;


        // ==============================================
        // User State
        // ==============================================

        const isUpvoted =
            currentUserId
                ? question.upvotes.some(
                    user =>
                        user.toString() ===
                        currentUserId.toString()
                )
                : false;


        const isOwner =
            currentUserId
            &&
            question.author?._id?.toString() ===
            currentUserId.toString();


        return res.status(200).json({

            success: true,

            question: {

                ...question,

                views:
                    question.views + 1,

                isUpvoted,

                isOwner

            }

        });

    } catch (error) {

        next(error);

    }

};



// ======================================================
// UPDATE QUESTION
// PUT /api/v1/questions/:id
// Private
// ======================================================

exports.updateQuestion = async (req, res, next) => {

    try {

        const userId =
            req.user.userId;

        const { id } =
            req.params;


        // ==============================================
        // Validate ID
        // ==============================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid question ID."

            });

        }


        // ==============================================
        // Find Question
        // ==============================================

        const question =
            await Question.findOne({

                _id: id,

                isDeleted: false

            });


        if (!question) {

            return res.status(404).json({

                success: false,

                message:
                    "Question not found."

            });

        }


        // ==============================================
        // Ownership
        // ==============================================

        if (
            question.author.toString() !==
            userId.toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You can only edit your own questions."

            });

        }


        // ==============================================
        // Fields
        // ==============================================

        const {
            title,
            description,
            category,
            tags,
            hsCode,
            country,
            status
        } = req.body;


        // ==============================================
        // Update
        // ==============================================

        if (title !== undefined) {

            if (!title.trim()) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Question title cannot be empty."
                });

            }

            question.title =
                title.trim();

        }


        if (description !== undefined) {

            if (!description.trim()) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Question description cannot be empty."
                });

            }

            question.description =
                description.trim();

        }


        if (category !== undefined) {

            question.category =
                category;

        }


        if (tags !== undefined) {

            question.tags =
                Array.isArray(tags)
                    ? tags
                    : [];

        }


        if (hsCode !== undefined) {

            question.hsCode =
                hsCode;

        }


        if (country !== undefined) {

            question.country =
                country;

        }


        // ==============================================
        // Status
        // ==============================================

        if (status !== undefined) {

            if (
                ![
                    "OPEN",
                    "ANSWERED",
                    "CLOSED"
                ].includes(status)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid question status."

                });

            }

            question.status =
                status;

        }


        await question.save();


        // ==============================================
        // Populate Author
        // ==============================================

        await question.populate(
            "author",
            "fullName profession companyName designation location profileImage isVerified"
        );


        return res.status(200).json({

            success: true,

            message:
                "Question updated successfully.",

            question

        });

    } catch (error) {

        next(error);

    }

};



// ======================================================
// DELETE QUESTION
// DELETE /api/v1/questions/:id
// Private
// ======================================================

exports.deleteQuestion = async (req, res, next) => {

    try {

        const userId =
            req.user.userId;

        const { id } =
            req.params;


        // ==============================================
        // Validate ID
        // ==============================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid question ID."

            });

        }


        // ==============================================
        // Find Question
        // ==============================================

        const question =
            await Question.findOne({

                _id: id,

                isDeleted: false

            });


        if (!question) {

            return res.status(404).json({

                success: false,

                message:
                    "Question not found."

            });

        }


        // ==============================================
        // Ownership
        // ==============================================

        if (
            question.author.toString() !==
            userId.toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You can only delete your own questions."

            });

        }


        // ==============================================
        // Soft Delete
        // ==============================================

        question.isDeleted =
            true;

        question.isPublished =
            false;


        await question.save();


        return res.status(200).json({

            success: true,

            message:
                "Question deleted successfully."

        });

    } catch (error) {

        next(error);

    }

};



// ======================================================
// TOGGLE QUESTION UPVOTE
// PUT /api/v1/questions/:id/upvote
// Private
// ======================================================

exports.toggleUpvote = async (req, res, next) => {

    try {

        const userId =
            req.user.userId;

        const { id } =
            req.params;


        // ==============================================
        // Validate ID
        // ==============================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid question ID."

            });

        }


        // ==============================================
        // Find Question
        // ==============================================

        const question =
            await Question.findOne({

                _id: id,

                isDeleted: false,

                isPublished: true

            });


        if (!question) {

            return res.status(404).json({

                success: false,

                message:
                    "Question not found."

            });

        }


        // ==============================================
        // Check Existing Upvote
        // ==============================================

        const alreadyUpvoted =
            question.upvotes.some(
                user =>
                    user.toString() ===
                    userId.toString()
            );


        // ==============================================
        // Toggle
        // ==============================================

        if (alreadyUpvoted) {

            question.upvotes =
                question.upvotes.filter(
                    user =>
                        user.toString() !==
                        userId.toString()
                );

        } else {

            question.upvotes.push(
                userId
            );

        }


        // ==============================================
        // Count
        // ==============================================

        question.upvotesCount =
            question.upvotes.length;


        await question.save();


        return res.status(200).json({

            success: true,

            upvoted:
                !alreadyUpvoted,

            upvotesCount:
                question.upvotesCount

        });

    } catch (error) {

        next(error);

    }

};



// ======================================================
// GET MY QUESTIONS
// GET /api/v1/questions/my
// Private
// ======================================================

exports.getMyQuestions = async (req, res, next) => {

    try {

        const userId =
            req.user.userId;


        const questions =
            await Question.find({

                author: userId,

                isDeleted: false

            })

                .sort({
                    createdAt: -1
                })

                .populate(
                    "author",
                    "fullName profession companyName designation location profileImage isVerified"
                );


        return res.status(200).json({

            success: true,

            count:
                questions.length,

            questions

        });

    } catch (error) {

        next(error);

    }

};