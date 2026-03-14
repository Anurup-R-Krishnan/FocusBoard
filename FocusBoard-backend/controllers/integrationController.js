const Integration = require('../models/Integration');

exports.createIntegration = async (req, res) => {
    try {
        const integration = new Integration({ ...req.body, user_id: req.user.id });
        await integration.save();
        res.status(201).json({ success: true, data: integration });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getIntegrations = async (req, res) => {
    try {
        const integrations = await Integration.find({ user_id: req.user.id });
        res.status(200).json({ success: true, data: integrations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateIntegration = async (req, res) => {
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

exports.deleteIntegration = async (req, res) => {
    try {
        const integration = await Integration.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
        if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });
        res.status(200).json({ success: true, data: integration });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
