const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

async function handleMessage(userId, message) {
  try {
    if (message.fromMe || !message.body) return;

    if (
      message.from.includes('@g.us') ||
      message.from.includes('@newsletter') ||
      message.from.includes('@broadcast') ||
      message.from.includes('@lid')
    ) return;

    const contact = await message.getContact();
    if (contact.isMyContact) return;

    const phone = message.from;
    const text = message.body.trim();
    const lower = text.toLowerCase();

    console.log(`🔥 ${userId} | ${phone}: ${text}`);

    await Message.create({
      userId,
      phone,
      text,
      direction: "incoming"
    });

    let convo = await Conversation.findOne({ userId, phone });

    if (!convo) {
      convo = await Conversation.create({
        userId,
        phone,
        step: "GREETING",
        data: {}
      });
    }

    // 🔰 GREETING
    if (convo.step === "GREETING") {
      await message.reply(`👋 Hi!

What are you looking for?

1. View Rooms  
2. Book Room  
3. Support`);

      convo.step = "MENU";
    }

    // 📋 MENU
    else if (convo.step === "MENU") {
      if (lower === "1") {
        await message.reply(`Room A - ₹1000\nRoom B - ₹1500`);
      } 
      else if (lower === "2") {
        convo.step = "ASK_NAME";
        await message.reply("Enter your name:");
      } 
      else if (lower === "3") {
        await message.reply("Support will contact you.");
        convo.step = "END";
      } 
      else {
        await message.reply("Reply 1, 2 or 3");
      }
    }

    // 🧾 FLOW
    else if (convo.step === "ASK_NAME") {
      convo.data.name = text;
      convo.step = "ASK_ROOM";
      await message.reply("Enter Room (A/B/C):");
    }

    else if (convo.step === "ASK_ROOM") {
      const map = { a: "Room A", b: "Room B", c: "Room C" };

      if (!map[lower]) {
        await message.reply("Choose A, B or C");
        return;
      }

      convo.data.room = map[lower];
      convo.step = "ASK_DATE";
      await message.reply("Enter Date (YYYY-MM-DD):");
    }

    else if (convo.step === "ASK_DATE") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        await message.reply("Invalid format");
        return;
      }

      convo.data.date = text;

      await message.reply(
        `✅ Booking Confirmed\nName: ${convo.data.name}\nRoom: ${convo.data.room}\nDate: ${convo.data.date}`
      );

      convo.step = "GREETING";
      convo.data = {};
    }

    await convo.save();

  } catch (err) {
    console.log(err);
  }
}

module.exports = { handleMessage };