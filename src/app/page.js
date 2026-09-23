import Link from 'next/link';
import { Music2, Star, Tags, Guitar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SongList } from '@/components/song-list';
import { InstallHint } from '@/components/install-hint';
import { tokenizeSheet, sheetChords } from '@/lib/sheet/tokenize';
import { requireUserId } from '@/lib/session';
import { listSongs } from '@/lib/songs';

// Every read is per-user, so there is nothing to prerender; once auth lands the session
// lookup makes this implicit.
export const dynamic = 'force-dynamic';

function stats(all) {
  const chords = new Set();
  const tags = new Set();
  let favourites = 0;

  for (const song of all) {
    if (song.favourite) favourites += 1;
    for (const tag of song.tags) tags.add(tag);
    for (const chord of sheetChords(tokenizeSheet(song.body))) chords.add(chord);
  }

  return { sheets: all.length, favourites, tags: tags.size, chords: chords.size };
}

export default async function HomePage() {
  const userId = await requireUserId();
  const songs = listSongs(userId);
  const { sheets, favourites, tags, chords } = stats(songs);

  const items = [
    { icon: Music2, tint: 'text-primary', value: sheets, label: sheets === 1 ? 'sheet' : 'sheets' },
    { icon: Star, tint: 'text-amber-400', value: favourites, label: 'favourites' },
    { icon: Tags, tint: 'text-emerald-500', value: tags, label: tags === 1 ? 'tag' : 'tags' },
    { icon: Guitar, tint: 'text-sky-500', value: chords, label: 'distinct chords' },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
          <Button asChild size="sm">
            <Link href="/songs/new">
              <Plus className="size-4" />
              Add song
            </Link>
          </Button>
        </div>

        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {items.map(({ icon: Icon, tint, value, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className={`size-4 ${tint}`} />
              <dd className="font-semibold text-foreground">{value}</dd>
              <dt>{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <SongList songs={songs} />
      <InstallHint />
    </div>
  );
}
