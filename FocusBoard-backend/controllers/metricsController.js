const Activity = require('../models/Activity');
const Category = require('../models/Category');

const METRICS_CACHE_TTL_MS = 30000;
const metricsCache = new Map();

const getCacheKey = (userId, timezone, type) => `${userId}:${timezone}:${type}`;

const getCachedMetrics = (key) => {
    const cached = metricsCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < METRICS_CACHE_TTL_MS) {
        return cached.data;
    }
    return null;
};

const setCachedMetrics = (key, data) => {
    metricsCache.set(key, { data, timestamp: Date.now() });
};

const getStartOfDay = (timezone = 'UTC') => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type)?.value || '0';
    
    return new Date(Date.UTC(
        parseInt(getPart('year')),
        parseInt(getPart('month')) - 1,
        parseInt(getPart('day')),
        0, 0, 0
    ));
};

const isValidISODate = (dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
};

const DEFAULT_DURATION_MS = 30000;

const getActivityDuration = (activity) => {
    if (!activity.start_time) return DEFAULT_DURATION_MS;
    
    const start = new Date(activity.start_time).getTime();
    
    if (activity.end_time) {
        const end = new Date(activity.end_time).getTime();
        return Math.max(0, end - start);
    }
    
    return DEFAULT_DURATION_MS;
};

