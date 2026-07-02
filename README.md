# 🎬 Cinema Booking — aplikacja do rezerwacji miejsc w kinie

Aplikacja webowa do przeglądania repertuaru i rezerwacji miejsc w kinie.
Projekt zaliczeniowy (PWO). Pełny stack w TypeScript, uruchamiany jedną komendą
przez Docker Compose.

![stack](https://img.shields.io/badge/stack-TypeScript%20end--to--end-blue)

---

## ✨ Funkcje

- **Repertuar** z filtrami (film, data), seanse pogrupowane po dniach.
- **Interaktywna mapa sali** (`SeatMap`) — klik zaznacza/odznacza miejsce,
  zajęte miejsca są wyszarzone i nieklikalne.
- **Rezerwacja wielu miejsc** w jednej transakcji z odpornością na
  współbieżność (patrz niżej).
- **Konto użytkownika** — rejestracja, logowanie (JWT), „Moje rezerwacje”
  z możliwością anulowania.
- Responsywny, ciemny interfejs (Tailwind CSS).

---

## 🧱 Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| ORM / DB | Prisma + PostgreSQL 16 |
| Walidacja | Zod (front i back) |
| Auth | JWT (access + refresh) + bcrypt |
| Uruchomienie | Docker Compose |

---

## 🚀 Uruchomienie (Docker — zalecane)

Wymagany jedynie **Docker Desktop**. Nie trzeba instalować Node, Postgresa
ani niczego konfigurować ręcznie.

```bash
git clone https://github.com/JakubKruszynski1/cinema-booking
cd cinema-booking
cp .env.example .env          # sekrety mają bezpieczne wartości domyślne dla dev
docker compose up --build     # frontend :5173, backend :3000, db :5432
```

Po chwili aplikacja działa pod **http://localhost:5173**.

Przy starcie backendu automatycznie wykonują się **migracje** (`prisma migrate
deploy`) oraz **seed** (`prisma db seed`) wypełniający bazę salami, filmami
i seansami. Seed jest idempotentny — nie nadpisuje istniejących danych, więc
rezerwacje przetrwają restart kontenera.

> W środowisku deweloperskim komunikacja odbywa się po **HTTP** (to jest OK).
> W produkcji zakłada się HTTPS — wtedy refresh-cookie zyskuje atrybut `Secure`.

---

## 🛟 Plan B — uruchomienie bez Dockera (SQLite)

Jeśli odbiorca nie ma Dockera, można uruchomić backend na wbudowanym SQLite
(jeden plik `dev.db`, zero serwera bazy):

```bash
# 1) Backend
cd backend
# w prisma/schema.prisma zmień: provider = "postgresql"  ->  "sqlite"
# w .env ustaw:                 DATABASE_URL="file:./dev.db"
npm install
npx prisma generate
npx prisma db push        # tworzy schemat w SQLite (bez migracji postgresowych)
npx prisma db seed
npm run dev               # backend na http://localhost:3000

# 2) Frontend (w drugim terminalu)
cd ../frontend
npm install
npm run dev               # frontend na http://localhost:5173
```

Wymagany Node.js 20+.

---

## 🗂️ Struktura projektu

```
cinema-booking/
├── docker-compose.yml       # orkiestracja: db + backend + frontend
├── .env.example             # szablon zmiennych (bez sekretów w repo)
├── backend/
│   ├── prisma/              # schema, migracje, seed
│   └── src/
│       ├── config/          # walidacja env (Zod)
│       ├── middleware/      # auth, errorHandler, rateLimit
│       ├── modules/         # auth, movies, screenings, reservations
│       ├── lib/             # prisma, jwt, asyncHandler
│       └── schemas/         # schematy Zod
└── frontend/
    └── src/
        ├── api/             # klient fetch + typy
        ├── context/         # AuthContext
        ├── components/      # SeatMap, Navbar, ui/*
        └── pages/           # Login, Register, Screenings, Booking, MyReservations
```

---

## 🔌 API — endpointy

| Metoda | Ścieżka | Auth | Opis |
|---|---|---|---|
| POST | `/api/auth/register` | ✗ | Rejestracja (email + hasło). |
| POST | `/api/auth/login` | ✗ | Access token + refresh w httpOnly cookie. |
| POST | `/api/auth/refresh` | cookie | Odświeżenie access tokenu. |
| POST | `/api/auth/logout` | ✓ | Wyczyszczenie refresh cookie. |
| GET | `/api/movies` | ✗ | Lista filmów. |
| GET | `/api/screenings` | ✗ | Repertuar (filtry: `movieId`, `date`). |
| GET | `/api/screenings/:id/seats` | ✗ | Mapa sali + zajęte miejsca. |
| POST | `/api/reservations` | ✓ | Rezerwacja miejsc (transakcja). |
| GET | `/api/reservations/me` | ✓ | Rezerwacje zalogowanego użytkownika. |
| DELETE | `/api/reservations/:id` | ✓ | Anulowanie własnej rezerwacji. |

### Serce projektu — odporność na współbieżność

`POST /api/reservations` wykonuje wszystko w **jednej transakcji Prisma**.
Unikalny indeks `@@unique([screeningId, seatId])` na poziomie bazy gwarantuje,
że tego samego miejsca nie da się zarezerwować dwa razy. Gdy dwóch użytkowników
jednocześnie sięgnie po to samo miejsce, jeden dostaje błąd `P2002`, który
mapujemy na **`409 Conflict`** z listą zajętych miejsc — frontend odświeża
mapę i podpowiada wybór innych miejsc. To eliminuje race condition bez ręcznych
blokad.

---

## 🔒 Bezpieczeństwo (OWASP-aligned)

- **Hasła**: bcrypt (cost 12); wymuszona minimalna siła hasła (Zod).
- **Tokeny**: krótki access token (15 min, nagłówek `Bearer`); refresh token
  w **httpOnly + SameSite=Strict** cookie (Secure w produkcji) — odporny na
  kradzież przez XSS.
- **Autoryzacja / IDOR**: rezerwacje filtrowane po `userId` z tokenu, nie
  z parametru — nie da się zobaczyć ani skasować cudzej rezerwacji.
- **Walidacja**: każde ciało żądania przez Zod; Prisma = zapytania
  parametryzowane (brak SQL injection); brak `dangerouslySetInnerHTML` (XSS).
- **Nagłówki i transport**: Helmet (CSP, X-Frame-Options…), CORS z whitelistą
  origin frontendu (nie `*`), `SameSite=Strict` przeciw CSRF.
- **Odporność**: rate limiting (ostrzejszy na `/auth/login` i `/register`),
  centralny error handler bez wycieku stack trace, logi błędów tylko po stronie
  serwera.
- **Sekrety**: `.env` w `.gitignore` (w repo tylko `.env.example`); sekret JWT
  min. 32 znaki, walidowany przy starcie.

### Status `npm audit`

- **Backend**: `0 podatności`.
- **Frontend**: 1 podatność *moderate* dotyczy wyłącznie **dev-serwera** Vite
  (`esbuild`) i nie występuje w buildzie produkcyjnym; jej usunięcie wymaga
  zrywającej aktualizacji do Vite 8, dlatego świadomie ją odnotowujemy.

---

## 🧪 Uwagi deweloperskie

- Type-check: `npm run lint` (frontend) / `npx tsc --noEmit` (backend).
- Build produkcyjny frontendu: `npm run build`.
- Konto testowe zakładasz samodzielnie przez formularz rejestracji
  (rola administratora nie jest wymagana — dane początkowe są w seedzie).
