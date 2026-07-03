import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100',
        'placeholder:text-slate-500',
        'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40',
        'disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
