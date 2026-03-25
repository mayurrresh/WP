const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));
app.use('/api/hotel', require('./routes/hotelRoutes')); // optional

// Serve frontend (QR UI)
app.use(express.static(path.join(__dirname, 'public')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

module.exports = app;