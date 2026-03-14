const { z } = require('zod');
const ActivityMapping = require('../models/ActivityMapping');
require('../models/Activity');
require('../models/Category');

const mappingSchema = z.object({
    activityId: z.string({ required_error: 'activityId is required.' }).min(1),
    categoryId: z.string({ required_error: 'categoryId is required.' }).min(1),
    isManualOverride: z.boolean().optional(),
    overrideReason: z.string().optional(),
    confidenceScore: z.number().min(0).max(100).optional(),
});

// POST /api/activity-mappings
const createMapping = async (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, message: 'Request body is missing or not valid JSON.' });
    }

    const result = mappingSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
    }

    try {
        const mapping = new ActivityMapping(result.data);
        const saved = await mapping.save();
        const populated = await saved.populate([
            { path: 'activityId', select: 'app_name start_time end_time' },
            { path: 'categoryId', select: 'name color icon' },
        ]);
        return res.status(201).json({ success: true, data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/activity-mappings
const getAllMappings = async (req, res) => {
    try {
        const { activityId, categoryId, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (activityId) filter.activityId = activityId;
        if (categoryId) filter.categoryId = categoryId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await ActivityMapping.countDocuments(filter);
        const mappings = await ActivityMapping.find(filter)
            .populate('activityId', 'app_name start_time end_time')
            .populate('categoryId', 'name color icon')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({ success: true, total, page: parseInt(page), limit: parseInt(limit), data: mappings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/activity-mappings/:id
const getMappingById = async (req, res) => {
    try {
        const mapping = await ActivityMapping.findById(req.params.id)
            .populate('activityId', 'app_name start_time end_time')
            .populate('categoryId', 'name color icon');
        if (!mapping) return res.status(404).json({ success: false, message: 'Mapping not found.' });
        return res.status(200).json({ success: true, data: mapping });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/activity-mappings/:id
const updateMapping = async (req, res) => {
    try {
        const allowedFields = ['activityId', 'categoryId', 'isManualOverride', 'overrideReason', 'confidenceScore'];
        const updateFields = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updateFields[field] = req.body[field];
        }
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
        }

        const oldMapping = await ActivityMapping.findById(req.params.id).populate('activityId');
        
        const updated = await ActivityMapping.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { returnDocument: 'after', runValidators: true }
        ).populate('activityId', 'app_name start_time end_time')
            .populate('categoryId', 'name color icon');
        if (!updated) return res.status(404).json({ success: false, message: 'Mapping not found.' });

        const response = { success: true, data: updated };
        
        if (updateFields.isManualOverride && oldMapping && oldMapping.categoryId !== updateFields.categoryId) {
            response.suggestRule = true;
            response.suggestedPattern = updated.activityId.app_name;
            response.message = `Create rule for '${updated.activityId.app_name}'?`;
        }

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/activity-mappings/:id
const deleteMapping = async (req, res) => {
    try {
        const deleted = await ActivityMapping.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Mapping not found.' });
        return res.status(200).json({ success: true, message: 'Mapping deleted successfully.', data: deleted });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createMapping,
    getAllMappings,
    getMappingById,
    updateMapping,
    deleteMapping,
};
