// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Home page: all courses
router.get('/courses', userController.getAllCourses);

// Upload course (protected)
router.post('/courses', authenticateToken, userController.addCourse);

// User courses (public)
router.get('/:id/courses', userController.getMyCourses);

// Popular courses (public)
router.get('/courses/popular', userController.getPopularCourses);

// Trust course (protected)
router.post('/courses/:courseId/trust', authenticateToken, userController.trustCourse);

// Distrust course (protected)
router.post('/courses/:courseId/distrust', authenticateToken, userController.distrustCourse);

// Profile

// Update profile (protected)
router.put('/profile', authenticateToken, userController.updateProfile);

// Save course (protected)
router.post('/:userId/save-course/:courseId', authenticateToken, userController.saveCourse);

// Get user's paid courses (protected, NEW)
router.get('/me/paid-courses', authenticateToken, userController.getPaidCourses);

// Delete course (protected)
router.delete('/courses/:courseId', authenticateToken, userController.deleteCourse);

// Pin course (protected toggle)
router.post('/me/pin-course/:courseId', authenticateToken, userController.togglePinCourse);

// Get my pinned courses (protected)
router.get('/me/pinned-courses', authenticateToken, userController.getMyPinnedCourses);

// Get saved courses (public)
router.get('/:userId/saved-courses', userController.getSavedCourses);

module.exports = router;


