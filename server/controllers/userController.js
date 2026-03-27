const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').limit(20);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check if username is available
// @route   GET /api/users/check-username/:username
// @access  Public
exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    const formattedUsername = username.toLowerCase().replace(/\s+/g, '_');
    const user = await User.findOne({ username: formattedUsername });
    
    res.json({ available: !user, formattedUsername });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Get user profile
// @route   GET /api/users/:username
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username name profilePic')
      .populate('following', 'username name profilePic');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc    Increment profile views
// @route   PUT /api/users/:username/view
// @access  Public
exports.viewProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.profileViews += 1;
    await user.save();
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(user._id.toString()).emit('profile_viewed', user.profileViews);
    }
    
    res.json({ views: user.profileViews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user's full profile (with followers/following populated)
// @route   GET /api/users/me/profile
// @access  Private
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user)
      .select('-password')
      .populate('followers', 'username name profilePic')
      .populate('following', 'username name profilePic');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.username) user.username = req.body.username;
      if (req.body.email) user.email = req.body.email;
      if (req.body.bio !== undefined) user.bio = req.body.bio;
      if (req.body.skills) user.skills = req.body.skills;
      if (req.body.profilePic) user.profilePic = req.body.profilePic;
      if (req.body.coverPic !== undefined) user.coverPic = req.body.coverPic;
      if (req.body.githubUsername !== undefined) user.githubUsername = req.body.githubUsername;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        profilePic: updatedUser.profilePic,
        coverPic: updatedUser.coverPic,
        githubUsername: updatedUser.githubUsername,
        followers: updatedUser.followers,
        following: updatedUser.following,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get posts liked or commented on by a user
// @route   GET /api/users/:userId/activity
// @access  Public
exports.getUserActivity = async (req, res) => {
  try {
    const userId = req.params.userId;
    const type = req.query.type; // 'likes' or 'comments'

    let posts;
    if (type === 'likes') {
      posts = await Post.find({ likes: userId, isActivity: { $ne: true } })
        .populate('userId', 'username name profilePic')
        .populate('comments.userId', 'username name profilePic')
        .sort({ createdAt: -1 });
    } else if (type === 'comments') {
      posts = await Post.find({ 'comments.userId': userId, isActivity: { $ne: true } })
        .populate('userId', 'username name profilePic')
        .populate('comments.userId', 'username name profilePic')
        .sort({ createdAt: -1 });
    } else {
      posts = [];
    }

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Follow a user
// @route   PUT /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res) => {
  try {
    if (req.params.id === req.user.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!userToFollow.followers.includes(req.user)) {
      await userToFollow.updateOne({ $push: { followers: req.user } });
      await currentUser.updateOne({ $push: { following: req.params.id } });
      
      // Log Activity in Feed
      await Post.create({
        userId: req.user,
        content: `followed ${userToFollow.username}`,
        isActivity: true,
        activityType: 'follow'
      });

      // Create Notification
      const notif = await Notification.create({
        receiver: req.params.id,
        sender: req.user,
        type: 'follow'
      });

      // Emit Socket Event
      const io = req.app.get('io');
      io.to(req.params.id).emit('new_notification', {
        _id: notif._id,
        type: 'follow',
        senderName: currentUser.username
      });

      res.status(200).json({ message: 'User has been followed' });
    } else {
      res.status(403).json({ message: 'You already follow this user' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Unfollow a user
// @route   PUT /api/users/:id/unfollow
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    if (req.params.id === req.user.toString()) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToUnfollow.followers.includes(req.user)) {
      await userToUnfollow.updateOne({ $pull: { followers: req.user } });
      await currentUser.updateOne({ $pull: { following: req.params.id } });
      res.status(200).json({ message: 'User has been unfollowed' });
    } else {
      res.status(403).json({ message: 'You do not follow this user' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Search users by username
// @route   GET /api/users/search?q=
// @access  Public
exports.searchUsers = async (req, res) => {
  try {
    const keyword = req.query.q
      ? {
          username: {
            $regex: req.query.q,
            $options: 'i',
          },
        }
      : {};

    const users = await User.find({ ...keyword }).select('username name profilePic bio');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
