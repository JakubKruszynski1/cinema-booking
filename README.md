# 🎬 Cinema Booking — aplikacja do rezerwacji miejsc w kinie

Aplikacja webowa do przeglądania repertuaru i rezerwacji miejsc w kinie.
Projekt magisterski (PWO). Stack: **React + TypeScript + Vite** (frontend),
**Node.js + Express + TypeScript + Prisma** (backend), **PostgreSQL** (baza),
całość uruchamiana przez **Docker Compose**.

> Status: projekt w budowie, realizowany krok po kroku wg specyfikacji
> (`CINEMA_PROJECT_SPEC.md`, sekcja 7).

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

Migracje bazy i dane początkowe (seed) uruchamiają się automatycznie
w entrypoincie backendu.

> W środowisku deweloperskim komunikacja odbywa się po HTTP — to jest OK.
> W produkcji zakłada się HTTPS.

---

## 🧱 Struktura projektu

```
cinema-booking/
├── docker-compose.yml   # orkiestracja: db + backend + frontend
├── .env.example         # szablon zmiennych (bez sekretów w repo)
├── backend/             # API (Express + Prisma)
└── frontend/            # UI (React + Vite)
```

---

## 🔒 Bezpieczeństwo

Plik `.env` z sekretami **nigdy** nie trafia do repozytorium
(jest w `.gitignore`). W repo znajduje się wyłącznie `.env.example`
z wartościami domyślnymi do developmentu.
