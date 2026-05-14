const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { getLeaderboardCache, setLeaderboardCache } = require('../middleware/cache');

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const cached = getLeaderboardCache();
    if (cached) return res.json(cached);

    const top = await User.find({ isPublic: true })
      .sort({ highestStreak: -1 })
      .limit(10)
      .select('username avatar currentStreak highestStreak milestonesAchieved bio');

    setLeaderboardCache(top);
    res.json(top);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/search?q=
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const users = await User.find({
      isPublic: true,
      username: { $regex: q, $options: 'i' }
    }).limit(20).select('username avatar currentStreak highestStreak bio');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('activeWorkoutPlan', 'title days')
      .populate('activeDietPlan', 'title dailyCalories')
      .select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me
router.put('/me', protect, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), async (req, res) => {
  try {
    const { bio, username, isPublic, activeWorkoutPlan, activeDietPlan } = req.body;
    const update = {};
    if (bio !== undefined) update.bio = bio;
    if (username) update.username = username;
    if (isPublic !== undefined) update.isPublic = isPublic === 'true';
    if (activeWorkoutPlan !== undefined) update.activeWorkoutPlan = activeWorkoutPlan === '' ? null : activeWorkoutPlan;
    if (activeDietPlan !== undefined) update.activeDietPlan = activeDietPlan === '' ? null : activeDietPlan;
    
    if (req.files) {
      if (req.files.avatar) {
        const result = await uploadToCloudinary(req.files.avatar[0].buffer, 'avatars');
        update.avatar = result.secure_url;
      }
      if (req.files.coverPhoto) {
        const result = await uploadToCloudinary(req.files.coverPhoto[0].buffer, 'covers');
        update.coverPhoto = result.secure_url;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar')
      .select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isPublic) return res.json({ username: user.username, avatar: user.avatar, isPublic: false });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:id/follow
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "Can't follow yourself" });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const alreadyFollowing = req.user.following.includes(req.params.id);
    if (alreadyFollowing) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
      res.json({ following: false, message: 'Unfollowed' });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $push: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $push: { followers: req.user._id } });
      res.json({ following: true, message: 'Following' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
