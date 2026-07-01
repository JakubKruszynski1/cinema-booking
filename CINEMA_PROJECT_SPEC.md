# Specyfikacja projektu: Aplikacja do rezerwacji miejsc w kinie

Dokument techniczny (PWO, studia magisterskie). Przeznaczony do przekazania Claude Code jako punkt wyjścia realizacji.

---

## 1. Stack technologiczny

Dobór podyktowany trzema kryteriami: **łatwość uruchomienia na cudzej maszynie**, dojrzałość (mało niespodzianek) i „efektowność" na obronie.

| Warstwa | Technologia | Uzasadnienie |
|---|---|---|
| Frontend | **React 18 + TypeScript + Vite** | Szybki dev server, typowanie, standard rynkowy. |
| Styling / UI | **Tailwind CSS** + komponenty **shadcn/ui** | Responsywność „z pudełka", spójna estetyka bez pisania CSS od zera. |
| Backend | **Node.js + Express + TypeScript** | Prosty, jeden język w całym projekcie (TS end-to-end). |
| ORM | **Prisma** | Migracje, seedowanie danych początkowych, ochrona przed SQL injection (zapytania parametryzowane). |
| Baza danych | **PostgreSQL 16** | Wsparcie transakcji i blokad — kluczowe przy rezerwacji miejsc. |
| Walidacja | **Zod** | Walidacja wejścia współdzielona między front a back. |
| Auth | **JWT (access + refresh) + bcrypt** | Standard, wystarczający na potrzeby projektu. |
| Uruchomienie | **Docker Compose** | `docker compose up` = cała aplikacja. Zero ręcznej konfiguracji u odbiorcy. |

> **Dlaczego Docker Compose:** odbiorca instaluje wyłącznie Docker Desktop, klonuje repo i wpisuje jedną komendę. Nie musi mieć Node, Postgresa ani niczego konfigurować. To bezpośrednio realizuje wymóg „bez zbędnej konfiguracji na innej maszynie".
>
> **Fallback bez Dockera:** Prisma pozwala trywialnie podmienić `provider = "postgresql"` na `"sqlite"`. Jeśli komisja/odbiorca nie ma Dockera, wystarczy jeden plik `dev.db` i `npm install && npm run dev` w backendzie. Warto trzymać tę opcję w README jako plan B.

---

## 2. Struktura katalogów

```
cinema-booking/
├── docker-compose.yml          # orkiestracja: db + backend + frontend
├── .env.example                # szablon zmiennych (bez sekretów w repo)
├── .gitignore                  # node_modules, .env, dist, dev.db
├── README.md                   # instrukcja uruchomienia (1 komenda)
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma       # model danych
│   │   ├── seed.ts             # dane początkowe: filmy, sale, seanse
│   │   └── migrations/
│   └── src/
│       ├── index.ts            # bootstrap Express, middleware globalne
│       ├── config/
│       │   └── env.ts          # walidacja zmiennych środowiskowych (Zod)
│       ├── middleware/
│       │   ├── auth.ts         # weryfikacja JWT
│       │   ├── errorHandler.ts # centralna obsługa błędów (bez wycieku stack trace)
│       │   └── rateLimit.ts
│       ├── modules/
│       │   ├── auth/           # register, login, refresh, logout
│       │   ├── movies/         # lista filmów
│       │   ├── screenings/     # seanse + stan mapy sali
│       │   └── reservations/   # tworzenie/anulowanie/lista rezerwacji
│       ├── lib/
│       │   ├── prisma.ts       # singleton klienta Prisma
│       │   └── jwt.ts          # podpis/weryfikacja tokenów
│       └── schemas/            # schematy Zod dla request body
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx             # routing
        ├── api/
        │   └── client.ts       # fetch wrapper + dołączanie tokenu
        ├── context/
        │   └── AuthContext.tsx # stan zalogowania
        ├── components/
        │   ├── ui/             # przyciski, inputy (shadcn)
        │   ├── SeatMap.tsx     # KLUCZOWY komponent: interaktywna mapa sali
        │   └── Navbar.tsx
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── ScreeningsPage.tsx    # repertuar
        │   ├── BookingPage.tsx       # wybór miejsc dla seansu
        │   └── MyReservationsPage.tsx
        └── hooks/
            └── useAuth.ts
```

