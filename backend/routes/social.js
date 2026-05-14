const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../utils/cloudinary');

// GET /api/posts/feed  — posts from followed users + own
router.get('/feed', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const following = [...req.user.following, req.user._id];
    const posts = await Post.find({ author: { $in: following } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'username avatar currentStreak highestStreak')
      .populate('comments.author', 'username avatar');
    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/posts/explore  — public posts for non-logged users
router.get('/explore', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'username avatar currentStreak highestStreak');
    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/posts/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar currentStreak');
    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/posts  — create a post
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { caption, type, dataStickers, tags } = req.body;
    const user = await User.findById(req.user._id);

    // Update post streak
    const today = new Date();
    const lastPost = user.lastPostDate ? new Date(user.lastPostDate) : null;
    const isConsecutive = lastPost && (today - lastPost) < 48 * 60 * 60 * 1000;

    const newPostStreak = isConsecutive ? user.postStreak + 1 : 1;
    await User.findByIdAndUpdate(req.user._id, {
      postStreak: newPostStreak,
      lastPostDate: today
    });

    let imageUrl = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'posts');
      imageUrl = result.secure_url;
    }

    const post = await Post.create({
      author: req.user._id,
      imageUrl,
      caption,
      type: type || 'general',
      dataStickers: dataStickers ? JSON.parse(dataStickers) : [],
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      postStreak: newPostStreak
    });

    await post.populate('author', 'username avatar currentStreak');
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/posts/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.includes(req.user._id);
    if (alreadyLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    res.json({ liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ author: req.user._id, text });
    await post.save();
    await post.populate('comments.author', 'username avatar');
    res.json(post.comments[post.comments.length - 1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/posts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ message: 'Post not found or unauthorized' });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
