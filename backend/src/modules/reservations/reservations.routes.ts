import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { create, listMine, remove } from './reservations.controller.js';

const router = Router();

// Wszystkie operacje na rezerwacjach wymagają zalogowania.
router.use(requireAuth);

router.post('/', asyncHandler(create));
router.get('/me', asyncHandler(listMine));
router.delete('/:id', asyncHandler(remove));

export default router;
