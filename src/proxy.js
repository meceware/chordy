import { NextResponse } from 'next/server';
import { sessionFor } from '@/lib/session';

// `/offline` is public because the service worker stores it at install time and serves it to
// whoever is holding the phone when the network drops.
const PUBLIC = ['/login', '/api/auth', '/offline'];

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  if (await sessionFor(request)) return NextResponse.next();

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icons/|manifest.webmanifest|robots.txt|sw.js).*)',
  ],
};
