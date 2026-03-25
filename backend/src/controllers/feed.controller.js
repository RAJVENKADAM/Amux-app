const User = require('../models/User.model');
const Post = require('../models/Post.model');
const Notification = require('../models/Notification.model');

/**
 * Follow a user
 */
exports.followUser = async (req, res, next) => {
  try {
   const userIdToFollow = req.params.userId;
   const currentUserId = req.user._id;

    if (userIdToFollow === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if user exists
   const userToFollow = await User.findById(userIdToFollow);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already following
    if (userToFollow.followers.includes(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Add follower
    userToFollow.followers.push(currentUserId);
    await userToFollow.save();

    // Add following to current user
    await User.findByIdAndUpdate(currentUserId, {
      $push: { following: userIdToFollow }
    });

    // Create notification
    await Notification.create({
      userId: userIdToFollow,
      type: 'new_follower',
      message: `${req.user.username} started following you`,
      fromUser: currentUserId
    });

    res.status(200).json({
      success: true,
      message: `Successfully followed ${userToFollow.username}`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unfollow a user
 */
exports.unfollowUser = async (req, res, next) => {
  try {
   const userIdToUnfollow = req.params.userId;
   const currentUserId = req.user._id;

   const userToUnfollow = await User.findById(userIdToUnfollow);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove follower
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUserId.toString()
    );
    await userToUnfollow.save();

    // Remove following from current user
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userIdToUnfollow }
    });

    res.status(200).json({
      success: true,
      message: `Successfully unfollowed ${userToUnfollow.username}`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity feed
 */
exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for feed'
      });
    }

    // Get posts from users that current user follows + own posts
    const currentUser = await User.findById(userId);
    const followingIds = [userId, ...currentUser.following];

    const posts = await Post.find({
      userId: { $in: followingIds }
    })
      .populate('userId', 'name username profilePicture')
      .populate('courseId', 'title thumbnail')
      .populate('skillId', 'name category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Post.countDocuments({
      userId: { $in: followingIds }
    });

    // Add likes and comments count
    const postsWithCounts = posts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      isLiked: post.likes?.some(id => id.toString() === userId.toString())
    }));

    res.status(200).json({
      success: true,
      data: postsWithCounts,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Like a post
 */
exports.likePost = async (req, res, next) => {
  try {
   const postId = req.params.id;
   const userId = req.user._id;

   const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    if (post.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked'
      });
    }

    post.likes.push(userId);
    await post.save();

    // Create notification for post owner
    if (post.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: post.userId,
        type: 'post_like',
        message: `${req.user.username} liked your post`,
        fromUser: userId,
        postId: post._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      data: { likesCount: post.likes.length }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Comment on a post
 */
exports.commentOnPost = async (req, res, next) => {
  try {
   const postId = req.params.id;
   const { message } = req.body;
   const userId = req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment message is required'
      });
    }

   const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Add comment
    post.comments.push({
      userId,
      message: message.trim()
    });

    await post.save();

    // Populate the new comment
    await post.populate('comments.userId', 'name username profilePicture');

    // Create notification for post owner
    if (post.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: post.userId,
        type: 'post_comment',
        message: `${req.user.username} commented on your post`,
        fromUser: userId,
        postId: post._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: {
       comment: post.comments[post.comments.length - 1],
       commentsCount: post.comments.length
      }
    });
  } catch (error) {
    next(error);
  }
};
