import { z } from 'zod';

/**
 * Walidacja recenzji: ocena 1–5 (liczba całkowita) oraz opcjonalny,
 * krótki komentarz. Pusty komentarz traktujemy jak jego brak.
 */
export const upsertReviewSchema = z.object({
  rating: z
    .number({ invalid_type_error: 'Ocena jest wymagana' })
    .int('Ocena musi być liczbą całkowitą')
    .min(1, 'Ocena musi być od 1 do 5')
    .max(5, 'Ocena musi być od 1 do 5'),
  comment: z
    .string()
    .trim()
    .max(500, 'Komentarz może mieć maksymalnie 500 znaków')
    .optional(),
});

export type UpsertReviewInput = z.infer<typeof upsertReviewSchema>;
