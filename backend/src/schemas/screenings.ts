import { z } from 'zod';

/**
 * Walidacja parametrów zapytania repertuaru.
 * Oba filtry opcjonalne: film (movieId) oraz data (YYYY-MM-DD).
 */
export const screeningsQuerySchema = z.object({
  movieId: z.string().min(1).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data musi być w formacie YYYY-MM-DD')
    // Odrzucamy daty poprawne formatem, ale nieistniejące w kalendarzu
    // (np. 2026-13-99). Sprawdzamy, czy komponenty round-trippują.
    .refine((v) => {
      const [y, m, d] = v.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return (
        dt.getFullYear() === y &&
        dt.getMonth() === m - 1 &&
        dt.getDate() === d
      );
    }, 'Nieprawidłowa data kalendarzowa')
    .optional(),
});

export type ScreeningsQuery = z.infer<typeof screeningsQuerySchema>;
