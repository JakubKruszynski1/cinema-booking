import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// W kontenerze zmienne wstrzykuje docker-compose (process.env ma pierwszeństwo).
// Lokalnie (npm run dev z katalogu backend/) wczytujemy .env z katalogu backendu,
// a jako fallback .env z katalogu głównego repozytorium.
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config(); // backend/.env, jeśli istnieje
dotenv.config({ path: resolve(__dirname, '../../../.env') }); // <repo>/.env

/**
 * Walidacja zmiennych środowiskowych przy starcie aplikacji.
 * Jeśli czegoś brakuje lub sekret JWT jest zbyt krótki — proces kończy się
 * czytelnym błędem, zamiast padać w losowym miejscu w trakcie działania.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),

  // Sekrety muszą mieć min. 32 znaki (wymóg z checklisty bezpieczeństwa).
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET musi mieć min. 32 znaki'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET musi mieć min. 32 znaki'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Nieprawidłowa konfiguracja zmiennych środowiskowych:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
