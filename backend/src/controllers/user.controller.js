const User = require('../models/User.model');
const Course = require('../models/Course.model');
const mongoose = require('mongoose');

// Get all courses (Home Page)
exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({})
      .populate('owner', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

// Add course (Upload)
exports.addCourse = async (req, res, next) => {
  try {
    const { title, description, thumbnail, topics } = req.body;

    if (!title || !topics || topics.length < 1) {
      return res.status(400).json({ success: false, message: 'Course title and at least 1 topic required' });
    }

    // Validate YouTube URLs - Flexible regex matching frontend
    const youtubeRegex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+(\S+)?$/;
    for (const t of topics) {
      if (!youtubeRegex.test(t.youtubeUrl)) {
        return res.status(400).json({ success: false, message: `Invalid YouTube URL for topic: ${t.name}` });
      }
    }

    const { source = 'course' } = req.body;
    const course = new Course({
      title,
      description,
      thumbnail,
      topics,
      source,
      owner: req.user._id,
      published: true,
    });
    await course.save();

    await User.findByIdAndUpdate(req.user._id, { $push: { courses: course._id } });

// Send notifications to followers
    const owner = await User.findById(req.user._id).select('username followers').populate('followers', 'name username profilePicture pushToken');
    const Notification = require('../models/Notification.model');
    const expoPush = require('../services/expoPush');
    
    const pushTokens = owner.followers
      .filter(f => f.pushToken)
      .map(f => f.pushToken);
    
    // Create notifications
    for (const follower of owner.followers) {
      await Notification.create({
        userId: follower._id,
        type: 'new_course_post',
        message: `${owner.username} posted a new course: ${course.title}`,
        fromUser: owner._id,
        courseId: course._id
      });
    }
    
    // Send push notifications
    if (pushTokens.length > 0 && process.env.EXPO_ACCESS_TOKEN) {
      await expoPush.sendPushNotification(
        pushTokens,
        'New Course!',
        `${owner.username} posted a new course: ${course.title}`,
        { type: 'new_course_post', courseId: course._id, ownerId: owner._id }
      );
    }

    res.status(201).json({ success: true, message: 'Course launched successfully', data: course });
  } catch (error) {
    next(error);
  }
};

// Get user profile - FIXED: Single query, no lean(), proper populate
exports.getUserProfile = async (req, res, next) => {
  try {
const { id: identifier } = req.params;
    console.log('🔍 Route param id:', req.params.id, 'identifier:', identifier);
    
    console.log('🔍 getUserProfile identifier:', identifier, typeof identifier);
    
    let userQuery;
    
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      userQuery = { _id: identifier };
    } else {
      userQuery = { username: identifier };
    }
    
    console.log('🔍 getUserProfile using query:', userQuery);
    
    const user = await User.findOne(userQuery)
    .populate('courses', 'title thumbnail source owner published createdAt trustCount')
    .populate('savedCourses', 'title thumbnail source owner published createdAt trustCount')
    .populate('pinnedCourses', 'title thumbnail source owner published createdAt trustCount')
    .populate('followers', 'name username profilePicture')
    .lean();

    console.log('✅ User found:', !!user, 'ID:', user?._id, 'Username:', user?.username);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate total trust count from all course types
    const totalTrust = (user.courses || []).reduce((sum, course) => sum + (course.trustCount || 0), 0) +
                      (user.savedCourses || []).reduce((sum, course) => sum + (course.trustCount || 0), 0);
    user.totalTrustCount = totalTrust;

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('🔥 getUserProfile error:', error.message, 'identifier:', req.params.identifier);
    next(error);
  }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    // 🔧 Defensive check for malformed req.body (fix for "Value of undefined")
    if (!req.body) {
      console.error('❌ EMPTY req.body in updateProfile');
      return res.status(400).json({ success: false, message: 'Invalid request body' });
    }
    
    console.log('📦 req.body type:', typeof req.body, 'keys:', Object.keys(req.body));
    console.log('📦 req.body full:', JSON.stringify(req.body, null, 2));
    
    const { name, username, profilePicture } = req.body;
    
    // 🔥 DETAILED LOGGING for debugging
    console.log('🔥 PROFILE UPDATE START:', {
      userId: req.user._id,
      currentUser: req.user.username,
      name,
      username,
      profilePicture: profilePicture ? `${profilePicture.substring(0, 50)}...` : 'none',
      hasToken: !!req.user
    });

    // ✅ REMOVED STRICT CLOUDINARY VALIDATION - Cloudinary middleware handles it
    if (profilePicture) {
      console.log('✅ ProfilePicture received (validation skipped):', profilePicture.substring(0, 100) + '...');
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const currentUser = req.user;

    // Check username uniqueness if changed
    if (username && username.trim() !== currentUser.username) {
      const existingUser = await User.findOne({ 
        username: username.trim().toLowerCase() 
      });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
    }

    // Build update object conditionally
    const updateData = {
      name: name.trim(),
    };
    
    if (username && username.trim() !== currentUser.username) {
      updateData.username = username.trim().toLowerCase();
    }
    
    if (profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    console.log('🔥🔥 UPDATE DEBUG - Before DB update:');
    console.log('  User ID:', currentUser._id);
    console.log('  updateData:', JSON.stringify(updateData, null, 2));
    
    // Get DB state before update
    const beforeUpdate = await User.findById(currentUser._id).select('profilePicture updatedAt');
    console.log('🔥 DB Before:', {
      profilePicture: beforeUpdate?.profilePicture || 'EMPTY',
      updatedAt: beforeUpdate?.updatedAt
    });
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires');
    
    // Verify DB state after update
    const afterUpdate = await User.findById(currentUser._id).select('profilePicture updatedAt');
    console.log('🔥 DB After:', {
      profilePicture: afterUpdate?.profilePicture || 'EMPTY',
      updatedAt: afterUpdate?.updatedAt,
      success: afterUpdate?.profilePicture !== beforeUpdate?.profilePicture
    });
    
    console.log('✅ PROFILE UPDATED SUCCESS:', {
      userId: updatedUser._id,
      newName: updatedUser.name,
      newUsername: updatedUser.username,
      newProfilePic: !!updatedUser.profilePicture,
      dbSaved: !!afterUpdate?.profilePicture
    });

    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedUser 
    });
  } catch (error) {
    console.error('🔥 PROFILE UPDATE ERROR:', {
      userId: req.user?._id,
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

// Get user's courses
exports.getMyCourses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const courses = await Course.find({ owner: id, published: true })
      .populate('owner', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({ 
      success: true, 
      data: { 
        courses,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: courses.length }
      } 
    });
  } catch (error) {
    next(error);
  }
};

// Get popular courses
exports.getPopularCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const courses = await Course.find({ published: true })
      .populate('owner', 'name username profilePicture')
      .sort({ stars: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({ 
      success: true, 
      data: { 
        courses,
        pagination: { page: parseInt(page), limit: parseInt(limit) }
      } 
    });
  } catch (error) {
    next(error);
  }
};

// Trust course (thumbs up)
exports.trustCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already trusted
    if (course.trustedBy.includes(userId)) {
      return res.status(200).json({ 
        success: true, 
        alreadyTrusted: true, 
        message: 'Already trusted this course',
        trustCount: course.trustCount 
      });
    }

    // Add trust
    course.trustedBy.push(userId);
    course.trustCount += 1;
    await course.save();

    res.status(200).json({ 
      success: true, 
      alreadyTrusted: false,
      message: 'Course trusted successfully!',
      trustCount: course.trustCount 
    });
  } catch (error) {
    next(error);
  }
};

