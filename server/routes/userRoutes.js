const express = require('express');
const router = express.Router();
const { 
  getUserProfile,
  getMyProfile,
  updateUserProfile, 
  followUser, 
  unfollowUser,
  searchUsers,
  getAllUsers,
  getUserActivity,
  viewProfile,
  checkUsernameAvailability,
  addUserProject,
  getSavedPosts,
  toggleSavedPost,
  acceptFollowRequest,
  rejectFollowRequest,
  cancelFollowRequest
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/search', searchUsers);
router.get('/check-username/:username', checkUsernameAvailability);
router.get('/', getAllUsers);
router.get('/me/profile', protect, getMyProfile);
router.get('/me/saved-posts', protect, getSavedPosts);
router.put('/me/saved-posts/:postId', protect, toggleSavedPost);
router.get('/:username', getUserProfile);
router.put('/:username/view', viewProfile);
router.get('/:userId/activity', getUserActivity);
router.put('/profile', protect, updateUserProfile);
router.post('/projects', protect, addUserProject);
router.put('/:id/follow', protect, followUser);
router.put('/:id/accept-follow', protect, acceptFollowRequest);
router.put('/:id/reject-follow', protect, rejectFollowRequest);
router.put('/:id/cancel-follow-request', protect, cancelFollowRequest);
router.put('/:id/unfollow', protect, unfollowUser);

module.exports = router;
