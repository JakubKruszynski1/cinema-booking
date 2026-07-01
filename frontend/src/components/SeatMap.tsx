import { useMemo } from 'react';
import type { Seat } from '../api/types';
import { cn } from '../lib/cn';

interface SeatMapProps {
  rows: number;
  cols: number;
  seats: Seat[];
  selectedIds: Set<string>;
  onToggle: (seatId: string) => void;
}

/**
 * KLUCZOWY komponent — interaktywna mapa sali.
 * - miejsce wolne: klik zaznacza/odznacza,
 * - miejsce zajęte: wyszarzone i nieklikalne,
 * - miejsce zaznaczone: wyróżnione kolorem marki.
 */
export function SeatMap({
  rows,
  cols,
  seats,
  selectedIds,
  onToggle,
}: SeatMapProps) {
  // Szybki dostęp do miejsca po współrzędnych (row, col).
  const byPos = useMemo(() => {
    const map = new Map<string, Seat>();
    for (const s of seats) map.set(`${s.row}-${s.col}`, s);
    return map;
  }, [seats]);

  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <div className="flex flex-col items-center">
      {/* Ekran */}
      <div className="mb-6 w-full max-w-xl">
        <div className="mx-auto h-2 w-3/4 rounded-t-full bg-gradient-to-b from-slate-400 to-slate-700" />
        <p className="mt-2 text-center text-xs uppercase tracking-widest text-slate-500">
          Ekran
        </p>
      </div>

      {/* Siatka miejsc */}
      <div className="inline-block overflow-x-auto">
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex items-center gap-1.5">
              <span className="w-5 text-right text-xs font-medium text-slate-500">
                {rowLabels[r] ?? r + 1}
              </span>
              {Array.from({ length: cols }, (_, c) => {
                const seat = byPos.get(`${r + 1}-${c + 1}`);
                if (!seat) {
                  return <span key={c} className="h-7 w-7" />;
                }
                const selected = selectedIds.has(seat.id);
                const disabled = seat.occupied;
                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(seat.id)}
                    title={`Rząd ${rowLabels[r] ?? r + 1}, miejsce ${c + 1}`}
                    aria-label={`Rząd ${rowLabels[r] ?? r + 1}, miejsce ${c + 1}${
                      disabled ? ' (zajęte)' : selected ? ' (wybrane)' : ''
                    }`}
                    aria-pressed={selected}
                    className={cn(
                      'h-7 w-7 rounded-md text-[10px] font-semibold transition-colors',
                      disabled &&
                        'cursor-not-allowed bg-slate-800 text-slate-600',
                      !disabled &&
                        !selected &&
                        'bg-slate-600 text-slate-100 hover:bg-slate-500',
                      selected && 'bg-brand text-white ring-2 ring-brand/50'
                    )}
                  >
                    {c + 1}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-slate-600" /> wolne
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-brand" /> wybrane
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-slate-800" /> zajęte
        </span>
      </div>
    </div>
  );
}
