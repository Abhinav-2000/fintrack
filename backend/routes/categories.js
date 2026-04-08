const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// GET /api/categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({
      $or: [{ userId: req.user._id }, { isDefault: true }]
    }).sort('name');
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/categories
router.post('/', auth, async (req, res) => {
  try {
    const { name, icon, color, type } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const category = await Category.create({ userId: req.user._id, name, icon, color, type });
    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/categories/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body, { new: true }
    );
    if (!category) return res.status(404).json({ message: 'Not found or not yours' });
    res.json({ category });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!category) return res.status(404).json({ message: 'Not found or not yours' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
