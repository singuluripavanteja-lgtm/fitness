const mongoose = require('mongoose');

const LoggedExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  plannedSets: Number,
  plannedReps: Number,
  plannedWeight: Number,
  completedSets: { type: Number, default: 0 },
  completedReps: { type: Number, default: 0 },
  actualWeight: { type: Number, default: 0 },
  unit: { type: String, default: 'lbs' },
  isCompleted: { type: Boolean, default: false }
});

const WorkoutLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan' },
  date: { type: Date, default: Date.now },
  dayName: { type: String },
  exercises: [LoggedExerciseSchema],
  progressPercent: { type: Number, default: 0 },
  totalSets: { type: Number, default: 0 },
  completedSets: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  plateauDetected: { type: Boolean, default: false },
  mood: { type: String, enum: ['terrible', 'bad', 'okay', 'good', 'great'], default: 'okay' },
}, { timestamps: true });

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);
