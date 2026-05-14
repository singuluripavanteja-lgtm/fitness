const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { aiChat, aiVision } = require('../utils/ai');
const { uploadToCloudinary } = require('../utils/cloudinary');
const WorkoutLog = require('../models/WorkoutLog');

// POST /api/ai/workout-plan
router.post('/workout-plan', protect, async (req, res) => {
  try {
    const { goal, fitnessLevel, daysPerWeek, equipment, age, weight, injuries } = req.body;
    const prompt = `You are an expert personal trainer. Create a detailed ${daysPerWeek}-day weekly workout plan for someone with the following profile:
- Goal: ${goal}
- Fitness Level: ${fitnessLevel}
- Equipment: ${equipment}
- Age: ${age}, Weight: ${weight}
- Injuries/Limitations: ${injuries || 'None'}

Return ONLY valid JSON in this exact format:
{
  "title": "Plan name",
  "description": "Brief description",
  "difficulty": "${fitnessLevel}",
  "durationWeeks": 4,
  "days": [
    {
      "dayName": "Monday",
      "focus": "Chest & Triceps",
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": 10, "weight": 135, "unit": "lbs", "restSeconds": 90, "notes": "Keep elbows at 45 degrees" }
      ]
    }
  ]
}`;

    const response = await aiChat([{ role: 'user', content: prompt }]);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ message: 'AI returned invalid format' });
    const plan = JSON.parse(jsonMatch[0]);
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'AI error: ' + err.message });
  }
});

// POST /api/ai/tweak-plan  — Progressive Overload Engine
router.post('/tweak-plan', protect, async (req, res) => {
  try {
    const { currentPlan, plateauExercises } = req.body;

    // Get last 14 days of logs
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const logs = await WorkoutLog.find({
      user: req.user._id,
      date: { $gte: twoWeeksAgo }
    }).sort({ date: 1 });

    const logSummary = logs.map(l => ({
      date: l.date.toDateString(),
      exercises: l.exercises.map(e => ({
        name: e.name,
        sets: e.completedSets,
        reps: e.completedReps,
        weight: e.actualWeight,
        unit: e.unit
      }))
    }));

    const prompt = `You are an expert personal trainer specializing in progressive overload. 
A user has hit a plateau in: ${plateauExercises.join(', ')}.

Here are their last 14 days of workout logs:
${JSON.stringify(logSummary, null, 2)}

Current plan:
${JSON.stringify(currentPlan, null, 2)}

Analyze the data and return a MODIFIED workout plan that introduces progressive overload to break through the plateau.
Include specific comments on what you changed and why.

Return ONLY valid JSON in this format:
{
  "title": "Modified plan title",
  "description": "What changed and why",
  "changes": ["Changed bench press: reduced reps from 10 to 8, increased weight by 5 lbs to break plateau"],
  "days": [ ... same structure as input ... ]
}`;

    const response = await aiChat([{ role: 'user', content: prompt }]);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ message: 'AI returned invalid format' });
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    res.status(500).json({ message: 'AI error: ' + err.message });
  }
});

// POST /api/ai/diet-plan
router.post('/diet-plan', protect, async (req, res) => {
  try {
    const { goal, calories, restrictions, allergies, mealsPerDay, weight, height } = req.body;
    const prompt = `You are a certified nutritionist. Create a detailed daily diet plan with the following requirements:
- Goal: ${goal} (lose weight / gain muscle / maintain)
- Target Calories: ${calories} kcal/day
- Meals per day: ${mealsPerDay}
- Dietary restrictions: ${restrictions || 'None'}
- Allergies: ${allergies || 'None'}
- Weight: ${weight}, Height: ${height}

Return ONLY valid JSON in this format:
{
  "title": "Diet Plan Name",
  "description": "Brief overview",
  "goal": "${goal}",
  "dailyCalories": ${calories},
  "macroSplit": { "carbs": 50, "protein": 30, "fat": 20 },
  "meals": [
    {
      "mealType": "breakfast",
      "name": "Power Breakfast",
      "foods": [
        { "name": "Oats", "amount": "1 cup", "calories": 300, "carbs": 54, "protein": 10, "fat": 6 }
      ]
    }
  ]
}`;

    const response = await aiChat([{ role: 'user', content: prompt }]);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ message: 'AI returned invalid format' });
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    res.status(500).json({ message: 'AI error: ' + err.message });
  }
});

// POST /api/ai/food-photo  — Vision: analyze meal image for macros
router.post('/food-photo', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const prompt = `Analyze this meal/food image. Estimate the nutritional content based on what you see.
Return ONLY valid JSON in this exact format (use numbers, not strings):
{
  "name": "Identified food name",
  "mealType": "breakfast|lunch|dinner|snack",
  "portionSize": "Estimated portion (e.g. 1 cup, 200g)",
  "calories": 450,
  "carbs": 55,
  "protein": 25,
  "fat": 12,
  "fiber": 5,
  "confidence": "high|medium|low",
  "notes": "Any relevant notes about the estimate"
}`;

    const response = await aiVision(base64, prompt, mimeType);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ message: 'AI could not analyze the image' });

    const macros = JSON.parse(jsonMatch[0]);
    
    // Upload to Cloudinary to get a permanent URL
    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'meals');
      macros.imageUrl = uploadResult.secure_url;
    } catch (err) {
      console.error('[Cloudinary] Upload failed:', err);
      macros.imageUrl = null;
    }

    macros.aiEstimated = true;
    res.json(macros);
  } catch (err) {
    res.status(500).json({ message: 'AI vision error: ' + err.message });
  }
});

// POST /api/ai/chat  — General fitness Q&A
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, context } = req.body;
    const messages = [
      { role: 'system', content: 'You are FitAI, an expert fitness and nutrition coach. Give concise, actionable advice. Be encouraging and motivating.' },
      ...(context || []),
      { role: 'user', content: message }
    ];
    const response = await aiChat(messages);
    res.json({ reply: response });
  } catch (err) {
    res.status(500).json({ message: 'AI error: ' + err.message });
  }
});

module.exports = router;
