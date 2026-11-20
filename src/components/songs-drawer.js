'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { ChevronLeft, ChevronRight, Play, Search } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { SongRow, SongRows, songMeta } from '@/components/song-row';

const FUSE_OPTIONS = { keys: ['title', 'artist'], threshold: 0.4, ignoreLocation: true };

// Songs listed before anything is typed: the ones opened last. Search reaches every song.
const LIMIT = 10;
const byRecent = (a, b) => (b.viewedAt ?? 0) - (a.viewedAt ?? 0) || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

/**
 * Picking the next song, as a list rather than a pair of arrows. The arrows went unused because
 * "the next one in title order" is rarely the song you want next; the one after this one is
 * still a single tap away at the top.
 *
 * `songs` arrives in title order, and "up next" walks that order. Not recently-opened order:
 * opening a song records a view, which moves it to the front of the very sequence being walked,
 * so next and previous would swap on every step. The list below is the other way round: the ten
 * opened last, since a long library listed in full is a scroll, not a choice.
 */
export function SongsDrawer({ open, onOpenChange, songs, currentId }) {
  const [query, setQuery] = useState('');

  const index = songs.findIndex((song) => song.id === currentId);
  // The order goes round: after the last song comes the first again, and before the first, the
  // last. With a single song there is nowhere to step to.
  const stepping = index >= 0 && songs.length > 1;
  const previous = stepping ? songs[(index - 1 + songs.length) % songs.length] : null;
  const next = stepping ? songs[(index + 1) % songs.length] : null;

  const fuse = useMemo(() => new Fuse(songs, FUSE_OPTIONS), [songs]);
  const recent = useMemo(() => [...songs].sort(byRecent).slice(0, LIMIT), [songs]);
  const searching = query.trim() !== '';
  const shown = searching ? fuse.search(query).map((hit) => hit.item) : recent;

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
            ) : null}
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

        {!searching && songs.length > LIMIT ? (
          <p className="text-center text-xs text-muted-foreground">
            The {LIMIT} you opened last. Search to find any of your {songs.length} songs.
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  );
}
