import { useState } from 'react';
import { cn } from '../lib/cn';

/**
 * Wyświetlanie oceny w gwiazdkach (tylko do odczytu).
 * Obsługuje wartości ułamkowe (np. średnia 4.3) przez częściowe wypełnienie.
 */
export function Stars({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      className={cn('relative inline-block leading-none', className)}
      aria-label={`Ocena ${value} na 5`}
    >
      {/* Tło — puste gwiazdki */}
      <span className="text-slate-600">★★★★★</span>
      {/* Wypełnienie — przycięte do procentu oceny */}
      <span
        className="absolute left-0 top-0 overflow-hidden text-brand"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

/**
 * Interaktywny wybór oceny 1–5 (na potrzeby formularza).
 */
export function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Twoja ocena">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} z 5`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={cn(
            'text-2xl leading-none transition-colors disabled:cursor-not-allowed',
            n <= active ? 'text-brand' : 'text-slate-600 hover:text-slate-500'
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
