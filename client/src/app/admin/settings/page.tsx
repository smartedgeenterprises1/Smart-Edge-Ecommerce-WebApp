'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { fromMinor, toMinor } from '@/lib/format';
import { mediaUrl } from '@/lib/config';
import { ImageSizeGuide, HERO_IMAGE_GUIDE } from '@/components/admin/image-size-guide';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Spinner } from '@/components/ui/misc';
import type { StoreSettings } from '@/types';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [form, setForm] = useState({
    storeName: 'SMART EDGE',
    tagline: '',
    announcement: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    shippingFlat: '250',
    freeShippingThreshold: '5000',
    serviceClaims: '',
    shippingPolicy: '',
    returnsPolicy: '',
    aboutPolicy: '',
  });

  useEffect(() => {
    void api<StoreSettings>('/api/admin/settings')
      .then((s) => {
        setHeroImageUrl(s.heroImageUrl || '');
        setForm({
          storeName: s.storeName || '',
          tagline: s.tagline || '',
          announcement: s.announcement || '',
          contactEmail: s.contactEmail || '',
          contactPhone: s.contactPhone || '',
          contactAddress: s.contactAddress || '',
          shippingFlat: String(fromMinor(s.shippingFlatMinor || 0)),
          freeShippingThreshold: String(fromMinor(s.freeShippingThresholdMinor || 0)),
          serviceClaims: (s.serviceClaims || []).join('\n'),
          shippingPolicy: s.policies?.shipping || '',
          returnsPolicy: s.policies?.returns || '',
          aboutPolicy: s.policies?.about || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const body = new FormData();
      body.append('file', file);
      const saved = await api<{ url: string }>('/api/admin/uploads', { method: 'POST', body });
      setHeroImageUrl(saved.url);
      setMsg('Image uploaded — Save settings dabao taake homepage pe lag jaye.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          storeName: form.storeName,
          tagline: form.tagline,
          announcement: form.announcement,
          heroImageUrl,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          contactAddress: form.contactAddress,
          shippingFlatMinor: toMinor(Number(form.shippingFlat) || 0),
          freeShippingThresholdMinor: toMinor(Number(form.freeShippingThreshold) || 0),
          serviceClaims: form.serviceClaims
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          policies: {
            shipping: form.shippingPolicy,
            returns: form.returnsPolicy,
            about: form.aboutPolicy,
          },
        }),
      });
      setMsg('Settings saved');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Save failed');
    }
  }

  if (loading) return <Spinner className="size-8" />;

  const preview = heroImageUrl ? mediaUrl(heroImageUrl) : '';

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary-ink">Settings</h1>
      <form onSubmit={onSubmit} className="grid max-w-3xl gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-3 rounded-xl border border-border bg-primary-soft/30 p-4">
          <h2 className="font-semibold text-primary-ink">Homepage hero image</h2>
          <ImageSizeGuide title="Recommended banner size" items={[...HERO_IMAGE_GUIDE]} />
          {preview ? (
            <div className="relative h-48 w-full overflow-hidden rounded-lg border border-border bg-[#071018] sm:h-56">
              <Image src={preview} alt="Hero preview" fill className="object-cover object-center" unoptimized />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn btn-secondary cursor-pointer">
              {uploading ? 'Uploading…' : 'Upload image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
              />
            </label>
            {heroImageUrl ? (
              <button
                type="button"
                className="text-sm text-danger"
                onClick={() => setHeroImageUrl('')}
              >
                Remove image
              </button>
            ) : null}
          </div>
        </div>

        {(
          [
            ['storeName', 'Store name'],
            ['tagline', 'Tagline'],
            ['announcement', 'Announcement bar'],
            ['contactEmail', 'Contact email'],
            ['contactPhone', 'Contact phone'],
            ['contactAddress', 'Contact address'],
            ['shippingFlat', 'Flat shipping (PKR)'],
            ['freeShippingThreshold', 'Free shipping threshold (PKR)'],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label} htmlFor={key}>
            <Input
              id={key}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </Field>
        ))}
        <div className="sm:col-span-2">
          <Field label="Service claims (one per line)" htmlFor="serviceClaims">
            <Textarea
              id="serviceClaims"
              value={form.serviceClaims}
              onChange={(e) => setForm({ ...form, serviceClaims: e.target.value })}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Shipping policy" htmlFor="shippingPolicy">
            <Textarea
              id="shippingPolicy"
              value={form.shippingPolicy}
              onChange={(e) => setForm({ ...form, shippingPolicy: e.target.value })}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Returns policy" htmlFor="returnsPolicy">
            <Textarea
              id="returnsPolicy"
              value={form.returnsPolicy}
              onChange={(e) => setForm({ ...form, returnsPolicy: e.target.value })}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="About" htmlFor="aboutPolicy">
            <Textarea
              id="aboutPolicy"
              value={form.aboutPolicy}
              onChange={(e) => setForm({ ...form, aboutPolicy: e.target.value })}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit">Save settings</Button>
          {msg ? <p className="mt-2 text-sm text-primary-ink">{msg}</p> : null}
        </div>
      </form>
    </div>
  );
}
