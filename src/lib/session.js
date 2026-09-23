import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from './auth.js';

export async function currentSession() {
  // Read the request before touching auth: `headers()` aborts the render during `next build`,
  // so this ordering is what keeps the build from opening (and creating) the database.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}

/** Null when nobody is signed in, for callers that answer rather than redirect. */
export async function currentUserId() {
  const session = await currentSession();
  return session?.user?.id ?? null;
}

/**
 * For pages. `src/proxy.js` already turns away requests with no session cookie, so this is
 * the check that matters — a cookie can be present and still not resolve to a session.
 */
export async function requireUserId() {
  const id = await currentUserId();
  if (!id) redirect('/login');
  return id;
}
