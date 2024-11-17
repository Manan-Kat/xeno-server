const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  totalSpending: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  lastVisit: { type: Date },
});

// Pre-save hook to set a random number of visits if not explicitly provided
customerSchema.pre("save", function (next) {
  if (!this.isModified("visits")) {
    this.visits = Math.floor(Math.random() * 10) + 1; // Random between 1 and 10
  }
  next();
});

module.exports = mongoose.model("Customer", customerSchema);
