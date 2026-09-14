/** Money is stored as integer minor units (paisa). 100 paisa = 1 PKR. */
export function formatPkr(minorUnits: number | null | undefined, opts?: { compact?: boolean }): string {
  const value = (minorUnits ?? 0) / 100;
  if (opts?.compact) {
    return `Rs ${Math.round(value).toLocaleString('en-PK')}`;
  }
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function fromMinor(minorUnits: number): number {
  return (minorUnits ?? 0) / 100;
}

export function toMinor(major: number): number {
  return Math.round(major * 100);
}

export function formatDate(iso?: string | Date | null): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Alias for pages that import formatMoney */
export const formatMoney = formatPkr;
