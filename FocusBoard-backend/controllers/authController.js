const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

const isDevLoginEnabled = () => process.env.ENABLE_DEV_LOGIN === 'true';

const generateToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email_id }, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN,
    });
};

// POST /api/auth/register
const register = async (req, res) => {
    try {
        // Check for existing user
        const existing = await User.findOne({ email_id: req.body.email_id });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const user = new User(req.body);
        await user.save();

        const token = generateToken(user);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: {
                token,
                user: { id: user._id, name: user.name, email_id: user.email_id },
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const user = await User.findOne({ email_id: req.body.email_id });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            data: {
                token,
                user: { id: user._id, name: user.name, email_id: user.email_id },
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        // Bypass DB lookup for the offline dev admin user only when explicitly enabled
        if (isDevLoginEnabled() && req.user.id === 'dev_admin_offline_id_12345') {
            return res.status(200).json({
                success: true,
                data: {
                    id: 'dev_admin_offline_id_12345',
                    name: 'Admin Tester',
                    email_id: 'admin@focusboard.dev',
                    age: null,
                    parentEmail: null,
                    nsfwAlertPreference: 'none'
                },
            });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email_id: user.email_id,
                age: user.age,
                parentEmail: user.parentEmail,
                nsfwAlertPreference: user.nsfwAlertPreference
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/auth/dev-login (Permanent test admin, restricted in prod)
const devLogin = async (req, res) => {
    if (process.env.NODE_ENV === 'production' || !isDevLoginEnabled()) {
        return res.status(403).json({ success: false, message: 'Dev login is disabled.' });
    }

    try {
        const adminEmail = 'admin@focusboard.dev';

        // Bypass MongoDB completely for dev-login so it works without a DB
        const mockUser = {
            _id: 'dev_admin_offline_id_12345',
            name: 'Admin Tester',
            email_id: adminEmail,
        };

        const token = generateToken(mockUser);

        return res.status(200).json({
            success: true,
            data: {
                token,
                user: { id: mockUser._id, name: mockUser.name, email_id: mockUser.email_id },
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/auth/parental-controls
const updateParentalControls = async (req, res) => {
    try {
        const { age, parentEmail, nsfwAlertPreference } = req.body;

        const updateFields = {};
        if (age !== undefined) updateFields.age = age;
        if (parentEmail !== undefined) updateFields.parentEmail = parentEmail;
        if (nsfwAlertPreference !== undefined) updateFields.nsfwAlertPreference = nsfwAlertPreference;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login, getMe, devLogin, updateParentalControls };
