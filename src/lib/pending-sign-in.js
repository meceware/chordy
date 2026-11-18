'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { siteConfig } from '@/components/config';

// The sign-in that is waiting for its code: which address, and when the email went out. Held in
// memory only, for as long as the page is open, so closing the dialog and opening it again comes
// back to the code; a reload starts over. Nothing is written to the browser, and never the code.
let current = null;
const listeners = new Set();

function read() {
  // Past the code's lifetime there is nothing left to type in, so it reads as no sign-in at all.
  if (current && Date.now() - current.sentAt >= siteConfig.signIn.codeSeconds * 1000) return null;
  return current;
}

function write(value) {
  current = value;
  for (const listener of listeners) listener();
}

export function clearPendingSignIn() {
  write(null);
}

/** Seconds until another email may be sent; 0 once it may. */
export function resendWaitFor(sentAt) {
  const elapsed = Math.floor((Date.now() - sentAt) / 1000);
  return Math.max(0, siteConfig.signIn.resendSeconds - elapsed);
}

/**
 * `[{ email, sentAt } | null, set]`, shared by every component that asks and kept in step between
 * them. Null on the server.
 */
export function usePendingSignIn() {
  const subscribe = useCallback((onChange) => {
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  }, []);

  return [useSyncExternalStore(subscribe, read, () => null), write];
}
