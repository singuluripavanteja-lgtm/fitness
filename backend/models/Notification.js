const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['workout_reminder', 'achievement', 'social_activity', 'challenge_update', 'duo_reminder', 'friend_request', 'message'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },
  metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
