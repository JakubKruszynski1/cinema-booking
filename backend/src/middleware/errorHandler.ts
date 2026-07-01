import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Klasa błędu aplikacyjnego — pozwala kontrolerom rzucać błędy z konkretnym
 * kodem HTTP i bezpiecznym komunikatem dla klienta.
 */
export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Centralny handler błędów.
 * Klientowi zwracamy ogólny komunikat i kod — NIGDY stack trace ani szczegółów
 * bazy danych. Pełny błąd logujemy wyłącznie po stronie serwera.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  // Błędy walidacji Zod -> 400 z listą pól (bez wrażliwych danych).
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Nieprawidłowe dane wejściowe',
      details: err.flatten().fieldErrors,
    });
  }

  // Zamierzone błędy aplikacyjne.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Wszystko inne = błąd nieoczekiwany. Logujemy szczegóły tylko na serwerze.
  console.error('💥 Nieobsłużony błąd:', err);
  return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
}

/**
 * Handler dla nieznanych tras (404).
 */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Nie znaleziono zasobu' });
}
