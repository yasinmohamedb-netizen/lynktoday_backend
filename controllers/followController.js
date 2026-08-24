const User = require("../models/User");
const Notification = require("../models/Notification");

const {
    getUserSocket
} = require("../utils/socketManager");


// ============================================
// Toggle Follow / Unfollow
// POST /api/v1/follow/:userId
// ============================================

exports.toggleFollow = async (req, res, next) => {

    try {

        const currentUserId =
            req.user.userId;

        const targetUserId =
            req.params.userId;


        // ==========================================
        // Cannot Follow Yourself
        // ==========================================

        if (
            currentUserId.toString() ===
            targetUserId.toString()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "You cannot follow yourself."

            });

        }


        // ==========================================
        // Get Users
        // ==========================================

        const currentUser =
            await User.findById(
                currentUserId
            );

        const targetUser =
            await User.findById(
                targetUserId
            );


        if (
            !currentUser ||
            !targetUser
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        // ==========================================
        // Check Existing Follow
        // ==========================================

        const alreadyFollowing =
            currentUser.following.some(

                id =>
                    id.toString() ===
                    targetUserId.toString()

            );


        // ==========================================
        // UNFOLLOW
        // ==========================================

        if (alreadyFollowing) {

            currentUser.following.pull(
                targetUserId
            );

            targetUser.followers.pull(
                currentUserId
            );


            currentUser.followingCount =
                Math.max(
                    0,
                    (currentUser.followingCount || 0) - 1
                );


            targetUser.followersCount =
                Math.max(
                    0,
                    (targetUser.followersCount || 0) - 1
                );


            await currentUser.save();

            await targetUser.save();


            return res.status(200).json({

                success: true,

                following: false,

                followersCount:
                    targetUser.followersCount,

                followingCount:
                    currentUser.followingCount,

                message:
                    "User unfollowed successfully."

            });

        }


        // ==========================================
        // FOLLOW
        // ==========================================

        if (
            !currentUser.following.some(
                id =>
                    id.toString() ===
                    targetUserId.toString()
            )
        ) {

            currentUser.following.push(
                targetUserId
            );

        }


        if (
            !targetUser.followers.some(
                id =>
                    id.toString() ===
                    currentUserId.toString()
            )
        ) {

            targetUser.followers.push(
                currentUserId
            );

        }


        currentUser.followingCount =
            (currentUser.followingCount || 0) + 1;


        targetUser.followersCount =
            (targetUser.followersCount || 0) + 1;


        await currentUser.save();

        await targetUser.save();


        // ==========================================
        // Remove Old Follow Notification
        // ==========================================

        await Notification.deleteMany({

            receiver:
                targetUser._id,

            sender:
                currentUser._id,

            type:
                "FOLLOW"

        });


        // ==========================================
        // Create Notification
        // ==========================================

        const notification =
            await Notification.create({

                receiver:
                    targetUser._id,

                sender:
                    currentUser._id,

                type:
                    "FOLLOW",

                message:
                    `${currentUser.fullName} started following you.`

            });


        // ==========================================
        // Real-Time Socket Notification
        // ==========================================

        const io =
            req.app.get("io");


        if (io) {

            const receiverSocket =
                getUserSocket(
                    targetUser._id
                );


            if (receiverSocket) {

                io.to(receiverSocket).emit(

                    "new_notification",

                    notification

                );

                console.log(
                    `Real-time notification sent to ${targetUser.fullName}`
                );

            } else {

                console.log(
                    `User ${targetUser._id} is not connected`
                );

            }

        }


        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({

            success: true,

            following: true,

            followersCount:
                targetUser.followersCount,

            followingCount:
                currentUser.followingCount,

            message:
                "User followed successfully."

        });

    } catch (error) {

        next(error);

    }

};



// ============================================
// Get Followers
// GET /api/v1/follow/followers/:userId
// @access Private
// ============================================

exports.getFollowers = async (
    req,
    res,
    next
) => {

    try {

        const user =
            await User.findById(
                req.params.userId
            )
            .populate(
                "followers",
                "fullName profileImage profession designation companyName location accountType isVerified followersCount followingCount following"
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        // ==========================================
        // Current Logged In User
        // ==========================================

        const currentUserId =
            req.user.userId.toString();


        const currentUser =
            await User.findById(
                currentUserId
            )
            .select("following");


        if (!currentUser) {

            return res.status(404).json({

                success: false,

                message:
                    "Current user not found."

            });

        }


        // ==========================================
        // Build Followers List
        // ==========================================

        const followers =
            user.followers.map(
                follower => {

                    const followerObject =
                        follower.toObject();


                    followerObject.isFollowing =
                        currentUser.following.some(

                            followingId =>
                                followingId
                                    .toString() ===
                                follower._id
                                    .toString()

                        );


                    // Don't expose following array

                    delete followerObject.following;


                    return followerObject;

                }
            );


        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({

            success: true,

            count:
                followers.length,

            followers

        });

    } catch (error) {

        next(error);

    }

};



// ============================================
// Get Following
// GET /api/v1/follow/following/:userId
// @access Private
// ============================================

exports.getFollowing = async (
    req,
    res,
    next
) => {

    try {

        const user =
            await User.findById(
                req.params.userId
            )
            .populate(
                "following",
                "fullName profileImage profession designation companyName location accountType isVerified followersCount followingCount following"
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        // ==========================================
        // Current Logged In User
        // ==========================================

        const currentUserId =
            req.user.userId.toString();


        const currentUser =
            await User.findById(
                currentUserId
            )
            .select("following");


        if (!currentUser) {

            return res.status(404).json({

                success: false,

                message:
                    "Current user not found."

            });

        }


        // ==========================================
        // Build Following List
        // ==========================================

        const following =
            user.following.map(
                followedUser => {

                    const followedUserObject =
                        followedUser.toObject();


                    followedUserObject.isFollowing =
                        currentUser.following.some(

                            followingId =>
                                followingId
                                    .toString() ===
                                followedUser._id
                                    .toString()

                        );


                    // Don't expose following array

                    delete followedUserObject.following;


                    return followedUserObject;

                }
            );


        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({

            success: true,

            count:
                following.length,

            following

        });

    } catch (error) {

        next(error);

    }

};