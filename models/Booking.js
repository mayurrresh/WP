const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  room: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true // 🔥 adds createdAt, updatedAt
});

module.exports = mongoose.model("Booking", bookingSchema);