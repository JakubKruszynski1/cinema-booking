import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import moviesRoutes from './modules/movies/movies.routes.js';
import screeningsRoutes from './modules/screenings/screenings.routes.js';

const app = express();

// Za reverse-proxy (np. w produkcji) — poprawne IP klienta dla rate-limitera.
app.set('trust proxy', 1);

// ---- Middleware bezpieczeństwa i parsowania ----

// Helmet: zestaw bezpiecznych nagłówków HTTP (CSP, X-Frame-Options, itd.).
app.use(helmet());

// CORS: whitelist wyłącznie origin frontendu (nigdy "*"),
// credentials=true dla cookie z refresh tokenem.
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Globalny rate limiting.
app.use(globalLimiter);

// ---- Trasy ----

// Health-check — przydatny dla docker-compose i diagnostyki.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Moduły API.
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/screenings', screeningsRoutes);
// reservations zostanie zamontowany w kolejnym kroku.

// ---- Obsługa błędów (na końcu) ----
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 Backend nasłuchuje na porcie ${env.PORT} (${env.NODE_ENV})`);
  console.log(`   CORS origin: ${env.CORS_ORIGIN}`);
});
