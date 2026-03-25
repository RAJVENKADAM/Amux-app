const User = require('../models/User.model');
const Course = require('../models/Course.model');


/**
 * Search users, skills, and projects
 */
exports.search = async (req, res, next) => {
  try {
   const { q, type = 'all', page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

   const searchQuery = {
      $regex: q,
      $options: 'i' // Case-insensitive
    };

    let results = {};

    // Search users
    if (type === 'all' || type === 'users') {
     const users = await User.find({
        $or: [
          { name: searchQuery },
          { username: searchQuery },
          { bio: searchQuery }
        ],
        emailVerified: true
      })
        .select('name username profilePicture bio skillScore followers')
        .limit(limit * 1)
        .skip((page - 1) * limit);

      results.users = users;
    }

    // Search courses
    if (type === 'all' || type === 'projects') {
     const courses = await Course.find({
        $or: [
          { title: searchQuery },
          { description: searchQuery }
        ]
      })
        .populate('owner', 'name username profilePicture')
        .sort({ stars: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      results.courses = courses;
    }


    res.status(200).json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

