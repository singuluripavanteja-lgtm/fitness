const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/goals
// @desc    Get all user goals
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('goals');
    res.json(user.goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/goals
// @desc    Create a new goal
router.post('/', protect, async (req, res) => {
  const { title, targetValue, unit, deadline, milestones } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const newGoal = {
      title,
      targetValue,
      unit,
      deadline,
      milestones: milestones ? milestones.map(m => ({ title: m, isCompleted: false })) : []
    };
    user.goals.push(newGoal);
    await user.save();
    res.json(user.goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/goals/:id
// @desc    Update goal progress or status
router.put('/:id', protect, async (req, res) => {
  const { currentValue, status, milestones } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const goal = user.goals.id(req.params.id);
    
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });

    if (currentValue !== undefined) goal.currentValue = currentValue;
    if (status) goal.status = status;
    if (milestones) goal.milestones = milestones;

    // Check if goal is achieved
    if (goal.targetValue && goal.currentValue >= goal.targetValue && goal.status !== 'completed') {
        goal.status = 'completed';
        // Trigger achievement notification here later
    }

    await user.save();
    res.json(user.goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/goals/:id
// @desc    Delete a goal
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.goals.pull({ _id: req.params.id });
    await user.save();
    res.json(user.goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
