const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');
const { Parser } = require('json2csv');

// GET /api/transactions
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, startDate, endDate, tag, page = 1, limit = 20, sort = '-date' } = req.query;
    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/transactions
router.post('/', auth, [
  body('amount').isFloat({ min: 0.01 }),
  body('type').isIn(['income', 'expense']),
  body('category').notEmpty(),
  body('date').isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { amount, type, category, date, notes, tags, isRecurring, recurringFrequency, recurringEndDate } = req.body;
    const transaction = await Transaction.create({
      userId: req.user._id, amount, type, category, date, notes, tags,
      isRecurring, recurringFrequency, recurringEndDate
    });

    // Check budget alert
    if (type === 'expense') {
      const d = new Date(date);
      const budget = await Budget.findOne({
        userId: req.user._id, category,
        month: d.getMonth(), year: d.getFullYear()
      });
      if (budget) {
        const spent = await Transaction.aggregate([
          { $match: { userId: req.user._id, category, type: 'expense',
            date: { $gte: new Date(d.getFullYear(), d.getMonth(), 1),
                    $lte: new Date(d.getFullYear(), d.getMonth() + 1, 0) } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalSpent = spent[0]?.total || 0;
        const budgetExceeded = totalSpent > budget.amount;
        return res.status(201).json({ transaction, budgetExceeded, budgetAmount: budget.amount, totalSpent });
      }
    }

    res.status(201).json({ transaction });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const allowed = ['amount', 'type', 'category', 'date', 'notes', 'tags', 'isRecurring', 'recurringFrequency'];
    allowed.forEach(f => { if (req.body[f] !== undefined) transaction[f] = req.body[f]; });
    await transaction.save();
    res.json({ transaction });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const t = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!t) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/transactions/export/csv
router.get('/export/csv', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort('-date');
    const fields = ['amount', 'type', 'category', 'date', 'notes', 'tags'];
    const parser = new Parser({ fields });
    const csv = parser.parse(transactions.map(t => ({ ...t.toObject(), tags: t.tags.join(',') })));
    res.header('Content-Type', 'text/csv');
    res.attachment('fintrack-transactions.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Export failed' });
  }
});

// GET /api/transactions/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [summary] = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      { $group: {
        _id: null,
        totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        monthIncome: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'income'] }, { $gte: ['$date', startOfMonth] }] }, '$amount', 0] } },
        monthExpense: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'expense'] }, { $gte: ['$date', startOfMonth] }] }, '$amount', 0] } }
      }}
    ]);

    res.json(summary || { totalIncome: 0, totalExpense: 0, monthIncome: 0, monthExpense: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
