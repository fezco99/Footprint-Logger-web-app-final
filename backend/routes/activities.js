const express = require("express");
const Activity = require("../models/Activity");
const auth = require("../middleware/authMiddleware");
const Goal = require("../models/Goal");
const { analyzeUser } = require("../services/insightEngine");

const router = express.Router();

/* CREATE ACTIVITY */
router.post("/", auth, async (req, res) => {
  const activity = new Activity({
    ...req.body,
    userId: req.user.id,
  });

  await activity.save();
  res.json(activity);

  const goal = await Goal.findOne({ userId: req.user.id }).sort({
    weekStart: -1,
  });

  if (goal) {
    goal.currentTotal += activity.co2;

    if (goal.currentTotal <= goal.baseline - goal.targetReduction) {
      goal.achieved = true;
    }

    await goal.save();
  }
});

/* GET USER ACTIVITIES */
router.get("/my", auth, async (req, res) => {
  const activities = await Activity.find({ userId: req.user.id });
  res.json(activities);
});

/* USER DASHBOARD SUMMARY */
router.get("/dashboard/summary", auth, async (req, res) => {
  const activities = await Activity.find({ userId: req.user.id });

  const total = activities.reduce((sum, a) => sum + a.co2, 0);

  res.json({
    totalEmissions: total,
    activityCount: activities.length,
  });
});

/* WEEKLY SUMMARY */
router.get("/weekly", auth, async (req, res) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const activities = await Activity.find({
    userId: req.user.id,
    date: { $gte: oneWeekAgo },
  });

  const total = activities.reduce((sum, a) => sum + a.co2, 0);

  res.json({
    weeklyTotal: total,
    activities,
  });
});

/* STREAK TRACKING */
router.get("/streak", auth, async (req, res) => {
  const activities = await Activity.find({ userId: req.user.id }).sort({
    date: -1,
  });

  if (activities.length === 0) return res.json({ streak: 0 });

  let streak = 1;
  let currentDate = new Date(activities[0].date);

  for (let i = 1; i < activities.length; i++) {
    const prevDate = new Date(activities[i].date);

    const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  res.json({ streak });
});

/* LEADERBOARD */
router.get("/leaderboard", async (req, res) => {
  const results = await Activity.aggregate([
    {
      $group: {
        _id: "$userId",
        total: { $sum: "$co2" },
      },
    },
    {
      $sort: { total: 1 },
    },
    {
      $limit: 10,
    },
  ]);

  res.json(results);
});

router.post("/goal/create", auth, async (req, res) => {
  const analysis = await analyzeUser(req.user.id);

  const baseline = Object.values(analysis.totals).reduce((a, b) => a + b, 0);

  const targetReduction = baseline * 0.1; // 10% reduction goal

  const goal = new Goal({
    userId: req.user.id,
    weekStart: new Date(),
    targetReduction,
    baseline,
  });

  await goal.save();

  res.json(goal);
});

router.get("/goal", auth, async (req, res) => {
  const goal = await Goal.findOne({
    userId: req.user.id,
  }).sort({ weekStart: -1 });

  res.json(goal);
});

router.get("/insight", auth, async (req, res) => {
  const analysis = await analyzeUser(req.user.id);
  res.json(analysis);
});
