const { createModel } = require('../db/nedb');

module.exports = createModel('trackingrules', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  categoryId: { type: String, ref: 'Category', required: true },
  pattern: { type: String, required: true },
  matchType: { type: String, required: true },
  priority: { type: Number, default: 50 },
  isAutoLearned: { type: Boolean, default: false },
}, { timestamps: true, modelName: 'TrackingRule', indices: ['categoryId'] });
