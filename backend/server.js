require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');

const connectDB = require('./config/db');
const User = require('./models/User');
const DuoStreak = require('./models/DuoStreak');
const { invalidateLeaderboardCache } = require('./middleware/cache');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workoutRoutes = require('./routes/workout');
const dietRoutes = require('./routes/diet');
const aiRoutes = require('./routes/ai');
const socialRoutes = require('./routes/social');
const duoRoutes = require('./routes/duo');

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.') && !req.path.startsWith('/api')) {
    const normalizedPath = req.path.replace(/^\/|\/$/g, '');
    const frontendDir = path.resolve(__dirname, '..', 'frontend');
    
    let targetFile = '';
    if (normalizedPath === '') {
      targetFile = path.join(frontendDir, 'index.html');
    } else {
      const htmlPath = path.join(frontendDir, `${normalizedPath}.html`);
      if (require('fs').existsSync(htmlPath)) {
        targetFile = htmlPath;
      } else {
        const indexPath = path.join(frontendDir, normalizedPath, 'index.html');
        if (require('fs').existsSync(indexPath)) {
          targetFile = indexPath;
        }
      }
    }

    if (targetFile) {
      console.log(`[Router] Serving ${normalizedPath} -> ${targetFile}`);
      return res.sendFile(targetFile);
    }
  }
  next();
});

// Static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/posts', socialRoutes);
app.use('/api/duo', duoRoutes);
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/notifications', require('./routes/notifications'));

// Serve frontend for all non-API routes


// Socket.IO — real-time notifications
io.on('connection', (socket) => {
  socket.on('join', (userId) => socket.join(userId));
  socket.on('disconnect', () => {});
});

// Cron: Reset duo streak daily check-in flags at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('🕛 Running midnight cron: checking duo streaks...');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const brokenDuos = await DuoStreak.find({
    status: 'active',
    $or: [
      { lastBothLogged: { $lt: yesterday } },
      { lastBothLogged: null }
    ]
  });

  for (const duo of brokenDuos) {
    duo.currentStreak = 0;
    duo.status = 'broken';
    await duo.save();
  }

  // Invalidate leaderboard cache daily
  invalidateLeaderboardCache();
  console.log(`✅ Processed ${brokenDuos.length} broken duo streaks`);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 fitnesSHARE server running on http://localhost:${PORT}`);
});

module.exports = { app, io };
