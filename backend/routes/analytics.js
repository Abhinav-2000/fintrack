const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// GET /api/analytics/monthly - monthly income vs expense for last 6 months
router.get('/monthly', auth, async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const data = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/categories - category breakdown for current month
router.get('/categories', auth, async (req, res) => {
  try {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear(), type = 'expense' } = req.query;
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const data = await Transaction.aggregate([
      { $match: { userId: req.user._id, type, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/insights - smart insights
router.get('/insights', auth, async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: req.user._id, type: 'expense', date: { $gte: thisMonthStart } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }
      ]),
      Transaction.aggregate([
        { $match: { userId: req.user._id, type: 'expense', date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ])
    ]);

    const lastMonthMap = Object.fromEntries(lastMonth.map(m => [m._id, m.total]));
    const insights = [];

    // Top category
    if (thisMonth[0]) {
      insights.push({ type: 'top_category', message: `Your highest expense category this month is ${thisMonth[0]._id}`, icon: '🏆', value: thisMonth[0].total });
    }

    // Month-over-month changes
    thisMonth.forEach(({ _id, total }) => {
      const prev = lastMonthMap[_id] || 0;
      if (prev > 0) {
        const pct = Math.round(((total - prev) / prev) * 100);
        if (pct >= 20) insights.push({ type: 'increase', message: `You spent ${pct}% more on ${_id} vs last month`, icon: '📈', value: pct });
        else if (pct <= -20) insights.push({ type: 'decrease', message: `You spent ${Math.abs(pct)}% less on ${_id} vs last month`, icon: '📉', value: pct });
      }
    });

    // Total this month
    const totalThisMonth = thisMonth.reduce((s, m) => s + m.total, 0);
    const totalLastMonth = lastMonth.reduce((s, m) => s + m.total, 0);
    if (totalLastMonth > 0) {
      const diff = Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100);
      insights.push({
        type: 'overall',
        message: diff > 0 ? `Overall spending is up ${diff}% vs last month` : `Overall spending is down ${Math.abs(diff)}% vs last month`,
        icon: diff > 0 ? '⚠️' : '✅',
        value: diff
      });
    }

    res.json({ insights });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
