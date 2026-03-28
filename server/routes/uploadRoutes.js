const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

const MAX_VIDEO_SIZE_BYTES = 5 * 1024 * 1024;
const VIDEO_SIZE_ERROR = 'video till 5mb is allowed or compress video to 5 mb';

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), (req, res) => {
  try {
    if (req.file) {
      if (req.file.mimetype?.startsWith('video/') && req.file.size > MAX_VIDEO_SIZE_BYTES) {
        return res.status(400).json({ message: VIDEO_SIZE_ERROR });
      }

      // Cloudinary upload: multer-storage-cloudinary returns public URL in req.file.path
      if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
        return res.json({ url: req.file.path });
      }

      // Build URL from request host so production uploads always point to the live backend domain.
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.get('host');
      const baseUrl = `${proto}://${host}`;
      return res.json({ url: `${baseUrl}/uploads/${req.file.filename}` });
    } else {
      res.status(400).json({ message: 'No image uploaded' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
