const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// GET /api/budgets?month=&year=
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month ?? now.getMonth());
    const year = parseInt(req.query.year ?? now.getFullYear());

    const budgets = await Budget.find({ userId: req.user._id, month, year });

    // Attach spending to each budget
    const enriched = await Promise.all(budgets.map(async (b) => {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
      const [spent] = await Transaction.aggregate([
        { $match: { userId: req.user._id, category: b.category, type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      return { ...b.toObject(), spent: spent?.total || 0, exceeded: (spent?.total || 0) > b.amount };
    }));

    res.json({ budgets: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/budgets
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category, month, year },
      { amount, alertSent: false },
      { upsert: true, new: true }
    );
    res.status(201).json({ budget });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
