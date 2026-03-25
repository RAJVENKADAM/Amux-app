const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const feedController = require('../controllers/feed.controller');

// Routes - all require auth
router.use(authenticateToken);
router.get('/', feedController.getFeed);
router.post('/:id/like', feedController.likePost);
router.post('/:id/comment', feedController.commentOnPost);

module.exports = router;
