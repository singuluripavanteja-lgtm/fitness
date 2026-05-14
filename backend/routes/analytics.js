const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const User = require('../models/User');

// @route   GET api/analytics/trends
// @desc    Get workout and diet trends over time
router.get('/trends', protect, async (req, res) => {
  try {
    const workouts = await WorkoutLog.find({ user: req.user.id }).sort({ date: 1 });
    const diet = await DietLog.find({ user: req.user.id }).sort({ date: 1 });
    
    res.json({ workouts, diet });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/analytics/metrics
// @desc    Get user body metrics over time
router.get('/metrics', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('metrics');
    res.json(user.metrics);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/analytics/metrics
// @desc    Add a new body metric
router.post('/metrics', protect, async (req, res) => {
  const { type, value, unit } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.metrics.push({ type, value, unit, date: new Date() });
    await user.save();
    res.json(user.metrics);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/analytics/comparison
// @desc    Compare progress month-over-month
router.get('/comparison', protect, async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthWorkouts = await WorkoutLog.countDocuments({
      user: req.user.id,
      date: { $gte: thisMonth }
    });

    const lastMonthWorkouts = await WorkoutLog.countDocuments({
      user: req.user.id,
      date: { $gte: lastMonth, $lt: thisMonth }
    });

    res.json({
      currentMonth: currentMonthWorkouts,
      lastMonth: lastMonthWorkouts,
      percentageChange: lastMonthWorkouts === 0 ? 100 : ((currentMonthWorkouts - lastMonthWorkouts) / lastMonthWorkouts) * 100
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
