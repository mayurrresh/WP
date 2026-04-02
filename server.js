require('dotenv').config();

console.log("🚀 Starting server...");

const app = require('./app');
const connectDB = require('./config/db');

// 🔥 Global error handlers
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

// 🔥 HEALTH CHECK (important for Fly.io)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

(async () => {
  try {
    console.log("🔌 Connecting DB...");
    await connectDB();
    console.log("✅ DB Connected");

    // 🔥 USE FLY PORT (IMPORTANT)
    const PORT = process.env.PORT || 3000;

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // 🔥 Increase timeout (Puppeteer heavy apps)
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

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