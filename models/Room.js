const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: String,
    price: Number,
    available: Boolean
});

module.exports = mongoose.model("Room", roomSchema);