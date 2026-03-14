const mongoose = require('mongoose');

const categoryGoalSchema = new mongoose.Schema({
    _id: { type: String, default: () => require('crypto').randomUUID() },
    userId: { type: String, ref: 'User', required: true },
    categoryId: { type: String, ref: 'Category', required: true },
    dailyLimitMinutes: { type: Number, min: 0, default: 60 },
    weeklyLimitMinutes: { type: Number, min: 0, default: 300 },
    alertEnabled: { type: Boolean, default: true },
    goalType: { type: String, enum: ['reduce', 'increase'], default: 'reduce' },
}, { timestamps: true });

categoryGoalSchema.index({ userId: 1, categoryId: 1 });

module.exports = mongoose.model('CategoryGoal', categoryGoalSchema);
