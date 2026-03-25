const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: String,
  phone: String,
  step: String,
  data: {
    name: String,
    room: String,
    date: String
  }
});

module.exports = mongoose.model('Conversation', schema);