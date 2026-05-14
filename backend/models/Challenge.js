const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['steps', 'workouts', 'calories', 'weightLoss'], required: true },
  target: { type: Number, required: true },
  unit: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now }
  }],
  isGlobal: { type: Boolean, default: true },
  rewardBadges: [{ type: String }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Challenge', ChallengeSchema);
