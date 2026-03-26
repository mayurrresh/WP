require('dotenv').config();

console.log("🚀 Starting server...");

const app = require('./app');
const connectDB = require('./config/db');

// 🔥 Catch unhandled errors (VERY IMPORTANT)
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

(async () => {
  try {
    console.log("🔌 Connecting DB...");
    await connectDB();
    console.log("✅ DB Connected");

    const PORT = process.env.PORT || 3000;

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // 🔥 Graceful shutdown (important for Render)
    process.on('SIGTERM', () => {
      console.log('⚠️ SIGTERM received. Shutting down...');
      server.close(() => {
        console.log('💀 Process terminated');
      });
    });

  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
})();