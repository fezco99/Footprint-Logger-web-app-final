const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  weekStart: Date,
  targetReduction: Number, // kg CO2 to reduce
  achieved: {
    type: Boolean,
    default: false,
  },
  baseline: Number, // previous week's total
  currentTotal: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Goal", goalSchema);
