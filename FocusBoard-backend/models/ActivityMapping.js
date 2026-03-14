const mongoose = require('mongoose');

const activityMappingSchema = new mongoose.Schema({
    _id: { type: String, default: () => require('crypto').randomUUID() },
    activityId: { type: String, ref: 'Activity', required: true },
    categoryId: { type: String, ref: 'Category', required: true },
    isManualOverride: { type: Boolean, default: false },
    overrideReason: { type: String, trim: true, default: '' },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
    model_name: { type: String, default: null },
    model_version: { type: String, default: null },
    embedding_dim: { type: Number, default: null },
}, { timestamps: true });

activityMappingSchema.index({ activityId: 1 });
activityMappingSchema.index({ categoryId: 1 });

module.exports = mongoose.model('ActivityMapping', activityMappingSchema);
