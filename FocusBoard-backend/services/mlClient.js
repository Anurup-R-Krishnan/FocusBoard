'use strict';

/**
 * Shared HTTP client for the ML service.
 *
 * Uses a persistent keep-alive agent so TCP connections are reused across
 * requests instead of torn down and re-established for every call. On a local
 * network (or Docker bridge) this saves 1-5 ms per request; on a live
 * deployment it also halves the number of TCP handshakes under sustained load.
 */
const http = require('http');
const https = require('https');
const axios = require('axios');
const config = require('../config');

const ML_SERVICE_URL = config.ML_SERVICE_URL;
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS || '5000', 10);

const keepAliveAgent = ML_SERVICE_URL.startsWith('https')
    ? new https.Agent({ keepAlive: true, maxSockets: 20, maxFreeSockets: 10, scheduling: 'fifo' })
    : new http.Agent({ keepAlive: true, maxSockets: 20, maxFreeSockets: 10, scheduling: 'fifo' });

const mlClient = axios.create({
    baseURL: ML_SERVICE_URL,
    timeout: ML_TIMEOUT_MS,
    httpAgent: keepAliveAgent,
    httpsAgent: keepAliveAgent,
});

module.exports = mlClient;
