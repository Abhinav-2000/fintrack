const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const defaultCategories = [
  { name: 'Food & Dining', icon: '🍔', color: '#f97316', type: 'expense' },
  { name: 'Rent & Housing', icon: '🏠', color: '#8b5cf6', type: 'expense' },
  { name: 'Travel', icon: '✈️', color: '#06b6d4', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
  { name: 'Bills & Utilities', icon: '⚡', color: '#eab308', type: 'expense' },
  { name: 'Healthcare', icon: '🏥', color: '#ef4444', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#a855f7', type: 'expense' },
  { name: 'Education', icon: '📚', color: '#3b82f6', type: 'expense' },
  { name: 'Salary', icon: '💼', color: '#10b981', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#14b8a6', type: 'income' },
  { name: 'Investment', icon: '📈', color: '#22c55e', type: 'income' },
  { name: 'Other', icon: '💰', color: '#6b7280', type: 'both' }
];

// POST /api/auth/signup
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });

    // Create default categories for user
    await Category.insertMany(defaultCategories.map(c => ({ ...c, userId: user._id })));

    const token = generateToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json({ user: req.user }));

// PUT /api/auth/profile
router.put('/profile', auth, [
  body('name').optional().trim().notEmpty(),
  body('currency').optional().isLength({ min: 3, max: 3 })
], async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.currency) updates.currency = req.body.currency;
    if (req.body.darkMode !== undefined) updates.darkMode = req.body.darkMode;
    if (req.body.notifications) updates.notifications = req.body.notifications;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
