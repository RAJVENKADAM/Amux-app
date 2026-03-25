const crypto = require('crypto');

/**
 * Generate a 4-digit OTP
 */
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Generate OTP with expiry (5 minutes)
 */
const generateOTPWithExpiry = () => {
  const otp = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  return {
    otp,
    expires: new Date(expires)
  };
};

/**
 * Verify OTP against stored value and expiry
 */
const verifyOTP = (storedOTP, inputOTP, expires) => {
  const now = Date.now();
  const otpExpired = !expires || now > expires.getTime();
  
  return !otpExpired && storedOTP === inputOTP;
};

module.exports = {
  generateOTP,
  generateOTPWithExpiry,
  verifyOTP
};

