import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { SeatMapResponse } from '../api/types';
import { SeatMap } from '../components/SeatMap';
import { Card, CardBody } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { formatDateTime, formatPrice } from '../lib/format';

export function BookingPage() {
  const { screeningId } = useParams<{ screeningId: string }>();

  const [data, setData] = useState<SeatMapResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!screeningId) return;
    let active = true;
    setLoading(true);
    setError(null);

    api<SeatMapResponse>(`/api/screenings/${screeningId}/seats`)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError ? err.message : 'Nie udało się wczytać sali'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [screeningId]);

  function toggleSeat(seatId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  }

  const selectedSeats = useMemo(() => {
    if (!data) return [];
    return data.seats
      .filter((s) => selected.has(s.id))
      .sort((a, b) => a.row - b.row || a.col - b.col);
  }, [data, selected]);

  const total = data ? selectedSeats.length * data.screening.price : 0;
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="rounded-md bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error ?? 'Nie znaleziono seansu'}
        </p>
        <Link to="/" className="mt-4 inline-block text-brand hover:underline">
          ← Wróć do repertuaru
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="text-sm text-slate-400 hover:text-white">
        ← Repertuar
      </Link>

      <div className="mt-2 mb-6">
        <h1 className="text-2xl font-bold">{data.screening.movie.title}</h1>
        <p className="text-slate-400">
          {data.hall.name} • {formatDateTime(data.screening.startsAt)} •{' '}
          {formatPrice(data.screening.price)} / miejsce
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Mapa sali */}
        <Card>
          <CardBody>
            <SeatMap
              rows={data.hall.rows}
              cols={data.hall.cols}
              seats={data.seats}
              selectedIds={selected}
              onToggle={toggleSeat}
            />
          </CardBody>
        </Card>

        {/* Podsumowanie wyboru */}
        <div>
          <Card>
            <CardBody>
              <h2 className="mb-3 font-semibold">Twój wybór</h2>
              {selectedSeats.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Kliknij wolne miejsca na mapie, aby je wybrać.
                </p>
              ) : (
                <ul className="space-y-1 text-sm text-slate-200">
                  {selectedSeats.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>
                        Rząd {rowLabels[s.row - 1] ?? s.row}, miejsce {s.col}
                      </span>
                      <span className="text-slate-400">
                        {formatPrice(data.screening.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex justify-between border-t border-slate-800 pt-3 font-semibold">
                <span>Razem ({selectedSeats.length})</span>
                <span className="text-brand">{formatPrice(total)}</span>
              </div>

              {/* Potwierdzenie rezerwacji (POST + obsługa konfliktu 409)
                  zostanie dodane w kroku 9. */}
              <p className="mt-4 text-xs text-slate-500">
                Potwierdzenie rezerwacji pojawi się w kroku 9.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
