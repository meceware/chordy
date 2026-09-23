'use client';

import { useEffect } from 'react';

/**
 * Left out of development on purpose: a worker that answers navigations from cache fights
 * Turbopack's hot reload, and the install prompt only needs the production build anyway.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  }, []);

  return null;
}