exports.getDashboardMetrics = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated.' });
        }

        const timezone = req.query.timezone || 'UTC';
        const cacheKey = getCacheKey(userId, timezone, 'dashboard');
        
        if (req.query.noCache !== 'true') {
            const cached = getCachedMetrics(cacheKey);
            if (cached) {
                return res.status(200).json({ success: true, data: cached, cached: true });
            }
        }

        const startOfToday = getStartOfDay(timezone);

        const activitiesToday = await Activity.find({
            user_id: userId,
            start_time: { $gte: startOfToday },
            idle: { $ne: 1, $ne: true }
        }).populate('category_id', 'productivityScore name');

        let totalFocusMs = 0;
        let totalDistractedMs = 0;

        activitiesToday.forEach(act => {
            const durationMs = getActivityDuration(act);
            const score = act.category_id?.productivityScore ?? 0;

            if (score >= 0) {
                totalFocusMs += durationMs;
            } else {
                totalDistractedMs += durationMs;
            }
        });

        const totalMs = totalFocusMs + totalDistractedMs;
        let focusScore = 0;
        
        if (totalMs > 0) {
            focusScore = Math.round((totalFocusMs / totalMs) * 100);
        }

        const metrics = {
            focusScore,
            deepWorkMinutes: Math.floor(totalFocusMs / 60000),
            distractedMinutes: Math.floor(totalDistractedMs / 60000),
            totalActivities: activitiesToday.length,
            hasData: activitiesToday.length > 0
        };

        setCachedMetrics(cacheKey, metrics);
        res.status(200).json({ success: true, data: metrics });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTimeline = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated.' });
        }
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ success: false, message: 'start and end dates are required' });
        }

        if (!isValidISODate(start) || !isValidISODate(end)) {
            return res.status(400).json({ success: false, message: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (startDate > endDate) {
            return res.status(400).json({ success: false, message: 'start date must be before end date' });
        }

        const activities = await Activity.find({
            user_id: userId,
            start_time: { $gte: startDate, $lte: endDate }
        })
            .populate('category_id', 'productivityScore name')
            .sort({ start_time: 1 });

        const timelineBlocks = activities.map(act => {
            const durationMs = getActivityDuration(act);
            const durationSeconds = Math.max(1, Math.round(durationMs / 1000));
            
            return {
                id: act._id,
                title: act.window_title || act.app_name,
                app_name: act.app_name,
                window_title: act.window_title,
                url: act.url,
                startTime: act.start_time,
                endTime: act.end_time || new Date(new Date(act.start_time).getTime() + durationMs),
                category: act.category_id?.name || 'Uncategorized',
                category_id: act.category_id?._id,
                duration: durationSeconds,
                idle: act.idle,
                type: (act.category_id?.productivityScore ?? 0) >= 0 ? 'focus' : 'distraction'
            };
        });

        res.status(200).json({ success: true, data: timelineBlocks });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getActivitySummary = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated.' });
        }

        const { start, end, groupBy = 'day' } = req.query;

        if (!start || !end) {
            return res.status(400).json({ success: false, message: 'start and end dates are required' });
        }

        if (!isValidISODate(start) || !isValidISODate(end)) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        const activities = await Activity.find({
            user_id: userId,
            start_time: { $gte: startDate, $lte: endDate }
        })
            .populate('category_id', 'productivityScore name')
            .sort({ start_time: 1 });

        const summary = {};
        
        activities.forEach(act => {
            let key;
            const actDate = new Date(act.start_time);
            
            if (groupBy === 'hour') {
                key = actDate.toISOString().slice(0, 13) + ':00:00Z';
            } else if (groupBy === 'week') {
                const weekStart = new Date(actDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                key = weekStart.toISOString().slice(0, 10);
            } else {
                key = actDate.toISOString().slice(0, 10);
            }

            if (!summary[key]) {
                summary[key] = {
                    date: key,
                    focusMinutes: 0,
                    distractedMinutes: 0,
                    activityCount: 0,
                    topApps: {}
                };
            }

            const durationMs = getActivityDuration(act);
            const durationMinutes = Math.round(durationMs / 60000);
            const score = act.category_id?.productivityScore ?? 0;

            if (score >= 0) {
                summary[key].focusMinutes += durationMinutes;
            } else {
                summary[key].distractedMinutes += durationMinutes;
            }

            summary[key].activityCount++;
            
            const appName = act.app_name || 'Unknown';
            summary[key].topApps[appName] = (summary[key].topApps[appName] || 0) + durationMinutes;
        });

        const result = Object.values(summary).map(day => {
            const topApps = Object.entries(day.topApps)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([app, minutes]) => ({ app, minutes }));
            
            return { ...day, topApps };
        });

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTrends = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated.' });
        }

        const { period = 'week' } = req.query;
        const now = new Date();
        const daysBack = period === 'month' ? 30 : 7;
        const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

        const activities = await Activity.find({
            user_id: userId,
            start_time: { $gte: startDate },
            idle: { $ne: 1, $ne: true }
        }).populate('category_id', 'productivityScore name');

        const dailyStats = {};
        
        for (let i = 0; i < daysBack; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = date.toISOString().slice(0, 10);
            dailyStats[key] = { date: key, focusMinutes: 0, distractedMinutes: 0, activities: 0 };
        }

        activities.forEach(act => {
            const key = new Date(act.start_time).toISOString().slice(0, 10);
            if (!dailyStats[key]) return;
            
            const durationMs = getActivityDuration(act);
            const minutes = Math.round(durationMs / 60000);
            const score = act.category_id?.productivityScore ?? 0;

            if (score >= 0) {
                dailyStats[key].focusMinutes += minutes;
            } else {
                dailyStats[key].distractedMinutes += minutes;
            }
            dailyStats[key].activities++;
        });

        const data = Object.values(dailyStats).reverse();
        const avgFocus = data.reduce((sum, d) => sum + d.focusMinutes, 0) / daysBack;
        const avgDistracted = data.reduce((sum, d) => sum + d.distractedMinutes, 0) / daysBack;

        res.status(200).json({ 
            success: true, 
            data,
            summary: {
                averageFocusMinutes: Math.round(avgFocus),
                averageDistractedMinutes: Math.round(avgDistracted),
                trend: avgFocus > avgDistracted ? 'positive' : 'needs_improvement'
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCategoryBreakdown = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated.' });
        }

        const { start, end } = req.query;
        const filter = { user_id: userId, idle: { $ne: 1, $ne: true } };
        
        if (start && end) {
            filter.start_time = { $gte: new Date(start), $lte: new Date(end) };
        }

        const activities = await Activity.find(filter).populate('category_id', 'name color productivityScore');

        const categoryStats = {};

        activities.forEach(act => {
            const cat = act.category_id;
            const catName = cat?.name || 'Uncategorized';
            const durationMs = getActivityDuration(act);
            const minutes = Math.round(durationMs / 60000);

            if (!categoryStats[catName]) {
                categoryStats[catName] = {
                    name: catName,
                    color: cat?.color || '#6B7280',
                    productivityScore: cat?.productivityScore ?? 0,
                    totalMinutes: 0,
                    activityCount: 0,
                };
            }
            categoryStats[catName].totalMinutes += minutes;
            categoryStats[catName].activityCount++;
        });

        const result = Object.values(categoryStats)
            .sort((a, b) => b.totalMinutes - a.totalMinutes);

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
