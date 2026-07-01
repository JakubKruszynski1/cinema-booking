# Frontend: React 18 + TypeScript + Vite
FROM node:20-alpine

WORKDIR /app

# Adres API wstrzykiwany na etapie builda (Vite zamraża zmienne w bundle)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Instalacja zależności (osobna warstwa dla cache)
COPY package*.json ./
RUN npm install

# Kod źródłowy
COPY . .

EXPOSE 5173

# Dev server Vite dostępny spoza kontenera (--host)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
