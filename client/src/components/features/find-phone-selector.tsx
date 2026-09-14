'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import type { Brand, DeviceModel } from '@/types';

export function FindPhoneSelector({ brands: initialBrands }: { brands?: Brand[] }) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands || []);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!initialBrands?.length) {
      void api<Brand[]>('/api/catalog/brands').then(setBrands).catch(() => undefined);
    }
  }, [initialBrands]);

  useEffect(() => {
    if (!brand) {
      setModels([]);
      setModel('');
      return;
    }
    void api<DeviceModel[]>(`/api/catalog/device-models?brand=${encodeURIComponent(brand)}`)
      .then((data) => {
        setModels(data);
        setModel('');
      })
      .catch(() => setModels([]));
  }, [brand]);

  function go() {
    if (model) router.push(`/model/${model}`);
    else if (brand) router.push(`/brand/${brand}`);
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-5 shadow-md sm:p-7">
      <h2 className="font-display text-xl font-bold text-primary-ink sm:text-2xl">Find your phone cover</h2>
      <p className="mt-1 text-sm text-muted">Choose brand, then model — we only show covers that fit.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="find-brand" className="label">
            Brand
          </label>
          <Select id="find-brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b._id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="find-model" className="label">
            Model
          </label>
          <Select
            id="find-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!brand}
          >
            <option value="">Select model</option>
            {models.map((m) => (
              <option key={m._id} value={m.slug}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button className="w-full sm:w-auto" onClick={go} disabled={!brand}>
            Shop covers
          </Button>
        </div>
      </div>
    </div>
  );
}
