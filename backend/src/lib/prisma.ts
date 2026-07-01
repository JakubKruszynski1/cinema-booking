import { PrismaClient } from '@prisma/client';

// Singleton klienta Prisma — jedna instancja na proces.
// W trybie dev (tsx watch) zapobiega tworzeniu wielu połączeń przy hot-reloadzie.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
