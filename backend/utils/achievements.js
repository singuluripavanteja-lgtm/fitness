const User = require('../models/User');
const Notification = require('../models/Notification');

const BADGES = [
  { id: 'first_workout', name: 'First Workout', icon: '🏋️', description: 'Completed your first workout!' },
  { id: 'streak_7', name: '7-Day Streak', icon: '🔥', description: 'Workout for 7 days in a row!' },
  { id: 'workout_100', name: 'Century Club', icon: '💯', description: 'Completed 100 workouts!' },
  { id: 'goal_getter', name: 'Goal Getter', icon: '🎯', description: 'Achieved your first fitness goal!' },
  { id: 'social_star', name: 'Social Star', icon: '🌟', description: 'Made your first social post!' }
];

const checkAchievements = async (userId, type, metadata = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    let unlockedBadges = [];

    if (type === 'workout_complete') {
      // First workout
      if (!user.badges.some(b => b.badgeId === 'first_workout')) {
        unlockedBadges.push(BADGES.find(b => b.id === 'first_workout'));
      }
      // Streak check
      if (user.currentStreak >= 7 && !user.badges.some(b => b.badgeId === 'streak_7')) {
        unlockedBadges.push(BADGES.find(b => b.id === 'streak_7'));
      }
      // 100 workouts
      // Need to count workouts from logs, or keep a count in user model
      // For now, let's assume we check workout count
      // const workoutCount = await WorkoutLog.countDocuments({ user: userId });
      // if (workoutCount >= 100) ...
    }

    if (type === 'goal_complete') {
        if (!user.badges.some(b => b.badgeId === 'goal_getter')) {
            unlockedBadges.push(BADGES.find(b => b.id === 'goal_getter'));
        }
    }

    if (unlockedBadges.length > 0) {
      for (const badge of unlockedBadges) {
        user.badges.push({
          badgeId: badge.id,
          name: badge.name,
          icon: badge.icon
        });

        // Add XP
        user.xp += 100;
        if (user.xp >= user.level * 500) {
            user.level += 1;
            // Level up notification?
        }

        // Create Notification
        await Notification.create({
          recipient: userId,
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `Congratulations! You've earned the "${badge.name}" badge.`,
          metadata: { badgeId: badge.id }
        });
      }
      await user.save();
    }

    return unlockedBadges;
  } catch (err) {
    console.error('Error checking achievements:', err);
  }
};

module.exports = { checkAchievements, BADGES };
