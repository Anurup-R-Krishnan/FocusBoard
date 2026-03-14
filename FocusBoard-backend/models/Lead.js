const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    source: { type: String, trim: true, default: 'landing_page' },
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
