import ProjectRule from '../models/ProjectRule.js';
import { getUserIdFromRequest } from '../utils/authUtils.js';

const getRules = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const rules = await ProjectRule.find({ userId }).sort({ priority: -1 });
    res.status(200).json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRule = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const { projectId, pattern, matchType, priority } = req.body;
    if (!projectId || !pattern || !matchType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const rule = await ProjectRule.create({
      projectId,
      pattern,
      matchType,
      priority: priority || 50,
      userId
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRule = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const deleted = await ProjectRule.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Rule not found' });

    res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getRules, createRule, deleteRule };
