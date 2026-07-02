# Backend: Node.js + Express + TypeScript + Prisma
FROM node:20-alpine

WORKDIR /app

# Prisma na Alpine potrzebuje OpenSSL i libc6-compat — bez nich silnik zapytań
# nie wykrywa wersji libssl ("Prisma failed to detect the libssl/openssl
# version") i wpada w pętlę restartów. Instalujemy je przed prisma generate.
RUN apk add --no-cache openssl libc6-compat

# Instalacja zależności (osobna warstwa dla cache)
COPY package*.json ./
RUN npm install

# Kod źródłowy
COPY . .

# Generowanie klienta Prisma na podstawie schematu
RUN npx prisma generate

EXPOSE 3000

# Entrypoint: zastosuj migracje, wykonaj seed (idempotentny — pomija, gdy dane
# już istnieją), a następnie uruchom serwer. Dzięki temu `docker compose up`
# stawia całą aplikację bez ręcznej konfiguracji.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npx tsx src/index.ts"]
