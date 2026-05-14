const express = require('express');
const router = express.Router();
const DietLog = require('../models/DietLog');
const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/diet/log/today
router.get('/log/today', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let log = await DietLog.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!log) {
      log = await DietLog.create({ user: req.user._id, date: today });
    }
    res.json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/diet/log/history
router.get('/log/history', protect, async (req, res) => {
  try {
    const logs = await DietLog.find({ user: req.user._id })
      .sort({ date: -1 }).limit(30);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/diet/log/meal  — add a meal to today's log
router.post('/log/meal', protect, async (req, res) => {
  try {
    const { name, carbs, protein, fat, calories, fiber, mealType, imageUrl, aiEstimated } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let log = await DietLog.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });
    if (!log) log = await DietLog.create({ user: req.user._id, date: today });

    const meal = { name, carbs: +carbs || 0, protein: +protein || 0, fat: +fat || 0, calories: +calories || 0, fiber: +fiber || 0, mealType, imageUrl, aiEstimated };
    log.meals.push(meal);

    // Recalculate totals
    log.totals = log.meals.reduce((acc, m) => ({
      carbs: acc.carbs + m.carbs,
      protein: acc.protein + m.protein,
      fat: acc.fat + m.fat,
      calories: acc.calories + m.calories,
      fiber: acc.fiber + m.fiber
    }), { carbs: 0, protein: 0, fat: 0, calories: 0, fiber: 0 });

    await log.save();
    res.json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/diet/log/meal/:mealId
router.delete('/log/meal/:mealId', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const log = await DietLog.findOne({ user: req.user._id, date: { $gte: today, $lt: tomorrow } });
    if (!log) return res.status(404).json({ message: 'No diet log for today' });

    log.meals = log.meals.filter(m => m._id.toString() !== req.params.mealId);
    log.totals = log.meals.reduce((acc, m) => ({
      carbs: acc.carbs + m.carbs, protein: acc.protein + m.protein,
      fat: acc.fat + m.fat, calories: acc.calories + m.calories, fiber: acc.fiber + m.fiber
    }), { carbs: 0, protein: 0, fat: 0, calories: 0, fiber: 0 });

    await log.save();
    res.json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/diet/log/goal
router.put('/log/goal', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const log = await DietLog.findOneAndUpdate(
      { user: req.user._id, date: { $gte: today, $lt: tomorrow } },
      { dailyGoal: req.body },
      { new: true, upsert: true }
    );
    res.json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/diet/plans
router.get('/plans', protect, async (req, res) => {
  try {
    const plans = await DietPlan.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/diet/plans
router.post('/plans', protect, async (req, res) => {
  try {
    const plan = await DietPlan.create({ ...req.body, owner: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { activeDietPlan: plan._id });
    res.status(201).json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/diet/plans/:id
router.put('/plans/:id', protect, async (req, res) => {
  try {
    const plan = await DietPlan.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
