// Simple in-memory cache for leaderboard (refreshes every hour)
let leaderboardCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const getLeaderboardCache = () => {
  if (leaderboardCache && Date.now() - lastCacheTime < CACHE_TTL) {
    return leaderboardCache;
  }
  return null;
};

const setLeaderboardCache = (data) => {
  leaderboardCache = data;
  lastCacheTime = Date.now();
};

const invalidateLeaderboardCache = () => {
  leaderboardCache = null;
  lastCacheTime = 0;
};

module.exports = { getLeaderboardCache, setLeaderboardCache, invalidateLeaderboardCache };
