# Backend: Node.js + Express + TypeScript + Prisma
FROM node:20-alpine

WORKDIR /app

# Instalacja zależności (osobna warstwa dla cache)
COPY package*.json ./
RUN npm install

# Kod źródłowy
COPY . .

# Generowanie klienta Prisma (schema pojawi się w kroku 2)
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

EXPOSE 3000

# Entrypoint: migracje + seed + start.
# Migracje/seed zostaną dodane w kolejnych krokach.
CMD ["npm", "run", "start"]
