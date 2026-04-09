const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { analyzeCode } = require('../controllers/aiController');

// POST /api/ai/analyze — AI-powered code analysis
router.post('/analyze', protect, analyzeCode);

module.exports = router;
