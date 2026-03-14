module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'focusboard_dev_secret_change_me',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    MONGODB_URL: process.env.MONGODB_URL,
    ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:5001',
    PORT: process.env.PORT || 5000,
    DEFAULT_ACTIVITY_COLOR: process.env.DEFAULT_ACTIVITY_COLOR || '#3B82F6',
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? '1500' : '5000'), 10),
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost:4173,http://localhost:1420,http://localhost:1421,tauri://localhost,https://tauri.localhost')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    TRUST_PROXY: process.env.TRUST_PROXY === 'true',
    ENFORCE_HTTPS: process.env.ENFORCE_HTTPS === 'true' || process.env.NODE_ENV === 'production',
};
