'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { ChevronLeft, ChevronRight, Play, Search } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { SongRow, SongRows, songMeta } from '@/components/song-row';

const FUSE_OPTIONS = { keys: ['title', 'artist'], threshold: 0.4, ignoreLocation: true };

/**
 * Picking the next song, as a list rather than a pair of arrows. The arrows went unused because
 * "the next one in title order" is rarely the song you want next; the one after this one is
 * still a single tap away at the top.
 *
 * `songs` arrives in title order, and "up next" walks that order. Not recently-opened order:
 * opening a song records a view, which moves it to the front of the very sequence being walked,
 * so next and previous would swap on every step.
 */
export function SongsDrawer({ open, onOpenChange, songs, currentId }) {
  const [query, setQuery] = useState('');

  const index = songs.findIndex((song) => song.id === currentId);
  const previous = index > 0 ? songs[index - 1] : null;
  const next = index >= 0 ? (songs[index + 1] ?? null) : null;

  const fuse = useMemo(() => new Fuse(songs, FUSE_OPTIONS), [songs]);
  const shown = query.trim() ? fuse.search(query).map((hit) => hit.item) : songs;

  const close = (value) => {
    if (!value) setQuery('');
    onOpenChange(value);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={close} title="Songs" className="sm:max-w-lg">
      <div className="space-y-4">
        {next || previous ? (
          <div className="flex gap-2">
            {previous ? (
              <Link
                href={`/songs/${previous.id}`}
                onClick={() => close(false)}
                aria-label={`Previous song: ${previous.title}`}
                className="grid h-16 w-12 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ChevronLeft className="size-5" />
              </Link>
            ) : null}

            {next ? (
              <Link
                href={`/songs/${next.id}`}
                onClick={() => close(false)}
                className="flex h-16 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border px-3 hover:bg-accent"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-brand">
                  <Play className="size-4 fill-current" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">Up next</span>
                  <span className="block truncate font-semibold">{next.title}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            ) : (
              <p className="flex h-16 flex-1 items-center rounded-xl border border-dashed border-border px-4 text-sm text-muted-foreground">
                This is the last song.
              </p>
            )}
          </div>
        ) : null}

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a song"
            aria-label="Find a song"
            className="h-11 rounded-xl pl-9"
          />
        </div>

        {/* The same rows as the library, so a song looks the same wherever you pick it from. The
            dialog only ever opens after hydration, so the opened-when line is safe to work out. */}
        {shown.length > 0 ? (
          <SongRows>
            {shown.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                meta={songMeta(song, 'title')}
                current={song.id === currentId}
                onClick={() => close(false)}
              />
            ))}
          </SongRows>
        ) : (
          <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            Nothing matches “{query}”.
          </p>
        )}
      </div>
    </ResponsiveDialog>
  );
}
