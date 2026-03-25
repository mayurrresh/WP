require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Room.insertMany([
    { name: "Deluxe Room", price: 2500, location: "Pune", available: true },
    { name: "Standard Room", price: 1500, location: "Mumbai", available: true },
    { name: "Luxury Suite", price: 5000, location: "Goa", available: true }
  ]);

  console.log("Rooms seeded");
  process.exit();
});