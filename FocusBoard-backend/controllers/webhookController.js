import WebhookEndpoint from '../models/WebhookEndpoint.js';

export const createEndpoint = async (req, res) => {
    try {
        const { name, url, events } = req.body;
        if (!name || !url) {
            return res.status(400).json({ success: false, message: 'Name and URL are required.' });
        }
        const endpoint = await WebhookEndpoint.create({
            user_id: req.user.id,
            name,
            url,
            events: events || ['integration.sync.*', 'integration.updated'],
        });
        return res.status(201).json({ success: true, data: endpoint });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const getEndpoints = async (req, res) => {
    try {
        const endpoints = await WebhookEndpoint.find({ user_id: req.user.id });
        return res.status(200).json({ success: true, data: endpoints });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const updateEndpoint = async (req, res) => {
    try {
        const { name, url, events, active } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (url !== undefined) updates.url = url;
        if (events !== undefined) updates.events = events;
        if (active !== undefined) updates.active = active;

        const endpoint = await WebhookEndpoint.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            { $set: updates },
        );
        if (!endpoint) return res.status(404).json({ success: false, message: 'Endpoint not found.' });
        return res.status(200).json({ success: true, data: endpoint });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteEndpoint = async (req, res) => {
    try {
        const endpoint = await WebhookEndpoint.findOneAndDelete({
            _id: req.params.id,
            user_id: req.user.id,
        });
        if (!endpoint) return res.status(404).json({ success: false, message: 'Endpoint not found.' });
        return res.status(200).json({ success: true, message: 'Endpoint deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const regenerateSecret = async (req, res) => {
    try {
        const { default: crypto } = await import('crypto');
        const secret = crypto.randomBytes(32).toString('hex');
        const endpoint = await WebhookEndpoint.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            { $set: { secret } },
        );
        if (!endpoint) return res.status(404).json({ success: false, message: 'Endpoint not found.' });
        return res.status(200).json({ success: true, data: { secret } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
