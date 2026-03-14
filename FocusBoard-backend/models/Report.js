const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  report_type: { type: String, required: true },
  start_range: { type: Date, required: true },
  end_range: { type: Date, required: true },
  file_path: { type: String },
  generated_at: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
