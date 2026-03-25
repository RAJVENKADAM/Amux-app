const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feed.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Routes
router.post('/:userId', authenticateToken, feedController.followUser);
router.delete('/:userId', authenticateToken, feedController.unfollowUser);

module.exports = router;
