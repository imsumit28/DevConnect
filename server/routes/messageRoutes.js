const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getInboxConversations } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getInboxConversations);
router.post('/', protect, sendMessage);
router.get('/:otherUserId', protect, getConversation);

module.exports = router;
