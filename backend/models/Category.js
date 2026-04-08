const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = predefined
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '💰' },
  color: { type: String, default: '#6366f1' },
  type: { type: String, enum: ['income', 'expense', 'both'], default: 'both' },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
