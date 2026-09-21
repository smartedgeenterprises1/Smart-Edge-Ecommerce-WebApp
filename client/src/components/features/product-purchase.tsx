'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { api } from '@/lib/api';
import { formatPkr } from '@/lib/format';
import { mediaUrl } from '@/lib/config';
import { cn } from '@/lib/cn';
import type { ProductDetail, ProductVariant } from '@/types';

function modelLabel(v: ProductVariant) {
  const dm = v.deviceModelId;
  if (!dm || typeof dm === 'string') return 'Universal';
  const brand = typeof dm.brandId === 'object' && dm.brandId ? (dm.brandId as { name?: string }).name : '';
  return brand ? `${brand} ${dm.name}` : dm.name;
}

function modelId(v: ProductVariant) {
  const dm = v.deviceModelId;
  if (!dm) return '';
  return typeof dm === 'string' ? dm : dm._id;
}

function available(v: ProductVariant) {
  return Math.max(0, v.availableStock ?? v.stockOnHand - (v.stockReserved || 0));
}

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const variants = useMemo(() => product.variants || [], [product.variants]);

  const allModels = useMemo(() => {
    const seen = new Set<string>();
    return variants.filter((v) => {
      const id = modelId(v) || 'universal';
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [variants]);

  const [deviceKey, setDeviceKey] = useState(() => modelId(allModels[0]) || 'universal');

  const colorsForModel = useMemo(() => {
    const list = variants.filter((v) => (modelId(v) || 'universal') === deviceKey);
    const byColor = new Map<string, ProductVariant>();
    for (const v of list) {
      if (!byColor.has(v.color)) byColor.set(v.color, v);
    }
    return [...byColor.values()];
  }, [variants, deviceKey]);

  const [color, setColor] = useState(() => colorsForModel[0]?.color || '');

  useEffect(() => {
    if (!colorsForModel.some((v) => v.color === color)) {
      setColor(colorsForModel[0]?.color || '');
    }
  }, [colorsForModel, color]);

  const selected = useMemo(() => {
    return (
      variants.find((v) => v.color === color && (modelId(v) || 'universal') === deviceKey) ||
      variants.find((v) => (modelId(v) || 'universal') === deviceKey) ||
      variants[0]
    );
  }, [variants, color, deviceKey]);

  const images = useMemo(() => {
    const colorVariants = variants.filter((v) => v.color === color);
    const fromColor = colorVariants.flatMap((v) => v.images || []);
    const fromSelected = selected?.images?.length ? selected.images : [];
    const fromProduct = product.images || [];
    const merged = [...fromSelected, ...fromColor, ...fromProduct];
    const seen = new Set<string>();
    return merged.filter((img) => {
      if (!img?.url || seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });
  }, [variants, color, selected, product.images]);

  const [activeImg, setActiveImg] = useState(0);
  useEffect(() => {
    setActiveImg(0);
  }, [deviceKey, color]);

  const { addItem } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [wishBusy, setWishBusy] = useState(false);
  const router = useRouter();

  const stock = selected ? available(selected) : 0;
  const canBuy = Boolean(selected) && stock > 0;
  const maxQty = Math.max(1, Math.min(20, stock || 1));

  useEffect(() => {
    setQty((q) => Math.min(q, maxQty));
  }, [maxQty]);

  function onModelChange(nextKey: string) {
    setDeviceKey(nextKey);
    const nextColors = variants.filter((v) => (modelId(v) || 'universal') === nextKey);
    const preferred =
      nextColors.find((v) => v.color === color && available(v) > 0) ||
      nextColors.find((v) => available(v) > 0) ||
      nextColors[0];
    setColor(preferred?.color || '');
  }

  function onColor(c: string) {
    setColor(c);
  }

  function add(buyNow = false) {
    if (!selected) return;
    addItem(selected._id, Math.min(qty, maxQty));
    toast('Product added to cart');
    setMsg('');
    if (buyNow) router.push('/checkout');
  }

  async function toggleWishlist() {
    if (!user) {
      router.push(`/login?next=/product/${product.slug}`);
      return;
    }
    setWishBusy(true);
    try {
      await api(`/api/account/wishlist/${product._id}`, { method: 'POST' });
      setMsg('Saved to wishlist');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not update wishlist');
    } finally {
      setWishBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-muted-bg">
          <Image
            src={mediaUrl(images[activeImg]?.url || product.images?.[0]?.url)}
            alt={images[activeImg]?.alt || product.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 50vw"
          />
        </div>
        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.url + i}
                type="button"
                onClick={() => setActiveImg(i)}
                className={cn(
                  'relative size-16 shrink-0 overflow-hidden rounded-xl border-2',
                  i === activeImg ? 'border-primary-deep' : 'border-transparent',
                )}
                aria-label={`View image ${i + 1}`}
              >
                <Image src={mediaUrl(img.url)} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-ink sm:text-4xl">{product.title}</h1>
          <p className="mt-2 text-2xl font-semibold">{formatPkr(selected?.priceMinor ?? product.basePriceMinor)}</p>
          {selected?.compareAtPriceMinor && selected.compareAtPriceMinor > selected.priceMinor ? (
            <p className="text-sm text-muted line-through">{formatPkr(selected.compareAtPriceMinor)}</p>
          ) : null}
        </div>

        {allModels.length ? (
          <fieldset>
            <legend className="label">1. Choose your phone model</legend>
            <select
              className="input mt-1 w-full max-w-md"
              value={deviceKey}
              onChange={(e) => onModelChange(e.target.value)}
              aria-label="Phone model"
            >
              {allModels.map((v) => {
                const key = modelId(v) || 'universal';
                return (
                  <option key={v._id} value={key}>
                    {modelLabel(v)}
                  </option>
                );
              })}
            </select>
          </fieldset>
        ) : null}

        {colorsForModel.length ? (
          <fieldset>
            <legend className="label">2. Choose color{color ? `: ${color}` : ''}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {colorsForModel.map((v) => {
                const inStock = available(v) > 0;
                return (
                  <button
                    key={v.color}
                    type="button"
                    onClick={() => inStock && onColor(v.color)}
                    disabled={!inStock}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
                      v.color === color ? 'border-primary-deep bg-primary-soft' : 'border-border bg-white',
                      !inStock && 'cursor-not-allowed opacity-40',
                    )}
                    aria-pressed={v.color === color}
                    title={inStock ? v.color : `${v.color} — out of stock`}
                  >
                    <span
                      className="size-4 rounded-full border border-black/10"
                      style={{ background: v.colorHex || '#ccc' }}
                    />
                    {v.color}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <p className="text-sm">
          {canBuy ? (
            <span className="font-medium text-success">{stock} in stock</span>
          ) : (
            <span className="font-medium text-danger">Out of stock</span>
          )}
          {selected?.sku ? <span className="text-muted"> · SKU {selected.sku}</span> : null}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="qty" className="sr-only">
            Quantity
          </label>
          <QuantityStepper
            id="qty"
            value={Math.min(qty, maxQty)}
            min={1}
            max={maxQty}
            disabled={!canBuy}
            onChange={setQty}
          />
          <Button onClick={() => add(false)} disabled={!canBuy}>
            Add to cart
          </Button>
          <Button variant="secondary" onClick={() => add(true)} disabled={!canBuy}>
            Buy now
          </Button>
          <Button variant="ghost" onClick={toggleWishlist} disabled={wishBusy} aria-label="Add to wishlist">
            <Heart size={18} />
          </Button>
        </div>
        {msg ? <p className="text-sm text-primary-ink" role="status">{msg}</p> : null}

        {product.description ? (
          <div className="prose prose-sm max-w-none border-t border-border pt-5 text-muted">
            <p className="whitespace-pre-wrap">{product.description}</p>
          </div>
        ) : null}
        {product.features?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {product.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
