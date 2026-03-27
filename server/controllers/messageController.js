const Message = require('../models/Message');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User');

const serializeMessage = (messageDoc) => {
  const msg = messageDoc.toObject ? messageDoc.toObject() : messageDoc;
  return {
    ...msg,
    _id: msg._id?.toString?.() || msg._id,
    senderId: msg.senderId?._id?.toString?.() || msg.senderId?.toString?.() || msg.senderId,
    receiverId: msg.receiverId?._id?.toString?.() || msg.receiverId?.toString?.() || msg.receiverId,
    postId: msg.postId?._id?.toString?.() || msg.postId?.toString?.() || msg.postId || null,
  };
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text, messageType, postId } = req.body;
    const senderId = req.user; // req.user is just the ID string from auth middleware
    const normalizedText = typeof text === 'string' ? text.trim() : '';

    if (!receiverId || !normalizedText) {
      return res.status(400).json({ message: 'receiverId and text are required' });
    }

    if (receiverId.toString() === senderId.toString()) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }

    const receiverExists = await User.findById(receiverId).select('_id');
    if (!receiverExists) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: normalizedText,
      messageType: messageType || 'text',
      postId: postId || null,
    });

    const io = req.app.get('io');
    const serializedMessage = serializeMessage(newMessage);
    
    // Emit the message to receiver
    io.to(receiverId).emit('new_message', serializedMessage);
    // Emit to sender as well so all sender sessions stay in sync.
    io.to(senderId.toString()).emit('new_message', serializedMessage);

    // Create Notification
    const notif = await Notification.create({
      receiver: receiverId,
      sender: senderId,
      type: 'message'
    });

    // Fetch sender's username for notification payload
    const senderUser = await User.findById(senderId).select('username');

    // Emit Notification
    io.to(receiverId).emit('new_notification', {
      _id: notif._id,
      type: 'message',
      senderName: senderUser ? senderUser.username : 'Someone'
    });

    res.status(201).json(serializedMessage);
  } catch (error) {
    console.error('SEND MESSAGE ERROR:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get conversation history
// @route   GET /api/messages/:otherUserId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user, receiverId: req.params.otherUserId },
        { senderId: req.params.otherUserId, receiverId: req.user },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages.map(serializeMessage));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get inbox conversations for current user
// @route   GET /api/messages
// @access  Private
exports.getInboxConversations = async (req, res) => {
  try {
    const currentUserId = req.user;
    const messages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'username name profilePic')
      .populate('receiverId', 'username name profilePic');

    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      const senderId = msg.senderId?._id?.toString() || msg.senderId?.toString();
      const receiverId = msg.receiverId?._id?.toString() || msg.receiverId?.toString();
      const otherUser = senderId === currentUserId.toString() ? msg.receiverId : msg.senderId;
      const otherUserId = otherUser?._id?.toString() || otherUser?.toString();

      if (!otherUserId || seen.has(otherUserId)) continue;
      seen.add(otherUserId);

      conversations.push({
        user: otherUser,
        lastMessage: serializeMessage(msg),
        updatedAt: msg.createdAt,
      });
    }

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
