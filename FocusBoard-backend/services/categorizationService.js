import TrackingRule from '../models/TrackingRule.js';
import ProjectRule from '../models/ProjectRule.js';
import Project from '../models/Project.js';
import * as mlClient from './mlClient.js';

const MAX_PATTERN_LENGTH = 100;
const MAX_RECURSION = 10;

const isValidRegex = (pattern) => {
    if (pattern.length > MAX_PATTERN_LENGTH) return false;

    const starCount = (pattern.match(/\*/g) || []).length;
    const plusCount = (pattern.match(/\+/g) || []).length;

    if (starCount > 5 || plusCount > 5) return false;

    try {
        // Validate the wildcard-expanded regex, not the raw pattern.
        const testRegex = new RegExp(wildcardToRegex(pattern));
        return true;
    } catch {
        return false;
    }
};

const wildcardToRegex = (pattern) => {
    const sanitized = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

    return `^${sanitized}$`;
};

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

const matchByRules = async (activity) => {
    try {
        const rules = await getCachedRules();

        for (const rule of rules) {
            if (!isValidRegex(rule.pattern)) {
                continue;
            }

            let textToMatch = '';

            switch (rule.matchType) {
                case 'app_name':
                    textToMatch = activity.app_name || '';
                    break;
                case 'url':
                    textToMatch = activity.url || '';
                    break;
                case 'window_title':
                    textToMatch = activity.window_title || '';
                    break;
                default:
                    continue;
            }

            try {
                const regexPattern = wildcardToRegex(rule.pattern);
                const regex = new RegExp(regexPattern, 'i');

                if (regex.test(textToMatch)) {
                    return rule.categoryId;
                }
            } catch (e) {
                continue;
            }
        }

        return null;
    } catch (error) {
        console.error('Error in matchByRules:', error);
        return null;
    }
};

const clearRulesCache = () => {
    rulesCache = { data: null, timestamp: 0 };
};

const matchProjectByRules = async (activity, userId) => {
    try {
        const rules = await ProjectRule.find({ userId }).sort({ priority: -1 });

        for (const rule of rules) {
            if (!isValidRegex(rule.pattern)) continue;

            let textToMatch = '';
            switch (rule.matchType) {
                case 'app_name': textToMatch = activity.app_name || ''; break;
                case 'url': textToMatch = activity.url || ''; break;
                case 'window_title': textToMatch = activity.window_title || ''; break;
                default: continue;
            }

            try {
                const regexPattern = wildcardToRegex(rule.pattern);
                const regex = new RegExp(regexPattern, 'i');
                if (regex.test(textToMatch)) {
                    return rule.projectId;
                }
            } catch (e) { continue; }
        }

        // --- ML Fallback ---
        const textToMatch = `${activity.window_title || ''} ${activity.app_name || ''}`.trim();
        if (textToMatch) {
            const projects = await Project.find({ user_id: userId });
            const candidates = projects.filter(p => p.embedding && p.embedding.length > 0).map(p => ({
                id: p._id.toString(),
                embedding: p.embedding
            }));

            if (candidates.length > 0) {
                const matchId = await mlClient.findSimilar(textToMatch, candidates, 0.7);
                if (matchId) return matchId;
            }
        }

        return null;
    } catch (error) {
        console.error('Error in matchProjectByRules:', error);
        return null;
    }
};

export { matchByRules, matchProjectByRules, clearRulesCache };
