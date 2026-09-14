import { NextResponse, type NextRequest } from 'next/server';

function hostOnly(value: string | null): string {
  return (value || '').split(':')[0].toLowerCase().trim();
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
}

export function middleware(req: NextRequest) {
  const host = hostOnly(req.headers.get('host'));
  const adminHost = hostOnly(process.env.NEXT_PUBLIC_ADMIN_HOST || null);
  const storeHost = hostOnly(process.env.NEXT_PUBLIC_STORE_HOST || null);
  const { pathname } = req.nextUrl;

  // Local / preview without custom hosts: keep single-domain behavior.
  if (!adminHost || !storeHost || isLocalHost(host)) {
    return NextResponse.next();
  }

  const isAdmin = host === adminHost;
  const apex = storeHost.replace(/^www\./, '');
  const isStore = host === storeHost || host === apex || host === `www.${apex}`;

  // admin.smartedge.com → admin app only
  if (isAdmin) {
    const allowedAuth =
      pathname.startsWith('/login') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password');

    if (allowedAuth || pathname.startsWith('/admin') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
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
