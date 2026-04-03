require('dotenv').config();

console.log("🚀 Starting server...");

const app = require('./app');
const connectDB = require('./config/db');

/**
 * 🔥 GLOBAL ERROR HANDLERS (DON’T LET APP DIE)
 */
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

/**
 * ❤️ HEALTH CHECK (Fly / Render / Load balancer)
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

/**
 * 🚀 START SERVER
 */
(async () => {
  try {
    console.log("🔌 Connecting DB...");
    await connectDB();
    console.log("✅ DB Connected");

    const PORT = process.env.PORT || 3000;

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    /**
     * 🔥 KEEP ALIVE (important for Puppeteer + Fly)
     */
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    /**
     * 🧠 MEMORY LOG (debug leaks / puppeteer load)
     */
    setInterval(() => {
      const used = process.memoryUsage();
      console.log(`🧠 Memory Usage:
        RSS: ${(used.rss / 1024 / 1024).toFixed(2)} MB
        Heap Used: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB
      `);
    }, 60000); // every 60s

    /**
     * 🛑 GRACEFUL SHUTDOWN
     */
    const shutdown = (signal) => {
      console.log(`⚠️ ${signal} received. Shutting down...`);

      server.close(() => {
        console.log('💀 HTTP server closed');
        process.exit(0);
      });

      // Force kill after 10s (safety)
      setTimeout(() => {
        console.error('❌ Force shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
})();