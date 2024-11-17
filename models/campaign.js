const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  audienceCriteria: { type: Object, required: true }, // Store as JSON for flexibility
  userId: { 
    type: String, 
    ref: "User", 
    required: true // Ensure a campaign is always tied to a user
  }
});

module.exports = mongoose.model('Campaign', campaignSchema);
