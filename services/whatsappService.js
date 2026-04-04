const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');

const clients = {};
const qrStore = {};

/**
 * 🚀 INIT CLIENT (ULTRA OPTIMIZED FOR LOW RAM)
 */
async function initClient(userId) {
    if (clients[userId]) {
        console.log(`⚠️ Client ${userId} already exists`);
        return clients[userId];
    }

    console.log(`🚀 Creating WhatsApp client for ${userId}`);

    const chromePath =
        process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();

    console.log("🧠 Using Chrome at:", chromePath);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),

        puppeteer: {
            executablePath: chromePath,
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-sync',
                '--disable-default-apps',
                '--disable-translate',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-first-run',
                '--disable-notifications',
                '--disable-infobars'
            ]
        }
    });

    clients[userId] = client;

    /**
     * 🔄 EVENTS
     */

    client.on('loading_screen', (percent, message) => {
        console.log(`⏳ [${userId}] ${percent}%`);
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

        try {
            await client.sendPresenceUnavailable();
        } catch {}

        delete qrStore[userId];

        // 🔥 AUTO-KILL AFTER 5 MIN (PREVENT CRASH)
        setTimeout(async () => {
            console.log(`💀 Auto destroying client (${userId}) to save RAM`);
            try {
                await client.destroy();
            } catch {}
            cleanup(userId);
        }, 5 * 60 * 1000);
    });

    client.on('auth_failure', (msg) => {
        console.error(`❌ AUTH FAILURE (${userId})`);
        cleanup(userId);
    });

    client.on('disconnected', async (reason) => {
        console.log(`❌ DISCONNECTED (${userId}):`, reason);

        try {
            await client.destroy();
        } catch {}

        cleanup(userId);
    });

    /**
     * 🤖 LIGHTWEIGHT BOT LOGIC
     */
    client.on('message', async (msg) => {
        try {
            if (!client.info) return;
            if (msg.from.includes("@g.us")) return;

            const text = msg.body.toLowerCase();

            if (text.includes("hi") || text.includes("hello")) {
                return msg.reply("👋 Welcome! Type 'price' or 'book'");
            }

            if (text.includes("price")) {
                return msg.reply("💰 Rooms: ₹2000 / ₹3500 / ₹5000");
            }

            if (text.includes("book")) {
                return msg.reply("📅 Send check-in, check-out & guests");
            }

        } catch (err) {
            console.error(`❌ Message error (${userId})`);
        }
    });

    /**
     * 🚀 DELAYED INITIALIZATION (CRITICAL)
     */
    setTimeout(async () => {
        try {
            await client.initialize();
            console.log(`🚀 INITIALIZED (${userId})`);
        } catch (err) {
            console.error(`❌ INIT FAILED (${userId})`, err);
            cleanup(userId);
        }
    }, 3000); // 🔥 delay reduces crash spike

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