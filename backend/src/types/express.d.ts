// Rozszerzenie typu Request o identyfikator zalogowanego użytkownika,
// ustawiany przez middleware `auth` po weryfikacji tokenu JWT.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
