import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { register, login, refresh, logout } from './auth.controller.js';

const router = Router();

// Ostrzejszy rate-limit na rejestracji i logowaniu (ochrona przed brute-force).
router.post('/register', authLimiter, asyncHandler(register));
router.post('/login', authLimiter, asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', requireAuth, asyncHandler(logout));

export default router;
