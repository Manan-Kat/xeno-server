const mongoose = require("mongoose");

// Helper function to generate a random date within the last 3 months
const getRandomDateInLast3Months = () => {
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(now.getMonth() - 3);

  return new Date(
    threeMonthsAgo.getTime() +
      Math.random() * (now.getTime() - threeMonthsAgo.getTime())
  );
};

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  orderDate: {
    type: Date,
    required: true,
    default: getRandomDateInLast3Months,
  },
  orderAmount: { type: Number, required: true },
});

module.exports = mongoose.model("Order", orderSchema);
