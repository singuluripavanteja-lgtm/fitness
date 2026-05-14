const mongoose = require('mongoose');

const StickerSchema = new mongoose.Schema({
  type: { type: String, enum: ['streak', 'pr', 'macro', 'milestone'] },
  label: String,
  value: String,
  posX: { type: Number, default: 50 },
  posY: { type: Number, default: 50 }
});

const CommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, default: '' },
  caption: { type: String, default: '', maxlength: 2200 },
  dataStickers: [StickerSchema],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
  postStreak: { type: Number, default: 0 },
  type: { type: String, enum: ['progress', 'meal', 'workout', 'general'], default: 'general' },
  tags: [String],
  workoutLog: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutLog', default: null },
  dietLog: { type: mongoose.Schema.Types.ObjectId, ref: 'DietLog', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
