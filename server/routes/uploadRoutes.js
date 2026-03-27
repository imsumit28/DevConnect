const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), (req, res) => {
  try {
    if (req.file) {
      // Return absolute URL for local storage uploads.
      const baseUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
      res.json({ url: `${baseUrl}/uploads/${req.file.filename}` });
    } else {
      res.status(400).json({ message: 'No image uploaded' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
