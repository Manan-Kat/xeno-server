const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['SENT', 'FAILED'], required: true },
  sentAt: { type: Date, required: true },
  userId: { 
    type: String, 
    ref: "User", 
    required: true // Ensure a campaign is always tied to a user
  }
});

module.exports = mongoose.model('CommunicationLog', communicationLogSchema);