const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    phone: String,
    name: String,
    date: String,
    room: String
});

module.exports = mongoose.model("Booking", bookingSchema);