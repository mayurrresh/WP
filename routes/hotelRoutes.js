const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// ✅ Get all rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// ✅ Create booking
router.post('/book', async (req, res) => {
  try {
    const { name, roomId, date } = req.body;

    // Basic validation
    if (!name || !roomId || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const booking = await Booking.create({
      name,
      roomId,
      date
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

module.exports = router;