const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const { generateOTPWithExpiry, verifyOTP } = require('../utils/generateOTP');
const emailService = require('../services/email.service');
const axios = require('axios');

/**
 * Register a new user - sends OTP
 */
exports.register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if user exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if username is taken
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    // Create user
    const user = new User({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password
    });

    await user.save();

    console.log('User created ID:', user._id);

    // Generate OTP
    const { otp, expires } = generateOTPWithExpiry();
    user.otp = otp;
    user.otpExpires = expires;
    await user.save();

    console.log('OTP saved to user:', user.otp);

    console.log(`User registered: ${name} (${username}) (${email})`);
    console.log(`Generated OTP: ${otp} (expires: ${expires})`);

    // Send OTP email (non-blocking)
    emailService.sendOTPEmail(email, otp)
      .catch(err => {
        console.error(`Failed to send OTP to ${email}:`, err.message);
      });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the 4-digit OTP.',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedOtp = otp?.trim();

    if (!trimmedEmail || !trimmedOtp || trimmedOtp.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid email and 4-digit OTP'
      });
    }

    const user = await User.findOne({ 
      email: trimmedEmail, 
      emailVerified: false 
    }).select('+otp otpExpires');

    if (!user) {
      console.log(`No unverified user found for email: ${trimmedEmail}`);
      return res.status(400).json({
        success: false,
        message: 'No unverified account found for this email. Please register first.'
      });
    }

    console.log(`Verifying OTP for ${trimmedEmail}: input="${trimmedOtp}", stored="${user.otp}", expires=${user.otpExpires}`); 

    // Verify OTP expiry and match
    const now = Date.now();
    const remainingMs = user.otpExpires.getTime() - now;
    const otpExpired = remainingMs <= 0;
    const otpMatch = user.otp === trimmedOtp;
    
    console.log(`OTP check ${trimmedEmail}: match=${otpMatch}, expired=${otpExpired}, remaining=${Math.round(remainingMs/1000)}s`);
    
    if (otpExpired) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }
    
    if (!otpMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP. Double-check your email and try again.'
      });
    }

    // Mark email as verified and clear OTP
    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.name)
      .catch(err => console.error(`Welcome email error: ${err.message}`))
      .then(() => console.log('✅ Welcome email sent')); 

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP
 */
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new OTP
    const { otp, expires } = generateOTPWithExpiry();
    user.otp = otp;
    user.otpExpires = expires;
    await user.save();

    console.log('Resend OTP saved to user:', user.otp);
    console.log(`Resent OTP to ${email}: ${otp} (expires: ${expires}) - Check email service logs if not received`);

    // Send OTP email (non-blocking)
    emailService.sendOTPEmail(email, otp)
      .catch(err => console.error('Failed to send OTP:', err));

    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user (keeps emailVerified check)
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email with OTP before logging in'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if username is available
 */
exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters'
      });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Username is already taken'
      });
    }

    res.status(200).json({
      success: true,
      available: true,
      message: 'Username is available'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    console.log('🔍 getCurrentUser for user:', req.user._id);
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('🔥 getCurrentUser error:', error.message, 'userId:', req.user?._id);
    next(error);
  }
};



/**
 * Exchange GitHub OAuth code for access token and connect account
 */
exports.exchangeGithubCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/github/callback';

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl
      },
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const { access_token } = tokenResponse.data;

    // Fetch GitHub user info
    const githubUserResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`
      }
    });

    const githubUser = githubUserResponse.data;

    // Update user's GitHub account
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'githubAccount.connected': true,
        'githubAccount.githubId': githubUser.id.toString(),
        'githubAccount.githubUsername': githubUser.login,
        'githubAccount.accessToken': access_token,
        'githubAccount.connectedAt': new Date()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `GitHub account (@${githubUser.login}) connected successfully`,
      data: {
        githubUsername: githubUser.login
      }
    });
  } catch (error) {
    console.error('GitHub connect/exchange error:', error.response || error);

    res.status(400).json({
      success: false,
      message: error.response?.data?.error || 'Failed to connect GitHub account'
    });
  }
};

