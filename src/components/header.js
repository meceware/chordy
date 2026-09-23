'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Pick } from '@/components/pick';
import { ModeToggle } from '@/components/mode-toggle';
import { AccountMenu } from '@/components/account-menu';
import { siteConfig } from '@/components/config';
import { cn } from '@/lib/utils';

const THRESHOLD = 8;

export function Header({ email = null }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      if (frame.current) return;

      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const y = window.scrollY;
        const delta = y - lastY.current;

        // Ignore sub-threshold movement so a few pixels of jitter, or the rubber-band
        // at the top of the page, does not flap the header.
        if (Math.abs(delta) < THRESHOLD) return;

        setHidden(delta > 0 && y > 64);
        lastY.current = y;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <header
      data-hidden={hidden}
      className={cn(
        'no-print hide-in-stage sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur',
        'transition-transform duration-300 ease-out',
        hidden && '-translate-y-full',
      )}
    >
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Pick className="size-5 text-primary" />
          {siteConfig.name}
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <ModeToggle />
          <AccountMenu email={email} />
        </div>
      </div>
    </header>
  );
}
