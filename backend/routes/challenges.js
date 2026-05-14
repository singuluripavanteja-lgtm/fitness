const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const User = require('../models/User');

// @route   GET api/challenges
// @desc    Get all active challenges
router.get('/', protect, async (req, res) => {
  try {
    const challenges = await Challenge.find({ endDate: { $gte: new Date() } });
    res.json(challenges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/challenges/join/:id
// @desc    Join a challenge
router.post('/join/:id', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ msg: 'Challenge not found' });

    const isParticipant = challenge.participants.some(p => p.user.toString() === req.user.id);
    if (isParticipant) return res.status(400).json({ msg: 'Already joined' });

    challenge.participants.push({ user: req.user.id });
    await challenge.save();
    res.json(challenge);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/challenges/progress/:id
// @desc    Update challenge progress
router.put('/progress/:id', protect, async (req, res) => {
  const { progress } = req.body;
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ msg: 'Challenge not found' });

    const participant = challenge.participants.find(p => p.user.toString() === req.user.id);
    if (!participant) return res.status(400).json({ msg: 'Not a participant' });

    participant.progress = progress;
    await challenge.save();
    res.json(challenge);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/challenges/leaderboard/:id
// @desc    Get challenge leaderboard
router.get('/leaderboard/:id', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('participants.user', 'username avatar');
    
    if (!challenge) return res.status(404).json({ msg: 'Challenge not found' });

    const leaderboard = challenge.participants
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 10);

    res.json(leaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
