import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100',
        'placeholder:text-slate-500',
        'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40',
        'disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