// Distrust course (thumbs down)
exports.distrustCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already distrusted (not trusted)
    if (!course.trustedBy.includes(userId)) {
      return res.status(200).json({ 
        success: true, 
        alreadyDistrusted: true, 
        message: 'Course not trusted',
        trustCount: course.trustCount 
      });
    }

    // Remove from trustedBy
    course.trustedBy = course.trustedBy.filter(id => id.toString() !== userId.toString());
    course.trustCount = Math.max(0, course.trustCount - 1);
    await course.save();

    res.status(200).json({ 
      success: true, 
      alreadyDistrusted: false,
      message: 'Trust removed successfully!',
      trustCount: course.trustCount 
    });
  } catch (error) {
    next(error);
  }
};

// Save/Unsave course (toggle)
exports.saveCourse = async (req, res, next) => {
  try {
    let { userId, courseId } = req.params;
    
    if (userId === 'me') userId = req.user._id;
    
    console.log('🔍 saveCourse auth check:', { userId, courseId, loggedUser: req.user._id.toString(), reqUserId: req.user._id });

    // Allow any authenticated user to save any course (no ownership check needed)
    // if (userId !== req.user._id.toString()) {
    //   return res.status(403).json({ success: false, message: 'Unauthorized' });
    // }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const user = await User.findById(userId);
    const isSaved = user.savedCourses.includes(courseId);

    let message, action;
    if (isSaved) {
      await User.findByIdAndUpdate(userId, { $pull: { savedCourses: courseId } });
      message = 'Course unsaved';
      action = 'removed';
    } else {
      await User.findByIdAndUpdate(userId, { $push: { savedCourses: courseId } });
      message = 'Course saved';
      action = 'added';
    }

    const updatedUser = await User.findById(userId).populate('savedCourses', 'title thumbnail owner');
    const count = updatedUser.savedCourses.length;

    res.json({ 
      success: true, 
      action, 
      message, 
      count,
      course: { _id: courseId, title: course.title }
    });
  } catch (error) {
    next(error);
  }
};

