const express = require('express');
const path = require('path');

const app = express();

// 🔥 HARD CORS FIX (works 100% even on Render)
app.use((req, res, next) => {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
return res.sendStatus(200);
}

next();
});

// Middleware
app.use(express.json());

// ✅ TEST ROUTE (to verify backend is alive)
app.get('/test', (req, res) => {
res.json({ message: "Backend working ✅" });
});

// Routes
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));
app.use('/api/hotel', require('./routes/hotelRoutes'));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Default route
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public/index.html'));
});

module.exports = app;
