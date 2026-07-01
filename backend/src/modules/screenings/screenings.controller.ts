import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { screeningsQuerySchema } from '../../schemas/screenings.js';

/**
 * GET /api/screenings — repertuar z opcjonalnymi filtrami (film, data).
 * Domyślnie zwraca seanse od teraz w przyszłość, posortowane rosnąco.
 */
export async function listScreenings(req: Request, res: Response) {
  const { movieId, date } = screeningsQuerySchema.parse(req.query);

  const where: Prisma.ScreeningWhereInput = {};

  if (movieId) {
    where.movieId = movieId;
  }

  if (date) {
    // Zakres całego wskazanego dnia (czas lokalny serwera).
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T00:00:00`);
    end.setDate(end.getDate() + 1);
    where.startsAt = { gte: start, lt: end };
  } else {
    // Bez filtra daty pokazujemy tylko przyszłe seanse.
    where.startsAt = { gte: new Date() };
  }

  const screenings = await prisma.screening.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      startsAt: true,
      price: true,
      movie: {
        select: { id: true, title: true, durationMin: true, posterUrl: true },
      },
      hall: { select: { id: true, name: true, rows: true, cols: true } },
    },
  });

  res.json(screenings);
}

/**
 * GET /api/screenings/:id/seats — mapa sali z informacją, które miejsca zajęte.
 * Zwraca wymiary sali oraz listę miejsc z flagą `occupied`.
 */
export async function getScreeningSeats(req: Request, res: Response) {
  const { id } = req.params;

  const screening = await prisma.screening.findUnique({
    where: { id },
    select: {
      id: true,
      startsAt: true,
      price: true,
      movie: { select: { id: true, title: true, durationMin: true } },
      hall: { select: { id: true, name: true, rows: true, cols: true } },
    },
  });

  if (!screening) {
    throw new AppError(404, 'Seans nie istnieje');
  }

  // Wszystkie fotele danej sali.
  const seats = await prisma.seat.findMany({
    where: { hallId: screening.hall.id },
    select: { id: true, row: true, col: true },
    orderBy: [{ row: 'asc' }, { col: 'asc' }],
  });

  // Miejsca już zarezerwowane na tym konkretnym seansie.
  const reserved = await prisma.reservation.findMany({
    where: { screeningId: screening.id },
    select: { seatId: true },
  });
  const reservedIds = new Set(reserved.map((r) => r.seatId));

  res.json({
    screening: {
      id: screening.id,
      startsAt: screening.startsAt,
      price: screening.price,
      movie: screening.movie,
    },
    hall: screening.hall,
    seats: seats.map((s) => ({
      id: s.id,
      row: s.row,
      col: s.col,
      occupied: reservedIds.has(s.id),
    })),
  });
}
