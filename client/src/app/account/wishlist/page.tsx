'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ProductGrid } from '@/components/features/product-card';
import { Spinner, EmptyState } from '@/components/ui/misc';
import type { ProductListItem } from '@/types';

export default function WishlistPage() {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<ProductListItem[]>('/api/account/wishlist')
      .then((data) => setItems(Array.isArray(data) ? data.filter(Boolean) : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!items.length) {
    return (
      <EmptyState
        title="Wishlist is empty"
        description="Tap the heart on a product page to save it here."
        action={
          <Link href="/shop" className="btn btn-primary">
            Browse shop
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-primary-ink">Wishlist</h1>
      <ProductGrid products={items} />
    </div>
  );
}
