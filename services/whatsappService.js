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

        // ✅ CLEAN & STABLE PUPPETEER CONFIG
        puppeteer: {
            headless: true,
            executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
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
        console.log(`⏳ [${userId}] Loading ${percent}% - ${message}`);
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
        console.log(`🔐 AUTHENTICATED for ${userId}`);
    });

    client.on('ready', () => {
        console.log(`✅ WHATSAPP READY for ${userId}`);
        delete qrStore[userId];
    });

    client.on('auth_failure', (msg) => {
        console.error(`❌ AUTH FAILURE (${userId}):`, msg);
        delete clients[userId];
        delete qrStore[userId];
    });

    client.on('disconnected', async (reason) => {
        console.log(`❌ DISCONNECTED (${userId}):`, reason);

        try {
            await client.destroy();
        } catch (e) {
            console.error(`❌ Error destroying client (${userId}):`, e);
        }

        delete clients[userId];
        delete qrStore[userId];
    });

    // 🔥 MAIN BOT LOGIC

    client.on('message', async (msg) => {
        if (!client.info) {
            console.log("⚠️ Bot not ready yet");
            return;
        }

        if (msg.from.includes("@g.us")) return;

        const text = msg.body.toLowerCase();
        console.log(`📩 MESSAGE (${userId}):`, text);

        try {
            if (text.includes("hi") || text.includes("hello")) {
                await msg.reply(`👋 Welcome to *[Your Hotel Name]*!

Please choose:
1️⃣ Check Room Prices
2️⃣ Check Availability
3️⃣ Book Now
4️⃣ Talk to Manager`);
            }

            else if (text === "1") {
                await msg.reply(`💰 *Room Pricing:*

• Standard – ₹2000  
• Deluxe – ₹3500  
• Suite – ₹5000  

Reply 2 for availability or 3 to book.`);
            }

            else if (text === "2") {
                await msg.reply(`📅 Please share:

• Check-in date  
• Check-out date  
• Number of guests`);
            }

            else if (text === "3") {
                await msg.reply(`🚀 Book instantly here:
https://yourwebsite.com/book`);
            }

            else if (text === "4") {
                await msg.reply(`👨‍💼 Manager will assist you shortly.`);
            }

            else {
                await msg.reply(`❓ Please choose:
1️⃣ Pricing
2️⃣ Availability
3️⃣ Book Now`);
            }

        } catch (err) {
            console.error(`❌ Reply error (${userId}):`, err);
        }
    });

    // 🔥 BACKUP EVENT (debugging)

    client.on('message_create', (msg) => {
        if (!msg.fromMe) {
            console.log(`📨 MESSAGE_CREATE (${userId}):`, msg.body);
        }
    });

    // 🚀 INITIALIZE

    client.initialize()
        .then(() => {
            console.log(`🚀 INITIALIZE SUCCESS (${userId})`);
        })
        .catch((err) => {
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