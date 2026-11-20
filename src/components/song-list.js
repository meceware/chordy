'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { ArrowDownUp, Check, Music2, Play, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SongRow, SongRows, songMeta } from '@/components/song-row';
import { artistOf } from '@/lib/display';
import { useHydrated, useStoredChoice } from '@/lib/hooks';
import { tagColor, tagColorSelected } from '@/lib/tag-color';
import { cn } from '@/lib/utils';

const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'artist', weight: 2 },
    { name: 'tags', weight: 1 },
    { name: 'songKey', weight: 1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
};

const byTitle = (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

const SORTS = {
  // Songs never opened have no timestamp, so they fall to the end rather than the front.
  recent: { label: 'Recently opened', compare: (a, b) => (b.viewedAt ?? 0) - (a.viewedAt ?? 0) || byTitle(a, b) },
  title: { label: 'Title', compare: byTitle },
  artist: { label: 'Artist', compare: (a, b) => artistOf(a).localeCompare(artistOf(b), undefined, { sensitivity: 'base' }) || byTitle(a, b) },
  added: { label: 'Recently added', compare: (a, b) => b.createdAt - a.createdAt || byTitle(a, b) },
};
const SORT_KEYS = Object.keys(SORTS);

const FAVOURITES = Symbol('favourites');

const NEUTRAL = {
  tint: 'bg-secondary text-secondary-foreground ring-border hover:bg-accent',
  solid: 'bg-foreground text-background ring-foreground',
};

/**
 * A filter chip. Tags wear the same colour here as on every song row, faint until chosen and
 * filled in once chosen, so the filter and the songs it keeps read as the same thing.
 */
function Chip({ active, onClick, colors, count, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        // The pseudo-element lifts the tap target to 44px without making the chip itself taller.
        // `grow`: the chips on a full row share its spare width, so every row ends flush.
        'relative inline-flex h-9 shrink-0 grow items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-medium ring-1 transition-colors ring-inset',
        'after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active ? colors.solid : colors.tint,
      )}
    >
      {children}
      <span className="tabular-nums opacity-60">{count}</span>
    </button>
  );
}

function Continue({ song }) {
  return (
    <Link
      href={`/songs/${song.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Play className="size-5 fill-current" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">Continue playing</span>
        <span className="block truncate text-[17px] font-semibold">{song.title}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {artistOf(song)}
          {song.songKey ? ` · key ${song.songKey}` : ''}
        </span>
      </span>
    </Link>
  );
}

export function SongList({ songs }) {
  const [query, setQuery] = useState('');
  const [shelf, setShelf] = useState(null);
  const [sort, setSort] = useStoredChoice('chordy.sort', 'recent', SORT_KEYS);
  // Relative dates depend on the viewer's clock and timezone, which the server render cannot know.
  const hydrated = useHydrated();

  const fuse = useMemo(() => new Fuse(songs, FUSE_OPTIONS), [songs]);
  const tagCounts = useMemo(() => {
    const counts = new Map();
    for (const song of songs) for (const name of song.tags) counts.set(name, (counts.get(name) ?? 0) + 1);
    return [...counts].sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [songs]);
  const favourites = songs.filter((song) => song.favourite).length;
  const recent = useMemo(
    () => songs.filter((song) => song.viewedAt).sort((a, b) => b.viewedAt - a.viewedAt)[0] ?? null,
    [songs],
  );

  const searching = query.trim() !== '';

  const results = useMemo(() => {
    // A fuzzy search is already ranked by relevance, so sorting it again would throw the
    // ranking away; the chosen order applies to the unfiltered list.
    const base = searching ? fuse.search(query).map((hit) => hit.item) : [...songs].sort(SORTS[sort].compare);
    if (shelf === FAVOURITES) return base.filter((song) => song.favourite);
    return shelf ? base.filter((song) => song.tags.includes(shelf)) : base;
  }, [fuse, query, searching, songs, sort, shelf]);

  const toggle = (next) => setShelf((current) => (current === next ? null : next));

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-secondary text-brand">
          <Music2 className="size-6" />
        </span>
        <div className="space-y-1">
          <p className="font-medium">No songs yet</p>
          <p className="text-sm text-muted-foreground">Paste a chord sheet from anywhere — plain text or ChordPro.</p>
        </div>
        <Button asChild className="h-11 rounded-xl px-5">
          <Link href="/songs/new">Add your first song</Link>
        </Button>
      </div>
    );
  }

  return (
    <section aria-label="Library" className="space-y-4">
      {recent ? <Continue song={recent} /> : null}

      <div className="flex items-center gap-2">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search songs, artists, tags"
            aria-label="Search songs"
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </label>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 rounded-xl"
              aria-label={`Sort: ${SORTS[sort].label}`}
              title={`Sort: ${SORTS[sort].label}`}
            >
              <ArrowDownUp className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            {SORT_KEYS.map((value) => (
              <DropdownMenuItem key={value} onSelect={() => setSort(value)} className="min-h-11 gap-2">
                <Check className={cn('size-4', sort === value ? 'opacity-100' : 'opacity-0')} />
                {SORTS[value].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {tagCounts.length > 0 || favourites > 0 ? (
        // Every chip in view, wrapping onto as many rows as it takes, at every width.
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2 py-1">
          <Chip active={shelf === null} onClick={() => setShelf(null)} colors={NEUTRAL} count={songs.length}>
            All
          </Chip>
          {favourites > 0 ? (
            <Chip active={shelf === FAVOURITES} onClick={() => toggle(FAVOURITES)} colors={NEUTRAL} count={favourites}>
              <Star className={cn('size-3.5', shelf === FAVOURITES ? 'fill-current' : 'fill-brand text-brand')} aria-hidden />
              Favourites
            </Chip>
          ) : null}
          {tagCounts.map(([name, count]) => (
            <Chip
              key={name}
              active={shelf === name}
              onClick={() => toggle(name)}
              colors={{ tint: tagColor(name), solid: tagColorSelected(name) }}
              count={count}
            >
              {name}
            </Chip>
          ))}
          {/* Takes the last row's spare width, so a few chips left over keep their own size
              instead of stretching across it. The margin cancels the gap before it. */}
          <span aria-hidden className="-ml-2 h-0 basis-0 grow-[999]" />
        </div>
      ) : null}

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          {searching ? `Nothing matches “${query}”.` : 'Nothing here yet.'}
        </p>
      ) : (
        <SongRows>
          {results.map((song) => (
            <SongRow key={song.id} song={song} meta={hydrated ? songMeta(song, sort) : null} />
          ))}
        </SongRows>
      )}
    </section>
  );
}
