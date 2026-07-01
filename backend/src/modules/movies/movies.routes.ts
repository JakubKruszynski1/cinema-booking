import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { listMovies } from './movies.controller.js';

const router = Router();

// Publiczny odczyt listy filmów.
router.get('/', asyncHandler(listMovies));

export default router;
