const Category = require('../models/Category');
const Activity = require('../models/Activity');
const ActivityMapping = require('../models/ActivityMapping');
const mlClient = require('../services/mlClient');

exports.generateEmbeddings = async (req, res) => {
    try {
        const categories = await Category.find({});
        
        const results = {
            total: categories.length,
            success: 0,
            failed: 0,
            errors: []
        };

        for (const category of categories) {
            try {
                const text = `${category.name} ${category.description || ''}`.trim();
                
                const response = await mlClient.post('/embed',
                    { text },
                    { timeout: 10000 }
                );

                if (response.data && response.data.embedding) {
                    const update = { embedding: response.data.embedding, embedding_generated_at: new Date() };
                    if (typeof response.data.model_name === 'string') update.embedding_model_name = response.data.model_name;
                    if (typeof response.data.model_version === 'string') update.embedding_model_version = response.data.model_version;
                    if (Number.isFinite(response.data.embedding_dim)) update.embedding_dim = response.data.embedding_dim;
                    await Category.updateOne({ _id: category._id }, { $set: update });
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push({ id: category._id, name: category.name, error: 'No embedding returned' });
                }
            } catch (error) {
                results.failed++;
                results.errors.push({ id: category._id, name: category.name, error: error.message });
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: `Generated embeddings for ${results.success} categories`,
            data: results
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.regenerateEmbedding = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const text = `${category.name} ${category.description || ''}`.trim();
        
        const response = await mlClient.post('/embed',
            { text },
            { timeout: 10000 }
        );

        if (!response.data || !response.data.embedding) {
            return res.status(500).json({ success: false, message: 'Failed to generate embedding' });
        }

        const update = { embedding: response.data.embedding, embedding_generated_at: new Date() };
        if (typeof response.data.model_name === 'string') update.embedding_model_name = response.data.model_name;
        if (typeof response.data.model_version === 'string') update.embedding_model_version = response.data.model_version;
        if (Number.isFinite(response.data.embedding_dim)) update.embedding_dim = response.data.embedding_dim;
        await Category.updateOne({ _id: category._id }, { $set: update });
        Object.assign(category, update);

        return res.status(200).json({ 
            success: true, 
            message: 'Embedding regenerated successfully',
            data: category
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.recategorizeAllActivities = async (req, res) => {
    try {
        const categories = await Category.find({ embedding: { $exists: true, $ne: [] } });
        
        if (categories.length === 0) {
            return res.status(400).json({ success: false, message: 'No categories with embeddings found' });
        }

        const activities = await Activity.find({
            $or: [
                { category_id: { $exists: false } },
                { category_id: null }
            ]
        }).limit(1000);

        let recategorized = 0;
        
        for (const activity of activities) {
            try {
                const text = `${activity.app_name} ${activity.window_title || ''} ${activity.url || ''}`.trim();
                
                const response = await mlClient.post('/find-similar', {
                    text,
                    categories: categories.map(c => ({ _id: c._id, embedding: c.embedding })),
                    threshold: 0.3
                }, { timeout: 5000 });

                if (response.data && response.data.categoryId) {
                    const category = categories.find(c => c._id === response.data.categoryId);
                    
                    const activityUpdate = {
                        category_id: response.data.categoryId,
                    };
                    if (category && category.color) {
                        activityUpdate.color = category.color;
                    }
                    await Activity.updateOne({ _id: activity._id }, { $set: activityUpdate });
                    
                        await ActivityMapping.findOneAndUpdate(
                            { activityId: activity._id },
                            { 
                                activityId: activity._id,
                                categoryId: response.data.categoryId,
                                confidenceScore: Math.round(response.data.similarity * 100),
                                isManualOverride: false,
                                model_name: response.data.model_name || null,
                                model_version: response.data.model_version || null,
                                embedding_dim: Number.isFinite(response.data.embedding_dim)
                                    ? response.data.embedding_dim
                                    : null
                            },
                            { upsert: true }
                        );
                    
                    recategorized++;
                }
            } catch (e) {
                // Continue with next activity
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: `Recategorized ${recategorized} activities`,
            data: { recategorized, total: activities.length }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
