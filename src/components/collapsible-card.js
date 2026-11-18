'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/**
 * A card that folds to its title row, so what sits between the song's card and its sheet costs
 * one line each until asked for. The title row is tinted apart from the body. `summary` rides in
 * the folded title row, as a hint of what opening it shows; open, the body says it instead.
 *
 * Folded, the body is not on the page at all, so anything heavy inside (a video player) is only
 * loaded once the card is opened.
 */
export function CollapsibleCard({ icon: Icon, title, summary = null, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="no-print hide-in-stage overflow-hidden rounded-xl border border-border bg-card">
      <h2>
        <CollapsibleTrigger className="flex min-h-14 w-full items-center gap-2.5 bg-secondary px-4 py-2 text-left text-base font-semibold transition-colors hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset">
          <Icon className="size-5 shrink-0 text-brand" aria-hidden />
          {title}
          {summary && !open ? <span className="min-w-0 flex-1 truncate text-sm font-normal">{summary}</span> : null}
          <ChevronDown
            className={cn('ml-auto size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </CollapsibleTrigger>
      </h2>

      <CollapsibleContent className="border-t border-border">{children}</CollapsibleContent>
    </Collapsible>
  );
}
