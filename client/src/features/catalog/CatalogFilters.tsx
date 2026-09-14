'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Filter, X } from 'lucide-react';

type Facets = {
  colors: string[];
  materials: string[];
  caseTypes: string[];
  priceRange: { minMinor: number; maxMinor: number };
};

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'bestselling', label: 'Bestselling' },
];

export function CatalogFilters({
  facets,
  basePath = '/shop',
}: {
  facets: Facets;
  basePath?: string;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    params.delete('page');
    router.push(`${basePath}?${params.toString()}`);
  }

  function clearAll() {
    router.push(basePath);
  }

  const active = [...sp.entries()].filter(([k]) => !['page', 'sort'].includes(k));

  const form = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Filters</p>
        <button type="button" className="text-sm text-primary-deep" onClick={clearAll}>
          Reset
        </button>
      </div>
      <label className="block text-sm">
        Sort
        <select
          className="input mt-1"
          value={sp.get('sort') || 'newest'}
          onChange={(e) => setParam('sort', e.target.value)}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Color
        <select className="input mt-1" value={sp.get('color') || ''} onChange={(e) => setParam('color', e.target.value)}>
          <option value="">Any</option>
          {facets.colors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Material
        <select
          className="input mt-1"
          value={sp.get('material') || ''}
          onChange={(e) => setParam('material', e.target.value)}
        >
          <option value="">Any</option>
          {facets.materials.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Case type
        <select
          className="input mt-1"
          value={sp.get('caseType') || ''}
          onChange={(e) => setParam('caseType', e.target.value)}
        >
          <option value="">Any</option>
          {facets.caseTypes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={sp.get('inStock') === 'true'}
          onChange={(e) => setParam('inStock', e.target.checked ? 'true' : '')}
        />
        In stock only
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          Min PKR
          <input
            className="input mt-1"
            type="number"
            defaultValue={sp.get('minPrice') || ''}
            onBlur={(e) => setParam('minPrice', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Max PKR
          <input
            className="input mt-1"
            type="number"
            defaultValue={sp.get('maxPrice') || ''}
            onBlur={(e) => setParam('maxPrice', e.target.value)}
          />
        </label>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
          <Filter size={16} /> Filters
        </button>
        {active.map(([k, v]) => (
          <span key={k} className="rounded-full bg-surface-2 px-3 py-1 text-xs">
            {k}: {v}
          </span>
        ))}
      </div>
      <aside className="hidden lg:block">{form}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-y-0 right-0 w-[min(100%,360px)] overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-4 flex justify-between">
              <p className="font-semibold">Filters</p>
              <button type="button" aria-label="Close filters" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            {form}
            <button type="button" className="btn btn-primary mt-6 w-full" onClick={() => setOpen(false)}>
              Show results
            </button>
          </div>
        </div>
      ) : null}
      {active.length ? (
        <div className="mb-4 hidden flex-wrap gap-2 lg:flex">
          {active.map(([k, v]) => (
            <Link
              key={k}
              href={`${basePath}?${(() => {
                const p = new URLSearchParams(sp.toString());
                p.delete(k);
                return p.toString();
              })()}`}
              className="rounded-full bg-surface-2 px-3 py-1 text-xs"
            >
              {k}: {v} ×
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
