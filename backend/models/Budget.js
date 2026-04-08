const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  month: { type: Number, required: true }, // 0-11
  year: { type: Number, required: true },
  alertSent: { type: Boolean, default: false }
}, { timestamps: true });

budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
