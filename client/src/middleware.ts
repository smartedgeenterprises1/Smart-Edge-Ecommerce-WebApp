import { NextResponse, type NextRequest } from 'next/server';

function hostOnly(value: string | null): string {
  return (value || '').split(':')[0].toLowerCase().trim();
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
}

function apexOf(host: string): string {
  return host.replace(/^www\./, '').replace(/^admin\./, '');
}

export function middleware(req: NextRequest) {
  const host = hostOnly(req.headers.get('host'));
  const { pathname } = req.nextUrl;

  // Local / default vercel.app preview: keep single-domain behavior.
  if (isLocalHost(host) || host.endsWith('.vercel.app')) {
    return NextResponse.next();
  }

  const configuredAdmin = hostOnly(process.env.NEXT_PUBLIC_ADMIN_HOST || null);
  const configuredStore = hostOnly(process.env.NEXT_PUBLIC_STORE_HOST || null);

  const apex = apexOf(configuredStore || configuredAdmin || host);
  const adminHost = configuredAdmin || `admin.${apex}`;
  const storeHost = configuredStore || `www.${apex}`;

  // Prefer explicit env, otherwise auto-detect admin.* subdomain
  const isAdmin = configuredAdmin ? host === configuredAdmin : host.startsWith('admin.');
  const isStore =
    host === storeHost || host === apex || host === `www.${apex}` || (!isAdmin && host.endsWith(apex));

  // admin.smartedgeenterprises.com → admin app only
  if (isAdmin) {
    const allowedAuth =
      pathname.startsWith('/login') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password');

    if (
      allowedAuth ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/_next') ||
      pathname === '/favicon.ico'
    ) {
      if (pathname === '/') {
        const url = req.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();
    }

    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  // www / apex storefront → never serve /admin here
  if (isStore && pathname.startsWith('/admin')) {
    const url = req.nextUrl.clone();
    url.hostname = adminHost;
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
