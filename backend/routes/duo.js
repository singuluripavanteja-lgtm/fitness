const express = require('express');
const router = express.Router();
const DuoStreak = require('../models/DuoStreak');
const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const { protect } = require('../middleware/auth');
const { isSameDay } = require('../utils/streakEngine');

// POST /api/duo/invite  — invite a user to start a duo streak
router.post('/invite', protect, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (targetUserId === req.user._id.toString())
      return res.status(400).json({ message: "Can't duo with yourself" });

    const target = await User.findById(targetUserId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const existing = await DuoStreak.findOne({
      users: { $all: [req.user._id, targetUserId] }
    });
    if (existing) return res.status(400).json({ message: 'Duo streak already exists', duo: existing });

    const duo = await DuoStreak.create({
      users: [req.user._id, targetUserId],
      status: 'pending'
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { duoStreaks: duo._id } });
    await User.findByIdAndUpdate(targetUserId, { $push: { duoStreaks: duo._id } });

    res.status(201).json(duo);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/duo/:id/accept
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const duo = await DuoStreak.findById(req.params.id);
    if (!duo) return res.status(404).json({ message: 'Duo not found' });
    if (!duo.users.includes(req.user._id))
      return res.status(403).json({ message: 'Not part of this duo' });

    duo.status = 'active';
    await duo.save();
    res.json(duo);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/duo/my
router.get('/my', protect, async (req, res) => {
  try {
    const duos = await DuoStreak.find({ users: req.user._id })
      .populate('users', 'username avatar currentStreak');
    res.json(duos);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/duo/:id/log  — mark daily check-in for duo streak
router.post('/:id/log', protect, async (req, res) => {
  try {
    const duo = await DuoStreak.findById(req.params.id);
    if (!duo || duo.status !== 'active')
      return res.status(404).json({ message: 'Active duo not found' });

    const userIndex = duo.users.findIndex(u => u.toString() === req.user._id.toString());
    if (userIndex === -1) return res.status(403).json({ message: 'Not part of this duo' });

    if (userIndex === 0) duo.user1LoggedToday = true;
    else duo.user2LoggedToday = true;

    // Both logged today → increment streak
    if (duo.user1LoggedToday && duo.user2LoggedToday) {
      duo.currentStreak += 1;
      if (duo.currentStreak > duo.highestStreak) duo.highestStreak = duo.currentStreak;
      duo.lastBothLogged = new Date();
      duo.user1LoggedToday = false;
      duo.user2LoggedToday = false;
    }

    await duo.save();
    res.json({ duo, bothLogged: !duo.user1LoggedToday && !duo.user2LoggedToday });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
