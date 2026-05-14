const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 10 },
  weight: { type: Number, default: 0 },
  unit: { type: String, default: 'lbs', enum: ['lbs', 'kg'] },
  restSeconds: { type: Number, default: 60 },
  notes: { type: String, default: '' }
});

const DaySchema = new mongoose.Schema({
  dayName: { type: String, required: true },
  focus: { type: String, default: '' },
  exercises: [ExerciseSchema]
});

const WorkoutPlanSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  isPublic: { type: Boolean, default: true },
  days: [DaySchema],
  source: { type: String, default: 'manual', enum: ['manual', 'ai', 'cloned'] },
  originalPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan', default: null },
  cloneCount: { type: Number, default: 0 },
  tags: [String],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  durationWeeks: { type: Number, default: 4 },
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', WorkoutPlanSchema);
