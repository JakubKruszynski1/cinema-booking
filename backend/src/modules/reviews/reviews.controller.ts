import type { Request, Response } from 'express';
import { upsertReviewSchema } from '../../schemas/reviews.js';
import { getMovieReviews, upsertReview, deleteReview } from './reviews.service.js';

/**
 * GET /api/movies/:movieId/reviews — publiczne: lista recenzji + średnia + liczba.
 */
export async function listForMovie(req: Request, res: Response) {
  const data = await getMovieReviews(req.params.movieId);
  res.json(data);
}

/**
 * POST /api/movies/:movieId/reviews — wymaga zalogowania.
 * Tworzy lub aktualizuje recenzję bieżącego użytkownika (upsert).
 */
export async function upsertForMovie(req: Request, res: Response) {
  const input = upsertReviewSchema.parse(req.body);
  const review = await upsertReview(req.userId!, req.params.movieId, input);
  res.status(201).json(review);
}

/**
 * DELETE /api/reviews/:id — wymaga zalogowania; tylko własna recenzja.
 */
export async function remove(req: Request, res: Response) {
  await deleteReview(req.userId!, req.params.id);
  res.status(204).send();
}
