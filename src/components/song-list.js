'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { Search, Star, Music2, ArrowDownUp, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TagBadges } from '@/components/tag-badges';
import { artistOf } from '@/lib/display';
import { tagColor } from '@/lib/tag-color';
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
  favourite: { label: 'Favourites first', compare: (a, b) => b.favourite - a.favourite || byTitle(a, b) },
};

export function SongList({ songs }) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState(null);
  const [sort, setSort] = useState('recent');

  const fuse = useMemo(() => new Fuse(songs, FUSE_OPTIONS), [songs]);
  const tags = useMemo(() => [...new Set(songs.flatMap((song) => song.tags))].sort(), [songs]);

  const results = useMemo(() => {
    // A fuzzy search is already ranked by relevance, so sorting it again would throw the
    // ranking away; the chosen order applies to the unfiltered list.
    const searching = query.trim() !== '';
    const base = searching ? fuse.search(query).map((hit) => hit.item) : [...songs].sort(SORTS[sort].compare);

    return tag ? base.filter((song) => song.tags.includes(tag)) : base;
  }, [fuse, query, songs, sort, tag]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search songs, artists, tags"
            aria-label="Search songs"
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="h-9 w-full sm:w-auto" aria-label="Sort songs">
              <ArrowDownUp className="size-4 text-muted-foreground" />
              {SORTS[sort].label}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            {Object.entries(SORTS).map(([value, { label }]) => (
              <DropdownMenuItem key={value} onSelect={() => setSort(value)} className="gap-2">
                <Check className={cn('size-4', sort === value ? 'opacity-100' : 'opacity-0')} />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((name) => (
          <button key={name} type="button" onClick={() => setTag(tag === name ? null : name)}>
            <Badge
              className={cn(
                'cursor-pointer border-transparent font-medium',
                tagColor(name),
                tag === name && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
              )}
            >
              {name}
            </Badge>
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {songs.length === 0 ? (
            <>
              Nothing here yet.{' '}
              <Link href="/songs/new" className="text-primary underline underline-offset-4 hover:no-underline">
                Add your first chord sheet
              </Link>
              .
            </>
          ) : (
            `Nothing matches “${query}”.`
          )}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {results.map((song) => (
            <li key={song.id}>
              <Link
                href={`/songs/${song.id}`}
                className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent/60"
              >
                <Music2 className="size-4 shrink-0 text-muted-foreground" />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{song.title}</span>
                    {song.favourite ? (
                      <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                    ) : null}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {artistOf(song)}
                  </span>

                  <TagBadges tags={song.tags} className="mt-1 sm:hidden" />
                </span>

                <TagBadges tags={song.tags} className="hidden sm:flex" />

                <span className="w-10 shrink-0 self-start text-right font-mono text-sm text-primary sm:self-center">
                  {song.songKey}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
