const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer'); // 🔥 important

const clients = {};
const qrStore = {};

function initClient(userId, handleMessage) {
  // 🚫 prevent duplicate clients
  if (clients[userId]) {
    console.log(`⚠️ Client ${userId} already exists`);
    return clients[userId];
  }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: userId }),

    puppeteer: {
      headless: true,
      executablePath: puppeteer.executablePath(), // 🔥 FIX: use bundled Chrome
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  clients[userId] = client;

  // 📲 QR generation
  client.on('qr', async (qr) => {
    try {
      qrStore[userId] = await QRCode.toDataURL(qr);
      console.log(`📲 QR generated for ${userId}`);
    } catch (err) {
      console.log("QR Error:", err);
    }
  });

  // ✅ ready
  client.on('ready', () => {
    console.log(`✅ ${userId} connected`);
  });

  // ❌ disconnected
  client.on('disconnected', (reason) => {
    console.log(`❌ ${userId} disconnected:`, reason);
    delete clients[userId];
  });

  // 📩 message handler
  client.on('message', (msg) => {
    handleMessage(userId, msg);
  });

  // 🚀 initialize
  client.initialize();

  return client;
}

module.exports = {
  initClient,
  qrStore,
  clients
};