const mongoose = require('mongoose');

const DuoStreakSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  currentStreak: { type: Number, default: 0 },
  highestStreak: { type: Number, default: 0 },
  lastBothLogged: { type: Date, default: null },
  user1LoggedToday: { type: Boolean, default: false },
  user2LoggedToday: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'broken', 'pending'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DuoStreak', DuoStreakSchema);
