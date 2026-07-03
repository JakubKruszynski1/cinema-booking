import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { UpsertReviewInput } from '../../schemas/reviews.js';

/** Sprawdza, czy film istnieje — inaczej 404. */
async function ensureMovieExists(movieId: string) {
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    select: { id: true },
  });
  if (!movie) {
    throw new AppError(404, 'Film nie istnieje');
  }
}

/**
 * Lista recenzji filmu (publiczna) wraz z policzoną średnią oceną i liczbą.
 * Autor identyfikowany przez e-mail (zgodnie z wymaganiem).
 */
export async function getMovieReviews(movieId: string) {
  await ensureMovieExists(movieId);

  const [reviews, agg] = await Promise.all([
    prisma.review.findMany({
      where: { movieId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    }),
    prisma.review.aggregate({
      where: { movieId },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  return {
    // Średnia zaokrąglona do jednego miejsca po przecinku (null, gdy brak recenzji).
    average:
      agg._avg.rating !== null ? Math.round(agg._avg.rating * 10) / 10 : null,
    count: agg._count,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      author: { id: r.user.id, email: r.user.email },
    })),
  };
}

/**
 * Dodanie lub aktualizacja recenzji zalogowanego użytkownika.
 * Dzięki @@unique([userId, movieId]) upsert gwarantuje jedną recenzję na film —
 * ponowne wysłanie nadpisuje poprzednią zamiast tworzyć duplikat.
 */
export async function upsertReview(
  userId: string,
  movieId: string,
  input: UpsertReviewInput
) {
  await ensureMovieExists(movieId);

  // Pusty komentarz zapisujemy jako null (brak komentarza).
  const comment = input.comment && input.comment.length > 0 ? input.comment : null;

  const review = await prisma.review.upsert({
    where: { userId_movieId: { userId, movieId } },
    create: { userId, movieId, rating: input.rating, comment },
    update: { rating: input.rating, comment },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, email: true } },
    },
  });

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    author: { id: review.user.id, email: review.user.email },
  };
}

/**
 * Usunięcie recenzji — wyłącznie własnej.
 * Właściciela ustalamy po userId z tokenu (nie z parametru) — ochrona przed IDOR.
 * 404 gdy recenzja nie istnieje, 403 gdy należy do kogoś innego.
 */
export async function deleteReview(userId: string, reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  });
  if (!review) {
    throw new AppError(404, 'Recenzja nie istnieje');
  }
  if (review.userId !== userId) {
    throw new AppError(403, 'Nie możesz usunąć cudzej recenzji');
  }
  await prisma.review.delete({ where: { id: reviewId } });
}
