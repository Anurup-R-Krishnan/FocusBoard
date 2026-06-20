import Integration from '../models/Integration.js';

export const createIntegration = async (req, res) => {
    try {
        const integration = await Integration.create({ ...req.body, user_id: req.user.id });
        res.status(201).json({ success: true, data: integration });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const getIntegrations = async (req, res) => {
    try {
        const integrations = await Integration.find({ user_id: req.user.id });
        res.status(200).json({ success: true, data: integrations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateIntegration = async (req, res) => {
    try {
        const integration = await Integration.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });
        res.status(200).json({ success: true, data: integration });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const deleteIntegration = async (req, res) => {
    try {
        const integration = await Integration.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
        if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });
        res.status(200).json({ success: true, data: integration });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
