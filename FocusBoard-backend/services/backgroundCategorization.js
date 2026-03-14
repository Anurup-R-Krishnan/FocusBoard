const schedule = require('node-schedule');
const Activity = require('../models/Activity');
const ActivityMapping = require('../models/ActivityMapping');
const Category = require('../models/Category');
const User = require('../models/User');
const TrackingRule = require('../models/TrackingRule');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

const ML_SERVICE_URL = config.ML_SERVICE_URL;
const CATEGORIZATION_DELAY_MS = parseInt(process.env.CATEGORIZATION_DELAY_MS || '10000', 10);
const MAX_ACTIVITIES_PER_JOB = parseInt(process.env.MAX_ACTIVITIES_PER_JOB || '100', 10);
const SIMILARITY_THRESHOLD = parseFloat(process.env.ML_SIMILARITY_THRESHOLD || '0.3');

let rulesCache = { data: null, timestamp: 0 };
const RULES_CACHE_TTL = 60000;

const getCachedRules = async () => {
    const now = Date.now();
    if (rulesCache.data && (now - rulesCache.timestamp) < RULES_CACHE_TTL) {
        return rulesCache.data;
    }
    const rules = await TrackingRule.find().sort({ priority: -1 });
    rulesCache = { data: rules, timestamp: now };
    return rules;
};

const runCategorizationJob = async () => {
    try {
        logger.info('[Background Job] Running categorization job...');

        const delayMsAgo = new Date(Date.now() - CATEGORIZATION_DELAY_MS);
        
        const uncategorizedActivities = await Activity.find({
            start_time: { $lte: delayMsAgo },
            $or: [
                { category_id: { $exists: false } },
                { category_id: null }
            ]
        }).limit(MAX_ACTIVITIES_PER_JOB);

        const mappedActivityIds = (await ActivityMapping.find().distinct('activityId'));
        const activitiesToCategorize = uncategorizedActivities.filter(
            activity => !mappedActivityIds.includes(activity._id)
        );

        logger.info(`[Background Job] Found ${activitiesToCategorize.length} activities to categorize (max: ${MAX_ACTIVITIES_PER_JOB})`);

        const categories = await Category.find({ embedding: { $exists: true, $ne: [] } });
        
        for (const activity of activitiesToCategorize) {
            const text = `${activity.app_name} ${activity.window_title || ''} ${activity.url || ''}`.trim();
            
            try {
                const response = await axios.post(`${ML_SERVICE_URL}/find-similar`, {
                    text,
                    categories: categories.map(c => ({ _id: c._id, embedding: c.embedding })),
                    threshold: SIMILARITY_THRESHOLD
                }, { timeout: 5000 });

                if (response.data.categoryId && response.data.similarity >= SIMILARITY_THRESHOLD) {
                    const category = categories.find(c => c._id === response.data.categoryId);
                    
                    const mapping = new ActivityMapping({
                        activityId: activity._id,
                        categoryId: response.data.categoryId,
                        confidenceScore: Math.round(response.data.similarity * 100),
                        isManualOverride: false,
                        model_name: response.data.model_name || null,
                        model_version: response.data.model_version || null,
                        embedding_dim: Number.isFinite(response.data.embedding_dim)
                            ? response.data.embedding_dim
                            : null,
                    });
                    await mapping.save();
                    
                    activity.category_id = response.data.categoryId;
                    if (category && category.color) {
                        activity.color = category.color;
                    }
                    await activity.save();
                    
                    logger.info(`[Background Job] Categorized ${activity.app_name} -> ${response.data.categoryId} (${response.data.similarity.toFixed(2)})`);
                }

                const nsfwCheck = await axios.post(`${ML_SERVICE_URL}/check-nsfw`, {
                    url: activity.url || '',
                    window_title: activity.window_title || ''
                }, { timeout: 5000 });

                if (nsfwCheck.data.flagged && !activity.nsfw_flagged) {
                    const user = await User.findById(activity.user_id);
                    if (user && user.age && user.age >= 16 && user.nsfwAlertPreference === 'none') {
                    } else if (user && user.age && user.age < 16) {
                        activity.nsfw_flagged = true;
                        await activity.save();
                        
                        const alertService = require('./alertService');
                        await alertService.sendNsfwAlert(user._id, activity, nsfwCheck.data);
                    } else if (user && user.age && user.nsfwAlertPreference && user.nsfwAlertPreference !== 'none') {
                        activity.nsfw_flagged = true;
                        await activity.save();
                        
                        const alertService = require('./alertService');
                        await alertService.sendNsfwAlert(user._id, activity, nsfwCheck.data);
                    }
                }
            } catch (error) {
                if (error?.response?.status === 429) {
                    logger.warn('[Background Job] ML service overloaded (429). Backing off until next run.');
                    break;
                }
                logger.error(`[Background Job] Failed to categorize activity ${activity._id}: ${error.message}`);
            }
        }

        logger.info('[Background Job] Categorization job completed');
    } catch (error) {
        logger.error(`[Background Job] Job failed: ${error.message}`);
    }
};

const startBackgroundJobs = () => {
    schedule.scheduleJob('*/1 * * * *', runCategorizationJob);
    logger.info(`[Background Job] Scheduled to run every minute (delay: ${CATEGORIZATION_DELAY_MS}ms, max: ${MAX_ACTIVITIES_PER_JOB})`);
};

module.exports = { startBackgroundJobs, runCategorizationJob };
