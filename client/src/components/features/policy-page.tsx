import { serverApiSoft } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { StoreSettings } from '@/types';

type PolicyKey = 'about' | 'shipping' | 'returns' | 'privacy' | 'terms' | 'faq';

export function createPolicyPage(
  title: string,
  path: string,
  key: PolicyKey,
  fallback: string,
) {
  return async function PolicyPage() {
    const settings = await serverApiSoft<StoreSettings>('/api/settings');
    const body = settings?.policies?.[key] || fallback;
    const draft = settings?.policies?.policiesAreDraft;
    return (
      <div className="container-se py-10">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-primary-ink">{title}</h1>
          {draft ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-warning">
              {settings?.policies?.draftDisclaimer || 'Draft policy — confirm before launch.'}
            </p>
          ) : null}
          <div className="prose prose-slate mt-6 max-w-none whitespace-pre-wrap text-muted">{body}</div>
        </article>
      </div>
    );
  };
}

export function policyMetadata(title: string, path: string) {
  return buildMetadata({ title, path });
}
