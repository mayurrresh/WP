const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');

const clients = {};
const qrStore = {};

/**
 * 🚀 INIT CLIENT
 */
async function initClient(userId) {
    if (clients[userId]) {
        console.log(`⚠️ Client ${userId} already exists`);
        return clients[userId];
    }

    console.log(`🚀 Creating WhatsApp client for ${userId}`);

    // ✅ SMART CHROME PATH (LOCAL + RENDER SAFE)
    const chromePath =
        process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();

    console.log("🧠 Using Chrome at:", chromePath);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),

        puppeteer: {
            executablePath: chromePath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-sync',
                '--disable-notifications'
            ]
        }
    });

    clients[userId] = client;

    /**
     * 🔄 EVENTS
     */

    client.on('loading_screen', (percent, message) => {
        console.log(`⏳ [${userId}] ${percent}% - ${message}`);
    });

    client.on('qr', async (qr) => {
        try {
            console.log(`📲 QR RECEIVED for ${userId}`);
            qrStore[userId] = await QRCode.toDataURL(qr);
        } catch (err) {
            console.error(`❌ QR Error (${userId}):`, err);
        }
    });

    client.on('authenticated', () => {
        console.log(`🔐 AUTHENTICATED (${userId})`);
    });

    client.on('ready', async () => {
        console.log(`✅ WHATSAPP READY (${userId})`);

        // 🔥 GO OFFLINE (reduces weird behavior)
        try {
            await client.sendPresenceUnavailable();
        } catch (e) {}

        delete qrStore[userId];
    });

    client.on('auth_failure', (msg) => {
        console.error(`❌ AUTH FAILURE (${userId}):`, msg);
        cleanup(userId);
    });

    client.on('disconnected', async (reason) => {
        console.log(`❌ DISCONNECTED (${userId}):`, reason);

        try {
            await client.destroy();
        } catch (e) {
            console.error(`❌ Destroy error (${userId}):`, e);
        }

        cleanup(userId);
    });

    /**
     * 🤖 BOT LOGIC
     */
    client.on('message', async (msg) => {
        try {
            if (!client.info) return;
            if (msg.from.includes("@g.us")) return;

            const text = msg.body.toLowerCase();
            console.log(`📩 ${userId}: ${text}`);

            let reply;

            if (text.includes("hi") || text.includes("hello")) {
                reply = `👋 Welcome to *[Your Hotel Name]*!

How can I help you today? 😊`;
            } else if (text.includes("price")) {
                reply = `💰 Pricing:

• Standard – ₹2000  
• Deluxe – ₹3500  
• Suite – ₹5000`;
            } else if (text.includes("book")) {
                reply = `📅 Sure! Please share:

• Check-in date  
• Check-out date  
• Number of guests`;
            } else {
                reply = `😊 I'm here to help with bookings.

You can ask:
• room prices
• availability
• booking`;
            }

            await msg.reply(reply);

        } catch (err) {
            console.error(`❌ Message error (${userId}):`, err);
        }
    });

    /**
     * 🚀 INITIALIZE
     */
    try {
        await client.initialize();
        console.log(`🚀 INITIALIZED (${userId})`);
    } catch (err) {
        console.error(`❌ INIT FAILED (${userId}):`, err);
        cleanup(userId);
        throw err;
    }

    return client;
}

/**
 * 🧹 CLEANUP
 */
function cleanup(userId) {
    delete clients[userId];
    delete qrStore[userId];
}

module.exports = {
    initClient,
    qrStore,
    clients
};