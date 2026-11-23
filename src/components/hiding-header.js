'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// How far the page must move one way before the header follows: a slow auto-scroll still hides
// it, while a hand resting on the screen does not make it flicker.
const SLACK = 8;

/**
 * The header, stuck to the top of the window: it slides away while you scroll down, comes back as
 * soon as you scroll up, and is always there at the top of the page. `--header-offset` says how
 * much of the window it covers, for anything else that sticks to the top (a page's own bar).
 */
export function HidingHeader({ className, children }) {
  const ref = useRef(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (y <= (ref.current?.offsetHeight ?? 0)) {
        setHidden(false);
        last = y;
        return;
      }
      if (Math.abs(y - last) < SLACK) return;
      setHidden(y > last);
      last = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--header-offset', hidden ? '0px' : `${ref.current?.offsetHeight ?? 0}px`);
  }, [hidden]);

  return (
    <header
      ref={ref}
      className={cn(
        'sticky top-0 z-40 transition-transform duration-200 motion-reduce:transition-none',
        // Back in view whenever something in it has keyboard focus.
        hidden && '-translate-y-full focus-within:translate-y-0',
        className,
      )}
    >
      {children}
    </header>
  );
}
