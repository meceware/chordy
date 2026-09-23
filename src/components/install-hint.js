'use client';

import { useEffect, useState } from 'react';
import { Share, SquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/lib/hooks';
import { siteConfig } from '@/components/config';

const SEEN = 'chordy.install-hint';

let verdict;

/**
 * Decided once per page load and then memoised, so the answer cannot change under a re-render
 * once the flag below has been written.
 */
function firstVisit() {
  verdict ??=
    !localStorage.getItem(SEEN) &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.matchMedia('(display-mode: standalone)').matches &&
    !navigator.standalone;

  return verdict;
}

/**
 * iOS only, and once ever: Safari has no install prompt and no `beforeinstallprompt`, so the
 * steps have to be spelled out, while every other browser offers installation by itself. The
 * flag is written as soon as the hint appears rather than on dismissal — ignoring it is an
 * answer too, and nobody wants to be asked twice.
 */
export function InstallHint() {
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = useState(false);
  const show = hydrated && !dismissed && firstVisit();

  useEffect(() => {
    if (show) localStorage.setItem(SEEN, '1');
  }, [show]);

  if (!show) return null;

  return (
    <aside className="no-print flex items-start gap-3 rounded-lg border border-border bg-accent/40 px-4 py-3 text-sm">
      <p className="flex-1 text-muted-foreground">
        Keep {siteConfig.name} on your home screen — tap <Share className="inline size-4 align-text-bottom" /> then{' '}
        <SquarePlus className="inline size-4 align-text-bottom" /> Add to Home Screen.
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="-mt-1 -mr-2 size-7 shrink-0"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" />
      </Button>
    </aside>
  );
}
