'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Brand, DeviceModel } from '@/types/store';

export function PhoneFinder({ brands, models }: { brands: Brand[]; models: DeviceModel[] }) {
  const router = useRouter();
  const [brandSlug, setBrandSlug] = useState(brands[0]?.slug ?? '');
  const filtered = useMemo(
    () =>
      models.filter((m) => {
        const b = typeof m.brandId === 'object' ? m.brandId.slug : brands.find((x) => x._id === m.brandId)?.slug;
        return b === brandSlug;
      }),
    [models, brands, brandSlug],
  );
  const [modelSlug, setModelSlug] = useState('');

  return (
    <section className="card-quiet p-6 sm:p-8" aria-labelledby="finder-heading">
      <h2 id="finder-heading" className="font-display text-2xl font-bold sm:text-3xl">
        Find your phone cover
      </h2>
      <p className="mt-2 max-w-2xl text-muted">
        Choose your brand, then your exact phone model. Cases are model-specific — similar names do not share dimensions.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium">
          Brand
          <select
            className="input mt-1"
            value={brandSlug}
            onChange={(e) => {
              setBrandSlug(e.target.value);
              setModelSlug('');
            }}
          >
            {brands.map((b) => (
              <option key={b._id} value={b.slug}>
                {b.name} ({b.deviceFamilyLabel})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Phone model
          <select
            className="input mt-1"
            value={modelSlug}
            onChange={(e) => setModelSlug(e.target.value)}
          >
            <option value="">Select model</option>
            {filtered.map((m) => (
              <option key={m._id} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={!modelSlug}
            onClick={() => router.push(`/model/${modelSlug}`)}
          >
            Browse covers
          </button>
        </div>
      </div>
    </section>
  );
}
