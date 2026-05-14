const mongoose = require('mongoose');
const WorkoutProgram = require('./backend/models/WorkoutProgram');
require('dotenv').config();

const programs = [
  {
    title: "Beginner Strength",
    description: "Perfect for those just starting their fitness journey. Focuses on compound movements and proper form.",
    difficulty: "beginner",
    category: "strength",
    durationWeeks: 4,
    workouts: [
      { day: 1, title: "Full Body A", exercises: [
        { name: "Bodyweight Squats", sets: 3, reps: 12 },
        { name: "Push Ups", sets: 3, reps: 10 },
        { name: "Plank", sets: 3, reps: 30 }
      ]},
      { day: 2, title: "Rest & Recovery", exercises: [] },
      { day: 3, title: "Full Body B", exercises: [
        { name: "Lunges", sets: 3, reps: 10 },
        { name: "Dumbbell Rows", sets: 3, reps: 12 },
        { name: "Glute Bridges", sets: 3, reps: 15 }
      ]}
    ]
  },
  {
    title: "Weight Loss Cardio",
    description: "High-intensity interval training designed to burn calories and improve heart health.",
    difficulty: "intermediate",
    category: "weightLoss",
    durationWeeks: 4,
    workouts: [
      { day: 1, title: "HIIT Blast", exercises: [
        { name: "Jumping Jacks", sets: 4, reps: 20 },
        { name: "Mountain Climbers", sets: 4, reps: 20 },
        { name: "Burpees", sets: 4, reps: 10 }
      ]}
    ]
  },
  {
    title: "Advanced Hypertrophy",
    description: "Advanced program for muscle growth using high volume and progressive overload.",
    difficulty: "advanced",
    category: "strength",
    durationWeeks: 8,
    workouts: [
      { day: 1, title: "Push Day", exercises: [
        { name: "Bench Press", sets: 4, reps: 8 },
        { name: "Overhead Press", sets: 4, reps: 10 },
        { name: "Tricep Pushdowns", sets: 3, reps: 15 }
      ]}
    ]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await WorkoutProgram.deleteMany({});
    await WorkoutProgram.insertMany(programs);
    console.log("Database Seeded!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
