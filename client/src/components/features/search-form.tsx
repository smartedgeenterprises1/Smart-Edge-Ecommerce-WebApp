'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export function SearchForm({ initialQuery = '' }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const router = useRouter();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2" role="search">
      <label htmlFor="search-q" className="sr-only">
        Search
      </label>
      <Input
        id="search-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search covers…"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}
