const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true } // Unique identifier from Google Authentication
});

module.exports = mongoose.model('User', userSchema);
