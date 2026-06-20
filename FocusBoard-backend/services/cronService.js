import User from '../models/User.js';
import WebhookEndpoint from '../models/WebhookEndpoint.js';
import { calculateBurnoutRisk } from '../controllers/advancedAnalyticsController.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

const generateSignature = (payload, secret) => {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
};

export const startCronService = () => {
    // Run every 30 minutes
    const intervalMs = 30 * 60 * 1000;
    
    logger.info(`[CronService] Initialized. Running jobs every ${intervalMs / 1000 / 60} minutes.`);
    
    setInterval(async () => {
        try {
            logger.info('[CronService] Starting scheduled Burnout Risk check for all users...');
            const users = await User.find({});
            
            for (const user of users) {
                try {
                    const endpoints = await WebhookEndpoint.find({ 
                        user_id: user._id, 
                        active: true,
                        events: { $in: ['burnout.warning', '*'] }
                    });

                    if (endpoints.length === 0) continue;

                    const analytics = await calculateBurnoutRisk(user._id);
                    if (analytics.riskLevel === 'High') {
                        logger.warn(`[CronService] User ${user._id} has High Burnout Risk. Firing webhooks.`);
                        
                        const payload = {
                            event: 'burnout.warning',
                            timestamp: new Date().toISOString(),
                            data: {
                                userId: user._id,
                                riskLevel: analytics.riskLevel,
                                contextSwitchesToday: analytics.contextSwitchesToday,
                                longestContinuousFocusMins: analytics.longestContinuousFocusMins
                            }
                        };

                        for (const endpoint of endpoints) {
                            try {
                                const signature = generateSignature(payload, endpoint.secret);
                                const response = await fetch(endpoint.url, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-FocusBoard-Signature': signature,
                                        'X-FocusBoard-Event': 'burnout.warning'
                                    },
                                    body: JSON.stringify(payload)
                                });
                                
                                logger.info(`[CronService] Webhook sent to ${endpoint.url} - Status: ${response.status}`);
                            } catch (webhookErr) {
                                logger.error(`[CronService] Failed to send webhook to ${endpoint.url}: ${webhookErr.message}`);
                            }
                        }
                    }
                } catch (userErr) {
                    logger.error(`[CronService] Error processing user ${user._id}: ${userErr.message}`);
                }
            }
        } catch (err) {
            logger.error(`[CronService] Critical error in cron loop: ${err.message}`);
        }
    }, intervalMs);
};
