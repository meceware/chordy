'use client';

import { useOptimistic, useTransition } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { switchFavourite } from '@/app/songs/[id]/actions';
import { cn } from '@/lib/utils';

export function FavouriteButton({ songId, favourite }) {
  const [optimistic, setOptimistic] = useOptimistic(favourite);
  const [, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="no-print size-8"
      aria-label={optimistic ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={Boolean(optimistic)}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await switchFavourite(songId);
        })
      }
    >
      <Star className={cn('size-5', optimistic ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
    </Button>
  );
}
