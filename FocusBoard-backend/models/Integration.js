const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
    _id: { type: String, default: () => require('crypto').randomUUID() },
    name: { type: String, required: true },
    category: { type: String, required: true },
    connected: { type: Boolean, default: false },
    syncStatus: { type: String, enum: ['Synced', 'Syncing', 'Error', 'Pending'], default: 'Pending' },
    lastSync: { type: Date },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    user_id: { type: String, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Integration', integrationSchema);
