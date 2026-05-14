const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  carbs: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  calories: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  aiEstimated: { type: Boolean, default: false },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'snack' }
});

const DietLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  meals: [MealSchema],
  dailyGoal: {
    carbs: { type: Number, default: 250 },
    protein: { type: Number, default: 150 },
    fat: { type: Number, default: 65 },
    calories: { type: Number, default: 2000 },
    fiber: { type: Number, default: 30 }
  },
  totals: {
    carbs: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 }
  },
  waterIntake: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('DietLog', DietLogSchema);
