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
                '--disable-gpu',
                '--no-zygote',
                '--single-process'
            ]
        }
    });

    clients[userId] = client;

    // 🔥 FULL DEBUG LOGGING

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

    client.on('change_state', (state) => {
        console.log(`🔄 STATE CHANGE (${userId}):`, state);
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

    client.on('message', (msg) => {
        console.log(`📩 MESSAGE RECEIVED (${userId}):`, msg.body);

        if (handleMessage) {
            handleMessage(userId, msg);
        }
    });

    // 🚀 Initialize
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