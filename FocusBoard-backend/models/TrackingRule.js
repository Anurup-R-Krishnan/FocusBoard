const mongoose = require('mongoose');

const trackingRuleSchema = new mongoose.Schema({
  _id: { type: String, default: () => require('crypto').randomUUID() },
  categoryId: { type: String, ref: 'Category', required: true },
  pattern: { type: String, required: true },
  matchType: { type: String, enum: ['app_name', 'url', 'window_title'], required: true },
  priority: { type: Number, default: 50 },
  isAutoLearned: { type: Boolean, default: false },
}, { timestamps: true });

trackingRuleSchema.index({ categoryId: 1 });
trackingRuleSchema.index({ priority: -1 });

module.exports = mongoose.model('TrackingRule', trackingRuleSchema);
