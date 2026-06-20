import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('activities', {
  _id: { type: String, default: () => crypto.randomUUID() },
  app_name: { type: String, required: true },
  window_title: { type: String, default: '' },
  url: { type: String, default: '' },
  start_time: { type: Date, required: true },
  end_time: { type: Date },
  user_id: { type: String, ref: 'User' },
  category_id: { type: String, ref: 'Category' },
  project_id: { type: String, ref: 'Project' },
  color: { type: String },
  idle: { type: Number, default: 0 },
  cpu_usage: { type: Number },
  ram_usage_mb: { type: Number },
  nsfw_flagged: { type: Boolean, default: false },
}, { timestamps: true, modelName: 'Activity', indices: [{ fieldName: 'user_id' }, { fieldName: 'start_time' }] });
