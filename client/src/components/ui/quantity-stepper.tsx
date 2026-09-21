'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  disabled,
  id,
  className,
}: Props) {
  const lo = Math.max(1, min);
  const hi = Math.max(lo, max);
  const canDec = !disabled && value > lo;
  const canInc = !disabled && value < hi;

  return (
    <div
      className={cn(
        'inline-flex h-11 items-stretch overflow-hidden rounded-xl border border-border bg-white',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        className="flex w-11 items-center justify-center text-primary-ink transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
        aria-label="Decrease quantity"
        disabled={!canDec}
        onClick={() => onChange(Math.max(lo, value - 1))}
      >
        <Minus size={16} strokeWidth={2.5} />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        readOnly
        value={value}
        aria-live="polite"
        className="w-12 border-x border-border bg-white text-center text-sm font-semibold text-primary-ink outline-none"
        tabIndex={-1}
      />
      <button
        type="button"
        className="flex w-11 items-center justify-center text-primary-ink transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
        aria-label="Increase quantity"
        disabled={!canInc}
        onClick={() => onChange(Math.min(hi, value + 1))}
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
