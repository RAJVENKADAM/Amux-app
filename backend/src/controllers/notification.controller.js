const Notification = require('../models/Notification.model');
const expoPush = require('../services/expoPush');

/**
 * Get user notifications
 */
exports.getNotifications = async (req, res, next) => {
  try {
  const userId = req.user._id;
  const { page = 1, limit = 50, unreadOnly = false } = req.query;

  const query = { userId };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

  const notifications = await Notification.find(query)
      .populate('fromUser', 'name username profilePicture')
      .populate('postId', 'message type')
      .populate('skillId', 'name category')
      .populate('projectId', 'name sourceUrl')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

  const count = await Notification.countDocuments(query);

   // Mark all as read
    if (unreadOnly !== 'true') {
      await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      );
    }

    res.status(200).json({
      success: true,
      data: notifications,
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
 * Mark notification as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
  const notificationId = req.params.id;
  const userId = req.user._id;

  const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        userId 
      },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
  const userId = req.user._id;

    await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
  const userId = req.user._id;

  const count = await Notification.countDocuments({
      userId,
      read: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    next(error);
  }
};
