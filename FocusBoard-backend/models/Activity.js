const { createModel } = require('../db/nedb');

module.exports = createModel('activities', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  app_name: { type: String, required: true },
  window_title: { type: String, default: '' },
  url: { type: String, default: '' },
  start_time: { type: Date, required: true },
  end_time: { type: Date },
  user_id: { type: String, ref: 'User' },
  category_id: { type: String, ref: 'Category' },
  color: { type: String },
  idle: { type: Number, default: 0 },
  nsfw_flagged: { type: Boolean, default: false },
}, { timestamps: true, modelName: 'Activity', indices: [{ fieldName: 'user_id' }, { fieldName: 'start_time' }] });
