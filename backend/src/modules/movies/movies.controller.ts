import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

/**
 * GET /api/movies — lista wszystkich filmów.
 */
export async function listMovies(_req: Request, res: Response) {
  const movies = await prisma.movie.findMany({
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      durationMin: true,
      posterUrl: true,
    },
  });
  res.json(movies);
}
