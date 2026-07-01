import rateLimit from 'express-rate-limit';

/**
 * Globalny limiter — łagodny, chroni całe API przed zalewem żądań.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zbyt wiele żądań — spróbuj ponownie później.' },
});

/**
 * Ostrzejszy limiter dla endpointów uwierzytelniania (login/register).
 * Ochrona przed brute-force zgodnie z checklistą bezpieczeństwa.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Zbyt wiele prób logowania — spróbuj ponownie za kilka minut.',
  },
});
