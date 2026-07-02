import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { Reservation } from '../api/types';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { formatDateTime, formatPrice } from '../lib/format';

const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function seatLabel(row: number, col: number): string {
  return `Rząd ${rowLabels[row - 1] ?? row}, miejsce ${col}`;
}

export function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<Reservation[]>('/api/reservations/me')
      .then((data) => {
        if (active) setReservations(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Nie udało się pobrać rezerwacji'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCancel(id: string) {
    setCancelingId(id);
    setError(null);
    try {
      await api(`/api/reservations/${id}`, { method: 'DELETE' });
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Nie udało się anulować'
      );
    } finally {
      setCancelingId(null);
    }
  }

  // Grupujemy rezerwacje po seansie — kilka miejsc na jeden seans razem.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { screening: Reservation['screening']; items: Reservation[] }
    >();
    for (const r of reservations) {
      const g = map.get(r.screening.id) ?? {
        screening: r.screening,
        items: [],
      };
      g.items.push(r);
      map.set(r.screening.id, g);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.screening.startsAt).getTime() -
        new Date(b.screening.startsAt).getTime()
    );
  }, [reservations]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Moje rezerwacje</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {reservations.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-slate-400">Nie masz jeszcze żadnych rezerwacji.</p>
          <Link
            to="/"
            className="mt-3 inline-block text-brand hover:underline"
          >
            Przejdź do repertuaru →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.screening.id}>
              <CardBody className="flex gap-4">
                {g.screening.movie.posterUrl && (
                  <img
                    src={g.screening.movie.posterUrl}
                    alt={g.screening.movie.title}
                    className="hidden h-28 w-20 flex-none rounded object-cover sm:block"
                    loading="lazy"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {g.screening.movie.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {g.screening.hall.name} •{' '}
                    {formatDateTime(g.screening.startsAt)}
                  </p>

                  <ul className="mt-3 space-y-1.5">
                    {g.items
                      .slice()
                      .sort(
                        (a, b) =>
                          a.seat.row - b.seat.row || a.seat.col - b.seat.col
                      )
                      .map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-slate-200">
                            {seatLabel(r.seat.row, r.seat.col)}
                            <span className="ml-2 text-slate-500">
                              {formatPrice(g.screening.price)}
                            </span>
                          </span>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={cancelingId === r.id}
                            onClick={() => handleCancel(r.id)}
                          >
                            {cancelingId === r.id ? 'Anuluję…' : 'Anuluj'}
                          </Button>
                        </li>
                      ))}
                  </ul>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
