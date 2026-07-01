import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { listScreenings, getScreeningSeats } from './screenings.controller.js';

const router = Router();

// Publiczny odczyt repertuaru i mapy sali.
router.get('/', asyncHandler(listScreenings));
router.get('/:id/seats', asyncHandler(getScreeningSeats));

export default router;
