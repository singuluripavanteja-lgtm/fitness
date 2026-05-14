const express = require('express');
const router = express.Router();
const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateStreak, checkPlateauForUser } = require('../utils/streakEngine');

// GET /api/workout/plans
router.get('/plans', protect, async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/workout/plans/public
router.get('/plans/public', async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ isPublic: true })
      .populate('owner', 'username avatar currentStreak')
      .sort({ cloneCount: -1 })
      .limit(20);
    res.json(plans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/workout/plans/:id
router.get('/plans/:id', protect, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id).populate('owner', 'username avatar');
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/workout/plans
router.post('/plans', protect, async (req, res) => {
  try {
    const plan = await WorkoutPlan.create({ ...req.body, owner: req.user._id });
    res.status(201).json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/workout/plans/:id
router.put('/plans/:id', protect, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plan) return res.status(404).json({ message: 'Plan not found or unauthorized' });
    Object.assign(plan, req.body);
    await plan.save();
    res.json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/workout/plans/:id/clone
router.post('/plans/:id/clone', protect, async (req, res) => {
  try {
    const original = await WorkoutPlan.findById(req.params.id);
    if (!original || !original.isPublic)
      return res.status(404).json({ message: 'Plan not found or not public' });

    const cloned = await WorkoutPlan.create({
      owner: req.user._id,
      title: `[Cloned] ${original.title}`,
      description: original.description,
      days: original.days,
      source: 'cloned',
      originalPlan: original._id,
      tags: original.tags,
      difficulty: original.difficulty,
      isPublic: false
    });

    original.cloneCount += 1;
    await original.save();

    // Set as active plan
    await User.findByIdAndUpdate(req.user._id, { activeWorkoutPlan: cloned._id });

    res.status(201).json(cloned);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/workout/log  — log a daily session
router.post('/log', protect, async (req, res) => {
  try {
    const { planId, dayName, exercises, notes, duration, mood } = req.body;

    const totalSets = exercises.reduce((a, e) => a + (e.plannedSets || 0), 0);
    const completedSets = exercises.reduce((a, e) => a + (e.completedSets || 0), 0);
    const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    const log = await WorkoutLog.create({
      user: req.user._id,
      plan: planId || null,
      dayName,
      exercises,
      notes,
      duration,
      mood,
      totalSets,
      completedSets,
      progressPercent
    });

    // Update streak
    const updatedUser = await updateStreak(req.user._id);

    // Check plateau for each exercise
    const plateaus = [];
    for (const ex of exercises) {
      const plateauDetected = await checkPlateauForUser(req.user._id, ex.name);
      if (plateauDetected) plateaus.push(ex.name);
    }

    if (plateaus.length > 0) {
      log.plateauDetected = true;
      await log.save();
    }

    // Update personal records
    for (const ex of exercises) {
      if (ex.actualWeight > 0) {
        const user = await User.findById(req.user._id);
        const existing = user.personalRecords.find(pr => pr.exercise === ex.name);
        if (!existing || ex.actualWeight > existing.weight) {
          await User.findByIdAndUpdate(req.user._id, {
            $pull: { personalRecords: { exercise: ex.name } }
          });
          await User.findByIdAndUpdate(req.user._id, {
            $push: { personalRecords: { exercise: ex.name, weight: ex.actualWeight, reps: ex.completedReps, date: new Date() } }
          });
        }
      }
    }

    // Estimate calories (simple formula)
    const intensityFactor = mood === 'great' ? 8 : mood === 'good' ? 6 : 4;
    const caloriesBurned = Math.round((duration || 0) * intensityFactor);
    
    // Check for achievements
    const { checkAchievements } = require('../utils/achievements');
    const unlocked = await checkAchievements(req.user._id, 'workout_complete');

    res.status(201).json({
      log,
      caloriesBurned,
      currentStreak: updatedUser?.currentStreak,
      highestStreak: updatedUser?.highestStreak,
      newMilestones: updatedUser?.milestonesAchieved,
      plateausDetected: plateaus,
      unlockedBadges: unlocked
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/workout/logs
router.get('/logs', protect, async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const logs = await WorkoutLog.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('plan', 'title');
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/workout/logs/stats
router.get('/logs/stats', protect, async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ user: req.user._id }).sort({ date: -1 }).limit(30);
    const totalSessions = logs.length;
    const avgProgress = logs.length > 0
      ? Math.round(logs.reduce((a, l) => a + l.progressPercent, 0) / logs.length)
      : 0;
    const totalSets = logs.reduce((a, l) => a + l.completedSets, 0);
    res.json({ totalSessions, avgProgress, totalSets, recentLogs: logs.slice(0, 7) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/workout/streak/freeze
router.post('/streak/freeze', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.streakFreezes <= 0)
      return res.status(400).json({ message: 'No streak freezes available' });

    user.streakFreezes -= 1;
    user.lastWorkoutDate = new Date();
    user.currentStreak += 1;
    if (user.currentStreak > user.highestStreak) user.highestStreak = user.currentStreak;
    await user.save();

    res.json({ message: 'Streak freeze used!', currentStreak: user.currentStreak, freezesRemaining: user.streakFreezes });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/workout/log/today
router.get('/log/today', protect, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const log = await WorkoutLog.findOne({
      user: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('plan', 'title');

    res.json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/workout/stats/daily-progress
router.get('/stats/daily-progress', protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await WorkoutLog.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    const stats = logs.map(l => ({
      date: l.date.toISOString().split('T')[0],
      progress: l.progressPercent,
      sets: l.completedSets
    }));

    res.json(stats);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
