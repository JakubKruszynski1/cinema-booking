import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { Movie, Screening } from '../api/types';
import { ReviewsSection } from '../components/ReviewsSection';
import { Card, CardBody } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { formatDateTime, formatPrice } from '../lib/format';

export function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) return;
    let active = true;
    setLoading(true);
    setError(null);

    // Dane filmu bierzemy z istniejącej listy filmów, a jego seanse
    // z repertuaru filtrowanego po movieId — bez nowych endpointów backendu.
    Promise.all([
      api<Movie[]>('/api/movies'),
      api<Screening[]>(`/api/screenings?movieId=${movieId}`),
    ])
      .then(([movies, scr]) => {
        if (!active) return;
        const found = movies.find((m) => m.id === movieId) ?? null;
        setMovie(found);
        setScreenings(scr);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError ? err.message : 'Nie udało się wczytać filmu'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [movieId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="rounded-md bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error ?? 'Nie znaleziono filmu'}
        </p>
        <Link to="/" className="mt-4 inline-block text-brand hover:underline">
          ← Wróć do repertuaru
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-slate-400 hover:text-white">
        ← Repertuar
      </Link>

      {/* Nagłówek filmu */}
      <div className="mt-3 flex flex-col gap-5 sm:flex-row">
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-64 w-44 flex-none self-center rounded-lg object-cover sm:self-start"
            loading="lazy"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{movie.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{movie.durationMin} min</p>
          <p className="mt-3 text-slate-300">{movie.description}</p>
        </div>
      </div>

      {/* Najbliższe seanse */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-200">
          Najbliższe seanse
        </h2>
        {screenings.length === 0 ? (
          <p className="text-sm text-slate-400">
            Brak zaplanowanych seansów tego filmu.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {screenings.map((s) => (
              <Link key={s.id} to={`/booking/${s.id}`}>
                <Card className="transition-colors hover:border-brand">
                  <CardBody className="px-4 py-2">
                    <span className="text-sm font-medium text-slate-200">
                      {formatDateTime(s.startsAt)}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {s.hall.name} • {formatPrice(s.price)}
                    </span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recenzje */}
      <ReviewsSection movieId={movie.id} />
    </div>
  );
}
