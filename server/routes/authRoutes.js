const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuthStart,
  googleAuthCallback,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/google', googleAuthStart);
router.get('/google/callback', googleAuthCallback);

module.exports = router;
