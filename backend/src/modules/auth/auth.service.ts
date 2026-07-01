import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { signAccessToken, signRefreshToken } from '../../lib/jwt.js';
import type { RegisterInput, LoginInput } from '../../schemas/auth.js';

const BCRYPT_COST = 12; // zgodnie z checklistą (cost >= 12)

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AppError(409, 'Użytkownik o tym adresie e-mail już istnieje');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: { email: input.email, passwordHash },
    select: { id: true, email: true },
  });

  return issueTokens(user);
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // Ten sam komunikat dla braku użytkownika i złego hasła (brak enumeracji kont).
  // Zawsze wykonujemy porównanie, by zniwelować atak czasowy.
  const passwordOk = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : await bcrypt.compare(input.password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');

  if (!user || !passwordOk) {
    throw new AppError(401, 'Nieprawidłowy e-mail lub hasło');
  }

  return issueTokens({ id: user.id, email: user.email });
}

/**
 * Odświeżenie access tokenu na podstawie userId z ważnego refresh tokenu.
 * Weryfikacja samego refresh tokenu odbywa się w kontrolerze (odczyt z cookie).
 */
export async function refreshTokens(userId: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new AppError(401, 'Sesja nieprawidłowa');
  }
  return issueTokens(user);
}

function issueTokens(user: { id: string; email: string }): AuthResult {
  return {
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
    user,
  };
}
