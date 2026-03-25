// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Create Razorpay order for course
router.post('/order/:courseId', authenticateToken, paymentController.createOrder);

// Verify Razorpay payment
router.post('/verify', authenticateToken, paymentController.verifyPayment);

// Get user payments/courses
router.get('/my-payments', authenticateToken, paymentController.getUserPayments);

// Get course payment count (public)
router.get('/course/:courseId/count', paymentController.getCoursePaymentCount);

module.exports = router;
