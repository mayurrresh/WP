require('dotenv').config();

console.log("🚀 Starting server...");

const app = require('./app');
const connectDB = require('./config/db');

// 🔥 Catch unhandled errors
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

    const PORT = process.env.PORT || 10000;

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log("👉 Open this in your browser manually");
    });

    // 🔥 Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('⚠️ SIGTERM received. Shutting down...');
      server.close(() => {
        console.log('💀 Process terminated');
      });
    });

    process.on('SIGINT', () => {
      console.log('⚠️ CTRL+C detected. Closing server...');
      server.close(() => {
        console.log('💀 Server stopped');
        process.exit(0);
      });
    });

  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
})();