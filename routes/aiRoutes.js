const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Define route for AI chat
router.post('/chat', aiController.chat);

module.exports = router;
