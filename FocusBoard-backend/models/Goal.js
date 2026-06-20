import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('goals', {
  _id: { type: String, default: () => crypto.randomUUID() },
  title: { type: String, required: true },
  target_deep_work: { type: Number, required: true },
  distraction_limit: { type: Number, required: true },
  priority_tasks: { type: Array, default: [] },
  notes: { type: String },
  date: { type: Date, required: true },
  user_id: { type: String, ref: 'User' },
  achieved: { type: Boolean, default: false },
}, { timestamps: true, modelName: 'Goal', indices: ['user_id', 'date'] });
