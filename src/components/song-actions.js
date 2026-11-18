'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Download, Ellipsis, Headphones, PencilLine, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavouriteButton } from '@/components/favourite-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { removeSong } from '@/app/songs/actions';
import { cn } from '@/lib/utils';

/**
 * Everything you do *to* a song rather than with it while playing, kept with its title: listen
 * (where the song has a recording), favourite and edit in view, each with its name; download,
 * print and delete one tap further in.
 */
export function SongActions({ songId, title, favourite, mediaUrl, className }) {
  const [confirming, setConfirming] = useState(false);
  const [, startTransition] = useTransition();

  return (
    // Tighter on a phone, where four labelled actions share the card's width on one line.
    <div className={cn('no-print flex shrink-0 items-center gap-0.5 sm:gap-1', className)}>
      {mediaUrl ? (
        <Button asChild variant="ghost" className="h-10 gap-1.5 rounded-xl px-2 has-[>svg]:px-2 sm:gap-2 sm:px-3 sm:has-[>svg]:px-3">
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer" title="Listen, in a new tab">
            <Headphones className="size-5 text-muted-foreground" />
            Listen
          </a>
        </Button>
      ) : null}
      <FavouriteButton songId={songId} favourite={favourite} labelled className="gap-1.5 px-2 has-[>svg]:px-2 sm:gap-2 sm:px-3 sm:has-[>svg]:px-3" />
      <Button asChild variant="ghost" className="h-10 gap-1.5 rounded-xl px-2 has-[>svg]:px-2 sm:gap-2 sm:px-3 sm:has-[>svg]:px-3">
        <Link href={`/songs/${songId}/edit`}>
          <PencilLine className="size-5 text-muted-foreground" />
          Edit
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="size-10 rounded-xl" aria-label="More for this song" title="More">
            <Ellipsis className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-52 rounded-xl">
          <DropdownMenuItem asChild className="min-h-11">
            <a href={`/songs/${songId}/export`}>
              <Download className="size-4" />
              Download as Markdown
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" onSelect={() => window.print()}>
            <Printer className="size-4" />
            Print
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="min-h-11" onSelect={() => setConfirming(true)}>
            <Trash2 className="size-4" />
            Delete song
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
            <AlertDialogDescription>The sheet and its tags are removed for good. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => startTransition(() => removeSong(songId))}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
