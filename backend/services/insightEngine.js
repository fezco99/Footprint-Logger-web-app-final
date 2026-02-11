const Activity = require("../models/Activity");

async function analyzeUser(userId) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const activities = await Activity.find({
    userId,
    date: { $gte: oneWeekAgo },
  });

  const totals = {
    transport: 0,
    food: 0,
    energy: 0,
  };

  activities.forEach((a) => {
    totals[a.category] += a.co2;
  });

  let highestCategory = Object.keys(totals).reduce((a, b) =>
    totals[a] > totals[b] ? a : b
  );

  let tip = generateTip(highestCategory);

  return {
    highestCategory,
    totals,
    tip,
  };
}

function generateTip(category) {
  const tips = {
    transport: "Try cycling twice this week to cut 2kg CO₂ 🚴",
    food: "Reduce red meat meals by 2 this week to lower emissions 🥗",
    energy: "Switch off unused appliances to save 1.5kg CO₂ ⚡",
  };

  return tips[category] || "Keep making sustainable choices 🌍";
}

module.exports = { analyzeUser };
