const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

const clients = {};
const qrStore = {};

function initClient(userId) {
    if (clients[userId]) {
        console.log(`⚠️ Client ${userId} already exists`);
        return clients[userId];
    }

    console.log(`🚀 Creating WhatsApp client for ${userId}`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),

        // ✅ FIXED FOR FLY.IO / DOCKER
        puppeteer: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    });

    clients[userId] = client;

    // 🔥 DEBUG EVENTS

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

    client.on('ready', () => {
        console.log(`✅ WHATSAPP READY (${userId})`);
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

    // 🔥 BOT LOGIC

    client.on('message', async (msg) => {
        try {
            if (!client.info) return;
            if (msg.from.includes("@g.us")) return;

            const text = msg.body.toLowerCase();
            console.log(`📩 ${userId}: ${text}`);

            if (text.includes("hi") || text.includes("hello")) {
                return msg.reply(`👋 Welcome to *[Your Hotel Name]*!

Please choose:
1️⃣ Check Room Prices
2️⃣ Check Availability
3️⃣ Book Now
4️⃣ Talk to Manager`);
            }

            if (text === "1") {
                return msg.reply(`💰 *Room Pricing:*

• Standard – ₹2000  
• Deluxe – ₹3500  
• Suite – ₹5000  

Reply 2 for availability or 3 to book.`);
            }

            if (text === "2") {
                return msg.reply(`📅 Please share:

• Check-in date  
• Check-out date  
• Number of guests`);
            }

            if (text === "3") {
                return msg.reply(`🚀 Book instantly here:
https://yourwebsite.com/book`);
            }

            if (text === "4") {
                return msg.reply(`👨‍💼 Manager will assist you shortly.`);
            }

            return msg.reply(`❓ Please choose:
1️⃣ Pricing
2️⃣ Availability
3️⃣ Book Now`);

        } catch (err) {
            console.error(`❌ Message error (${userId}):`, err);
        }
    });

    // 🔥 BACKUP DEBUG

    client.on('message_create', (msg) => {
        if (!msg.fromMe) {
            console.log(`📨 DEBUG (${userId}):`, msg.body);
        }
    });

    // 🚀 INITIALIZE

    client.initialize()
        .then(() => {
            console.log(`🚀 INITIALIZED (${userId})`);
        })
        .catch((err) => {
            console.error(`❌ INIT FAILED (${userId}):`, err);
            cleanup(userId);
        });

    return client;
}

// 🔥 CLEANUP HELPER
function cleanup(userId) {
    delete clients[userId];
    delete qrStore[userId];
}

module.exports = {
    initClient,
    qrStore,
    clients
};