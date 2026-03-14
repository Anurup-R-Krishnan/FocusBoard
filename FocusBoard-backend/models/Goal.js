const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  _id: { type: String, default: () => require('crypto').randomUUID() },
  title: { type: String, required: true },
  target_deep_work: { type: Number, required: true },
  distraction_limit: { type: Number, required: true },
  priority_tasks: [{ type: String }],
  notes: { type: String },
  date: { type: Date, required: true },
  user_id: { type: String, ref: 'User', index: true },
  achieved: { type: Boolean, default: false },
}, { timestamps: true });

goalSchema.index({ user_id: 1, date: -1 });
goalSchema.index({ date: -1 });

module.exports = mongoose.model('Goal', goalSchema);
