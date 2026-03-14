const User = require('../models/User');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendNsfwAlert = async (userId, activity, nsfwDetails) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.age) {
      return;
    }

    if (user.age >= 16 && user.nsfwAlertPreference === 'none') {
      return;
    }

    const alertMessage = `
NSFW Content Alert

User: ${user.name}
Activity: ${activity.app_name}
Window Title: ${activity.window_title || 'N/A'}
URL: ${activity.url || 'N/A'}
Reason: ${nsfwDetails.reason}
Confidence: ${(nsfwDetails.confidence * 100).toFixed(0)}%
Time: ${new Date().toISOString()}
    `.trim();

    if (user.nsfwAlertPreference === 'email' || user.nsfwAlertPreference === 'both') {
      if (user.parentEmail && process.env.SMTP_USER) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || 'FocusBoard <noreply@focusboard.app>',
            to: user.parentEmail,
            subject: '⚠️ NSFW Content Alert - FocusBoard',
            html: `
              <h2>NSFW Content Detected</h2>
              <p>The following activity was flagged as potentially inappropriate:</p>
              <ul>
                <li><strong>User:</strong> ${user.name}</li>
                <li><strong>Time:</strong> ${new Date(activity.start_time).toLocaleString()}</li>
                <li><strong>Application:</strong> ${activity.app_name}</li>
                <li><strong>Window Title:</strong> ${activity.window_title || 'N/A'}</li>
                <li><strong>URL:</strong> ${activity.url || 'N/A'}</li>
                <li><strong>Reason:</strong> ${nsfwDetails.reason}</li>
                <li><strong>Confidence:</strong> ${(nsfwDetails.confidence * 100).toFixed(0)}%</li>
              </ul>
              <p>This alert was generated automatically by FocusBoard's content monitoring system.</p>
            `,
          });
          logger.info(`[Alert Service] Email sent to ${user.parentEmail}`);
        } catch (error) {
          logger.error(`[Alert Service] Failed to send email: ${error.message}`);
        }
      } else {
        logger.warn(`[Alert Service] Email alert skipped (SMTP not configured or no parent email)`);
      }
    }

    if (user.nsfwAlertPreference === 'in_app' || user.nsfwAlertPreference === 'both') {
      logger.info(`[Alert Service] In-app notification for user ${user._id}: ${alertMessage}`);
    }

    logger.info(`[Alert Service] NSFW alert sent for activity ${activity._id}`);
  } catch (error) {
    logger.error(`[Alert Service] Failed to send NSFW alert: ${error.message}`);
  }
};

module.exports = { sendNsfwAlert };
