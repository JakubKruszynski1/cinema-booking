import type { Request, Response } from 'express';
import { createReservationSchema } from '../../schemas/reservations.js';
import {
  createReservations,
  getMyReservations,
  cancelReservation,
} from './reservations.service.js';

// Wszystkie handlery działają za middleware requireAuth, więc req.userId istnieje.

export async function create(req: Request, res: Response) {
  const input = createReservationSchema.parse(req.body);
  const reservations = await createReservations(req.userId!, input);
  res.status(201).json({ reservations });
}

export async function listMine(req: Request, res: Response) {
  const reservations = await getMyReservations(req.userId!);
  res.json(reservations);
}

export async function remove(req: Request, res: Response) {
  await cancelReservation(req.userId!, req.params.id);
  res.status(204).send();
}
