import { z } from 'zod';

/**
 * Walidacja żądania utworzenia rezerwacji.
 * Rezerwujemy jedno lub więcej miejsc na wskazanym seansie.
 */
export const createReservationSchema = z.object({
  screeningId: z.string().min(1, 'screeningId jest wymagane'),
  seatIds: z
    .array(z.string().min(1))
    .min(1, 'Wybierz co najmniej jedno miejsce')
    .max(10, 'Maksymalnie 10 miejsc na jedną rezerwację')
    // Odrzucamy duplikaty tego samego miejsca w jednym żądaniu.
    .refine((arr) => new Set(arr).size === arr.length, 'Zduplikowane miejsca w żądaniu'),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
