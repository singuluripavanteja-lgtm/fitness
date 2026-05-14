const mongoose = require('mongoose');

const DietPlanSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  goal: { type: String, enum: ['lose weight', 'gain muscle', 'maintain', 'performance', 'lose_weight', 'gain_muscle'], default: 'maintain' },
  dailyCalories: { type: Number, default: 2000 },
  macroSplit: {
    carbs: { type: Number, default: 50 },   // percentage
    protein: { type: Number, default: 30 },
    fat: { type: Number, default: 20 }
  },
  meals: [{
    mealType: String,
    name: String,
    foods: [{ name: String, amount: String, calories: Number, carbs: Number, protein: Number, fat: Number }]
  }],
  source: { type: String, default: 'manual', enum: ['manual', 'ai'] },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', DietPlanSchema);
