'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductDetail, ProductVariant } from '@/types/store';
import { formatMoney } from '@/lib/format';
import { useCart } from '@/hooks/use-cart';
import { apiFetch } from '@/lib/api';

function variantModel(v: ProductVariant) {
  return typeof v.deviceModelId === 'object' && v.deviceModelId ? v.deviceModelId : null;
}

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { addItem } = useCart();
  const models = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const v of product.variants) {
      const m = variantModel(v);
      if (m) map.set(m._id, { id: m._id, name: m.name });
    }
    return [...map.values()];
  }, [product.variants]);

  const [modelId, setModelId] = useState(models[0]?.id ?? '');
  const colors = useMemo(() => {
    const set = new Map<string, string>();
    for (const v of product.variants) {
      const m = variantModel(v);
      if (!modelId || m?._id === modelId) set.set(v.color, v.colorHex || '#ccc');
    }
    return [...set.entries()].map(([name, hex]) => ({ name, hex }));
  }, [product.variants, modelId]);

  const [color, setColor] = useState(colors[0]?.name ?? '');
  const selected = product.variants.find((v) => {
    const m = variantModel(v);
    const modelOk = !modelId || m?._id === modelId;
    return modelOk && v.color === color;
  });

  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [wish, setWish] = useState(false);

  const images =
    selected?.images?.length ? selected.images : product.images?.length ? product.images : [];
  const [activeImg, setActiveImg] = useState(0);
  const main = images[activeImg] || images[0];
  const available = selected?.availableStock ?? 0;
  const canBuy = Boolean(selected && available > 0);

  async function toggleWish() {
    try {
      if (!wish) {
        await apiFetch(`/api/account/wishlist/${product._id}`, { method: 'POST' });
        setWish(true);
      } else {
        await apiFetch(`/api/account/wishlist/${product._id}`, { method: 'DELETE' });
        setWish(false);
      }
    } catch {
      router.push('/login');
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
          {main?.url ? (
            <Image
              src={main.url}
              alt={main.alt || product.title}
              fill
              priority
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover"
              unoptimized={main.url.endsWith('.svg')}
            />
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                type="button"
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border ${i === activeImg ? 'border-primary-deep' : 'border-border'}`}
                onClick={() => setActiveImg(i)}
              >
                <Image src={img.url} alt={img.alt || ''} fill className="object-cover" unoptimized={img.url.endsWith('.svg')} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{product.title}</h1>
        <p className="mt-3 text-2xl font-semibold text-primary-ink">
          {selected ? formatMoney(selected.priceMinor) : formatMoney(product.basePriceMinor)}
          {selected?.compareAtPriceMinor && selected.compareAtPriceMinor > selected.priceMinor ? (
            <span className="ml-2 text-base font-normal text-muted line-through">
              {formatMoney(selected.compareAtPriceMinor)}
            </span>
          ) : null}
        </p>

        {models.length ? (
          <label className="mt-6 block text-sm font-medium">
            Phone model
            <select
              className="input mt-1"
              value={modelId}
              onChange={(e) => {
                setModelId(e.target.value);
                setColor('');
                setActiveImg(0);
              }}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Color</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => {
              const exists = product.variants.some((v) => {
                const m = variantModel(v);
                return (!modelId || m?._id === modelId) && v.color === c.name && v.availableStock > 0;
              });
              return (
                <button
                  key={c.name}
                  type="button"
                  disabled={!exists && color !== c.name}
                  onClick={() => setColor(c.name)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${color === c.name ? 'border-primary-deep bg-surface' : 'border-border'} ${!exists ? 'opacity-40' : ''}`}
                >
                  <span className="mr-2 inline-block h-3 w-3 rounded-full border border-black/10" style={{ background: c.hex }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        <p className="mt-4 text-sm text-muted">
          {selected
            ? available > 0
              ? `${available} in stock · SKU ${selected.sku}`
              : 'Out of stock for this combination'
            : 'Select a valid model and color'}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Qty
            <input
              type="number"
              min={1}
              max={Math.max(1, available)}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(available || 1, Number(e.target.value) || 1)))}
              className="input ml-2 w-20"
              disabled={!canBuy}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canBuy}
            onClick={() => {
              if (!selected) return;
              addItem(selected._id, qty);
              setMsg('Added to cart');
            }}
          >
            Add to cart
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canBuy}
            onClick={() => {
              if (!selected) return;
              addItem(selected._id, qty);
              router.push('/checkout');
            }}
          >
            Buy now
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void toggleWish()}>
            {wish ? 'Wishlisted' : 'Wishlist'}
          </button>
        </div>
        {msg ? <p className="mt-3 text-sm text-success" role="status">{msg}</p> : null}

        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
          <p>{product.description}</p>
          {product.features?.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {product.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : null}
          {product.materials?.length ? <p>Materials: {product.materials.join(', ')}</p> : null}
          {product.careInstructions ? <p>Care: {product.careInstructions}</p> : null}
        </div>
      </div>
    </div>
  );
}
