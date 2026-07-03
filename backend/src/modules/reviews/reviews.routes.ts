import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { listForMovie, upsertForMovie, remove } from './reviews.controller.js';

// Router zagnieżdżony pod /api/movies/:movieId/reviews.
// mergeParams=true udostępnia :movieId z nadrzędnej ścieżki.
export const movieReviewsRouter = Router({ mergeParams: true });

// Odczyt recenzji publiczny; dodanie/edycja wymaga zalogowania.
movieReviewsRouter.get('/', asyncHandler(listForMovie));
movieReviewsRouter.post('/', requireAuth, asyncHandler(upsertForMovie));

// Router pod /api/reviews — usuwanie własnej recenzji.
export const reviewsRouter = Router();
reviewsRouter.delete('/:id', requireAuth, asyncHandler(remove));
