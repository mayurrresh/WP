const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Message = require('./models/Message');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// 🧠 Basic in-memory state (for flow)
const userState = {};

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

// QR
client.on('qr', (qr) => {
  console.log('Scan this QR:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Bot ready 🚀');
});

client.on('disconnected', (reason) => {
  console.log('Disconnected ❌:', reason);
});

// 🔥 MAIN HANDLER
client.on('message', async (message) => {
  try {
    // ❌ Ignore own messages
    if (message.fromMe) return;

    // ❌ Ignore empty
    if (!message.body) return;

    // ❌ Ignore groups
    if (message.from.includes('@g.us')) return;

    // ❌ Ignore channels / broadcasts
    if (
      message.from.includes('@newsletter') ||
      message.from.includes('@broadcast') ||
      message.from.includes('@lid')
    ) return;

    // ✅ Get contact info
    const contact = await message.getContact();

    // ❌ Ignore saved contacts (we only want new leads)
    if (contact.isMyContact) {
      console.log("Ignored saved contact:", message.from);
      return;
    }

    const user = message.from;
    const text = message.body.trim();
    const lower = text.toLowerCase();

    console.log(`🔥 Lead: ${user} | Message: ${text}`);

    // Save message
    await Message.create({
      number: user,
      text: text
    });

    await delay(300);

    // Init state
    if (!userState[user]) {
      userState[user] = { step: "GREETING" };
    }

    const state = userState[user];

    // 🔰 FIRST TOUCH (lead capture entry)
    if (state.step === "GREETING") {
      await message.reply(
`👋 Hi!

Thanks for reaching out 🙌

What are you looking for?

1️⃣ View Rooms  
2️⃣ Book a Room  
3️⃣ Talk to Support  

Reply with 1, 2 or 3`
      );

      state.step = "MENU";
      return;
    }

    // 📋 MENU
    if (state.step === "MENU") {
      if (lower === "1") {
        await message.reply(
`🏠 Available Rooms:

Room A - ₹1000  
Room B - ₹1500  
Room C - ₹2000  

Reply *2* to book a room`
        );
        return;
      }

      if (lower === "2") {
        state.step = "ASK_NAME";
        await message.reply("Enter your name:");
        return;
      }

      if (lower === "3") {
        await message.reply("Our team will contact you shortly 📞");
        state.step = "END";
        return;
      }

      await message.reply("Please reply with 1, 2 or 3.");
      return;
    }

    // 🧾 BOOKING FLOW
    if (state.step === "ASK_NAME") {
      state.name = text;
      state.step = "ASK_ROOM";

      await message.reply(
`Select Room:

A → Room A  
B → Room B  
C → Room C`
      );
      return;
    }

    if (state.step === "ASK_ROOM") {
      const roomMap = {
        a: "Room A",
        b: "Room B",
        c: "Room C"
      };

      const selected = roomMap[lower];

      if (!selected) {
        await message.reply("Invalid option. Choose A, B or C.");
        return;
      }

      state.room = selected;
      state.step = "ASK_DATE";

      await message.reply("Enter booking date (YYYY-MM-DD):");
      return;
    }

    if (state.step === "ASK_DATE") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        await message.reply("Invalid date format. Use YYYY-MM-DD.");
        return;
      }

      state.date = text;

      await message.reply(
`✅ Booking Request Received!

👤 Name: ${state.name}  
🏠 Room: ${state.room}  
📅 Date: ${state.date}

Our team will confirm shortly.`
      );

      state.step = "END";
      return;
    }

  } catch (err) {
    console.log("ERROR ❌:", err);
  }
});

client.initialize();