const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, deleteAccount, changePassword, updateParentalControls } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateSchema, createUserSchema, loginUserSchema, parentalControlsSchema } = require('../middleware/validation');

router.post('/register', validateSchema(createUserSchema), register);
router.post('/login', validateSchema(loginUserSchema), login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.delete('/account', authMiddleware, deleteAccount);
router.put('/parental-controls', authMiddleware, validateSchema(parentalControlsSchema), updateParentalControls);

module.exports = router;
