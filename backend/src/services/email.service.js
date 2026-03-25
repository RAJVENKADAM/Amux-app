const nodemailer = require('nodemailer');

class EmailService {
  constructor() {

  this.transporter = nodemailer.createTransport({

      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.from = process.env.EMAIL_FROM || 'HiRhub <noreply@hirhub.com>';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Send OTP email for verification
   */
  async sendOTPEmail(email, otp) {
    const mailOptions = {
      from: this.from,
      to: email,
      subject: 'Your HiRhub Verification Code 🔐',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; text-align: center; }
            .otp-box { background: #667eea; color: white; font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 20px auto; padding: 20px; border-radius: 10px; font-family: monospace; width: 200px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HiRhub Verification</h1>
            <p>Your 4-digit verification code</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Use this one-time code to verify your HiRhub account:</p>
            
            <div class="otp-box">${otp}</div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This code expires in <strong>5 minutes</strong>. 
              Don't share this code with anyone.
            </div>
            
            <p>Enter it in the app to complete registration.</p>
            
            <p>If you didn't create an account, ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} HiRhub. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending OTP email:', error.message);
      throw new Error('Failed to send OTP');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${this.frontendUrl}/reset-password/${token}`;
    
    const mailOptions = {
      from: this.from,
      to: email,
      subject: 'Reset Your HiRhub Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request 🔒</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your HiRhub password.</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Important:</strong> Link expires in 1 hour.
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HiRhub</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending reset email:', error.message);
      throw new Error('Failed to send reset email');
    }
  }

  /**
   * Send welcome email after OTP verification
   */
  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: this.from,
      to: email,
      subject: 'Welcome to HiRhub! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px; }
            .content { background: #f9f9f9; padding: 30px; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .cta { text-align: center; margin-top: 30px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome, ${name}! 🚀</h1>
            <p>Your HiRhub account is ready!</p>
          </div>
          <div class="content">
            <p>Thanks for verifying your email. Now showcase your skills:</p>
            
            <div class="feature">
              <strong>📚 Upload Courses</strong> - Share your knowledge
            </div>
            <div class="feature">
              <strong>📊 Build Profile</strong> - Showcase your courses
            </div>
            <div class="feature">
              <strong>🌐 Network</strong> - Connect with professionals
            </div>
            
            <div class="cta">
              <p><strong>Ready to start?</strong></p>
              <a href="${this.frontendUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Go to Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} HiRhub</p>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending welcome email:', error.message);
    }
  }
}

module.exports = new EmailService();

