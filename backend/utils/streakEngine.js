const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');

const MILESTONES = [
  { days: 7, label: '🔥 Week Warrior', freezesAwarded: 0 },
  { days: 30, label: '💪 Month Champion', freezesAwarded: 1 },
  { days: 60, label: '⚡ 60-Day Beast', freezesAwarded: 1 },
  { days: 90, label: '🏆 90-Day Legend', freezesAwarded: 2 },
  { days: 180, label: '🌟 Half-Year Hero', freezesAwarded: 3 },
  { days: 365, label: '👑 Year Master', freezesAwarded: 5 },
];

const isSameDay = (d1, d2) => {
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
};

const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();

  // Already logged today
  if (user.lastWorkoutDate && isSameDay(user.lastWorkoutDate, today)) return user;

  if (!user.lastWorkoutDate || isYesterday(user.lastWorkoutDate)) {
    // Consecutive day
    user.currentStreak += 1;
  } else {
    // Streak broken — check for freeze
    const daysMissed = Math.floor((today - new Date(user.lastWorkoutDate)) / (1000 * 60 * 60 * 24));
    if (daysMissed > 1) {
      if (user.streakFreezes > 0) {
        user.streakFreezes -= 1;
        // Keep streak, just continue
        user.currentStreak += 1;
      } else {
        user.currentStreak = 1;
      }
    } else {
      user.currentStreak += 1;
    }
  }

  user.lastWorkoutDate = today;
  if (user.currentStreak > user.highestStreak) {
    user.highestStreak = user.currentStreak;
  }

  // Check milestones
  for (const milestone of MILESTONES) {
    if (user.currentStreak === milestone.days && !user.milestonesAchieved.includes(milestone.label)) {
      user.milestonesAchieved.push(milestone.label);
      user.streakFreezes += milestone.freezesAwarded;
    }
  }

  await user.save();
  return user;
};

const checkPlateauForUser = async (userId, exerciseName) => {
  const logs = await WorkoutLog.find({ user: userId })
    .sort({ date: -1 })
    .limit(6);

  if (logs.length < 3) return false;

  const exerciseLogs = logs
    .map(log => log.exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase()))
    .filter(Boolean);

  if (exerciseLogs.length < 3) return false;

  const last3 = exerciseLogs.slice(0, 3);
  const allSame = last3.every(e =>
    e.completedReps === last3[0].completedReps &&
    e.actualWeight === last3[0].actualWeight
  );

  return allSame;
};

module.exports = { updateStreak, checkPlateauForUser, isSameDay };
