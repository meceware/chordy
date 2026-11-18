import Link from 'next/link';
import { Pick } from '@/components/pick';
import { ModeToggle } from '@/components/mode-toggle';
import { AccountMenu } from '@/components/account-menu';
import { GitHubMark } from '@/components/github-mark';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/components/config';

/**
 * The same header on every page, and it never moves: the page scrolls underneath it, between it
 * and whatever bar a page keeps at the bottom.
 */
export function Header({ email = null }) {
  return (
    <header className="no-print hide-in-stage shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-3">
        <Link href="/" className="flex h-11 items-center gap-2 rounded-xl px-1 text-[17px] font-semibold tracking-tight">
          <Pick className="size-5 text-brand" />
          {siteConfig.name}
        </Link>
        <div className="ml-auto flex items-center gap-0.5">
          <Button asChild variant="ghost" size="icon" className="size-11 rounded-xl">
            <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer" aria-label="Chordy on GitHub" title="Chordy on GitHub">
              <GitHubMark className="size-5" />
            </a>
          </Button>
          <ModeToggle />
          <AccountMenu email={email} />
        </div>
      </div>
    </header>
  );
}
