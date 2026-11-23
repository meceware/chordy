import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BackLink({ href, label, onClick, className }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        '-ml-1.5 inline-flex h-9 min-w-0 items-center gap-0.5 rounded-lg pr-2 pl-1 text-sm text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <ChevronLeft className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/**
 * A page's own actions, pinned to the top of the scrolling area under the header: where an
 * editor keeps its save state and its way out.
 */
export function PageBar({ children }) {
  return (
    <div className="sticky top-(--header-offset) z-30 -mx-4 mb-4 flex min-h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur transition-[top] duration-200 motion-reduce:transition-none">
      {children}
    </div>
  );
}
