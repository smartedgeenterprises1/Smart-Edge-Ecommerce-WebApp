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
  // Never allow quantity below 1
  const lo = Math.max(1, min);
  const hi = Math.max(lo, max);
  const current = Math.min(hi, Math.max(lo, value || lo));
  const canDec = !disabled && current > lo;
  const canInc = !disabled && current < hi;

  function set(next: number) {
    onChange(Math.min(hi, Math.max(lo, next)));
  }

  return (
    <div
      id={id}
      role="group"
      aria-label="Quantity"
      className={cn(
        'inline-flex h-11 select-none items-stretch overflow-hidden rounded-xl border border-border bg-white',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        className="flex w-11 items-center justify-center text-primary-ink transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
        aria-label="Decrease quantity"
        disabled={!canDec}
        onClick={() => set(current - 1)}
      >
        <Minus size={16} strokeWidth={2.5} />
      </button>
      <span
        className="flex w-12 items-center justify-center border-x border-border bg-white text-center text-sm font-semibold text-primary-ink"
        aria-live="polite"
        aria-atomic="true"
      >
        {current}
      </span>
      <button
        type="button"
        className="flex w-11 items-center justify-center text-primary-ink transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
        aria-label="Increase quantity"
        disabled={!canInc}
        onClick={() => set(current + 1)}
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
