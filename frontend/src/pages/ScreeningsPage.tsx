import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { Movie, Screening } from '../api/types';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { formatDay, formatTime, formatPrice, dayKey } from '../lib/format';

export function ScreeningsPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [movieFilter, setMovieFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lista filmów do filtra — pobierana raz.
  useEffect(() => {
    api<Movie[]>('/api/movies')
      .then(setMovies)
      .catch(() => {
        /* brak listy filmów nie blokuje repertuaru */
      });
  }, []);

  // Repertuar — przeładowywany przy zmianie filtrów.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (movieFilter) params.set('movieId', movieFilter);
    if (dateFilter) params.set('date', dateFilter);
    const qs = params.toString();

    api<Screening[]>(`/api/screenings${qs ? `?${qs}` : ''}`)
      .then((data) => {
        if (active) setScreenings(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Nie udało się pobrać repertuaru'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [movieFilter, dateFilter]);

  // Grupowanie seansów po dniu.
  const grouped = useMemo(() => {
    const map = new Map<string, Screening[]>();
    for (const s of screenings) {
      const key = dayKey(s.startsAt);
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [screenings]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Repertuar</h1>
      <p className="mb-6 text-slate-400">Wybierz seans, aby zarezerwować miejsca.</p>

      {/* Filtry */}
      <div className="mb-8 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Film
          </label>
          <select
            value={movieFilter}
            onChange={(e) => setMovieFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:border-brand focus:outline-none"
          >
            <option value="">Wszystkie filmy</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Data
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:border-brand focus:outline-none"
          />
        </div>
        {(movieFilter || dateFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setMovieFilter('');
              setDateFilter('');
            }}
          >
            Wyczyść filtry
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {error && !loading && (
        <p className="rounded-md bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && screenings.length === 0 && (
        <p className="py-16 text-center text-slate-400">
          Brak seansów dla wybranych filtrów.
        </p>
      )}

      {!loading &&
        !error &&
        grouped.map(([day, items]) => (
          <section key={day} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold capitalize text-slate-200">
              {formatDay(items[0].startsAt)}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <Card key={s.id} className="overflow-hidden">
                  {s.movie.posterUrl && (
                    <img
                      src={s.movie.posterUrl}
                      alt={s.movie.title}
                      className="h-48 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <CardBody>
                    <Link
                      to={`/movies/${s.movie.id}`}
                      className="font-semibold text-white hover:text-brand"
                    >
                      {s.movie.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-400">
                      {s.hall.name} • {s.movie.durationMin} min
                    </p>
                    <Link
                      to={`/movies/${s.movie.id}`}
                      className="mt-1 inline-block text-xs text-brand hover:underline"
                    >
                      Szczegóły i recenzje →
                    </Link>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-brand">
                          {formatTime(s.startsAt)}
                        </span>
                        <span className="ml-2 text-sm text-slate-400">
                          {formatPrice(s.price)}
                        </span>
                      </div>
                      <Link to={`/booking/${s.id}`}>
                        <Button size="sm">Rezerwuj</Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
