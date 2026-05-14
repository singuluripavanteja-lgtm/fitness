const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  coverPhoto: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 300 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  currentStreak: { type: Number, default: 0 },
  highestStreak: { type: Number, default: 0 },
  lastWorkoutDate: { type: Date, default: null },
  streakFreezes: { type: Number, default: 0 },
  milestonesAchieved: [{ type: String }],
  duoStreaks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DuoStreak' }],
  activeWorkoutPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan', default: null },
  activeDietPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'DietPlan', default: null },
  postStreak: { type: Number, default: 0 },
  lastPostDate: { type: Date, default: null },
  personalRecords: [{ exercise: String, weight: Number, reps: Number, date: Date }],
  isPublic: { type: Boolean, default: true },
  goals: [{
    title: { type: String, required: true },
    targetValue: { type: Number },
    currentValue: { type: Number, default: 0 },
    unit: { type: String },
    deadline: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
    milestones: [{
      title: { type: String },
      isCompleted: { type: Boolean, default: false }
    }]
  }],
  metrics: [{
    type: { type: String, enum: ['weight', 'bmi', 'bodyFat', 'muscleMass', 'sleep', 'water'], required: true },
    value: { type: Number, required: true },
    unit: { type: String },
    date: { type: Date, default: Date.now }
  }],
  badges: [{
    badgeId: { type: String },
    name: { type: String },
    icon: { type: String },
    unlockedAt: { type: Date, default: Date.now }
  }],
  notificationPreferences: {
    workoutReminders: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true },
    socialActivity: { type: Boolean, default: true },
    duoReminders: { type: Boolean, default: true }
  },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
