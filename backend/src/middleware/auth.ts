import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware uwierzytelniania.
 * Wymaga nagłówka `Authorization: Bearer <accessToken>`.
 * Po pomyślnej weryfikacji ustawia `req.userId` (źródło prawdy o tożsamości —
 * używane m.in. do ochrony przed IDOR/BOLA, NIGDY nie ufamy id z parametrów).
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Brak lub nieprawidłowy token uwierzytelniający');
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    // Nie ujawniamy, czy token wygasł, czy jest błędny.
    throw new AppError(401, 'Token nieprawidłowy lub wygasły');
  }
}
