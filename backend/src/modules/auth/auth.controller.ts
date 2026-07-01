import type { Request, Response } from 'express';
import type { CookieOptions } from 'express';
import { registerSchema, loginSchema } from '../../schemas/auth.js';
import { registerUser, loginUser, refreshTokens } from './auth.service.js';
import { verifyRefreshToken } from '../../lib/jwt.js';
import { AppError } from '../../middleware/errorHandler.js';
import { isProduction } from '../../config/env.js';

const REFRESH_COOKIE = 'refreshToken';

// Refresh token w httpOnly + Secure + SameSite=Strict cookie —
// niedostępny dla JS (odporny na kradzież przez XSS), chroniony przed CSRF.
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction, // w dev (HTTP) Secure wyłączony, w prod wymagany
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dni
};

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);

  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
  res.status(201).json({ accessToken: result.accessToken, user: result.user });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);

  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
  res.json({ accessToken: result.accessToken, user: result.user });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new AppError(401, 'Brak tokenu odświeżającego');
  }

  let userId: string;
  try {
    userId = verifyRefreshToken(token).sub;
  } catch {
    throw new AppError(401, 'Token odświeżający nieprawidłowy lub wygasły');
  }

  const result = await refreshTokens(userId);
  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
  res.json({ accessToken: result.accessToken, user: result.user });
}

export async function logout(_req: Request, res: Response) {
  // Unieważnienie sesji po stronie klienta: czyścimy httpOnly cookie z refresh
  // tokenem (musi mieć te same atrybuty path/sameSite, by przeglądarka je usunęła).
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth',
  });
  res.json({ message: 'Wylogowano' });
}
