import Link from 'next/link';
import { Pick } from '@/components/pick';
import { GitHubMark } from '@/components/github-mark';
import { siteConfig } from '@/components/config';

/**
 * Full width like the header, so its rule runs edge to edge; the text keeps to the page column.
 * The name sits on the left, where the header keeps it; the source and the copyright on the right.
 */
export function SiteFooter() {
  return (
    <footer className="no-print shrink-0 border-t border-border">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4 text-sm text-muted-foreground">
        <Link href="/" className="flex items-center gap-1.5 font-medium text-foreground hover:underline">
          <Pick className="size-3.5 text-brand" />
          {siteConfig.name}
        </Link>
        <span className="flex items-center gap-4">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground hover:underline"
          >
            <GitHubMark className="size-4" />
            GitHub
          </a>
          <span>© {new Date().getFullYear()}</span>
        </span>
      </div>
    </footer>
  );
}
