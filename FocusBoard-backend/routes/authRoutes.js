const express = require('express');
const router = express.Router();
const { register, login, getMe, devLogin, updateParentalControls } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateSchema, createUserSchema, loginUserSchema, parentalControlsSchema } = require('../middleware/validation');

router.post('/register', validateSchema(createUserSchema), register);
router.post('/login', validateSchema(loginUserSchema), login);
router.get('/me', authMiddleware, getMe);
router.put('/parental-controls', authMiddleware, validateSchema(parentalControlsSchema), updateParentalControls);

// Dev-only endpoint for one-click admin login
router.post('/dev-login', devLogin);

module.exports = router;
