const { createModel } = require('../db/nedb');

module.exports = createModel('categorygoals', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  userId: { type: String, ref: 'User', required: true },
  categoryId: { type: String, ref: 'Category', required: true },
  dailyLimitMinutes: { type: Number, default: 60 },
  weeklyLimitMinutes: { type: Number, default: 300 },
  alertEnabled: { type: Boolean, default: true },
  goalType: { type: String, default: 'reduce' },
}, { timestamps: true, modelName: 'CategoryGoal', indices: [{ fieldName: 'userId' }, { fieldName: 'categoryId' }] });
