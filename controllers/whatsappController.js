const { initClient, qrStore, clients } = require('../services/whatsappService');
const { handleMessage } = require('../services/messageService');

// ✅ CONNECT WHATSAPP
exports.connect = (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  // 🚫 Prevent duplicate initialization
  if (clients[userId]) {
    return res.json({ message: "Already connected or initializing" });
  }

  initClient(userId, handleMessage);

  res.json({ message: "QR generating..." });
};

// ✅ GET QR / STATUS
exports.getQR = (req, res) => {
  const { userId } = req.params;

  // ✅ If already connected
  if (clients[userId]?.info) {
    return res.json({ status: "connected" });
  }

  const qr = qrStore[userId];

  // ⏳ Still waiting for QR
  if (!qr) {
    return res.json({ status: "waiting" });
  }

  // 📲 Send QR
  res.json({ status: "qr", qr });
};

// 🔥 SEND MESSAGE API
exports.sendMessage = async (req, res) => {
  try {
    const { userId, phone, text } = req.body;

    if (!userId || !phone || !text) {
      return res.status(400).json({
        error: "userId, phone, text are required"
      });
    }

    const client = clients[userId];

    if (!client) {
      return res.status(400).json({
        error: "WhatsApp not connected"
      });
    }

    // 🚫 Ensure client is ready
    if (!client.info) {
      return res.status(400).json({
        error: "Client not ready yet. Scan QR first."
      });
    }

    // 📞 Format number properly
    const formatted = phone.includes('@c.us')
      ? phone
      : `${phone}@c.us`;

    await client.sendMessage(formatted, text);

    res.json({ success: true });

  } catch (err) {
    console.log("Send error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};