const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPostsByUserId,
  getTrendingTags,
  getHashtagSuggestions,
  likePost,
  addComment,
  toggleCommentLike,
  addCommentReply,
  updatePost,
  deletePost,
  logActivity,
  togglePinPost,
  getPinnedPost,
  repostPost
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createPost);
router.get('/', protect, getPosts);
router.get('/trending-tags', protect, getTrendingTags);
router.get('/hashtag-suggestions', protect, getHashtagSuggestions);
router.get('/pinned/:userId', protect, getPinnedPost);
router.get('/user/:userId', protect, getPostsByUserId);
router.post('/activity', protect, logActivity);
router.put('/:id/like', protect, likePost);
router.put('/:id/pin', protect, togglePinPost);
router.put('/:id', protect, updatePost);
router.post('/:id/repost', protect, repostPost);
router.post('/:id/comment', protect, addComment);
router.put('/:id/comments/:commentId/like', protect, toggleCommentLike);
router.post('/:id/comments/:commentId/reply', protect, addCommentReply);
router.delete('/:id', protect, deletePost);

module.exports = router;
