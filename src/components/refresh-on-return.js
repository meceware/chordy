'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Back and forward bring a page back as it was when you left it: Next restores it from its own
 * cache, and the browser's back-forward cache can restore the whole page. The library would then
 * still show the song you just opened as never opened, and Continue would point at the one before.
 * So a page reached that way is fetched again, the same as following a link to it. Client state
 * (a song's key, the metronome) survives a refresh.
 */
export function RefreshOnReturn() {
  const router = useRouter();

  useEffect(() => {
    // After Next has handled the same event and put the page back, so the refresh is for it.
    const onBackOrForward = () => setTimeout(() => router.refresh(), 0);
    const onShow = (event) => {
      if (event.persisted) router.refresh();
    };

    window.addEventListener('popstate', onBackOrForward);
    window.addEventListener('pageshow', onShow);
    return () => {
      window.removeEventListener('popstate', onBackOrForward);
      window.removeEventListener('pageshow', onShow);
    };
  }, [router]);

  return null;
}
