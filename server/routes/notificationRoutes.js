const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markOneAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/read', protect, markAsRead);
router.put('/:id/read', protect, markOneAsRead);

module.exports = router;
