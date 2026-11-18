'use client';

import { CloudOff, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Settings save themselves, so the only thing worth saying is that one did not. Sits just above
 * the play bar, where a phone held on a music stand still shows it.
 */
export function SaveNotice({ failed, onRetry, className }) {
  return (
    <div role="status" aria-live="polite" className={cn('pointer-events-none', className)}>
      {failed ? (
        <div className="pointer-events-auto mx-auto flex w-fit items-center gap-2 rounded-xl border border-destructive/40 bg-card py-1 pr-1 pl-3 text-sm">
          <CloudOff className="size-4 text-destructive" />
          <span>Couldn’t save your changes</span>
          <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg" onClick={onRetry}>
            <RotateCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
