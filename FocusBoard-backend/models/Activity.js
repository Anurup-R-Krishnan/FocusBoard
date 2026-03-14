const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  _id: { type: String, default: () => require('crypto').randomUUID() },
  app_name: { type: String, required: true },
  window_title: { type: String, default: '' },
  url: { type: String, default: '' },
  start_time: { type: Date, required: true },
  end_time: { type: Date },
  user_id: { type: String, ref: 'User', index: true },
  category_id: {
    type: String,
    ref: 'Category',
  },
  color: { type: String },
  idle: { type: Number, default: 0 },
  nsfw_flagged: { type: Boolean, default: false },
}, { timestamps: true });

activitySchema.index({ user_id: 1, start_time: -1 });

module.exports = mongoose.model('Activity', activitySchema);
