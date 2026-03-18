const schedule = require('node-schedule');
const axios = require('axios');
const Activity = require('../models/Activity');
const ActivityMapping = require('../models/ActivityMapping');
const Category = require('../models/Category');
const User = require('../models/User');
const TrackingRule = require('../models/TrackingRule');
const logger = require('../utils/logger');
const config = require('../config');

const ML_SERVICE_URL = config.ML_SERVICE_URL;
const CATEGORIZATION_DELAY_MS = parseInt(process.env.CATEGORIZATION_DELAY_MS || '10000', 10);
const MAX_ACTIVITIES_PER_JOB = parseInt(process.env.MAX_ACTIVITIES_PER_JOB || '100', 10);
const SIMILARITY_THRESHOLD = parseFloat(process.env.ML_SIMILARITY_THRESHOLD || '0.3');
const CATEGORIZATION_BATCH_SIZE = parseInt(process.env.CATEGORIZATION_BATCH_SIZE || '10', 10);

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

/**
 * Process a single activity: categorize it and run NSFW check.
 * Returns true if the ML service is overloaded (429) so the caller can abort the batch.
 */
const processActivity = async (activity, categories) => {
    const text = `${activity.app_name} ${activity.window_title || ''} ${activity.url || ''}`.trim();

    // Run categorization and NSFW check concurrently for this activity
    const [categorizeResult, nsfwResult] = await Promise.allSettled([
        axios.post(`${ML_SERVICE_URL}/find-similar`, {
            text,
            categories: categories.map(c => ({ _id: c._id, embedding: c.embedding })),
            threshold: SIMILARITY_THRESHOLD,
        }, { timeout: 5000 }),
        axios.post(`${ML_SERVICE_URL}/check-nsfw`, {
            url: activity.url || '',
            window_title: activity.window_title || '',
        }, { timeout: 5000 }),
    ]);

    // Handle categorize result
    if (categorizeResult.status === 'fulfilled') {
        const data = categorizeResult.value.data;
        if (data.categoryId && data.similarity >= SIMILARITY_THRESHOLD) {
            const category = categories.find(c => String(c._id) === String(data.categoryId));
            const mapping = new ActivityMapping({
                activityId: activity._id,
                categoryId: data.categoryId,
                confidenceScore: Math.round(data.similarity * 100),
                isManualOverride: false,
                model_name: data.model_name || null,
                model_version: data.model_version || null,
                embedding_dim: Number.isFinite(data.embedding_dim) ? data.embedding_dim : null,
            });
            await mapping.save();

            activity.category_id = data.categoryId;
            if (category && category.color) {
                activity.color = category.color;
            }
            await activity.save();

            logger.info(`[Background Job] Categorized ${activity.app_name} -> ${data.categoryId} (${data.similarity.toFixed(2)})`);
        }
    } else {
        const err = categorizeResult.reason;
        if (err?.response?.status === 429) {
            return 'overloaded';
        }
        logger.error(`[Background Job] Categorize failed for ${activity._id}: ${err.message}`);
    }

    // Handle NSFW result
    if (nsfwResult.status === 'fulfilled') {
        const nsfwData = nsfwResult.value.data;
        if (nsfwData.flagged && !activity.nsfw_flagged) {
            const user = await User.findById(activity.user_id);
            if (user && user.age != null) {
                const shouldAlert =
                    user.age < 16 ||
                    (user.nsfwAlertPreference && user.nsfwAlertPreference !== 'none');

                if (shouldAlert) {
                    activity.nsfw_flagged = true;
                    await activity.save();

                    const alertService = require('./alertService');
                    await alertService.sendNsfwAlert(user._id, activity, nsfwData);
                }
            }
        }
    } else {
        logger.error(`[Background Job] NSFW check failed for ${activity._id}: ${nsfwResult.reason?.message}`);
    }

    return 'ok';
};

const runCategorizationJob = async () => {
    try {
        logger.info('[Background Job] Running categorization job...');

        const delayMsAgo = new Date(Date.now() - CATEGORIZATION_DELAY_MS);

        // Get IDs of already-mapped activities directly in the DB query
        const mappedActivityIds = await ActivityMapping.find().distinct('activityId');

        const activitiesToCategorize = await Activity.find({
            start_time: { $lte: delayMsAgo },
            _id: { $nin: mappedActivityIds },
            $or: [
                { category_id: { $exists: false } },
                { category_id: null },
            ],
        }).limit(MAX_ACTIVITIES_PER_JOB);

        logger.info(`[Background Job] Found ${activitiesToCategorize.length} activities to categorize (max: ${MAX_ACTIVITIES_PER_JOB})`);

        if (activitiesToCategorize.length === 0) return;

        const categories = await Category.find({ embedding: { $exists: true, $ne: [] } });

        // Process in batches of CATEGORIZATION_BATCH_SIZE (default 10) concurrently
        let aborted = false;
        for (let i = 0; i < activitiesToCategorize.length && !aborted; i += CATEGORIZATION_BATCH_SIZE) {
            const batch = activitiesToCategorize.slice(i, i + CATEGORIZATION_BATCH_SIZE);
            const results = await Promise.allSettled(
                batch.map(activity => processActivity(activity, categories))
            );

            for (const result of results) {
                if (result.status === 'fulfilled' && result.value === 'overloaded') {
                    logger.warn('[Background Job] ML service overloaded (429). Aborting until next run.');
                    aborted = true;
                    break;
                }
            }
        }

        logger.info('[Background Job] Categorization job completed');
    } catch (error) {
        logger.error(`[Background Job] Job failed: ${error.message}`);
    }
};

const startBackgroundJobs = () => {
    schedule.scheduleJob('*/1 * * * *', runCategorizationJob);
    logger.info(`[Background Job] Scheduled to run every minute (delay: ${CATEGORIZATION_DELAY_MS}ms, max: ${MAX_ACTIVITIES_PER_JOB}, batch: ${CATEGORIZATION_BATCH_SIZE})`);
};

module.exports = { startBackgroundJobs, runCategorizationJob };
