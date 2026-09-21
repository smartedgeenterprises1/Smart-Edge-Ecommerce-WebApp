'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { formatPkr, toMinor } from '@/lib/format';
import { mediaUrl } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Spinner, Badge } from '@/components/ui/misc';
import { ImageSizeGuide, PRODUCT_IMAGE_GUIDE } from '@/components/admin/image-size-guide';
import { cn } from '@/lib/cn';
import type { Brand, DeviceModel, ProductListItem } from '@/types';

type ListResult = { items: ProductListItem[]; total: number; page: number; limit: number };
type ColorRow = { name: string; hex: string; stockOnHand: string; imageUrl: string };

const MAX_IMAGES = 15;
const MAX_COLORS = 10;

const DEFAULT_COLORS: ColorRow[] = [
  { name: 'Black', hex: '#111827', stockOnHand: '10', imageUrl: '' },
  { name: 'Clear', hex: '#E5E7EB', stockOnHand: '10', imageUrl: '' },
];

export default function AdminProductsPage() {
  const [data, setData] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [brandId, setBrandId] = useState('');
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [colors, setColors] = useState<ColorRow[]>(DEFAULT_COLORS);
  const [gallery, setGallery] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    basePrice: '1999',
    status: 'active',
    caseType: 'Soft case',
    material: 'TPU',
    isFeatured: false,
    isNewArrival: true,
  });

  const brandModels = useMemo(() => {
    if (!brandId) return models;
    return models.filter((m) => {
      const id = typeof m.brandId === 'string' ? m.brandId : m.brandId?._id;
      return id === brandId;
    });
  }, [models, brandId]);

  const variantPreview = selectedModelIds.length * colors.filter((c) => c.name.trim()).length;

  async function load(page = 1) {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) q.set('status', status);
    try {
      const res = await api<ListResult>(`/api/admin/products?${q}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  useEffect(() => {
    void (async () => {
      const [b, m] = await Promise.all([
        api<Brand[]>('/api/admin/brands'),
        api<DeviceModel[]>('/api/admin/device-models'),
      ]);
      setBrands(b);
      setModels(m);
      const apple = b.find((x) => x.slug === 'apple');
      if (apple) setBrandId(apple._id);
    })().catch(() => undefined);
  }, []);

  function toggleModel(id: string) {
    setSelectedModelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectAllModels() {
    setSelectedModelIds(brandModels.map((m) => m._id));
  }

  function clearModels() {
    setSelectedModelIds([]);
  }

  async function onUploadFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const remaining = MAX_IMAGES - gallery.length;
    if (remaining <= 0) {
      setMsg(`Max ${MAX_IMAGES} images allowed`);
      return;
    }
    const files = Array.from(fileList).slice(0, remaining);
    setUploading(true);
    setMsg('');
    try {
      const urls: string[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        const saved = await api<{ url: string }>('/api/admin/uploads', { method: 'POST', body });
        urls.push(saved.url);
      }
      setGallery((prev) => [...prev, ...urls].slice(0, MAX_IMAGES));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeGalleryImage(url: string) {
    setGallery((prev) => prev.filter((u) => u !== url));
    setColors((prev) => prev.map((c) => (c.imageUrl === url ? { ...c, imageUrl: '' } : c)));
  }

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    if (!brandId) {
      setMsg('Select a brand (Apple / Google / Samsung)');
      return;
    }
    if (!selectedModelIds.length) {
      setMsg('Select at least one phone model for the dropdown');
      return;
    }
    const cleanColors = colors
      .map((c) => ({
        name: c.name.trim(),
        hex: c.hex.trim() || '#CCCCCC',
        stockOnHand: Math.max(0, Number(c.stockOnHand) || 0),
        imageUrl: c.imageUrl || undefined,
      }))
      .filter((c) => c.name)
      .slice(0, MAX_COLORS);
    if (!cleanColors.length) {
      setMsg('Add at least one color');
      return;
    }
    if (gallery.length > MAX_IMAGES) {
      setMsg(`Max ${MAX_IMAGES} images`);
      return;
    }

    setBusy(true);
    try {
      const res = await api<{ product: ProductListItem; variantsCreated: number }>('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          basePriceMinor: toMinor(Number(form.basePrice) || 0),
          status: form.status,
          caseType: form.caseType,
          material: form.material,
          isFeatured: form.isFeatured,
          isNewArrival: form.isNewArrival,
          brandIds: [brandId],
          compatibleDeviceModelIds: selectedModelIds,
          images: gallery.map((url, i) => ({ url, alt: form.title, sortOrder: i })),
          colors: cleanColors,
        }),
      });
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        basePrice: '1999',
        status: 'active',
        caseType: 'Soft case',
        material: 'TPU',
        isFeatured: false,
        isNewArrival: true,
      });
      setSelectedModelIds([]);
      setColors(DEFAULT_COLORS);
      setGallery([]);
      await load();
      setMsg(`Product created with ${res.variantsCreated} variants (models × colors)`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(p: ProductListItem) {
    const next = p.status === 'active' ? 'archived' : 'active';
    await api(`/api/admin/products/${p._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    await load(data?.page || 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-ink">Products</h1>
          <p className="text-sm text-muted">
            One cover design = model dropdown first, then color swatches. Upload up to {MAX_IMAGES} photos and link one
            per color.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : 'New cover'}</Button>
        </div>
      </div>

      {msg ? <p className="text-sm text-primary-ink">{msg}</p> : null}

      {showForm ? (
        <form onSubmit={createProduct} className="grid gap-4 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2">
          <Field label="Cover name / design" htmlFor="title">
            <Input
              id="title"
              required
              placeholder="e.g. Matte Armor Case"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Price (PKR)" htmlFor="basePrice">
            <Input
              id="basePrice"
              type="number"
              required
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                placeholder="Customer picks phone model first, then color."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Brand" htmlFor="brand">
            <Select
              id="brand"
              required
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value);
                setSelectedModelIds([]);
              }}
            >
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>

          <Field label="Case type" htmlFor="caseType">
            <Input id="caseType" value={form.caseType} onChange={(e) => setForm({ ...form, caseType: e.target.value })} />
          </Field>
          <Field label="Material" htmlFor="material">
            <Input id="material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
          </Field>

          <div className="sm:col-span-2 space-y-2 rounded-xl border border-border bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary-ink">Phone models (customer chooses first)</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={selectAllModels}>
                  Select all
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={clearModels}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {brandModels.map((m) => (
                <label key={m._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedModelIds.includes(m._id)}
                    onChange={() => toggleModel(m._id)}
                  />
                  {m.name}
                </label>
              ))}
            </div>
            {!brandModels.length ? <p className="text-xs text-muted">No models for this brand yet.</p> : null}
          </div>

          <div className="sm:col-span-2 space-y-3 rounded-xl border border-border bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary-ink">
                Cover images ({gallery.length}/{MAX_IMAGES})
              </p>
              <label className="btn btn-secondary cursor-pointer text-sm">
                {uploading ? 'Uploading…' : 'Upload images'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  disabled={uploading || gallery.length >= MAX_IMAGES}
                  onChange={(e) => {
                    void onUploadFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <ImageSizeGuide title="Recommended image size" items={[...PRODUCT_IMAGE_GUIDE]} />
            <p className="text-xs text-muted">
              Upload up to {MAX_IMAGES} photos, then assign one image to each color so customers can see every option.
            </p>
            {gallery.length ? (
              <div className="flex flex-wrap gap-2">
                {gallery.map((url) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(url)} alt="" className="h-20 w-20 rounded-lg border border-border object-cover" />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 rounded-full bg-danger px-1.5 text-xs text-white"
                      onClick={() => removeGalleryImage(url)}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="sm:col-span-2 space-y-2 rounded-xl border border-border bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary-ink">
                Colors ({colors.length}/{MAX_COLORS})
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={colors.length >= MAX_COLORS}
                onClick={() =>
                  setColors((prev) =>
                    prev.length >= MAX_COLORS
                      ? prev
                      : [...prev, { name: '', hex: '#CCCCCC', stockOnHand: '10', imageUrl: '' }],
                  )
                }
              >
                Add color
              </Button>
            </div>
            <div className="space-y-3">
              {colors.map((c, i) => (
                <div key={i} className="rounded-xl border border-border bg-white p-3">
                  <div className="grid grid-cols-[1fr_5rem_5rem_auto] items-end gap-2">
                    <Field label={i === 0 ? 'Color name' : ''} htmlFor={`color-${i}`}>
                      <Input
                        id={`color-${i}`}
                        placeholder="Black"
                        value={c.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setColors((prev) => prev.map((row, idx) => (idx === i ? { ...row, name } : row)));
                        }}
                      />
                    </Field>
                    <Field label={i === 0 ? 'Hex' : ''} htmlFor={`hex-${i}`}>
                      <Input
                        id={`hex-${i}`}
                        type="color"
                        value={c.hex}
                        onChange={(e) => {
                          const hex = e.target.value;
                          setColors((prev) => prev.map((row, idx) => (idx === i ? { ...row, hex } : row)));
                        }}
                      />
                    </Field>
                    <Field label={i === 0 ? 'Stock' : ''} htmlFor={`stock-${i}`}>
                      <Input
                        id={`stock-${i}`}
                        type="number"
                        min={0}
                        value={c.stockOnHand}
                        onChange={(e) => {
                          const stockOnHand = e.target.value;
                          setColors((prev) => prev.map((row, idx) => (idx === i ? { ...row, stockOnHand } : row)));
                        }}
                      />
                    </Field>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={colors.length <= 1}
                      onClick={() => setColors((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="mt-2">
                    <p className="mb-1 text-xs font-medium text-muted">Color photo (from gallery)</p>
                    {gallery.length ? (
                      <div className="flex flex-wrap gap-2">
                        {gallery.map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() =>
                              setColors((prev) =>
                                prev.map((row, idx) => (idx === i ? { ...row, imageUrl: url } : row)),
                              )
                            }
                            className={cn(
                              'relative h-14 w-14 overflow-hidden rounded-lg border-2',
                              c.imageUrl === url ? 'border-primary-deep' : 'border-transparent',
                            )}
                            aria-label={`Assign image to ${c.name || 'color'}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mediaUrl(url)} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">Upload gallery images first, then tap one for this color.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted">
              Will create <strong>{variantPreview}</strong> sellable variants (each model × each color).
            </p>
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
              />
              New arrival
            </label>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create cover + variants'}
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).map((p) => (
                <tr key={p._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">{formatPkr(p.basePriceMinor)}</td>
                  <td className="px-4 py-3">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="secondary" onClick={() => void toggleStatus(p)}>
                      {p.status === 'active' ? 'Archive' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-muted">{data?.total ?? 0} products</p>
        </div>
      )}
    </div>
  );
}
