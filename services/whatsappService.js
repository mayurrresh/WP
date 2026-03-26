const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');

const clients = {};
const qrStore = {};

function initClient(userId, handleMessage) {
    if (clients[userId]) {
        console.log(`⚠️ Client ${userId} already exists`);
        return clients[userId];
    }

    console.log(`🚀 Creating WhatsApp client for ${userId}`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: {
            headless: true,
            executablePath: puppeteer.executablePath(),
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    });

    // Store reference immediately to prevent double-init while loading
    clients[userId] = client;

    // 🔥 DEBUG EVENTS
    client.on('loading_screen', (percent, message) => {
        console.log(`⏳ [${userId}] Loading ${percent}% - ${message}`);
    });

    client.on('auth_failure', (msg) => {
        console.error(`❌ AUTH FAILURE (${userId}):`, msg);
        delete clients[userId];
        delete qrStore[userId];
    });

    client.on('qr', async (qr) => {
        try {
            console.log(`📲 QR RECEIVED for ${userId}`);
            // Convert to Base64 Data URL for easy frontend display
            qrStore[userId] = await QRCode.toDataURL(qr);
        } catch (err) {
            console.error(`❌ QR Error (${userId}):`, err);
        }
    });

    client.on('ready', () => {
        console.log(`✅ ${userId} connected`);
        // Clear QR code from memory once connected
        delete qrStore[userId];
    });

    client.on('disconnected', async (reason) => {
        console.log(`❌ ${userId} disconnected:`, reason);

        try {
            await client.destroy(); // Properly close the browser instance
        } catch (e) {
            console.error("Error during client destruction:", e);
        }

        delete clients[userId];
        delete qrStore[userId];
    });

    // 📩 Message handler
    client.on('message', (msg) => {
        // Pass the message to your external service logic
        if (handleMessage) {
            handleMessage(userId, msg);
        }
    });

    // 🚀 Initialize with crash protection
    client.initialize().catch((err) => {
        console.error(`❌ INITIALIZE FAILED (${userId}):`, err);
        delete clients[userId];
        delete qrStore[userId];
    });

    return client;
}

module.exports = {
    initClient,
    qrStore,
    clients
};