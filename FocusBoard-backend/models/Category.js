import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('categories', {
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: 'bg-blue-500' },
  icon: { type: String, default: 'Tag' },
  productivityScore: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
  embedding: { type: Array, default: [] },
  embedding_model_name: { type: String, default: null },
  embedding_model_version: { type: String, default: null },
  embedding_dim: { type: Number, default: null },
  embedding_generated_at: { type: Date, default: null },
}, { timestamps: true, modelName: 'Category' });
