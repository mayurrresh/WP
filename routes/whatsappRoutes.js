const express = require('express');
const router = express.Router();

const {
  connect,
  getQR,
  sendMessage
} = require('../controllers/whatsappController');

// Connect WhatsApp
router.post('/connect', connect);

// Get QR
router.get('/qr/:userId', getQR);

// 🔥 NEW: Send message
router.post('/send', sendMessage);

module.exports = router;