'use client';

import { useOptimistic, useTransition } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { switchFavourite } from '@/app/songs/[id]/actions';
import { cn } from '@/lib/utils';

/** `labelled` adds the word beside the star, for a row of actions that each say what they do. */
export function FavouriteButton({ songId, favourite, labelled = false, className }) {
  const [optimistic, setOptimistic] = useOptimistic(favourite);
  const [, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size={labelled ? 'default' : 'icon'}
      className={cn('no-print rounded-xl', labelled ? 'h-10 px-3' : 'size-10', className)}
      // A labelled button is named by its word and says its state by being pressed; the icon-only
      // one needs the whole sentence.
      aria-label={labelled ? undefined : optimistic ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={Boolean(optimistic)}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await switchFavourite(songId);
        })
      }
    >
      <Star className={cn('size-5', optimistic ? 'fill-brand text-brand' : 'text-muted-foreground')} />
      {labelled ? 'Favourite' : null}
    </Button>
  );
}
