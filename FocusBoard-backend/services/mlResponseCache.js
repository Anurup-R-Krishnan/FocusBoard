'use strict';

/**
 * Response-level cache for ML service results.
 *
 * Caches /find-similar and /check-nsfw responses to avoid hitting the ML
 * service repeatedly for identical inputs (e.g. the same app name logged
 * hundreds of times per day).
 *
 * Cache key strategy:
 *   - find-similar: SHA-256 of (text + sorted category IDs) so the cache
 *     correctly invalidates when category set changes.
 *   - check-nsfw: SHA-256 of (url + window_title) — deterministic by design.
 *
 * TTL is configurable via ML_CACHE_TTL_MS (default 10 minutes).
 */
import crypto from 'crypto';
import logger from '../utils/logger.js';

const TTL_MS = parseInt(process.env.ML_CACHE_TTL_MS || String(10 * 60 * 1000), 10);
const MAX_ENTRIES = parseInt(process.env.ML_CACHE_MAX_ENTRIES || '500', 10);

// Simple LRU-style map: insertion-order eviction when MAX_ENTRIES exceeded.
const cache = new Map();

let hits = 0;
let misses = 0;

const _hash = (str) => crypto.createHash('sha256').update(str).digest('hex');

const _set = (key, value) => {
    if (cache.size >= MAX_ENTRIES) {
        // evict oldest entry
        cache.delete(cache.keys().next().value);
    }
    cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
};

const _get = (key) => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    // Move to end for LRU behaviour
    cache.delete(key);
    cache.set(key, entry);
    return entry.value;
};

/**
 * Wrap a call to /find-similar with caching.
 * @param {string} text
 * @param {Array<{_id: string}>} categories
 * @param {number} threshold
 * @param {() => Promise<object>} fetcher - async function that actually calls the ML service
 */
const findSimilarCached = async (text, categories, threshold, fetcher) => {
    const sortedIds = categories.map(c => String(c._id)).sort().join(',');
    const key = _hash(`find-similar:${text}:${sortedIds}:${threshold}`);

    const cached = _get(key);
    if (cached) {
        hits++;
        logger.debug(`[MLCache] HIT find-similar (hits=${hits}, misses=${misses})`);
        return cached;
    }

    misses++;
    const result = await fetcher();
    _set(key, result);
    return result;
};

/**
 * Wrap a call to /check-nsfw with caching.
 * @param {string} url
 * @param {string} windowTitle
 * @param {() => Promise<object>} fetcher
 */
const checkNsfwCached = async (url, windowTitle, fetcher) => {
    const key = _hash(`check-nsfw:${url}:${windowTitle}`);

    const cached = _get(key);
    if (cached) {
        hits++;
        logger.debug(`[MLCache] HIT check-nsfw (hits=${hits}, misses=${misses})`);
        return cached;
    }

    misses++;
    const result = await fetcher();
    _set(key, result);
    return result;
};

const getStats = () => ({ hits, misses, size: cache.size, maxEntries: MAX_ENTRIES, ttlMs: TTL_MS });

export { findSimilarCached, checkNsfwCached, getStats };
