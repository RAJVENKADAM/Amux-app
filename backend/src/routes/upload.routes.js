const express = require('express');
const router = express.Router();

const { upload, cloudinary } = require('../middleware/cloudinary');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * Upload files to Cloudinary (max 5)
 */
router.post(
  '/',
  // authenticateToken,           // Temporarily disabled - re-enable after Cloudinary setup
  upload.array('files', 5),
  (req, res) => {
    try {
      // ✅ check files
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // ✅ map uploaded files - BASIC URL ONLY (fixes demo account issues)
      const files = req.files.map(file => ({
        url: file.path,           // Main Cloudinary URL (optimized automatically)
        public_id: file.filename, // Cloudinary public ID
        resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      }));

      // ✅ response
      res.json({
        success: true,
        count: files.length,
        files
      });

    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
