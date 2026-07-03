import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { MovieReviewsResponse } from '../api/types';
import { useAuth } from '../hooks/useAuth';
import { Stars, StarRatingInput } from './Stars';
import { Button } from './ui/Button';
import { Card, CardBody } from './ui/Card';
import { Textarea } from './ui/Textarea';
import { Spinner } from './ui/Spinner';
import { formatDateTime } from '../lib/format';

/**
 * Sekcja recenzji filmu: średnia ocena, lista recenzji oraz — dla zalogowanego
 * użytkownika — formularz dodania/edycji własnej oceny i jej usunięcia.
 * Dla gościa zamiast formularza pokazuje zachętę do zalogowania.
 */
export function ReviewsSection({ movieId }: { movieId: string }) {
  const { user, isAuthenticated } = useAuth();

  const [data, setData] = useState<MovieReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () =>
      api<MovieReviewsResponse>(`/api/movies/${movieId}/reviews`).then(setData),
    [movieId]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    load()
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Nie udało się pobrać recenzji'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load]);

  // Recenzja bieżącego użytkownika (jeśli już ocenił ten film).
  const myReview = useMemo(
    () =>
      data && user
        ? data.reviews.find((r) => r.author.id === user.id) ?? null
        : null,
    [data, user]
  );

  // Prefill formularza istniejącą oceną (tryb edycji).
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [myReview]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setFormError('Wybierz ocenę od 1 do 5');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api(`/api/movies/${movieId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: comment.trim() ? comment.trim() : undefined,
        }),
      });
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Nie udało się zapisać recenzji'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!myReview) return;
    setDeleting(true);
    setFormError(null);
    try {
      await api(`/api/reviews/${myReview.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Nie udało się usunąć recenzji'
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-bold">Recenzje</h2>
        {data && data.count > 0 && (
          <span className="flex items-center gap-2 text-sm text-slate-400">
            <Stars value={data.average ?? 0} className="text-lg" />
            <span className="font-semibold text-slate-200">
              {data.average?.toFixed(1)}
            </span>
            <span>({data.count})</span>
          </span>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-7 w-7" />
        </div>
      )}

      {error && !loading && (
        <p className="rounded-md bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && data && (
        <>
          {/* Formularz oceny / zachęta do logowania */}
          {isAuthenticated ? (
            <Card className="mb-6">
              <CardBody>
                <h3 className="mb-3 font-semibold">
                  {myReview ? 'Edytuj swoją ocenę' : 'Dodaj swoją ocenę'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <StarRatingInput
                    value={rating}
                    onChange={setRating}
                    disabled={submitting}
                  />
                  <Textarea
                    placeholder="Komentarz (opcjonalnie)…"
                    value={comment}
                    maxLength={500}
                    onChange={(e) => setComment(e.target.value)}
                  />

                  {formError && (
                    <p className="rounded-md bg-red-950/60 px-3 py-2 text-sm text-red-300">
                      {formError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting
                        ? 'Zapisywanie…'
                        : myReview
                          ? 'Zaktualizuj ocenę'
                          : 'Wystaw ocenę'}
                    </Button>
                    {myReview && (
                      <Button
                        type="button"
                        variant="danger"
                        disabled={deleting}
                        onClick={handleDelete}
                      >
                        {deleting ? 'Usuwanie…' : 'Usuń'}
                      </Button>
                    )}
                  </div>
                </form>
              </CardBody>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardBody className="text-sm text-slate-300">
                <Link to="/login" className="text-brand hover:underline">
                  Zaloguj się
                </Link>
                , aby dodać własną recenzję.
              </CardBody>
            </Card>
          )}

          {/* Lista recenzji */}
          {data.reviews.length === 0 ? (
            <p className="py-6 text-center text-slate-400">
              Ten film nie ma jeszcze recenzji. Bądź pierwszy!
            </p>
          ) : (
            <ul className="space-y-3">
              {data.reviews.map((r) => (
                <li key={r.id}>
                  <Card>
                    <CardBody>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Stars value={r.rating} />
                          <span className="text-sm font-medium text-slate-200">
                            {r.author.email}
                          </span>
                          {user && r.author.id === user.id && (
                            <span className="rounded bg-brand/20 px-1.5 py-0.5 text-xs text-brand">
                              Ty
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(r.createdAt)}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                          {r.comment}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
