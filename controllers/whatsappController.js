const { initClient, qrStore, clients } = require('../services/whatsappService');

/**
 * ✅ CONNECT (AGGRESSIVE SAFE VERSION)
 */
exports.connect = async (req, res) => {
  try {
    console.log("🔥 CONNECT HIT:", req.body);

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // 🔥 HARD LIMIT: ONLY ONE SESSION (CRITICAL FOR LOW RAM)
    if (Object.keys(clients).length > 0) {
      return res.status(429).json({
        error: "Server busy. Try again later."
      });
    }

    // 🔁 Prevent duplicate same user
    if (clients[userId]) {
      return res.json({
        status: "already_exists",
        message: "Client already initialized"
      });
    }

    console.log(`🚀 Initializing client for: ${userId}`);

    // 🔥 SAFE INIT (prevents crash propagation)
    try {
      await initClient(userId);
    } catch (err) {
      console.error(`❌ INIT ERROR (${userId}):`, err);
      delete clients[userId];

      return res.status(500).json({
        error: "Server overloaded. Retry."
      });
    }

    return res.status(200).json({
      status: "starting",
      message: "QR generation started"
    });

  } catch (err) {
    console.error("❌ CONNECT CRASH:", err);

    delete clients[req.body?.userId];

    return res.status(500).json({
      error: "Internal server error"
    });
  }
};

/**
 * ✅ GET QR / STATUS (OPTIMIZED)
 */
exports.getQR = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const client = clients[userId];

    if (!client) {
      return res.json({ status: "not_found" });
    }

    let state = null;

    try {
      state = await client.getState();
    } catch {
      // ignore (low memory situations)
    }

    if (state === "CONNECTED") {
      return res.json({ status: "connected" });
    }

    const qr = qrStore[userId];

    if (!qr) {
      return res.json({ status: "waiting" });
    }

    return res.json({ status: "qr", qr });

  } catch (err) {
    console.error("❌ QR ERROR:", err);

    return res.status(500).json({
      error: "QR fetch failed"
    });
  }
};

/**
 * ✅ SEND MESSAGE (SAFE + LIGHT)
 */
exports.sendMessage = async (req, res) => {
  try {
    const { userId, phone, text } = req.body;

    if (!userId || !phone || !text) {
      return res.status(400).json({
        error: "userId, phone, text are required"
      });
    }

    const client = clients[userId];

    if (!client || !client.info) {
      return res.status(400).json({
        error: "Client not ready"
      });
    }

    const cleaned = phone.replace(/\D/g, '');
    const formatted = `${cleaned}@c.us`;

    try {
      await client.sendMessage(formatted, text);
    } catch (err) {
      console.error("❌ SEND FAIL:", err);

      return res.status(500).json({
        error: "Message failed"
      });
    }

    return res.json({
      success: true,
      to: formatted
    });

  } catch (err) {
    console.error("❌ SEND ERROR:", err);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
};