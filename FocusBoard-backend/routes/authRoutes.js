import express from 'express';
const router = express.Router();
import { register, login, getMe, updateProfile, deleteAccount, changePassword, updateParentalControls } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateSchema, createUserSchema, loginUserSchema, parentalControlsSchema } from '../middleware/validation.js';

router.post('/register', validateSchema(createUserSchema), register);
router.post('/login', validateSchema(loginUserSchema), login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.delete('/account', authMiddleware, deleteAccount);
router.put('/parental-controls', authMiddleware, validateSchema(parentalControlsSchema), updateParentalControls);

export default router;
