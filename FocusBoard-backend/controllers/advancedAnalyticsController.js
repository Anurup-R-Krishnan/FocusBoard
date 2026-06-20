import Activity from '../models/Activity.js';
import { getUserIdFromRequest } from '../utils/authUtils.js';

const getOptimalFlow = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activities = await Activity.find({
            user_id: userId,
            start_time: { $gte: thirtyDaysAgo }
        });

        // Group deep work (non-idle, non-distracting) by hour of day
        const hourlyDistribution = Array(24).fill(0);
        activities.forEach(act => {
            if (act.app_name === 'Idle' || !act.end_time) return;
            const hour = new Date(act.start_time).getHours();
            const durationSecs = (new Date(act.end_time) - new Date(act.start_time)) / 1000;
            // Assuming categories are mapped, we would filter by 'Development'/'Design' here, but for now we take all active time
            hourlyDistribution[hour] += durationSecs;
        });

        const bestHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));

        res.status(200).json({
            success: true,
            data: {
                optimalHour: bestHour,
                hourlyDistribution
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getBurnoutRisk = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

        const { riskLevel, contextSwitchesToday, longestContinuousFocusMins } = await calculateBurnoutRisk(userId);

        res.status(200).json({
            success: true,
            data: {
                riskLevel,
                contextSwitchesToday: contextSwitches,
                longestContinuousFocusMins: Math.floor(maxContinuousFocusSecs / 60)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const calculateBurnoutRisk = async (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysActivities = await Activity.find({
        user_id: userId,
        start_time: { $gte: today }
    }).sort({ start_time: 1 });

    let contextSwitches = 0;
    let maxContinuousFocusSecs = 0;
    let currentContinuousSecs = 0;
    let lastApp = null;

    for (const act of todaysActivities) {
        if (act.app_name !== lastApp && lastApp !== null) {
            contextSwitches++;
        }
        lastApp = act.app_name;

        if (act.end_time) {
            const duration = (new Date(act.end_time) - new Date(act.start_time)) / 1000;
            if (act.app_name !== 'Idle') {
                currentContinuousSecs += duration;
            } else {
                if (currentContinuousSecs > maxContinuousFocusSecs) {
                    maxContinuousFocusSecs = currentContinuousSecs;
                }
                currentContinuousSecs = 0;
            }
        }
    }
    if (currentContinuousSecs > maxContinuousFocusSecs) {
        maxContinuousFocusSecs = currentContinuousSecs;
    }

    let riskLevel = 'Low';
    if (contextSwitches > 100 || maxContinuousFocusSecs > 7200) {
        riskLevel = 'High';
    } else if (contextSwitches > 50 || maxContinuousFocusSecs > 3600) {
        riskLevel = 'Medium';
    }

    return {
        riskLevel,
        contextSwitchesToday: contextSwitches,
        longestContinuousFocusMins: Math.floor(maxContinuousFocusSecs / 60)
    };
};

export { getOptimalFlow, getBurnoutRisk };