---

## 3. Model danych (Prisma)

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  reservations Reservation[]
}

model Movie {
  id          String      @id @default(cuid())
  title       String
  description String
  durationMin Int
  posterUrl   String?
  screenings  Screening[]
}

model Hall {
  id       String      @id @default(cuid())
  name     String
  rows     Int         // liczba rzędów
  cols     Int         // miejsc w rzędzie
  seats    Seat[]
  screenings Screening[]
}

model Seat {
  id     String @id @default(cuid())
  hall   Hall   @relation(fields: [hallId], references: [id])
  hallId String
  row    Int
  col    Int
  reservations Reservation[]

  @@unique([hallId, row, col])
}

model Screening {
  id        String   @id @default(cuid())
  movie     Movie    @relation(fields: [movieId], references: [id])
  movieId   String
  hall      Hall     @relation(fields: [hallId], references: [id])
  hallId    String
  startsAt  DateTime
  price     Int      // w groszach
  reservations Reservation[]
}

model Reservation {
  id          String    @id @default(cuid())
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  screening   Screening @relation(fields: [screeningId], references: [id])
  screeningId String
  seat        Seat      @relation(fields: [seatId], references: [id])
  seatId      String
  createdAt   DateTime  @default(now())

  // KLUCZOWE: to samo miejsce nie może być zarezerwowane dwa razy na tym samym seansie.
  // Ta reguła na poziomie bazy eliminuje race condition.
  @@unique([screeningId, seatId])
}
```

**`seed.ts`** wypełnia bazę na stałe: 2–3 sale (z automatycznie generowanymi fotelami), 4–5 filmów, kilkanaście seansów w najbliższych dniach. Zgodnie z wymaganiami — dane początkowe wpisane na sztywno, rola administratora niewymagana.

---

## 4. API — endpointy

| Metoda | Ścieżka | Auth | Opis |
|---|---|---|---|
| POST | `/api/auth/register` | ✗ | Rejestracja (email + hasło). |
| POST | `/api/auth/login` | ✗ | Zwraca access token + ustawia refresh w httpOnly cookie. |
| POST | `/api/auth/refresh` | cookie | Odświeżenie access tokenu. |
| POST | `/api/auth/logout` | ✓ | Unieważnienie refresh tokenu. |
| GET | `/api/movies` | ✗ | Lista filmów. |
| GET | `/api/screenings` | ✗ | Repertuar (filtry: film, data). |
| GET | `/api/screenings/:id/seats` | ✗ | Mapa sali + które miejsca zajęte. |
| POST | `/api/reservations` | ✓ | Rezerwacja miejsc (transakcja). |
| GET | `/api/reservations/me` | ✓ | Rezerwacje **wyłącznie** zalogowanego użytkownika. |
| DELETE | `/api/reservations/:id` | ✓ | Anulowanie — tylko własnej rezerwacji. |

**Logika rezerwacji (serce projektu)** — endpoint `POST /api/reservations` wykonuje wszystko w **jednej transakcji Prisma** (`prisma.$transaction`). Próba wstawienia zajętego miejsca odbija się o unikalny indeks `@@unique([screeningId, seatId])` → błąd `P2002` → zwracamy `409 Conflict` z listą miejsc, które ktoś właśnie zajął. To rozwiązanie problemu współbieżności warto opisać w dokumentacji projektu jako element „ambitny".

---

## 5. Zabezpieczenia — checklista (OWASP-aligned)

> Uwaga realistyczna: „zero podatności" nie istnieje w żadnym systemie. Poniższa lista pokrywa jednak wszystkie standardowe wektory ataku istotne dla tej klasy aplikacji i jest w zupełności wystarczająca na poziomie magisterskim.

**Uwierzytelnianie i sesje**
- Hasła hashowane **bcrypt** (cost ≥ 12) — nigdy plaintext, nigdy odwracalne szyfrowanie.
- Wymuszenie minimalnej siły hasła przy rejestracji (długość, walidacja Zod).
- **Access token** krótki (15 min), przekazywany w nagłówku `Authorization: Bearer`.
- **Refresh token** długi, w **httpOnly + Secure + SameSite=Strict cookie** — niedostępny dla JS, odporny na XSS-kradzież.
- Sekret JWT w zmiennej środowiskowej, min. 32 losowe znaki, **nigdy w repo**.

**Autoryzacja (najczęstszy realny błąd)**
- Każdy chroniony endpoint sprawdza JWT (middleware `auth`).
- **IDOR/BOLA:** przy `GET /reservations/me` i `DELETE /reservations/:id` filtruj po `userId` z tokenu, nie z parametru. Użytkownik nie może zobaczyć ani skasować cudzej rezerwacji.

**Walidacja i wstrzyknięcia**
- **Każde** ciało żądania walidowane schematem Zod przed dotarciem do logiki.
- **SQL injection** — Prisma używa zapytań parametryzowanych; nie sklejaj zapytań surowych stringów (`$queryRawUnsafe` zabroniony).
- **XSS** — React domyślnie escapuje treści; zakaz `dangerouslySetInnerHTML`.

**Nagłówki i transport**
- **Helmet** — zestaw bezpiecznych nagłówków HTTP (CSP, X-Frame-Options itd.).
- **CORS** — whitelist tylko origin frontendu, nie `*`.
- **CSRF** — przy tokenach w cookie: `SameSite=Strict` + weryfikacja origin dla żądań mutujących.
- HTTPS zakładane w produkcji (w dev-Dockerze HTTP jest OK — odnotować w README).

**Odporność i higiena**
- **Rate limiting** (`express-rate-limit`) — ostrzejszy na `/auth/login` i `/register` (ochrona przed brute-force).
- Centralny **error handler** — klientowi zwracamy ogólny komunikat, **bez stack trace** i szczegółów bazy.
- Logi błędów tylko po stronie serwera.
- `.env` w `.gitignore`; w repo tylko `.env.example`.
- `npm audit` przed oddaniem — brak znanych krytycznych podatności w zależnościach.
- Brak danych wrażliwych w URL/query stringach.

---

## 6. Uruchomienie (dla odbiorcy)

```bash
git clone <repo>
cd cinema-booking
cp .env.example .env        # sekrety mają wartości domyślne dla dev
docker compose up --build   # frontend :5173, backend :3000, db :5432
```

Migracje i seed odpalają się automatycznie w entrypoincie backendu (`prisma migrate deploy && prisma db seed`). Po chwili aplikacja działa pod `http://localhost:5173`.

---

## 7. Sugerowana kolejność realizacji dla Claude Code

1. Szkielet repo + `docker-compose.yml` + `.env.example` + puste Dockerfile'e.
2. `schema.prisma` + pierwsza migracja + `seed.ts`.
3. Backend: bootstrap Express, middleware (helmet, cors, rate-limit, errorHandler).
4. Moduł `auth` (register/login/refresh/logout) + middleware `auth`.
5. Moduły `movies` i `screenings` (odczyt) + endpoint mapy sali.
6. Moduł `reservations` z transakcją i obsługą konfliktu `409`.
7. Frontend: AuthContext, routing, strony logowania/rejestracji.
8. Strona repertuaru + **komponent `SeatMap`** (klik = zaznacz/odznacz, zajęte wyszarzone).
9. Przepływ rezerwacji end-to-end + „Moje rezerwacje".
10. Dopieszczenie UI/UX (Tailwind, responsywność, stany ładowania/błędów) + `README.md`.

Rekomendacja: po każdym kroku commit do GitHuba — czytelna historia zmian to plus przy ocenie.
