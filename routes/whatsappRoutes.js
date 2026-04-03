const express = require('express');
const router = express.Router();

// ✅ Safe import (prevents silent undefined issues)
const controller = require('../controllers/whatsappController');

const connect = controller.connect;
const getQR = controller.getQR;
const sendMessage = controller.sendMessage;

/**
 * 🔍 DEBUG (REMOVE LATER)
 */
console.log("📦 Controller check:", {
  connect: typeof connect,
  getQR: typeof getQR,
  sendMessage: typeof sendMessage
});

/**
 * ❌ HARD FAIL if any handler is missing
 */
if (!connect || !getQR || !sendMessage) {
  throw new Error("❌ Controller functions not properly loaded");
}

/**
 * 🚀 ROUTES
 */

// Connect WhatsApp
router.post('/connect', connect);

// Get QR
router.get('/qr/:userId', getQR);

// Send message
router.post('/send', sendMessage);

module.exports = router;