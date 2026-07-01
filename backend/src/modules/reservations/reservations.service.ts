import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateReservationInput } from '../../schemas/reservations.js';

/**
 * Rezerwacja miejsc — SERCE PROJEKTU.
 *
 * Całość wykonywana w JEDNEJ transakcji Prisma. Zajętość miejsca jest
 * egzekwowana na poziomie bazy przez unikalny indeks
 * @@unique([screeningId, seatId]). Gdy dwóch użytkowników jednocześnie
 * próbuje wziąć to samo miejsce, jeden dostanie błąd P2002 → zwracamy
 * 409 Conflict z listą miejsc, które właśnie zostały zajęte.
 * To eliminuje race condition bez ręcznego blokowania.
 */
export async function createReservations(
  userId: string,
  input: CreateReservationInput
) {
  const { screeningId, seatIds } = input;

  // Seans musi istnieć.
  const screening = await prisma.screening.findUnique({
    where: { id: screeningId },
    select: { id: true, hallId: true, startsAt: true },
  });
  if (!screening) {
    throw new AppError(404, 'Seans nie istnieje');
  }

  // Nie pozwalamy rezerwować miejsc na seans, który już się rozpoczął.
  if (screening.startsAt.getTime() <= Date.now()) {
    throw new AppError(400, 'Seans już się rozpoczął — rezerwacja niemożliwa');
  }

  // Wszystkie wskazane miejsca muszą należeć do sali tego seansu.
  const seats = await prisma.seat.findMany({
    where: { id: { in: seatIds }, hallId: screening.hallId },
    select: { id: true },
  });
  if (seats.length !== seatIds.length) {
    throw new AppError(400, 'Niektóre miejsca nie należą do sali tego seansu');
  }

  try {
    // Transakcja: albo wszystkie miejsca zostaną zarezerwowane, albo żadne.
    const created = await prisma.$transaction(
      seatIds.map((seatId) =>
        prisma.reservation.create({
          data: { userId, screeningId, seatId },
          select: { id: true, seatId: true, screeningId: true, createdAt: true },
        })
      )
    );
    return created;
  } catch (err) {
    // P2002 = naruszenie unikalnego indeksu (miejsce zajęte na tym seansie).
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      // Sprawdzamy, które z żądanych miejsc są już zajęte, i zwracamy je klientowi.
      const taken = await prisma.reservation.findMany({
        where: { screeningId, seatId: { in: seatIds } },
        select: { seatId: true },
      });
      throw new AppError(
        409,
        'Wybrane miejsca zostały właśnie zajęte przez kogoś innego',
        { conflictingSeatIds: taken.map((t) => t.seatId) }
      );
    }
    throw err;
  }
}

/**
 * Rezerwacje WYŁĄCZNIE zalogowanego użytkownika.
 * Filtrujemy po userId z tokenu — ochrona przed IDOR/BOLA.
 */
export async function getMyReservations(userId: string) {
  return prisma.reservation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      seat: { select: { id: true, row: true, col: true } },
      screening: {
        select: {
          id: true,
          startsAt: true,
          price: true,
          movie: { select: { id: true, title: true, posterUrl: true } },
          hall: { select: { id: true, name: true } },
        },
      },
    },
  });
}

/**
 * Anulowanie — tylko własnej rezerwacji.
 * Kasujemy warunkiem { id, userId }: cudza rezerwacja nie zostanie usunięta
 * i zwracamy 404 (nie ujawniamy jej istnienia).
 */
export async function cancelReservation(userId: string, reservationId: string) {
  const result = await prisma.reservation.deleteMany({
    where: { id: reservationId, userId },
  });
  if (result.count === 0) {
    throw new AppError(404, 'Rezerwacja nie istnieje lub nie należy do Ciebie');
  }
}
