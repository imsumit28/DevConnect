const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

const withCommentUsers = (query) =>
  query
    .populate('comments.userId', 'username name profilePic email')
    .populate('comments.replies.userId', 'username name profilePic email');

const withFullPostDataById = (id) =>
  withCommentUsers(
    Post.findById(id)
      .populate('userId', 'username name profilePic email')
      .populate({
        path: 'originalPost',
        populate: { path: 'userId', select: 'username name profilePic email' }
      })
  );

// @desc    Get posts by specific user id
// @route   GET /api/posts/user/:userId
exports.getPostsByUserId = async (req, res) => {
  try {
    const query = { userId: req.params.userId };
    if (req.query.type === 'posts') {
      query.isActivity = { $ne: true };
    } else if (req.query.type === 'activity') {
      query.isActivity = true;
    }

    const posts = await withCommentUsers(
      Post.find(query)
      .populate('userId', 'username name profilePic email')
      .populate({
        path: 'originalPost',
        populate: { path: 'userId', select: 'username name profilePic email' }
      })
      .sort({ createdAt: -1 })
    );
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const newPost = new Post({
      userId: req.user,
      content: req.body.content,
      image: req.body.image || '',
      video: req.body.video || '',
      postType: req.body.postType || 'post',
      articleTitle: req.body.articleTitle || '',
      eventTitle: req.body.eventTitle || '',
      eventDate: req.body.eventDate || null,
    });

    const savedPost = await newPost.save();
    
    const populatedPost = await Post.findById(savedPost._id)
       .populate('userId', 'username name profilePic email');

    req.app.get('io').emit('postCreated', populatedPost);

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Protected
exports.getPosts = async (req, res) => {
  try {
    const posts = await withCommentUsers(
      Post.find({ isActivity: { $ne: true } })
      .populate('userId', 'username name profilePic email')
      .populate({
        path: 'originalPost',
        populate: { path: 'userId', select: 'username name profilePic email' }
      })
      .sort({ createdAt: -1 })
    );
    const viewerReposts = await Post.find({
      userId: req.user,
      isRepost: true,
      originalPost: { $ne: null }
    }).select('originalPost');

    const viewerRepostedOriginalIds = new Set(
      viewerReposts
        .map((r) => (r.originalPost ? String(r.originalPost) : ''))
        .filter(Boolean)
    );

    const postsWithRepostState = posts.map((postDoc) => {
      const post = postDoc.toObject();
      const postId = post?._id ? String(post._id) : '';
      const originalId = post?.originalPost?._id
        ? String(post.originalPost._id)
        : (post?.originalPost ? String(post.originalPost) : '');

      post.viewerHasReposted =
        viewerRepostedOriginalIds.has(postId) ||
        (originalId ? viewerRepostedOriginalIds.has(originalId) : false);

      return post;
    });

    res.json(postsWithRepostState);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Like or Unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.likes.includes(req.user)) {
      await post.updateOne({ $push: { likes: req.user } });
      
      // Emit Socket Event (Real-time like count for everyone)
      const io = req.app.get('io');
      io.emit('like_update', {
        postId: post._id,
        likes: post.likes.length + 1,
        userId: req.user
      });

      // Create Notification if not self-like
      if (post.userId.toString() !== req.user.toString()) {
        const notif = await Notification.create({
          receiver: post.userId,
          sender: req.user,
          type: 'like',
          post: req.params.id
        });

        // Emit Socket Event
        const io = req.app.get('io');
        // Fetch sender's username for the notification payload
        const senderUser = await User.findById(req.user).select('username');
        io.to(post.userId.toString()).emit('new_notification', {
          _id: notif._id,
          type: 'like',
          senderName: senderUser ? senderUser.username : 'Unknown User',
          postId: post._id
        });
      }

      const updatedPost = await withFullPostDataById(req.params.id);
      req.app.get('io').emit('postUpdated', updatedPost);
      res.status(200).json({ message: 'Post liked', post: updatedPost });
    } else {
      await post.updateOne({ $pull: { likes: req.user } });
      const updatedPost = await withFullPostDataById(req.params.id);
      req.app.get('io').emit('postUpdated', updatedPost);
      res.status(200).json({ message: 'Post unliked', post: updatedPost });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      userId: req.user,
      text: req.body.text,
    };

    post.comments.push(comment);
    await post.save();
    
    // Return the updated post with populated user data in comments
    const updatedPost = await withFullPostDataById(req.params.id);

    req.app.get('io').emit('postUpdated', updatedPost);

    res.status(201).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Like or unlike a comment
// @route   PUT /api/posts/:id/comments/:commentId/like
// @access  Private
exports.toggleCommentLike = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (!Array.isArray(comment.likes)) {
      comment.likes = [];
    }

    const userId = req.user.toString();
    const likeIndex = comment.likes.findIndex((l) => l.toString() === userId);
    if (likeIndex >= 0) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(req.user);
    }

    await post.save();
    const updatedPost = await withFullPostDataById(id);
    req.app.get('io').emit('postUpdated', updatedPost);

    return res.status(200).json({
      message: likeIndex >= 0 ? 'Comment unliked' : 'Comment liked',
      post: updatedPost,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reply to a comment
// @route   POST /api/posts/:id/comments/:commentId/reply
// @access  Private
exports.addCommentReply = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const text = (req.body.text || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (!Array.isArray(comment.replies)) {
      comment.replies = [];
    }

    comment.replies.push({
      userId: req.user,
      text,
    });

    await post.save();
    const updatedPost = await withFullPostDataById(id);
    req.app.get('io').emit('postUpdated', updatedPost);

    return res.status(201).json(updatedPost);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the post belongs to the user
    if (post.userId.toString() !== req.user.toString()) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    // Find and delete all reposts
    const reposts = await Post.find({ originalPost: post._id });
    const repostIds = reposts.map(r => r._id);
    
    await Post.deleteMany({ originalPost: post._id });
    await post.deleteOne();

    // Emit deletion events for the original post and all its reposts
    req.app.get('io').emit('postDeleted', req.params.id);
    repostIds.forEach(repostId => {
      req.app.get('io').emit('postDeleted', repostId);
    });

    res.status(200).json({ message: 'Post and its reposts deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Repost a post
// @route   POST /api/posts/:id/repost
// @access  Private
exports.repostPost = async (req, res) => {
  try {
    const originalPostId = req.params.id;
    const postToRepost = await Post.findById(originalPostId);
    
    if (!postToRepost) {
      return res.status(404).json({ message: 'Original post not found' });
    }

    // Determine the true original post (in case they are reposting a repost)
    const trueOriginalId = postToRepost.isRepost && postToRepost.originalPost ? postToRepost.originalPost : originalPostId;

    // Check if user already reposted this
    const existingRepost = await Post.findOne({
      userId: req.user,
      isRepost: true,
      originalPost: trueOriginalId
    });

    if (existingRepost) {
      const repostId = existingRepost._id;
      await existingRepost.deleteOne();
      req.app.get('io').emit('postDeleted', repostId.toString());
      return res.status(200).json({
        message: 'Post removed from your reposts',
        action: 'unreposted',
        postId: trueOriginalId.toString(),
        repostId: repostId.toString(),
      });
    }

    const newPost = await Post.create({
      userId: req.user,
      content: req.body?.content || 'Reposted', // Optional quote text
      isRepost: true,
      originalPost: trueOriginalId
    });

    // Populate for response and socket broadcast
    const populatedPost = await Post.findById(newPost._id)
      .populate('userId', 'username name profilePic email')
      .populate({
        path: 'originalPost',
        populate: { path: 'userId', select: 'username name profilePic email' }
      });

    // Notify the original author if not self-reposting
    const trueOriginalPost = await Post.findById(trueOriginalId);
    if (trueOriginalPost && trueOriginalPost.userId.toString() !== req.user.toString()) {
      const notif = await Notification.create({
        receiver: trueOriginalPost.userId,
        sender: req.user,
        type: 'repost',
        post: trueOriginalId
      });

      const senderUser = await User.findById(req.user).select('username');
      req.app.get('io').to(trueOriginalPost.userId.toString()).emit('new_notification', {
        _id: notif._id,
        type: 'repost',
        senderName: senderUser ? senderUser.username : 'Unknown User',
        postId: trueOriginalId
      });
    }

    req.app.get('io').emit('postCreated', populatedPost);
    res.status(201).json({
      message: 'Post reposted to your profile',
      action: 'reposted',
      post: populatedPost,
      postId: trueOriginalId.toString(),
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, stackTrace: error.stack });
  }
};
// @desc    Log a user activity in the feed
// @route   POST /api/posts/activity
exports.logActivity = async (req, res) => {
  try {
    const { activityType, content } = req.body;
    const newActivity = await Post.create({
      userId: req.user,
      content: content || `performed an action: ${activityType}`,
      isActivity: true,
      activityType
    });
    
    const populatedActivity = await Post.findById(newActivity._id)
      .populate('userId', 'username name profilePic email');

    req.app.get('io').emit('postCreated', populatedActivity);

    res.status(201).json(populatedActivity);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle pin a post on profile
// @route   PUT /api/posts/:id/pin
// @access  Private
exports.togglePinPost = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.userId.toString() !== req.user.toString()) {
      return res.status(403).json({ message: 'You can only pin your own posts' });
    }

    if (user.pinnedPost && user.pinnedPost.toString() === req.params.id) {
      // Unpin
      user.pinnedPost = null;
      await user.save();
      return res.json({ message: 'Post unpinned', pinnedPost: null });
    } else {
      // Pin (replace any existing pin)
      user.pinnedPost = req.params.id;
      await user.save();
      const pinned = await Post.findById(req.params.id)
        .populate('userId', 'username name profilePic email')
        .populate('comments.userId', 'username name profilePic email')
        .populate('comments.replies.userId', 'username name profilePic email');
      return res.json({ message: 'Post pinned', pinnedPost: pinned });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a user's pinned post
// @route   GET /api/posts/pinned/:userId
// @access  Public
exports.getPinnedPost = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.pinnedPost) return res.json(null);

    const post = await Post.findById(user.pinnedPost)
      .populate('userId', 'username name profilePic email')
      .populate('comments.userId', 'username name profilePic email')
      .populate('comments.replies.userId', 'username name profilePic email');
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
