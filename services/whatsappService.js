const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

const clients = {};
const qrStore = {};

function initClient(userId, handleMessage) {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: userId }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox']
    }
  });

  clients[userId] = client;

  client.on('qr', async (qr) => {
    try {
      qrStore[userId] = await QRCode.toDataURL(qr);
    } catch (err) {
      console.log("QR Error:", err);
    }
  });

  client.on('ready', () => {
    console.log(`✅ ${userId} connected`);
  });

  client.on('disconnected', (reason) => {
    console.log(`❌ ${userId} disconnected:`, reason);
    delete clients[userId]; // cleanup
  });

  client.on('message', (msg) => {
    handleMessage(userId, msg);
  });

  client.initialize();
}

// ✅ IMPORTANT: export clients also
module.exports = {
  initClient,
  qrStore,
  clients
};