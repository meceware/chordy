import { NextResponse } from 'next/server';

// `/offline` is public because the service worker stores it at install time and serves it to
// whoever is holding the phone when the network drops.
const PUBLIC = ['/login', '/api/auth', '/offline'];

/**
 * An optimistic check only: it looks for the session cookie, not a valid session. The Next
 * docs are explicit that proxy is not a place for session management, so the real check
 * lives in `requireUserId()` on each page. This just saves unauthenticated requests a trip
 * through rendering.
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  const signedIn = request.cookies.getAll().some((cookie) => cookie.name.startsWith('chordy.session_token'));
  if (signedIn) return NextResponse.next();

  const login = new URL('/login', request.url);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icons/|manifest.webmanifest|robots.txt|sw.js).*)',
  ],
};
