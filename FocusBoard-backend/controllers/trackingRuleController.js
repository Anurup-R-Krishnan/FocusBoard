const TrackingRule = require('../models/TrackingRule');
const Category = require('../models/Category');

exports.createRule = async (req, res) => {
  try {
    const { categoryId, pattern, matchType, priority, isAutoLearned } = req.body;
    
    if (!categoryId || !pattern || !matchType) {
      return res.status(400).json({ success: false, error: 'categoryId, pattern, and matchType are required' });
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    const rule = new TrackingRule({ categoryId, pattern, matchType, priority, isAutoLearned });
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRules = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { categoryId } : {};
    const rules = await TrackingRule.find(filter).sort({ priority: -1 }).populate('categoryId');
    res.status(200).json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRule = async (req, res) => {
  try {
    const rule = await TrackingRule.findById(req.params.id).populate('categoryId');
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }
    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const { pattern, priority, matchType } = req.body;
    const rule = await TrackingRule.findByIdAndUpdate(
      req.params.id,
      { pattern, priority, matchType },
      { returnDocument: 'after', runValidators: true }
    );
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }
    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const rule = await TrackingRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }
    res.status(200).json({ success: true, message: 'Rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createRuleFromOverride = async (req, res) => {
  try {
    const { activityId, categoryId } = req.body;
    const Activity = require('../models/Activity');
    
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    const rule = new TrackingRule({
      categoryId,
      pattern: activity.app_name,
      matchType: 'app_name',
      priority: 50,
      isAutoLearned: true
    });
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
