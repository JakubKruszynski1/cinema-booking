import { z } from 'zod';

/**
 * Schematy walidacji dla modułu auth.
 * Wymuszenie minimalnej siły hasła zgodnie z checklistą bezpieczeństwa.
 */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Nieprawidłowy adres e-mail'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .max(72, 'Hasło może mieć maksymalnie 72 znaki') // limit bcrypt
    .regex(/[a-z]/, 'Hasło musi zawierać małą literę')
    .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać cyfrę'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Nieprawidłowy adres e-mail'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
