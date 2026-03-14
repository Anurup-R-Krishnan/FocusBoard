const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  _id: { type: String, default: () => require('crypto').randomUUID() },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  color: { type: String, default: 'bg-blue-500' },
  icon: { type: String, default: 'Tag' },
  productivityScore: { type: Number, min: -5, max: 5, default: 0 },
  isDefault: { type: Boolean, default: false },
  embedding: { type: [Number], default: [] },
  embedding_model_name: { type: String, default: null },
  embedding_model_version: { type: String, default: null },
  embedding_dim: { type: Number, default: null },
  embedding_generated_at: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
