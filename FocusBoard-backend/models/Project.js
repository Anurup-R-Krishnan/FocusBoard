const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    _id: { type: String, default: () => require('crypto').randomUUID() },
    title: { type: String, required: true },
    members: { type: Number, default: 1 },
    progress: { type: Number, default: 0 },
    status: { type: String, enum: ['On Track', 'At Risk', 'Delayed', 'Completed'], default: 'On Track', index: true },
    due_date: { type: Date, index: true },
    user_id: { type: String, ref: 'User', required: true, index: true }
}, { timestamps: true });

projectSchema.index({ user_id: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);