// Delete course
exports.deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findOne({ _id: courseId, owner: userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
    }

    await Course.findByIdAndDelete(courseId);
    await User.findByIdAndUpdate(userId, { $pull: { courses: courseId } });

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get saved courses
exports.getSavedCourses = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const savedCourses = await User.findById(userId)
      .populate({
        path: 'savedCourses',
        select: 'title thumbnail description topics owner published createdAt trustCount views',
        match: { published: true },
        options: { skip, limit: parseInt(limit), sort: { createdAt: -1 } }
      })
      .select('savedCourses')
      .lean();

    res.status(200).json({ 
      success: true, 
      data: { 
        courses: savedCourses.savedCourses,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: user.savedCourses.length }
      } 
    });
  } catch (error) {
    next(error);
  }
};

// Get user's paid courses (NEW for home page unpaid prioritization)
exports.getPaidCourses = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const Payment = require('../models/Payment.model');
    const Course = require('../models/Course.model');

    const paidCourses = await Payment.aggregate([
      { $match: { 
          user: userId, 
          status: 'paid',
          course: { $exists: true }
        } 
      },
      { $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course',
          pipeline: [
            { $match: { published: true } },
            { $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner',
                pipeline: [{ $project: { name: 1, username: 1, profilePicture: 1 } }]
              }
            },
            { $addFields: { owner: { $arrayElemAt: ['$owner', 0] } } },
            { $project: {
                title: 1, description: 1, thumbnail: 1, topics: 1,
                owner: 1, source: 1, published: 1, trustCount: 1,
                createdAt: 1, views: 1
              }
            }
          ]
        }
      },
      { $unwind: '$course' },
      { $replaceRoot: { newRoot: '$course' } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const total = await Payment.countDocuments({ 
      user: userId, 
      status: 'paid',
      course: { $exists: true } 
    });

    res.status(200).json({
      success: true,
      data: {
        courses: paidCourses,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
      }
    });
  } catch (error) {
    console.error('getPaidCourses error:', error);
    next(error);
  }
};

// Toggle pin course (protected)
exports.togglePinCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const user = await User.findById(userId);
    const isPinned = user.pinnedCourses.includes(courseId);

    let message, action;
    if (isPinned) {
      await User.findByIdAndUpdate(userId, { $pull: { pinnedCourses: courseId } });
      message = 'Course unpinned';
      action = 'unpinned';
    } else {
      await User.findByIdAndUpdate(userId, { $push: { pinnedCourses: courseId } });
      message = 'Course pinned';
      action = 'pinned';
    }

    const updatedUser = await User.findById(userId).populate('pinnedCourses', 'title thumbnail owner');
    const count = updatedUser.pinnedCourses.length;

    res.json({ 
      success: true, 
      action, 
      message, 
      count,
      course: { _id: courseId, title: course.title }
    });
  } catch (error) {
    next(error);
  }
};

// Get my pinned courses (protected)
exports.getMyPinnedCourses = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pinnedCourses = await User.findById(userId)
      .populate({
        path: 'pinnedCourses',
        select: 'title thumbnail description topics owner published createdAt trustCount views',
        match: { published: true },
        options: { skip, limit: parseInt(limit), sort: { createdAt: -1 } }
      })
      .select('pinnedCourses')
      .lean();

    res.status(200).json({ 
      success: true, 
      data: { 
        courses: pinnedCourses.pinnedCourses,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: user.pinnedCourses.length }
      } 
    });
  } catch (error) {
    next(error);
  }
};


