const mongoose = require('mongoose');

const ProgramWorkoutSchema = new mongoose.Schema({
  day: { type: Number, required: true }, // e.g., Day 1, Day 2
  title: { type: String, required: true },
  exercises: [{
    name: { type: String, required: true },
    sets: { type: Number },
    reps: { type: Number },
    instructions: { type: String }
  }]
});

const WorkoutProgramSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  category: { type: String, enum: ['strength', 'cardio', 'weightLoss', 'flexibility'], default: 'strength' },
  durationWeeks: { type: Number, default: 4 },
  workouts: [ProgramWorkoutSchema],
  image: { type: String },
  enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('WorkoutProgram', WorkoutProgramSchema);
