const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    _id: { type: String, default: () => require('crypto').randomUUID() },
    title: { type: String, required: true },
    project: { type: String },
    client: { type: String },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO', index: true },
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM', index: true },
    timeSpent: { type: Number, default: 0 },
    billable: { type: Boolean, default: true },
    archived: { type: Boolean, default: false, index: true },
    notes: { type: String, default: '' },
    dueDate: { type: Date, index: true },
    user_id: { type: String, ref: 'User', required: true, index: true }
}, { timestamps: true });

taskSchema.index({ user_id: 1, status: 1 });
taskSchema.index({ user_id: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
