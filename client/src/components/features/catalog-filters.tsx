'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import type { Brand, Category, DeviceModel, Facets } from '@/types';
import { cn } from '@/lib/cn';

type Props = {
  brands: Brand[];
  categories: Category[];
  models: DeviceModel[];
  facets: Facets;
  className?: string;
};

function useFilterState() {
  const params = useSearchParams();
  return useMemo(
    () => ({
      brand: params.get('brand') || '',
      model: params.get('model') || '',
      category: params.get('category') || '',
      color: params.get('color') || '',
      material: params.get('material') || '',
      caseType: params.get('caseType') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      inStock: params.get('inStock') || '',
      sort: params.get('sort') || 'newest',
    }),
    [params],
  );
}

export function CatalogFilters(props: Props) {
  const [drawer, setDrawer] = useState(false);
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <Button variant="secondary" size="sm" onClick={() => setDrawer(true)}>
          <Filter size={16} /> Filters
        </Button>
        <SortSelect />
      </div>
      <aside className={cn('hidden lg:block', props.className)}>
        <FilterForm {...props} />
      </aside>
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,22rem)] flex-col bg-white shadow-md">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-semibold">Filters</h2>
              <button type="button" className="btn btn-ghost p-2" aria-label="Close" onClick={() => setDrawer(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterForm {...props} onApplied={() => setDrawer(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SortSelect({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  return (
    <Select
      className={cn('w-auto min-w-40', className)}
      aria-label="Sort products"
      value={params.get('sort') || 'newest'}
      disabled={pending}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set('sort', e.target.value);
        next.delete('page');
        start(() => router.push(`${pathname}?${next.toString()}`));
      }}
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: low to high</option>
      <option value="price_desc">Price: high to low</option>
      <option value="bestselling">Best selling</option>
    </Select>
  );
}

function FilterForm({
  brands,
  categories,
  models,
  facets,
  onApplied,
}: Props & { onApplied?: () => void }) {
  const state = useFilterState();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [local, setLocal] = useState(state);

  useEffect(() => {
    setLocal(state);
  }, [state]);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const next = new URLSearchParams();
    Object.entries(local).forEach(([k, v]) => {
      if (v) next.set(k, v);
    });
    // preserve q if present
    const q = params.get('q');
    if (q) next.set('q', q);
    start(() => {
      router.push(`${pathname}?${next.toString()}`);
      onApplied?.();
    });
  }

  function clear() {
    start(() => {
      const q = params.get('q');
      router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
      onApplied?.();
    });
  }

  return (
    <form onSubmit={apply} className="space-y-4">
      <div className="hidden items-center justify-between lg:flex">
        <h2 className="font-display text-lg font-bold">Filters</h2>
        <SortSelect />
      </div>

      <FilterSelect
        label="Brand"
        value={local.brand}
        onChange={(v) => setLocal((s) => ({ ...s, brand: v, model: '' }))}
        options={brands.map((b) => ({ value: b.slug, label: b.name }))}
      />
      <FilterSelect
        label="Model"
        value={local.model}
        onChange={(v) => setLocal((s) => ({ ...s, model: v }))}
        options={models
          .filter((m) => {
            if (!local.brand) return true;
            const brand = brands.find((b) => b.slug === local.brand);
            if (typeof m.brandId === 'object') return (m.brandId as Brand).slug === local.brand;
            return brand ? String(m.brandId) === brand._id : true;
          })
          .map((m) => ({ value: m.slug, label: m.name }))}
      />
      <FilterSelect
        label="Category"
        value={local.category}
        onChange={(v) => setLocal((s) => ({ ...s, category: v }))}
        options={categories.map((c) => ({ value: c.slug, label: c.name }))}
      />
      <FilterSelect
        label="Color"
        value={local.color}
        onChange={(v) => setLocal((s) => ({ ...s, color: v }))}
        options={facets.colors.map((c) => ({ value: c, label: c }))}
      />
      <FilterSelect
        label="Material"
        value={local.material}
        onChange={(v) => setLocal((s) => ({ ...s, material: v }))}
        options={facets.materials.map((c) => ({ value: c, label: c }))}
      />
      <FilterSelect
        label="Case type"
        value={local.caseType}
        onChange={(v) => setLocal((s) => ({ ...s, caseType: v }))}
        options={facets.caseTypes.map((c) => ({ value: c, label: c }))}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor="minPrice">
            Min PKR
          </label>
          <Input
            id="minPrice"
            type="number"
            min={0}
            value={local.minPrice}
            onChange={(e) => setLocal((s) => ({ ...s, minPrice: e.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="maxPrice">
            Max PKR
          </label>
          <Input
            id="maxPrice"
            type="number"
            min={0}
            value={local.maxPrice}
            onChange={(e) => setLocal((s) => ({ ...s, maxPrice: e.target.value }))}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={local.inStock === 'true'}
          onChange={(e) => setLocal((s) => ({ ...s, inStock: e.target.checked ? 'true' : '' }))}
        />
        In stock only
      </label>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          Apply
        </Button>
        <Button type="button" variant="secondary" onClick={clear} disabled={pending}>
          Clear
        </Button>
      </div>
    </form>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  if (totalPages <= 1) return null;

  function go(p: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(p));
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => go(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => go(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
