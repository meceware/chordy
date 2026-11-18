import Link from 'next/link';
import { ChevronRight, Music2, Star } from 'lucide-react';
import { TagPill } from '@/components/tag-pills';
import { artistOf } from '@/lib/display';
import { cn } from '@/lib/utils';

const DAY = 24 * 60 * 60 * 1000;

/** "today", "yesterday", "3 days ago", then a date: when a song was last opened or added. */
function when(timestamp) {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const days = Math.ceil((startOfToday - timestamp) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;

  const date = new Date(timestamp);
  const thisYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(thisYear ? {} : { year: 'numeric' }) });
}

/**
 * Every row says when the song was last opened, whatever the order. Sorted by date added, it says
 * that instead, so the reason a song sits where it does is right there. Depends on the viewer's
 * clock, so call it only once the page has hydrated.
 */
export function songMeta(song, sort) {
  if (sort === 'added') return `Added ${when(song.createdAt)}`;
  return song.viewedAt ? `Opened ${when(song.viewedAt)}` : 'Not opened yet';
}

// A tag in a row is capped and truncated, so a long one never crowds out the rest of the row.
const ROW_TAG = 'inline-block max-w-28 truncate leading-5';

function RowTags({ tags, limit, className }) {
  const shown = tags.slice(0, limit);
  const more = tags.length - shown.length;

  return (
    <span className={cn('items-center gap-1', className)}>
      {shown.map((name) => (
        <TagPill key={name} name={name} className={ROW_TAG} />
      ))}
      {more > 0 ? <span className="text-xs text-muted-foreground">+{more}</span> : null}
    </span>
  );
}

/**
 * The frame rows sit in: one list with a hairline between rows, not a stack of cards. It is a
 * size container, so a row lays itself out by the room the list has — the library on a wide
 * screen, or the narrower songs dialog — rather than by the width of the window.
 */
export function SongRows({ className, children }) {
  return <ul className={cn('@container divide-y divide-border overflow-hidden rounded-xl border border-border bg-card', className)}>{children}</ul>;
}

/**
 * The song on the left — key, title, artist — centred in the row; on the right, its tags, a rule,
 * and when it was last opened (or added). A narrow list has no room on the right, so there both
 * take their own lines under the artist, and the title keeps the full width.
 *
 * `current` marks the song already on screen, in the songs dialog.
 */
export function SongRow({ song, meta, current = false, onClick }) {
  const tags = song.tags ?? [];
  const tagged = tags.length > 0;

  return (
    <li>
      <Link
        href={`/songs/${song.id}`}
        onClick={onClick}
        aria-current={current ? 'page' : undefined}
        className={cn(
          'flex min-h-[4.5rem] items-center gap-3 px-3 py-3 transition-colors outline-none hover:bg-accent focus-visible:bg-accent @lg:px-4',
          current && 'bg-accent',
        )}
      >
        {/* The key, where a song has one, is the thing you check before you start to play. A
            favourite wears a star on the tile's corner, so the title keeps its whole line. */}
        <span className="relative shrink-0">
          <span
            className={cn(
              'grid size-11 place-items-center rounded-lg bg-secondary',
              song.songKey ? 'font-mono text-[15px] font-semibold text-chord' : 'text-muted-foreground',
              current && 'bg-background',
            )}
            aria-label={song.songKey ? `Key ${song.songKey}` : undefined}
          >
            {song.songKey || <Music2 className="size-4" aria-hidden />}
          </span>
          {song.favourite ? (
            <span className="absolute -top-2 -left-2 grid size-6 place-items-center rounded-full border border-border bg-card">
              <Star className="size-4 fill-brand text-brand" aria-label="Favourite" />
            </span>
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold">{song.title}</span>
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">{artistOf(song)}</span>
          {meta ? <span className="mt-0.5 block text-xs text-muted-foreground italic @lg:hidden">{meta}</span> : null}
          {tagged ? <RowTags tags={tags} limit={3} className="mt-1.5 flex flex-wrap @lg:hidden" /> : null}
        </span>

        <span className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground @lg:flex">
          {tagged ? <RowTags tags={tags} limit={2} className="flex" /> : null}
          {tagged && meta ? <span aria-hidden className="h-4 w-px bg-border" /> : null}
          {meta ? <span className="italic">{meta}</span> : null}
        </span>

        <ChevronRight className="-ml-1 size-4 shrink-0 text-muted-foreground/60" aria-hidden />
      </Link>
    </li>
  );
}
