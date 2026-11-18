import { NextResponse } from 'next/server';
import { sessionFor } from '@/lib/session';

// `/offline` is public because the service worker stores it at install time and serves it to
// whoever is holding the phone when the network drops.
const PUBLIC = ['/api/auth', '/offline'];

// The home page is the one exact path anyone may load: signed out it renders the static landing
// page and reads nothing; signed in it is the library, scoped by the session like every other
// page. Exact match only `/songs/...` and everything else stays behind the redirect below.
const PUBLIC_EXACT = ['/'];

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_EXACT.includes(pathname)) return NextResponse.next();
  if (PUBLIC.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  if (await sessionFor(request)) return NextResponse.next();

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icons/|manifest.webmanifest|robots.txt|sw.js).*)',
  ],
};
