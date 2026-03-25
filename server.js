require('dotenv').config(); // ✅ MUST be at the very top

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const hotelRoutes = require('./routes/hotelRoutes');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// ✅ MongoDB connection + WhatsApp initialization
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    // ✅ Start WhatsApp bot ONLY after DB connects
    require('./whatsapp');
  })
  .catch(err => {
    console.log("Mongo Error:", err);
    process.exit(1);
  });

// Routes
app.use('/api', hotelRoutes);

// Test route
app.get('/', (req, res) => {
  res.send("Hotel API is running 🚀");
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));