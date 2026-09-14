import { config } from './config';
import type { ApiError, ApiSuccess } from '@/types';

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type FetchOptions = RequestInit & {
  /** Forward cookies on the server (from next/headers). */
  cookie?: string;
  /** Skip throwing on non-2xx — return null instead for soft failures. */
  soft?: boolean;
};

function joinUrl(path: string) {
  const base = config.apiUrl.replace(/\/$/, '');
  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { cookie, soft, headers, ...rest } = options;
  const hdrs = new Headers(headers);

  if (rest.body && !hdrs.has('Content-Type') && !(rest.body instanceof FormData)) {
    hdrs.set('Content-Type', 'application/json');
  }
  if (cookie) hdrs.set('Cookie', cookie);

  const res = await fetch(joinUrl(path), {
    ...rest,
    headers: hdrs,
    credentials: 'include',
    cache: rest.cache ?? 'no-store',
  });

  const json = (await parseJson(res)) as ApiSuccess<T> | ApiError | null;

  if (!res.ok || !json || (json as ApiError).success === false) {
    const err = (json as ApiError)?.error;
    if (soft) return null as T;
    throw new ApiRequestError(
      err?.message || res.statusText || 'Request failed',
      res.status,
      err?.code,
      err?.details,
    );
  }

  return (json as ApiSuccess<T>).data;
}

/** Browser / shared client fetch */
export function api<T>(path: string, options?: RequestInit) {
  return apiFetch<T>(path, options);
}

/** Server Components / Route handlers — forwards session cookie when present */
export async function serverApi<T>(path: string, options: FetchOptions = {}): Promise<T> {
  let cookie = options.cookie;
  if (!cookie && typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const store = await cookies();
      cookie = store
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
    } catch {
      // outside request context
    }
  }
  return apiFetch<T>(path, { ...options, cookie });
}

export async function serverApiSoft<T>(path: string, options: FetchOptions = {}): Promise<T | null> {
  try {
    return await serverApi<T>(path, options);
  } catch {
    return null;
  }
}

/** Compatibility alias used by some pages */
export async function publicApiGet<T>(path: string): Promise<T> {
  return serverApi<T>(path);
}
