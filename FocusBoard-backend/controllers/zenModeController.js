import fs from 'fs';
import path from 'path';
import os from 'os';
import { getUserIdFromRequest } from '../utils/authUtils.js';

const getConfigPath = () => {
    const configDir = path.join(os.homedir(), '.config', 'focusboard');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    return path.join(configDir, 'zen_mode.json');
};

const getZenModeStatus = (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

        const configPath = getConfigPath();
        if (fs.existsSync(configPath)) {
            const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            res.status(200).json({ success: true, data });
        } else {
            res.status(200).json({ success: true, data: { active: false, blockedApps: [] } });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleZenMode = (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

        const { active, blockedApps } = req.body;
        const configPath = getConfigPath();
        
        let currentConfig = { active: false, blockedApps: [] };
        if (fs.existsSync(configPath)) {
            currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        const newConfig = {
            active: active !== undefined ? active : currentConfig.active,
            blockedApps: blockedApps !== undefined ? blockedApps : currentConfig.blockedApps
        };

        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');

        res.status(200).json({ success: true, data: newConfig });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export { getZenModeStatus, toggleZenMode };
