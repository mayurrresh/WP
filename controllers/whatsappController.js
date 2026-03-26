const { initClient, qrStore, clients } = require('../services/whatsappService');
const { handleMessage } = require('../services/messageService');

/**

* ✅ CONNECT WHATSAPP
  */
exports.connect = (req, res) => {
  try {
    console.log("🔥 CONNECT HIT:", req.body);

    const { userId } = req.body;

    if (!userId) {
      console.log("❌ Missing userId");
      return res.status(400).json({ error: "userId is required" });
    }

    // 🚫 Prevent duplicate initialization
    if (clients[userId]) {
      console.log("⚠️ Client already exists:", userId);
      return res.json({
        status: "already_exists",
        message: "Client already initialized"
      });
    }

    console.log(`🚀 Initializing client for: ${userId}`);

    // 🔥 Fire and forget (never block response)
    initClient(userId, handleMessage)
      .then(() => {
        console.log(`✅ Client initialized: ${userId}`);
      })
      .catch((err) => {
        console.error(`❌ INIT ERROR (${userId}):`, err);
        delete clients[userId];
      });

    // ✅ ALWAYS respond immediately
    return res.status(200).json({
      status: "starting",
      message: "QR generation started"
    });

  } catch (err) {
    console.error("❌ CONNECT CRASH:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }
};

/**

* ✅ GET QR / STATUS
  */
exports.getQR = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("📡 QR CHECK:", userId);

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const client = clients[userId];

    if (!client) {
      return res.json({ status: "not_found" });
    }

    // 🔥 Safe state check (never crash)
    let state = null;
    try {
      state = await client.getState();
    } catch (e) {
      console.log("⚠️ getState failed");
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
      error: "QR fetch failed",
      details: err.message
    });
  }
};

/**

* 🔥 SEND MESSAGE
  */
exports.sendMessage = async (req, res) => {
  try {
    console.log("📩 SEND REQUEST:", req.body);

    const { userId, phone, text } = req.body;

    if (!userId || !phone || !text) {
      return res.status(400).json({
        error: "userId, phone, text are required"
      });
    }

    const client = clients[userId];

    if (!client) {
      return res.status(404).json({
        error: "Client not found. Connect first."
      });
    }

    if (!client.info) {
      return res.status(400).json({
        error: "Client not ready yet"
      });
    }

    // 📞 Clean phone number
    const cleaned = phone.replace(/\D/g, '');
    const formatted = `${cleaned}@c.us`;

    await client.sendMessage(formatted, text);

    console.log("✅ Message sent:", formatted);

    return res.json({
      success: true,
      to: formatted
    });

  } catch (err) {
    console.error("❌ SEND ERROR:", err);
    return res.status(500).json({
      error: "Failed to send message",
      details: err.message
    });
  }
};
