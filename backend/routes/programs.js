const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WorkoutProgram = require('../models/WorkoutProgram');
const User = require('../models/User');

// @route   GET api/programs
// @desc    Get all workout programs
router.get('/', auth, async (req, res) => {
  try {
    const programs = await WorkoutProgram.find();
    res.json(programs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/programs/enroll/:id
// @desc    Enroll in a program
router.post('/enroll/:id', auth, async (req, res) => {
  try {
    const program = await WorkoutProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ msg: 'Program not found' });

    const user = await User.findById(req.user.id);
    if (user.activeWorkoutPlan && user.activeWorkoutPlan.toString() === req.params.id) {
        return res.status(400).json({ msg: 'Already enrolled' });
    }

    user.activeWorkoutPlan = program._id;
    if (!program.enrolledUsers.includes(user._id)) {
        program.enrolledUsers.push(user._id);
    }

    await user.save();
    await program.save();
    res.json({ msg: 'Successfully enrolled', program });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/programs/my-program
// @desc    Get current enrolled program
router.get('/my-program', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('activeWorkoutPlan');
    res.json(user.activeWorkoutPlan);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
