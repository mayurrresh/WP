require('dotenv').config();

console.log("Starting server...");

const app = require('./app');
const connectDB = require('./config/db');

(async () => {
  try {
    console.log("Connecting DB...");
    await connectDB();

    console.log("Starting Express...");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1); // 🔥 important for Render
  }
})();