export function ImageSizeGuide({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary-soft/40 px-3 py-2.5 text-sm">
      <p className="font-semibold text-primary-ink">{title}</p>
      <ul className="mt-1.5 space-y-1 text-muted">
        {items.map((item) => (
          <li key={item.label}>
            <span className="font-medium text-foreground">{item.label}:</span> {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const PRODUCT_IMAGE_GUIDE = [
  { label: 'Best size', value: '1200 × 1200 px (square)' },
  { label: 'Minimum', value: '800 × 800 px' },
  { label: 'Ratio', value: '1:1 — product page square crop use karti hai' },
  { label: 'Format', value: 'JPG / PNG / WebP (max 5 MB)' },
  { label: 'Tip', value: 'Cover center mein rakho; white/plain background better' },
] as const;

export const HERO_IMAGE_GUIDE = [
  { label: 'Best size', value: '1920 × 700 px (wide banner)' },
  { label: 'Also good', value: '1920 × 800 px' },
  { label: 'Ratio', value: '~16:6 / landscape — full-width homepage banner' },
  { label: 'Format', value: 'JPG / PNG / WebP (max 5 MB)' },
  { label: 'Tip', value: 'Important subject center mein; sides pe safe space rakho' },
] as const;
