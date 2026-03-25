const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const verifyOtpValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 4, max: 4 }).isNumeric().withMessage('OTP must be 4 digits')
];

const resendOtpValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

// Routes - OTP Flow
router.post('/register', registerValidation, authController.register);
router.post('/verify-otp', verifyOtpValidation, authController.verifyOTP);
router.post('/resend-otp', resendOtpValidation, authController.resendOTP);
router.post('/login', loginValidation, authController.login);
router.post('/check-username', authController.checkUsername);
router.get('/me', authenticateToken, authController.getCurrentUser);


// Backward compatibility (can be removed later)
router.get('/verify-email/:token', (req, res) => {
  res.status(404).json({ success: false, message: 'This endpoint has been replaced with OTP verification' });
});

module.exports = router;

